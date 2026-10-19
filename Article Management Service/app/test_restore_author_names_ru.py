import unittest
from types import SimpleNamespace

from app.restore_author_names_ru import proposed_changes


def author(**overrides):
    values = {
        "id": 1,
        "first_name_ru": None,
        "first_name_kz": None,
        "patronymic_ru": None,
        "patronymic_kz": None,
        "last_name_ru": None,
        "last_name_kz": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class RestoreRussianAuthorNamesTests(unittest.TestCase):
    def test_replaces_latin_ru_with_cyrillic_kz(self):
        changes = proposed_changes(
            author(
                first_name_ru="Yerasyl",
                first_name_kz="Ерасыл",
                last_name_ru="Qonyrov",
                last_name_kz="Қоңыров",
            )
        )
        self.assertEqual(
            {(change.field, change.new_value) for change in changes},
            {("first_name_ru", "Ерасыл"), ("last_name_ru", "Қоңыров")},
        )

    def test_fills_empty_ru_from_cyrillic_kz(self):
        changes = proposed_changes(author(patronymic_kz="Сергеевич"))
        self.assertEqual(
            [(change.field, change.old_value, change.new_value) for change in changes],
            [("patronymic_ru", None, "Сергеевич")],
        )

    def test_preserves_existing_cyrillic_ru(self):
        changes = proposed_changes(
            author(last_name_ru="Коныров", last_name_kz="Қоңыров")
        )
        self.assertEqual(changes, [])

    def test_ignores_latin_or_empty_kz_source(self):
        changes = proposed_changes(
            author(
                first_name_ru="John",
                first_name_kz="John",
                last_name_ru="Smith",
                last_name_kz=None,
            )
        )
        self.assertEqual(changes, [])

    def test_does_not_touch_non_ru_fields(self):
        item = author(first_name_ru="Yerasyl", first_name_kz="Ерасыл")
        item.first_name_en = "Yerasyl"
        item.first_name = "Yerasyl"

        changes = proposed_changes(item)

        self.assertEqual([change.field for change in changes], ["first_name_ru"])
        self.assertEqual(item.first_name_en, "Yerasyl")
        self.assertEqual(item.first_name, "Yerasyl")


if __name__ == "__main__":
    unittest.main()
