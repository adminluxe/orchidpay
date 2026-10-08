import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export type NativeSecurityState =
  | 'checking'
  | 'ready'
  | 'not-enrolled'
  | 'unavailable'
  | 'error';

export type NativeSecuritySnapshot = {
  secureStoreAvailable: boolean;
  secureStoreBiometricCapable: boolean;
  biometricHardware: boolean;
  biometricEnrolled: boolean;
  biometricTypes: string[];
  securityLevel: number;
  biometricState: NativeSecurityState;
};

export type StrongAuthResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function isExplicitUserCancelCode(code: string) {
  return code === 'user_cancel';
}

const DEVICE_BINDING_KEY = 'orchidpay.device.binding.v1';

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

function authenticationTypeName(type: LocalAuthentication.AuthenticationType) {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'FINGERPRINT';
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'FACE';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'IRIS';
    default:
      return `TYPE_${String(type)}`;
  }
}

export async function inspectNativeSecurity(): Promise<NativeSecuritySnapshot> {
  try {
    const [
      secureStoreAvailable,
      biometricHardware,
      biometricEnrolled,
      biometricTypes,
      securityLevel,
    ] = await Promise.all([
      SecureStore.isAvailableAsync(),
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);

    const secureStoreBiometricCapable = SecureStore.canUseBiometricAuthentication();

    let biometricState: NativeSecurityState = 'ready';
    if (!biometricHardware) biometricState = 'unavailable';
    else if (!biometricEnrolled) biometricState = 'not-enrolled';
    else if (!secureStoreBiometricCapable) biometricState = 'unavailable';
    else if (securityLevel < LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG) {
      biometricState = 'unavailable';
    }

    return {
      secureStoreAvailable,
      secureStoreBiometricCapable,
      biometricHardware,
      biometricEnrolled,
      biometricTypes: biometricTypes.map(authenticationTypeName),
      securityLevel,
      biometricState,
    };
  } catch {
    return {
      secureStoreAvailable: false,
      secureStoreBiometricCapable: false,
      biometricHardware: false,
      biometricEnrolled: false,
      biometricTypes: [],
      securityLevel: LocalAuthentication.SecurityLevel.NONE,
      biometricState: 'error',
    };
  }
}

export async function authenticateStrong(promptMessage: string): Promise<StrongAuthResult> {
  const snapshot = await inspectNativeSecurity();

  if (!snapshot.secureStoreAvailable) {
    return {
      ok: false,
      code: 'secure_store_unavailable',
      message: 'Le stockage sécurisé natif est indisponible.',
    };
  }

  if (snapshot.biometricState === 'not-enrolled') {
    return {
      ok: false,
      code: 'not_enrolled',
      message: 'Aucune biométrie forte n’est enregistrée sur cet appareil.',
    };
  }

  if (snapshot.biometricState !== 'ready') {
    return {
      ok: false,
      code: 'biometric_unavailable',
      message: 'La biométrie forte requise est indisponible.',
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Annuler',
    fallbackLabel: '',
    disableDeviceFallback: true,
    biometricsSecurityLevel: 'strong',
    requireConfirmation: true,
  });

  if (result.success) return { ok: true };

  return {
    ok: false,
    code: result.error,
    message:
      result.error === 'user_cancel' || result.error === 'system_cancel'
        ? 'Validation biométrique annulée.'
        : 'Validation biométrique refusée ou indisponible.',
  };
}

export async function ensureDeviceBindingId(): Promise<string> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) throw new Error('SecureStore unavailable');

  let value = await SecureStore.getItemAsync(DEVICE_BINDING_KEY, secureStoreOptions);
  if (value) return value;

  value = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_BINDING_KEY, value, secureStoreOptions);
  return value;
}

export async function hasDeviceBinding(): Promise<boolean> {
  if (!(await SecureStore.isAvailableAsync())) return false;
  return Boolean(await SecureStore.getItemAsync(DEVICE_BINDING_KEY, secureStoreOptions));
}

export async function getDeviceBindingFingerprint(): Promise<string> {
  if (!(await SecureStore.isAvailableAsync())) return '';

  const value = await SecureStore.getItemAsync(DEVICE_BINDING_KEY, secureStoreOptions);
  if (!value) return '';

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
  );

  return `OP-${digest.slice(0, 12).toUpperCase()}`;
}
