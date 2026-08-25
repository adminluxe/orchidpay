import DeviceCheck
import ExpoModulesCore
import Foundation

private let orchidPayAppAttestErrorDomain =
  "com.delishafrica.orchidpaymobile.appattest"

private func orchidPayAppAttestError(
  code: Int,
  message: String
) -> NSError {
  NSError(
    domain: orchidPayAppAttestErrorDomain,
    code: code,
    userInfo: [NSLocalizedDescriptionKey: message]
  )
}

private func decodeSHA256Base64(_ value: String) -> Data? {
  guard let data = Data(base64Encoded: value, options: []),
        data.count == 32 else {
    return nil
  }
  return data
}

private func validKeyId(_ value: String) -> Bool {
  !value.isEmpty && value.utf8.count <= 4096
}

public final class OrchidPayAppAttestModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OrchidPayAppAttest")

    AsyncFunction("isSupportedAsync") { () -> Bool in
      DCAppAttestService.shared.isSupported
    }

    AsyncFunction("generateKeyAsync") { (promise: Promise) in
      let service = DCAppAttestService.shared

      guard service.isSupported else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1001,
            message: "ORCHIDPAY_APP_ATTEST_UNSUPPORTED"
          )
        )
        return
      }

      service.generateKey { keyId, error in
        if let error {
          promise.reject(error)
          return
        }

        guard let keyId, validKeyId(keyId) else {
          promise.reject(
            orchidPayAppAttestError(
              code: 1004,
              message: "ORCHIDPAY_APP_ATTEST_EMPTY_KEY_ID"
            )
          )
          return
        }

        promise.resolve(keyId)
      }
    }

    AsyncFunction("attestKeyAsync") {
      (keyId: String, clientDataHashBase64: String, promise: Promise) in
      let service = DCAppAttestService.shared

      guard service.isSupported else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1001,
            message: "ORCHIDPAY_APP_ATTEST_UNSUPPORTED"
          )
        )
        return
      }

      guard validKeyId(keyId) else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1003,
            message: "ORCHIDPAY_APP_ATTEST_INVALID_KEY_ID"
          )
        )
        return
      }

      guard let clientDataHash = decodeSHA256Base64(clientDataHashBase64) else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1002,
            message: "ORCHIDPAY_APP_ATTEST_INVALID_SHA256_BASE64"
          )
        )
        return
      }

      service.attestKey(keyId, clientDataHash: clientDataHash) {
        attestationObject,
        error in
        if let error {
          promise.reject(error)
          return
        }

        guard let attestationObject else {
          promise.reject(
            orchidPayAppAttestError(
              code: 1005,
              message: "ORCHIDPAY_APP_ATTEST_EMPTY_ATTESTATION"
            )
          )
          return
        }

        promise.resolve(attestationObject.base64EncodedString())
      }
    }

    AsyncFunction("generateAssertionAsync") {
      (keyId: String, clientDataHashBase64: String, promise: Promise) in
      let service = DCAppAttestService.shared

      guard service.isSupported else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1001,
            message: "ORCHIDPAY_APP_ATTEST_UNSUPPORTED"
          )
        )
        return
      }

      guard validKeyId(keyId) else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1003,
            message: "ORCHIDPAY_APP_ATTEST_INVALID_KEY_ID"
          )
        )
        return
      }

      guard let clientDataHash = decodeSHA256Base64(clientDataHashBase64) else {
        promise.reject(
          orchidPayAppAttestError(
            code: 1002,
            message: "ORCHIDPAY_APP_ATTEST_INVALID_SHA256_BASE64"
          )
        )
        return
      }

      service.generateAssertion(keyId, clientDataHash: clientDataHash) {
        assertionObject,
        error in
        if let error {
          promise.reject(error)
          return
        }

        guard let assertionObject else {
          promise.reject(
            orchidPayAppAttestError(
              code: 1006,
              message: "ORCHIDPAY_APP_ATTEST_EMPTY_ASSERTION"
            )
          )
          return
        }

        promise.resolve(assertionObject.base64EncodedString())
      }
    }
  }
}
