import unittest
from types import SimpleNamespace

from app.backfill_author_names import proposed_changes, transliterate


class TransliterationTests(unittest.TestCase):
    def test_russian_and_kazakh_letters(self):
        self.assertEqual(transliterate("Ерасыл Қоңыров"), "Erasyl Qongyrov")
        self.assertEqual(transliterate("Сергеевич"), "Sergeevich")

    def test_punctuation_is_preserved(self):
        self.assertEqual(transliterate("Нұр-Сұлтан"), "Nur-Sultan")

    def test_only_empty_or_migration_placeholder_fields_change(self):
        author = SimpleNamespace(
            id=7,
            first_name="Ерасыл", patronymic=None, last_name="Қоңыров",
            first_name_en="Ерасыл", patronymic_en=None, last_name_en="Official Spelling",
            first_name_kz=None, patronymic_kz=None, last_name_kz="Қоңыров",
            first_name_ru=None, patronymic_ru=None, last_name_ru="Коныров",
        )
        changes = {(item.field, item.new_value) for item in proposed_changes(author)}
        self.assertEqual(
            changes,
            {
                ("first_name_en", "Erasyl"),
                ("first_name_kz", "Ерасыл"),
                ("first_name_ru", "Ерасыл"),
            },
        )

    def test_russian_name_prefers_existing_kazakh_value(self):
        author = SimpleNamespace(
            id=8,
            first_name="Yerasyl", patronymic=None, last_name="Qonyrov",
            first_name_en="Yerasyl", patronymic_en=None, last_name_en="Qonyrov",
            first_name_kz="Ерасыл", patronymic_kz=None, last_name_kz="Қоңыров",
            first_name_ru=None, patronymic_ru=None, last_name_ru=None,
        )
        changes = {(item.field, item.new_value) for item in proposed_changes(author)}
        self.assertIn(("first_name_ru", "Ерасыл"), changes)
        self.assertIn(("last_name_ru", "Қоңыров"), changes)

    def test_latin_source_is_not_copied_into_russian(self):
        author = SimpleNamespace(
            id=9,
            first_name="John", patronymic=None, last_name="Smith",
            first_name_en="John", patronymic_en=None, last_name_en="Smith",
            first_name_kz="John", patronymic_kz=None, last_name_kz="Smith",
            first_name_ru=None, patronymic_ru=None, last_name_ru=None,
        )
        changes = {(item.field, item.new_value) for item in proposed_changes(author)}
        self.assertNotIn(("first_name_ru", "John"), changes)
        self.assertNotIn(("last_name_ru", "Smith"), changes)

    def test_generated_latin_russian_placeholder_is_repaired(self):
        author = SimpleNamespace(
            id=10,
            first_name="Yerasyl", patronymic=None, last_name="Qonyrov",
            first_name_en="Yerasyl", patronymic_en=None, last_name_en="Qonyrov",
            first_name_kz="Ерасыл", patronymic_kz=None, last_name_kz="Қоңыров",
            first_name_ru="Yerasyl", patronymic_ru=None, last_name_ru="Qonyrov",
        )
        changes = {(item.field, item.new_value) for item in proposed_changes(author)}
        self.assertIn(("first_name_ru", "Ерасыл"), changes)
        self.assertIn(("last_name_ru", "Қоңыров"), changes)

    def test_generated_latin_placeholder_is_cleared_without_cyrillic_source(self):
        author = SimpleNamespace(
            id=11,
            first_name="John", patronymic=None, last_name="Smith",
            first_name_en="John", patronymic_en=None, last_name_en="Smith",
            first_name_kz="John", patronymic_kz=None, last_name_kz="Smith",
            first_name_ru="John", patronymic_ru=None, last_name_ru="Smith",
        )
        changes = {(item.field, item.new_value) for item in proposed_changes(author)}
        self.assertIn(("first_name_ru", None), changes)
        self.assertIn(("last_name_ru", None), changes)


if __name__ == "__main__":
    unittest.main()
