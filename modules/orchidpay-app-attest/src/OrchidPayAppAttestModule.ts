import { requireOptionalNativeModule } from 'expo-modules-core';

type OrchidPayAppAttestNativeModule = {
  isSupportedAsync(): Promise<boolean>;
  generateKeyAsync(): Promise<string>;
  attestKeyAsync(keyId: string, clientDataHashBase64: string): Promise<string>;
  generateAssertionAsync(keyId: string, clientDataHashBase64: string): Promise<string>;
};

const nativeModule =
  requireOptionalNativeModule<OrchidPayAppAttestNativeModule>('OrchidPayAppAttest');

function requireAppAttestNativeModule(): OrchidPayAppAttestNativeModule {
  if (!nativeModule) {
    throw new Error('ORCHIDPAY_APP_ATTEST_NATIVE_MODULE_UNAVAILABLE');
  }
  return nativeModule;
}

export async function isAppAttestSupportedAsync(): Promise<boolean> {
  if (!nativeModule) return false;
  return nativeModule.isSupportedAsync();
}

export function generateAppAttestKeyAsync(): Promise<string> {
  return requireAppAttestNativeModule().generateKeyAsync();
}

export function attestAppAttestKeyAsync(
  keyId: string,
  clientDataHashBase64: string,
): Promise<string> {
  return requireAppAttestNativeModule().attestKeyAsync(
    keyId,
    clientDataHashBase64,
  );
}

export function generateAppAttestAssertionAsync(
  keyId: string,
  clientDataHashBase64: string,
): Promise<string> {
  return requireAppAttestNativeModule().generateAssertionAsync(
    keyId,
    clientDataHashBase64,
  );
}
