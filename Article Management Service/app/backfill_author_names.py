"""One-off backfill for localized author names.

Dry-run is the default. Pass --apply to persist proposed changes.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from app.database import SessionLocal
from app.models import Author


CYRILLIC_RE = re.compile(r"[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]")

# A readable, deterministic Latin representation suitable for publication
# drafts. Official passport spellings should still be entered manually.
LATIN_MAP = {
    "А": "A", "Ә": "A", "Б": "B", "В": "V", "Г": "G", "Ғ": "Gh",
    "Д": "D", "Е": "E", "Ё": "Yo", "Ж": "Zh", "З": "Z", "И": "I",
    "Й": "I", "К": "K", "Қ": "Q", "Л": "L", "М": "M", "Н": "N",
    "Ң": "Ng", "О": "O", "Ө": "O", "П": "P", "Р": "R", "С": "S",
    "Т": "T", "У": "U", "Ұ": "U", "Ү": "U", "Ф": "F", "Х": "Kh",
    "Һ": "H", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Shch", "Ъ": "",
    "Ы": "Y", "І": "I", "Ь": "", "Э": "E", "Ю": "Yu", "Я": "Ya",
}


def _match_case(source: str, replacement: str) -> str:
    if source.islower():
        return replacement.lower()
    return replacement


def transliterate(value: str | None) -> str | None:
    """Transliterate Russian/Kazakh Cyrillic while preserving punctuation."""
    if not value:
        return value
    result: list[str] = []
    for char in value:
        replacement = LATIN_MAP.get(char.upper())
        result.append(_match_case(char, replacement) if replacement is not None else char)
    return "".join(result)


def has_cyrillic(value: str | None) -> bool:
    return bool(value and CYRILLIC_RE.search(value))


@dataclass(frozen=True)
class Change:
    author_id: int
    field: str
    old_value: str | None
    new_value: str | None


NAME_PARTS = ("first_name", "patronymic", "last_name")


def proposed_changes(author: Author) -> list[Change]:
    changes: list[Change] = []
    for base in NAME_PARTS:
        source = getattr(author, base)
        if not source:
            continue

        en_field = f"{base}_en"
        en_value = getattr(author, en_field)
        # The schema migration copied legacy Cyrillic values into *_en. Treat
        # those exact copies as placeholders, but preserve real manual values.
        if not en_value or (en_value == source and has_cyrillic(en_value)):
            latin = transliterate(source)
            if latin and latin != en_value:
                changes.append(Change(author.id, en_field, en_value, latin))

        kz_field = f"{base}_kz"
        kz_value = getattr(author, kz_field)
        if not kz_value:
            # Personal names are not machine-translated. Cyrillic source text
            # is retained for Kazakh; Latin source text remains unchanged.
            changes.append(Change(author.id, kz_field, kz_value, source))

        ru_field = f"{base}_ru"
        ru_value = getattr(author, ru_field)
        # Russian fields must never be auto-filled with Latin text. Prefer a
        # Cyrillic Kazakh spelling, then a Cyrillic legacy value.
        russian_source = next(
            (candidate for candidate in (kz_value, source) if has_cyrillic(candidate)),
            None,
        )
        if not ru_value and russian_source:
            changes.append(Change(author.id, ru_field, ru_value, russian_source))
        elif (
            ru_value
            and not has_cyrillic(ru_value)
            and ru_value in {value for value in (kz_value, source) if value}
        ):
            # Repair Latin placeholders written by an earlier script run.
            changes.append(Change(author.id, ru_field, ru_value, russian_source))
    return changes


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview or apply one-off author-name localization backfill."
    )
    parser.add_argument("--apply", action="store_true", help="Commit changes to the database")
    parser.add_argument("--author-id", type=int, help="Process only one author")
    parser.add_argument("--limit", type=int, help="Process at most this many authors")
    parser.add_argument("--csv", type=Path, help="Also write the report to a CSV file")
    return parser.parse_args()


def write_report(rows: list[Change], stream) -> None:
    writer = csv.writer(stream, lineterminator="\n")
    writer.writerow(("author_id", "field", "old_value", "new_value"))
    for row in rows:
        writer.writerow((row.author_id, row.field, row.old_value or "", row.new_value or ""))


def main() -> int:
    args = parse_args()
    if args.limit is not None and args.limit < 1:
        print("--limit must be greater than zero", file=sys.stderr)
        return 2

    db = SessionLocal()
    try:
        query = db.query(Author).order_by(Author.id)
        if args.author_id is not None:
            query = query.filter(Author.id == args.author_id)
        if args.limit is not None:
            query = query.limit(args.limit)

        authors = query.all()
        changes = [change for author in authors for change in proposed_changes(author)]
        write_report(changes, sys.stdout)

        if args.csv:
            args.csv.parent.mkdir(parents=True, exist_ok=True)
            with args.csv.open("w", encoding="utf-8-sig", newline="") as report:
                write_report(changes, report)

        if args.apply:
            by_id = {author.id: author for author in authors}
            for change in changes:
                setattr(by_id[change.author_id], change.field, change.new_value)
            db.commit()
            print(f"Applied {len(changes)} field changes across {len(authors)} checked authors.", file=sys.stderr)
        else:
            db.rollback()
            print(f"Dry run: {len(changes)} proposed field changes across {len(authors)} checked authors.", file=sys.stderr)
            print("Nothing was written. Run again with --apply to commit.", file=sys.stderr)
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
