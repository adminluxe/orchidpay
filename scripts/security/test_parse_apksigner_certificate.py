#!/usr/bin/env python3
"""Fail-closed signer fingerprint parser: 10 independent regression vectors."""
import unittest
import parse_apksigner_certificate as p

A = "0123456789abcdef" * 4
B = "abcdeffedcba9876" * 4


class SignerCertificateFormatTests(unittest.TestCase):
    def test_previous_apksigner_format(self):
        text = "Verifies\nNumber of signers: 1\nSigner #1 certificate SHA-256 digest: " + A
        self.assertEqual(p.parse(text), A)

    def test_buildtools37_v2_format(self):
        self.assertEqual(p.parse("V2 Signer: certificate SHA-256 digest: " + A), A)

    def test_buildtools37_v3_variants_same_signer(self):
        text = ("V2 Signer: certificate SHA-256 digest: " + A
                + "\nV3.0 Signer: certificate SHA-256 digest: " + A.upper()
                + "\nV3.1 Signer: certificate SHA-256 digest: " + A)
        self.assertEqual(p.parse(text), A)

    def test_conflicting_v2_v3_certificates_fail(self):
        with self.assertRaisesRegex(ValueError, "INCONSISTENT_SIGNER_CERTIFICATES"):
            p.parse("V2 Signer: certificate SHA-256 digest: " + A
                    + "\nV3.0 Signer: certificate SHA-256 digest: " + B)

    def test_malformed_digest_rejected(self):
        with self.assertRaisesRegex(ValueError, "UNKNOWN_CERTIFICATE_LABEL"):
            p.parse("V2 Signer: certificate SHA-256 digest: " + A[:-1])

    def test_additional_unrecognized_signer_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "UNKNOWN_CERTIFICATE_LABEL_OR_ADDITIONAL"):
            p.parse("Signer #1 certificate SHA-256 digest: " + A
                    + "\nSigner #2 certificate SHA-256 digest: " + B)

    def test_nonmatching_signer_count_refused(self):
        with self.assertRaisesRegex(ValueError, "SIGNER_COUNT_INVALID"):
            p.parse("Number of signers: 2\nV2 Signer: certificate SHA-256 digest: " + A)

    def test_unsupported_future_label_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "UNKNOWN_CERTIFICATE_LABEL"):
            p.parse("V4 Signer: certificate SHA-256 digest: " + A)

    def test_explicit_invalid_signature_cannot_be_parsed(self):
        with self.assertRaisesRegex(ValueError, "VERIFICATION_FAILURE"):
            p.parse("DOES NOT VERIFY\nV2 Signer: certificate SHA-256 digest: " + A)

    def test_empty_invalid_evidence_rejected(self):
        with self.assertRaisesRegex(ValueError, "MISSING"):
            p.parse("Number of signers: 1\nVerifies")
