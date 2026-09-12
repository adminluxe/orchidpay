import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { readExternalTrustReadinessPassport } from './externalTrustPassport';
import { deriveStagingHsmP256BindingDigest } from './stagingHsmP256Binding';
import {
  PROVIDER_ROOT_REVIEW_COMBINED_SHA256,
  PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256,
  PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256,
  buildProviderRootReviewContract,
  inspectProviderRootReviewContract,
} from './providerRootReviewContract';

const KEY = 'orchidpay.staging.trust.policy.passport.v1';
const VERSION = 1 as const;
export const STAGING_TRUST_POLICY_RELEASE = 'R13.8G-STAGING-TRUST-POLICY-RATIFICATION' as const;
const secureStoreOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY };

export type StagingTrustPolicyPassport = {
  v: 1;
  release: typeof STAGING_TRUST_POLICY_RELEASE;
  issuedAt: number;
  status: 'STAGING_PROVIDER_REVIEW_ACCEPTED_PRODUCTION_BLOCKED';
  suitePassed: 344;
  suiteTotal: 344;
  parentExternalTrustProof: string;
  stagingHsmBindingDigest: string;
  providerReviewDigest: string;
  combinedEvidenceSha256: typeof PROVIDER_ROOT_REVIEW_COMBINED_SHA256;
  deviceHsmPanelSha256: typeof PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256;
  device344PanelSha256: typeof PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256;
  providerReviewState: 'STAGING_EXCEPTION_ACCEPTED_PRODUCTION_GATE_OPEN';
  productionProviderRootGateOpen: true;
  productionRelease: false;
  networkExecution: false;
  livePaymentExecution: false;
  settlement: false;
  proof: string;
};
type Core = Omit<StagingTrustPolicyPassport, 'proof'>;

async function sha(value: string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value); }
function upper16(hex: string) { return hex.slice(0,16).toUpperCase(); }
function canonical(value: Core) {
  return [
    value.v,value.release,value.issuedAt,value.status,value.suitePassed,value.suiteTotal,
    value.parentExternalTrustProof,value.stagingHsmBindingDigest,value.providerReviewDigest,
    value.combinedEvidenceSha256,value.deviceHsmPanelSha256,value.device344PanelSha256,
    value.providerReviewState,value.productionProviderRootGateOpen?1:0,value.productionRelease?1:0,
    value.networkExecution?1:0,value.livePaymentExecution?1:0,value.settlement?1:0,
  ].join('|');
}

export async function issueStagingTrustPolicyPassport(suitePassed: number, suiteTotal: number) {
  try {
    if (suitePassed !== 344 || suiteTotal !== 344) return { ok:false as const, reason:'STAGING_POLICY_SUITE_NOT_344_344' };
    if (!(await SecureStore.isAvailableAsync())) return { ok:false as const, reason:'SECURESTORE_UNAVAILABLE' };
    const parent = await readExternalTrustReadinessPassport();
    if (!parent.valid || !parent.passport) return { ok:false as const, reason:'VALID_EXTERNAL_TRUST_V2_PASSPORT_REQUIRED' };
    if (parent.passport.productionRelease || parent.passport.networkExecution || parent.passport.livePaymentExecution || parent.passport.settlement) return { ok:false as const, reason:'PARENT_EXTERNAL_TRUST_FUSE_OPEN' };
    const review = await buildProviderRootReviewContract();
    const reviewStatus = await inspectProviderRootReviewContract(review);
    if (!reviewStatus.ok || review.productionEligible || !review.productionProviderRootGateOpen || !review.stagingExceptionAccepted) return { ok:false as const, reason:'PROVIDER_REVIEW_NOT_STAGING_ACCEPTABLE' };
    const core: Core = {
      v: VERSION,
      release: STAGING_TRUST_POLICY_RELEASE,
      issuedAt: Date.now(),
      status: 'STAGING_PROVIDER_REVIEW_ACCEPTED_PRODUCTION_BLOCKED',
      suitePassed:344,
      suiteTotal:344,
      parentExternalTrustProof: parent.passport.proof,
      stagingHsmBindingDigest: await deriveStagingHsmP256BindingDigest(),
      providerReviewDigest: review.digest,
      combinedEvidenceSha256: PROVIDER_ROOT_REVIEW_COMBINED_SHA256,
      deviceHsmPanelSha256: PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256,
      device344PanelSha256: PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256,
      providerReviewState: 'STAGING_EXCEPTION_ACCEPTED_PRODUCTION_GATE_OPEN',
      productionProviderRootGateOpen:true,
      productionRelease:false,
      networkExecution:false,
      livePaymentExecution:false,
      settlement:false,
    };
    const out: StagingTrustPolicyPassport = { ...core, proof:`STP-${upper16(await sha(canonical(core)))}` };
    await SecureStore.setItemAsync(KEY, JSON.stringify(out), secureStoreOptions);
    return { ok:true as const, passport:out };
  } catch {
    return { ok:false as const, reason:'STAGING_POLICY_PASSPORT_WRITE_FAILED' };
  }
}

export async function readStagingTrustPolicyPassport(): Promise<{valid:boolean;passport:StagingTrustPolicyPassport|null;error:string}> {
  try {
    if (!(await SecureStore.isAvailableAsync())) return {valid:false,passport:null,error:'SECURESTORE_UNAVAILABLE'};
    const raw = await SecureStore.getItemAsync(KEY, secureStoreOptions);
    if (!raw) return {valid:true,passport:null,error:''};
    const p = JSON.parse(raw) as StagingTrustPolicyPassport;
    if (p.v!==VERSION || p.release!==STAGING_TRUST_POLICY_RELEASE || p.status!=='STAGING_PROVIDER_REVIEW_ACCEPTED_PRODUCTION_BLOCKED' || p.suitePassed!==344 || p.suiteTotal!==344 || p.providerReviewState!=='STAGING_EXCEPTION_ACCEPTED_PRODUCTION_GATE_OPEN' || !p.productionProviderRootGateOpen || p.productionRelease!==false || p.networkExecution!==false || p.livePaymentExecution!==false || p.settlement!==false || !Number.isSafeInteger(p.issuedAt) || p.issuedAt<=0 || !/^ETP-[A-F0-9]{16}$/.test(p.parentExternalTrustProof) || !/^HSMB-[A-F0-9]{16}$/.test(p.stagingHsmBindingDigest) || !/^PRR-[A-F0-9]{16}$/.test(p.providerReviewDigest) || !/^STP-[A-F0-9]{16}$/.test(p.proof)) return {valid:false,passport:null,error:'STRUCTURE'};
    if (p.combinedEvidenceSha256!==PROVIDER_ROOT_REVIEW_COMBINED_SHA256 || p.deviceHsmPanelSha256!==PROVIDER_ROOT_REVIEW_DEVICE_HSM_PANEL_SHA256 || p.device344PanelSha256!==PROVIDER_ROOT_REVIEW_DEVICE_344_PANEL_SHA256 || p.stagingHsmBindingDigest!==await deriveStagingHsmP256BindingDigest()) return {valid:false,passport:null,error:'PINNED_EVIDENCE'};
    const review = await buildProviderRootReviewContract();
    const reviewStatus = await inspectProviderRootReviewContract(review);
    if (!reviewStatus.ok || p.providerReviewDigest!==review.digest) return {valid:false,passport:null,error:'PROVIDER_REVIEW'};
    const {proof,...core}=p;
    if (proof!==`STP-${upper16(await sha(canonical(core)))}`) return {valid:false,passport:null,error:'PROOF'};
    const parent = await readExternalTrustReadinessPassport();
    if (!parent.valid || !parent.passport || parent.passport.proof!==p.parentExternalTrustProof) return {valid:false,passport:null,error:'PARENT_CHAIN'};
    return {valid:true,passport:p,error:''};
  } catch {
    return {valid:false,passport:null,error:'INVALID'};
  }
}

export function buildStagingTrustPolicySnapshot(p: StagingTrustPolicyPassport | null) {
  if (!p) return 'stagingTrustPolicy=NONE\nsecrets=NONE';
  return [
    `stagingTrustPolicy=${p.release}`,
    `proof=${p.proof}`,
    `parentExternalTrust=${p.parentExternalTrustProof}`,
    `stagingHsmBinding=${p.stagingHsmBindingDigest}`,
    `providerReview=${p.providerReviewDigest}`,
    `combinedEvidenceSha256=${p.combinedEvidenceSha256}`,
    `deviceHsmPanelSha256=${p.deviceHsmPanelSha256}`,
    `device344PanelSha256=${p.device344PanelSha256}`,
    `providerReviewState=${p.providerReviewState}`,
    'externalTrustPassport=v2',
    'productionProviderRootGate=OPEN',
    'productionRelease=false',
    'networkExecution=false',
    'livePaymentExecution=false',
    'settlement=false',
    'secrets=NONE',
  ].join('\n');
}
