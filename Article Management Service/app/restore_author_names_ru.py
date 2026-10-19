"""Restore Russian author-name fields from their Kazakh Cyrillic values.

This is a one-off repair for data where an earlier backfill wrote Latin text
to ``first_name_ru``, ``patronymic_ru`` or ``last_name_ru``.  Dry-run is the
default; pass ``--apply`` to commit the proposed changes.
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


# Russian and Kazakh Cyrillic ranges, including letters outside the basic
# Cyrillic block. Using Unicode ranges keeps this source robust across shells.
CYRILLIC_RE = re.compile(r"[\u0400-\u052f]")
NAME_PARTS = ("first_name", "patronymic", "last_name")


def has_cyrillic(value: str | None) -> bool:
    return bool(value and CYRILLIC_RE.search(value))


@dataclass(frozen=True)
class Change:
    author_id: int
    field: str
    old_value: str | None
    new_value: str


def proposed_changes(author: Author) -> list[Change]:
    """Return RU-only repairs without changing valid Cyrillic RU values."""
    changes: list[Change] = []
    for base in NAME_PARTS:
        ru_field = f"{base}_ru"
        kz_field = f"{base}_kz"
        ru_value = getattr(author, ru_field)
        kz_value = getattr(author, kz_field)

        # A Kazakh value is a safe recovery source only when it contains
        # Cyrillic. Preserve manually entered Cyrillic Russian spellings.
        if has_cyrillic(kz_value) and not has_cyrillic(ru_value):
            changes.append(Change(author.id, ru_field, ru_value, kz_value))

    return changes


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Restore only Russian author-name fields from Kazakh Cyrillic fields."
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
        writer.writerow((row.author_id, row.field, row.old_value or "", row.new_value))


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
            print(
                f"Applied {len(changes)} RU field changes across "
                f"{len(authors)} checked authors.",
                file=sys.stderr,
            )
        else:
            db.rollback()
            print(
                f"Dry run: {len(changes)} proposed RU field changes across "
                f"{len(authors)} checked authors.",
                file=sys.stderr,
            )
            print("Nothing was written. Run again with --apply to commit.", file=sys.stderr)
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
