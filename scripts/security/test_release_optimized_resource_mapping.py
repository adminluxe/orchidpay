#!/usr/bin/env python3
"""AAPT2 logical XML resource -> optimized APK file path negative controls."""
import unittest
import verify_release_optimized_resource_mapping as m

DUMP = """Binary APK
Package name=com.delishafrica.orchidpaymobile id=7f
  type xml id=12 entryCount=2
    resource 0x7f120001 xml/orchidpay_no_backup
      () (file) res/a.xml type=XML
    resource 0x7f120002 xml/orchidpay_no_data_extraction
      () (file) res/b.xml type=XML
    resource 0x7f120003 xml/other
      () (file) res/c.xml type=XML
"""
FILES = {"res/a.xml", "res/b.xml", "res/c.xml"}


class OptimizedResourceMapTest(unittest.TestCase):
    def test_valid_renamed_paths_are_mapped_to_original_ids(self):
        actual = m.resolve(DUMP, FILES)
        self.assertEqual(actual["orchidpay_no_backup"]["id"], 0x7f120001)
        self.assertEqual(actual["orchidpay_no_backup"]["paths"], {"res/a.xml"})
        self.assertEqual(actual["orchidpay_no_data_extraction"]["paths"],
                         {"res/b.xml"})

    def test_original_named_paths_also_accepted(self):
        newer = DUMP.replace("res/a.xml", "res/xml/orchidpay_no_backup.xml").replace(
            "res/b.xml", "res/xml/orchidpay_no_data_extraction.xml")
        resolved = m.resolve(newer, {
            "res/xml/orchidpay_no_backup.xml",
            "res/xml/orchidpay_no_data_extraction.xml",
        })
        self.assertEqual(len(resolved), 2)

    def test_missing_xml_inside_apk_rejected(self):
        with self.assertRaisesRegex(ValueError, "MISSING_COMPILED_XML_RESOURCE_FILE"):
            m.resolve(DUMP, {"res/a.xml", "res/c.xml"})

    def test_missing_logical_resource_in_aapt_table_rejected(self):
        corrupted = DUMP.replace("xml/orchidpay_no_data_extraction", "xml/unknown")
        with self.assertRaisesRegex(ValueError, "LOGICAL_XML_RESOURCE_ID_NOT_FOUND"):
            m.resolve(corrupted, FILES)

    def test_missing_file_value_rejected(self):
        corrupted = DUMP.replace("() (file) res/b.xml type=XML", "() (color) #000000")
        with self.assertRaisesRegex(ValueError, "XML_RESOURCE_PHYSICAL_PATH_COUNT_INVALID"):
            m.resolve(corrupted, FILES)

    def test_mismatched_resource_ids_rejected(self):
        corrupted = DUMP.replace(
            "resource 0x7f120001 xml/orchidpay_no_backup",
            "resource 0x7f120001 xml/orchidpay_no_backup\n"
            "      () (file) res/a.xml type=XML\n"
            "    resource 0x7f12000a xml/orchidpay_no_backup")
        with self.assertRaisesRegex(ValueError, "DUPLICATE_LOGICAL_RESOURCE_ID"):
            m.resolve(corrupted, FILES)

    def test_same_physical_resource_cannot_serve_different_backup_rules(self):
        corrupted = DUMP.replace("() (file) res/b.xml type=XML",
                                 "() (file) res/a.xml type=XML")
        with self.assertRaisesRegex(ValueError, "TWO_XML_RESOURCES_SHARE"):
            m.resolve(corrupted, FILES)

    def test_legacy_string8_format_supported(self):
        legacy = """Binary APK
 config (default):
  resource 0x7f120001 com.delishafrica.orchidpaymobile:xml/orchidpay_no_backup:
     (string8) "res/a.xml"
  resource 0x7f120002 com.delishafrica.orchidpaymobile:xml/orchidpay_no_data_extraction:
     (string8) "res/b.xml"
"""
        self.assertEqual(m.resolve(legacy, FILES)["orchidpay_no_backup"]["paths"],
                         {"res/a.xml"})

    def test_optimized_extensionless_paths_supported_and_checked(self):
        data = DUMP.replace("res/a.xml", "res/z1").replace("res/b.xml", "res/z2")
        self.assertEqual(m.resolve(data, {"res/z1", "res/z2"})[
            "orchidpay_no_data_extraction"]["paths"], {"res/z2"})

    def test_untrusted_path_and_zip_entry_rejected(self):
        data = DUMP.replace("res/a.xml", "res/../a.xml")
        with self.assertRaisesRegex(ValueError, "UNSAFE_XML_RESOURCE_PATH"):
            m.resolve(data, FILES)


if __name__ == "__main__":
    unittest.main()