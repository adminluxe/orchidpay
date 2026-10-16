#!/usr/bin/env python3
"""Fail-closed fixtures for the compiled APK XML policy decoder."""
import importlib.util
import pathlib
import unittest

FILE = pathlib.Path(__file__).with_name("verify_compiled_android_policy.py")
SPEC = importlib.util.spec_from_file_location("apkpolicy", FILE)
POL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(POL)

A = "http://schemas.android.com/apk/res/android"
PERM = "android.permission.RECORD_AUDIO"
M = ('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="%s" package="com.delishafrica.orchidpaymobile">
 <uses-permission android:name="android.permission.INTERNET"/>
 <application android:debuggable="true" android:allowBackup="false"
 android:fullBackupContent="@xml/orchidpay_no_backup"
 android:dataExtractionRules="@xml/orchidpay_no_data_extraction" />
</manifest>''' % A)
OLD = '<full-backup-content><exclude domain="root" path="."/></full-backup-content>'
NEW = '''<data-extraction-rules>
<cloud-backup disableIfNoEncryptionCapabilities="true">
  <exclude domain="root" path="."/>
</cloud-backup><device-transfer>
  <exclude domain="root" path="."/>
</device-transfer></data-extraction-rules>'''


class CompiledPolicyTests(unittest.TestCase):
    def test_correct_baseline(self):
        self.assertIsNone(POL.validate_manifest(M, [PERM]))
        POL.validate_policy(OLD, "old", "full-backup-content", (None,))
        POL.validate_policy(NEW, "new", "data-extraction-rules",
                            ("cloud-backup", "device-transfer"))

    def test_compiled_numeric_resource_reference_is_resolved(self):
        resources = {"orchidpay_no_backup": 0x7f120001,
                     "orchidpay_no_data_extraction": 0x7f120002}
        numeric = M.replace("@xml/orchidpay_no_backup", "@0x7f120001").replace(
            "@xml/orchidpay_no_data_extraction", "@0x7f120002")
        POL.validate_manifest(numeric, [PERM], resources)
        table = ("Binary APK\n  type xml id=12 entryCount=2\n"
                 "    resource 0x7f120001 xml/orchidpay_no_backup\n"
                 "    resource 0x7f120002 xml/orchidpay_no_data_extraction\n")
        self.assertEqual(POL.parse_resource_ids(table), resources)

    def test_compiled_wrong_numeric_resource_id_rejected(self):
        resources = {"orchidpay_no_backup": 0x7f120001,
                     "orchidpay_no_data_extraction": 0x7f120002}
        numeric = M.replace("@xml/orchidpay_no_backup", "@0x7f120003")
        with self.assertRaisesRegex(ValueError, "APK_BACKUP_REFERENCE_MISMATCH"):
            POL.validate_manifest(numeric, [PERM], resources)

    def test_backup_enabled_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK_ALLOWBACKUP_NOT_FALSE"):
            POL.validate_manifest(M.replace('allowBackup="false"',
                                            'allowBackup="true"'), [])

    def test_wrong_backup_reference_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK_BACKUP_REFERENCE_INVALID"):
            POL.validate_manifest(M.replace('@xml/orchidpay_no_backup',
                                            '@xml/default_backup_rules'), [])

    def test_non_debug_binary_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK_NOT_A_DEBUG_ONLY_BUILD"):
            POL.validate_manifest(M.replace('debuggable="true"',
                                            'debuggable="false"'), [])

    def test_forbidden_permissions_rejected(self):
        modified = M.replace("<application", '<uses-permission android:name="' + PERM +
                             '"/><application', 1)
        with self.assertRaisesRegex(ValueError, "APK_FORBIDDEN_PERMISSION_PRESENT"):
            POL.validate_manifest(modified, [PERM])

    def test_missing_legacy_root_exclusion_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK_BACKUP_XML_ROOT_NOT_EXCLUDED"):
            POL.validate_policy(OLD.replace('domain="root"', 'domain="file"'),
                                "old", "full-backup-content", (None,))

    def test_missing_cloud_root_exclusion_rejected(self):
        with self.assertRaisesRegex(ValueError, "APK_BACKUP_XML_ROOT_NOT_EXCLUDED"):
            POL.validate_policy(NEW.replace('<cloud-backup disableIfNoEncryptionCapabilities="true">',
                                            '<cloud-backup disableIfNoEncryptionCapabilities="true">' +
                                            '<include domain="root" path="."/>').replace(
                                                '<exclude domain="root" path="."/>', '', 1),
                                "new", "data-extraction-rules",
                                ("cloud-backup", "device-transfer"))

    def test_missing_transfer_root_exclusion_rejected(self):
        changed = NEW.replace('<device-transfer>\n  <exclude domain="root" path="."/>',
                              '<device-transfer>\n  <include domain="root" path="."/>')
        with self.assertRaisesRegex(ValueError, "APK_BACKUP_XML_ROOT_NOT_EXCLUDED"):
            POL.validate_policy(changed, "new", "data-extraction-rules",
                                ("cloud-backup", "device-transfer"))


if __name__ == "__main__":
    unittest.main()
