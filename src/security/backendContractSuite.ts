import type { AcceptanceCheck } from './acceptanceSuite';
import {
  CONTINUITY_GENESIS,
  MAX_CONTINUITY_EVENTS,
  appendContinuityEvent,
  buildContinuitySnapshot,
  deriveContinuityDigest,
  inspectContinuityInput,
  inspectContinuityTransition,
  makeContinuityEvent,
  validateContinuityJournal,
  type AttestationContinuityJournal,
  type AttestationContinuityInput,
} from './attestationContinuity';
import { deriveBackendContractLineage, deriveIntegrationBoundaryLineage } from './passportLineage';
import {
  INTENT_REPLAY_GUARD_VERSION,
  INTENT_REPLAY_RELEASE,
  MAX_CLOCK_SKEW_MS,
  MAX_REPLAY_EVENTS,
  appendIntentReplayReceipt,
  buildIntentReplaySnapshot,
  deriveIntentReplayPolicyDigest,
  deriveReplayMaterials,
  inspectReplayDraft,
  intentReplayPolicy,
  validateIntentReplayJournal,
  type IntentReplayJournal,
} from './intentReplayGuard';
import {
  INTENT_AUTHORIZATION_RELEASE,
  INTENT_AUTHORIZATION_VERSION,
  MAX_AUTHORIZATION_TRACE_EVENTS,
  MAX_AUTHORIZATION_TTL_MS,
  advanceAuthorizationTrace,
  buildIntentAuthorizationEnvelope,
  buildIntentAuthorizationSnapshot,
  deriveAuthorizationMaterials,
  deriveIntentAuthorizationPolicyDigest,
  inspectAuthorizationContext,
  intentAuthorizationPolicy,
  startAuthorizationTrace,
  validateAuthorizationTrace,
  type AuthorizationContext,
} from './intentAuthorizationEnvelope';
import {
  MAX_DEVICE_ATTESTATION_TTL_MS,
  MAX_REMOTE_CLOCK_SKEW_MS,
  MAX_REMOTE_DECISION_TTL_MS,
  REMOTE_AUTHORIZATION_ALGORITHM,
  REMOTE_AUTHORIZATION_RELEASE,
  REMOTE_AUTHORIZATION_VERSION,
  buildDeviceAttestationBinding,
  buildRemoteAuthorizationDecision,
  buildRemoteAuthorizationSnapshot,
  deriveRemoteAuthorizationPolicyDigest,
  inspectDeviceAttestationBinding,
  inspectRemoteAuthorizationDecision,
  remoteAuthorizationPolicy,
  verifyRemoteAuthorizationDecision,
} from './remoteAuthorizationBoundary';
import {
  EXECUTION_PERMIT_RELEASE,
  EXECUTION_PERMIT_VERSION,
  MAX_EXECUTION_PERMIT_TTL_MS,
  advanceExecutionPermitTrace,
  buildDryRunExecutionPermit,
  buildExecutionPermitSnapshot,
  deriveExecutionPermitPolicyDigest,
  executionPermitPolicy,
  startExecutionPermitTrace,
  validateDryRunExecutionPermit,
  validateExecutionPermitTrace,
} from './executionPermit';
import {
  MAX_TRUST_ANCHOR_KEYS,
  MAX_TRUST_ANCHOR_TTL_MS,
  SERVER_TRUST_ALGORITHM,
  SERVER_TRUST_ANCHOR_RELEASE,
  SERVER_TRUST_ANCHOR_VERSION,
  buildServerTrustAnchorSet,
  buildServerTrustAnchorSnapshot,
  deriveServerTrustAnchorPolicyDigest,
  inspectServerTrustAnchorSet,
  inspectTrustAnchorRotation,
  serverTrustAnchorPolicy,
} from './serverTrustAnchor';
import {
  DEVICE_ATTESTATION_CONTRACT_RELEASE,
  DEVICE_ATTESTATION_CONTRACT_VERSION,
  MAX_ATTESTATION_CHALLENGE_TTL_MS,
  MAX_ATTESTATION_CLOCK_SKEW_MS,
  buildDeviceAttestationChallenge,
  buildDeviceAttestationContractSnapshot,
  buildDeviceAttestationVerdict,
  deriveDeviceAttestationPolicyDigest,
  deviceAttestationPolicy,
  inspectDeviceAttestationChallenge,
  inspectDeviceAttestationVerdict,
  verifyDeviceAttestationVerdict,
} from './deviceAttestationContract';
import {
  LEDGER_GENESIS,
  MAX_LEDGER_ANCHOR_EVENTS,
  MAX_SERVER_TIME_SKEW_MS,
  MAX_SERVER_TIME_TTL_MS,
  SERVER_LEDGER_ANCHOR_RELEASE,
  SERVER_LEDGER_ANCHOR_VERSION,
  appendLedgerAnchorEvent,
  buildServerLedgerAnchorSnapshot,
  buildSignedServerTimeAnchor,
  deriveServerLedgerAnchorPolicyDigest,
  inspectSignedServerTimeAnchor,
  serverLedgerAnchorPolicy,
  startLedgerAnchorJournal,
  validateLedgerAnchorJournal,
} from './serverLedgerAnchor';
import {
  MAX_RELEASE_RECEIPT_TTL_MS,
  RELEASE_READINESS_RELEASE,
  RELEASE_READINESS_VERSION,
  buildReleaseReadinessReceipt,
  buildReleaseReadinessSnapshot,
  deriveReleaseReadinessPolicyDigest,
  inspectLabReleaseReadiness,
  inspectProductionReleaseReadiness,
  inspectReleaseReadinessReceipt,
  releaseReadinessPolicy,
  type ReleaseReadinessInput,
} from './releaseReadinessGate';
import {
  MAX_TRUST_CEREMONY_CLOCK_SKEW_MS,
  MAX_TRUST_CEREMONY_TTL_MS,
  REQUIRED_TRUST_CEREMONY_APPROVALS,
  TRUST_CEREMONY_ALGORITHM,
  TRUST_CEREMONY_RELEASE,
  TRUST_CEREMONY_VERSION,
  buildTrustCeremonyManifest,
  buildTrustCeremonySnapshot,
  deriveTrustCeremonyPolicyDigest,
  inspectTrustCeremonyManifest,
  trustCeremonyPolicy,
  type TrustCeremonyApproval,
} from './trustCeremonyContract';
import {
  MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS,
  MAX_PROVIDER_REGISTRY_TTL_MS,
  PROVIDER_TRUST_REGISTRY_RELEASE,
  PROVIDER_TRUST_REGISTRY_VERSION,
  REQUIRED_ATTESTATION_PROVIDERS,
  buildProviderTrustRegistry,
  buildProviderTrustRegistrySnapshot,
  deriveProviderTrustRegistryPolicyDigest,
  inspectProviderTrustRegistry,
  providerTrustRegistryPolicy,
  type ProviderTrustDescriptor,
} from './providerTrustRegistry';
import {
  MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS,
  MAX_SERVER_VERIFICATION_TTL_MS,
  SERVER_VERIFICATION_ALGORITHM,
  SERVER_VERIFICATION_PROFILE_RELEASE,
  SERVER_VERIFICATION_PROFILE_VERSION,
  buildServerVerificationProfile,
  buildServerVerificationProfileSnapshot,
  deriveServerVerificationProfilePolicyDigest,
  inspectServerVerificationProfile,
  serverVerificationProfilePolicy,
  verifyLabServerDecision,
  verifyProductionServerDecision,
} from './serverVerificationProfile';
import {
  EXTERNAL_TRUST_READINESS_RELEASE,
  EXTERNAL_TRUST_READINESS_VERSION,
  MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS,
  buildExternalTrustReadinessReceipt,
  buildExternalTrustReadinessSnapshot,
  deriveExternalTrustReadinessPolicyDigest,
  externalTrustReadinessPolicy,
  inspectExternalTrustReadinessReceipt,
  inspectLabExternalTrustReadiness,
  inspectProductionExternalTrustReadiness,
  type ExternalTrustReadinessInput,
} from './externalTrustReadinessGate';
import {
  STAGING_HSM_ALGORITHM,
  STAGING_HSM_PROTECTION_LEVEL,
  STAGING_HSM_R13_8D_R2_BUNDLE_SHA256,
  deriveStagingHsmP256BindingDigest,
  inspectStagingHsmP256Binding,
  stagingHsmP256Binding,
  stagingHsmP256BindingPolicy,
} from './stagingHsmP256Binding';
import {
  PROVIDER_ROOT_REVIEW_RELEASE,
  buildProviderRootReviewContract,
  buildProviderRootReviewSnapshot,
  deriveProviderRootReviewPolicyDigest,
  inspectProviderRootReviewContract,
  providerRootReviewPolicy,
} from './providerRootReviewContract';
import {
  PRODUCTION_ADMISSION_SHADOW_RELEASE,
  buildProductionAdmissionAssessment,
  buildProductionAdmissionSnapshot,
  deriveProductionAdmissionPolicyDigest,
  inspectProductionAdmissionAssessment,
  productionAdmissionPolicy,
} from './productionAdmissionShadowContract';
import {
  PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE,
  R13_8I_DEVICE_PAP_PANEL_SHA256,
  R13_8I_PARENT_ADMISSION_DIGEST,
  R13_8I_PARENT_MANIFEST_SHA256,
  R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256,
  buildProductionFoundationBlueprint,
  buildProductionFoundationSnapshot,
  deriveProductionFoundationPolicyDigest,
  inspectProductionFoundationBlueprint,
  productionFoundationPolicy,
} from './productionFoundationBlueprint';
import { runBackendBoundarySuite } from './backendBoundarySuite';
import {
  BACKEND_CONTRACT_VERSION,
  MAX_INTENT_TTL_MS,
  ReplayWindow,
  backendContractPolicy,
  buildBackendContractSnapshot,
  buildCanonicalIntent,
  endpointContract,
  inspectContractServerResponse,
  inspectContractTransport,
  liveOperations,
  runBackendContractSelfTest,
  validateIntentDraft,
  type IntentDraft,
  type LiveOperation,
} from './backendContract';

export type BackendContractSuiteResult = {
  checks: AcceptanceCheck[];
  passed: number;
  total: number;
  allPass: boolean;
  ranAt: number;
};

export async function runBackendContractSuite(): Promise<BackendContractSuiteResult> {
  const prior = await runBackendBoundarySuite();
  const checks: AcceptanceCheck[] = [...prior.checks];
  const add = (id: string, label: string, pass: boolean, detail: string) => checks.push({ id, label, pass, detail });
  const now = 1_700_000_000_000;
  const base: IntentDraft = {
    v: 1,
    operation: 'payment.create',
    subjectRef: 'wallet.demo.001',
    nonce: 'nonce_demo_1234567890',
    idempotencyKey: 'idem_demo_12345678901',
    issuedAt: now,
    expiresAt: now + 60_000,
    amountMinor: 1250,
    currency: 'EUR',
    payload: { alpha: 1, beta: 'two' },
  };
  const valid = validateIntentDraft(base, now + 1);
  const self = runBackendContractSelfTest();

  add('contract-version', 'Version contrat backend épinglée', BACKEND_CONTRACT_VERSION === 'orchidpay.backend-contract.v1', BACKEND_CONTRACT_VERSION);
  add('contract-network-fuse', 'Exécution réseau du lab OFF', backendContractPolicy.networkExecutionEnabled === false && backendContractPolicy.liveIntentSubmissionEnabled === false, 'network=off · submit=off');
  add('contract-operation-catalog', 'Catalogue live strict et borné', liveOperations.length === 5 && liveOperations.includes('payment.create') && liveOperations.includes('deposit.create'), `${liveOperations.length} operations`);
  add('contract-relative-paths', 'Endpoints relatifs uniquement', Object.values(endpointContract).every((entry) => entry.path.startsWith('/v1/') && !entry.path.includes('://')), 'no absolute URL');
  add('contract-transport-blocked', 'Transport live reste impossible', !inspectContractTransport('https://example.invalid').ok, 'network execution disabled');
  add('contract-canonical-deterministic', 'Intent canonique déterministe', valid.ok && buildCanonicalIntent(base) === buildCanonicalIntent(base), 'stable canonical bytes');
  const reordered: IntentDraft = { ...base, payload: { beta: 'two', alpha: 1 } };
  add('contract-canonical-key-order', 'Ordre JSON ne change pas la preuve', buildCanonicalIntent(base) === buildCanonicalIntent(reordered), 'sorted keys');
  add('contract-money-minor', 'Montants en unités mineures entières', valid.ok && base.amountMinor === 1250 && Number.isSafeInteger(base.amountMinor), '1250 EUR cents');
  const badAmount = validateIntentDraft({ ...base, amountMinor: 12.5 }, now + 1);
  add('contract-invalid-amount', 'Montant fractionnaire rejeté', !badAmount.ok && badAmount.code === 'AMOUNT_MINOR_INVALID', badAmount.ok ? 'unexpected-pass' : badAmount.code);
  const badCurrency = validateIntentDraft({ ...base, currency: 'eur' }, now + 1);
  add('contract-currency', 'Devise ISO uppercase stricte', !badCurrency.ok && badCurrency.code === 'CURRENCY_INVALID', badCurrency.ok ? 'unexpected-pass' : badCurrency.code);
  const badNonce = validateIntentDraft({ ...base, nonce: 'short' }, now + 1);
  add('contract-nonce-format', 'Nonce entropy minimale', !badNonce.ok && badNonce.code === 'NONCE_INVALID', badNonce.ok ? 'unexpected-pass' : badNonce.code);
  const replay = new ReplayWindow();
  add('contract-replay-first', 'Premier nonce accepté localement', replay.accept(base.nonce, base.expiresAt, now + 1), 'first-use');
  add('contract-replay-second', 'Replay du nonce rejeté', !replay.accept(base.nonce, base.expiresAt, now + 2), 'replay blocked');
  add('contract-idempotency-format', 'Clé idempotence structurée', /^idem_[A-Za-z0-9_-]{16,80}$/.test(base.idempotencyKey), 'idem_*');
  const badIdem = validateIntentDraft({ ...base, idempotencyKey: 'bad' }, now + 1);
  add('contract-idempotency-invalid', 'Idempotence malformée rejetée', !badIdem.ok && badIdem.code === 'IDEMPOTENCY_KEY_INVALID', badIdem.ok ? 'unexpected-pass' : badIdem.code);
  const ttlTooLong = validateIntentDraft({ ...base, expiresAt: now + MAX_INTENT_TTL_MS + 1 }, now + 1);
  add('contract-ttl-bounded', 'TTL maximum 90 secondes', !ttlTooLong.ok && ttlTooLong.code === 'TTL_TOO_LONG', ttlTooLong.ok ? 'unexpected-pass' : ttlTooLong.code);
  const expired = validateIntentDraft({ ...base, expiresAt: now + 10 }, now + 11);
  add('contract-expired-intent', 'Intent expiré rejeté', !expired.ok && expired.code === 'EXPIRED', expired.ok ? 'unexpected-pass' : expired.code);
  const future = validateIntentDraft({ ...base, issuedAt: now + 20_000, expiresAt: now + 40_000 }, now);
  add('contract-future-intent', 'Horloge future hors skew rejetée', !future.ok && future.code === 'ISSUED_IN_FUTURE', future.ok ? 'unexpected-pass' : future.code);
  const unknown = validateIntentDraft({ ...base, operation: 'root.shell' as LiveOperation }, now + 1);
  add('contract-operation-unknown', 'Opération hors catalogue rejetée', !unknown.ok && unknown.code === 'OPERATION_UNKNOWN', unknown.ok ? 'unexpected-pass' : unknown.code);
  const pan = validateIntentDraft({ ...base, payload: { pan: '4111111111111111' } }, now + 1);
  add('contract-pan-forbidden', 'PAN brut interdit', !pan.ok && pan.code === 'FORBIDDEN_SENSITIVE_FIELD', pan.ok ? 'unexpected-pass' : pan.code);
  const cvv = validateIntentDraft({ ...base, payload: { cvv: '123' } }, now + 1);
  add('contract-cvv-forbidden', 'CVV/CVC interdit', !cvv.ok && cvv.code === 'FORBIDDEN_SENSITIVE_FIELD', cvv.ok ? 'unexpected-pass' : cvv.code);
  const token = validateIntentDraft({ ...base, payload: { authorizationToken: 'demo' } }, now + 1);
  add('contract-token-forbidden', 'Token/authorization interdit dans payload', !token.ok && token.code === 'FORBIDDEN_SENSITIVE_FIELD', token.ok ? 'unexpected-pass' : token.code);
  const url = validateIntentDraft({ ...base, payload: { callback: 'https://evil.invalid/callback' } }, now + 1);
  add('contract-outbound-url', 'URL sortante injectée rejetée', !url.ok && url.code === 'OUTBOUND_URL_IN_PAYLOAD', url.ok ? 'unexpected-pass' : url.code);
  const fakeServer = inspectContractServerResponse({ serverSigned: true, algorithm: 'Ed25519', keyId: 'kid-demo', signature: 'DEMO-SIGNATURE-NOT-VALID', nonce: 'nonce-1234567890', issuedAt: now, expiresAt: now + 60_000 }, now + 1);
  const snapshot = buildBackendContractSnapshot('IB-1234567890ABCDEF');
  add('contract-server-trust-redaction', 'Trust serveur fail-closed + snapshot expurgé', !fakeServer.ok && self.serverTrustStillBlocked && self.redactionSafe && snapshot.includes('serverSigned=false') && snapshot.includes('secrets=NONE'), fakeServer.ok ? 'unexpected-trust' : fakeServer.code);


  const ibSemantic = {
    release: 'R12.9-INTEGRATION-BOUNDARY' as const,
    status: 'BLOCKED_EXTERNAL_DEPENDENCIES' as const,
    liveReady: false as const,
    coreSuitePassed: 40 as const,
    coreSuiteTotal: 40 as const,
    blockerCount: 8,
    blockerDigest: '0123456789ABCDEF',
    serverSigned: false as const,
  };
  const ibSealA = { ...ibSemantic, v: 1 as const, issuedAt: 1_700_000_000_000, releaseProof: 'RP-AAAAAAAAAAAAAAAA', proof: 'IB-AAAAAAAAAAAAAAAA' };
  const ibSealB = { ...ibSemantic, v: 1 as const, issuedAt: 1_700_000_999_999, releaseProof: 'RP-BBBBBBBBBBBBBBBB', proof: 'IB-BBBBBBBBBBBBBBBB' };
  const ibLineageA = await deriveIntegrationBoundaryLineage(ibSealA);
  const ibLineageB = await deriveIntegrationBoundaryLineage(ibSealB);
  const ibLineageBlockerChanged = await deriveIntegrationBoundaryLineage({ ...ibSealA, blockerDigest: 'FEDCBA9876543210' });
  const bcLineageA = await deriveBackendContractLineage(ibLineageA);
  const bcLineageB = await deriveBackendContractLineage(ibLineageB);
  const bcLineageOtherParent = await deriveBackendContractLineage('IBL-1111111111111111');
  add('contract-lineage-ib-format', 'Lignée IB stable au format borné', /^IBL-[A-F0-9]{16}$/.test(ibLineageA), ibLineageA);
  add('contract-lineage-ib-deterministic', 'Lignée IB déterministe', ibLineageA === ibLineageB, 'same semantic state');
  add('contract-lineage-ib-seal-independent', 'Réémission IB conserve la lignée', ibLineageA === ibLineageB, 'issuedAt/releaseProof/proof excluded by design');
  add('contract-lineage-ib-sensitive', 'Dérive frontière détectée', ibLineageA !== ibLineageBlockerChanged, 'blocker digest changes lineage');
  add('contract-lineage-bc-format', 'Lignée contrat au format borné', /^BCL-[A-F0-9]{16}$/.test(bcLineageA), bcLineageA);
  add('contract-lineage-bc-deterministic', 'Lignée contrat déterministe', bcLineageA === bcLineageB, 'same contract + same boundary lineage');
  add('contract-lineage-bc-parent-sensitive', 'Changement de lignée parent détecté', bcLineageA !== bcLineageOtherParent, 'parent lineage changes contract lineage');
  add('contract-lineage-no-live', 'Lignée ne desserre aucun fuse live', backendContractPolicy.networkExecutionEnabled === false && backendContractPolicy.liveIntentSubmissionEnabled === false && backendContractPolicy.serverResponseTrustEnabled === false, 'network=off · submit=off · trust=off');

  const continuityInput: AttestationContinuityInput = {
    issuedAt: now,
    boundaryProof: 'IB-AAAAAAAAAAAAAAAA',
    boundaryLineage: ibLineageA,
    contractRef: 'BCR-AAAAAAAAAAAAAAAA',
    contractLineage: bcLineageA,
    suitePassed: 88,
    suiteTotal: 88,
    liveReady: false,
    networkExecution: false,
    serverSigned: false,
  };
  const continuityEvent1 = await makeContinuityEvent(continuityInput, 1, CONTINUITY_GENESIS);
  const continuityEvent1Again = await makeContinuityEvent(continuityInput, 1, CONTINUITY_GENESIS);
  const seqDigest = await deriveContinuityDigest(continuityInput, 2, CONTINUITY_GENESIS);
  const prevDigest = await deriveContinuityDigest(continuityInput, 1, 'AC-1111111111111111');
  add('contract-continuity-digest-format', 'Digest continuité au format borné', /^AC-[A-F0-9]{16}$/.test(continuityEvent1.digest), continuityEvent1.digest);
  add('contract-continuity-deterministic', 'Événement continuité déterministe', continuityEvent1.digest === continuityEvent1Again.digest, 'same canonical event');
  add('contract-continuity-sequence-sensitive', 'Séquence modifie le digest', continuityEvent1.digest !== seqDigest, 'seq is authenticated');
  add('contract-continuity-prev-sensitive', 'Lien précédent modifie le digest', continuityEvent1.digest !== prevDigest, 'prevDigest is authenticated');

  const continuityEvent2 = await makeContinuityEvent({
    ...continuityInput,
    issuedAt: now + 1,
    boundaryProof: 'IB-BBBBBBBBBBBBBBBB',
    contractRef: 'BCR-BBBBBBBBBBBBBBBB',
  }, 2, continuityEvent1.digest);
  const { digest: _continuityEvent2Digest, ...continuityEvent2WithoutDigest } = continuityEvent2;
  const rotation = inspectContinuityTransition(continuityEvent1, continuityEvent2WithoutDigest);
  add('contract-continuity-seal-rotation', 'Rotation des scellés permise si lignées stables', rotation.ok, rotation.ok ? 'lineage-stable' : rotation.code);
  const boundaryDrift = inspectContinuityTransition(continuityEvent1, { ...continuityEvent2WithoutDigest, boundaryLineage: 'IBL-1111111111111111' });
  add('contract-continuity-boundary-drift', 'Dérive lignée frontière rejetée', !boundaryDrift.ok && boundaryDrift.code === 'BOUNDARY_LINEAGE_DRIFT', boundaryDrift.ok ? 'unexpected-pass' : boundaryDrift.code);
  const contractDrift = inspectContinuityTransition(continuityEvent1, { ...continuityEvent2WithoutDigest, contractLineage: 'BCL-1111111111111111' });
  add('contract-continuity-contract-drift', 'Dérive lignée contrat rejetée', !contractDrift.ok && contractDrift.code === 'CONTRACT_LINEAGE_DRIFT', contractDrift.ok ? 'unexpected-pass' : contractDrift.code);
  const liveContinuity = inspectContinuityInput({ ...continuityInput, liveReady: true });
  add('contract-continuity-live-fuse', 'Continuité refuse liveReady=true', !liveContinuity.ok && liveContinuity.code === 'LIVE_READY_FORBIDDEN', liveContinuity.ok ? 'unexpected-pass' : liveContinuity.code);
  const networkContinuity = inspectContinuityInput({ ...continuityInput, networkExecution: true });
  add('contract-continuity-network-fuse', 'Continuité refuse exécution réseau', !networkContinuity.ok && networkContinuity.code === 'NETWORK_EXECUTION_FORBIDDEN', networkContinuity.ok ? 'unexpected-pass' : networkContinuity.code);
  const serverContinuity = inspectContinuityInput({ ...continuityInput, serverSigned: true });
  add('contract-continuity-server-fuse', 'Continuité locale refuse signature serveur simulée', !serverContinuity.ok && serverContinuity.code === 'SERVER_SIGNED_FORBIDDEN', serverContinuity.ok ? 'unexpected-pass' : serverContinuity.code);
  const suiteContinuity = inspectContinuityInput({ ...continuityInput, suitePassed: 87 });
  add('contract-continuity-suite-pin', 'Continuité exige strictement 88/88', !suiteContinuity.ok && suiteContinuity.code === 'SUITE_NOT_88_88', suiteContinuity.ok ? 'unexpected-pass' : suiteContinuity.code);

  const continuityJournal: AttestationContinuityJournal = {
    v: 1,
    release: 'R13.2-CONTINUITY-JOURNAL',
    anchorDigest: CONTINUITY_GENESIS,
    originBoundaryLineage: ibLineageA,
    originContractLineage: bcLineageA,
    events: [continuityEvent1, continuityEvent2],
    headDigest: continuityEvent2.digest,
  };
  const journalValid = await validateContinuityJournal(continuityJournal);
  add('contract-continuity-journal-chain', 'Journal chaîné valide de bout en bout', journalValid.ok, journalValid.ok ? '2 chained events' : journalValid.code);
  const headTamper = await validateContinuityJournal({ ...continuityJournal, headDigest: 'AC-0000000000000000' });
  add('contract-continuity-head-tamper', 'Altération de tête détectée', !headTamper.ok && headTamper.code === 'HEAD_DIGEST_MISMATCH', headTamper.ok ? 'unexpected-pass' : headTamper.code);
  const linkTamper = await validateContinuityJournal({
    ...continuityJournal,
    events: [continuityEvent1, { ...continuityEvent2, prevDigest: 'AC-1111111111111111' }],
  });
  add('contract-continuity-link-tamper', 'Altération du chaînage détectée', !linkTamper.ok && linkTamper.code === 'CHAIN_LINK_MISMATCH', linkTamper.ok ? 'unexpected-pass' : linkTamper.code);

  let bounded: AttestationContinuityJournal | null = null;
  for (let i = 0; i < 10; i += 1) {
    const suffix = String(i).padStart(16, 'A').slice(-16).replace(/[^A-F0-9]/g, 'A');
    const appended = await appendContinuityEvent(bounded, {
      ...continuityInput,
      issuedAt: now + i,
      boundaryProof: `IB-${suffix}`,
      contractRef: `BCR-${suffix}`,
    });
    if (!appended.ok) throw new Error(`CONTINUITY_TEST_${appended.code}`);
    bounded = appended.journal;
  }
  const boundedStatus = bounded ? await validateContinuityJournal(bounded) : { ok: false as const, code: 'ABSENT' };
  const boundedHead = bounded?.events[bounded.events.length - 1];
  add('contract-continuity-bounded-retention', 'Rétention bornée conserve une chaîne valide', Boolean(bounded && boundedStatus.ok && bounded.events.length === MAX_CONTINUITY_EVENTS && boundedHead?.seq === 10 && bounded.events[0].seq === 3), bounded ? `${bounded.events.length}/${MAX_CONTINUITY_EVENTS} · seq ${boundedHead?.seq}` : 'absent');
  const continuitySnapshot = buildContinuitySnapshot(continuityJournal);
  add('contract-continuity-redaction', 'Snapshot continuité expurgé des scellés individuels', continuitySnapshot.includes('seals=REDACTED') && continuitySnapshot.includes('secrets=NONE') && !continuitySnapshot.includes('boundaryProof=') && !continuitySnapshot.includes('contractRef='), 'seals redacted · secrets none');


  const replayBase: IntentDraft = {
    ...base,
    nonce: 'nonce_replay_1234567890',
    idempotencyKey: 'idem_replay_12345678901',
    issuedAt: now,
    expiresAt: now + 60_000,
  };
  const replayInspect = inspectReplayDraft(replayBase, now + 1);
  const replayPolicyDigestA = await deriveIntentReplayPolicyDigest();
  const replayPolicyDigestB = await deriveIntentReplayPolicyDigest();
  const replayMaterialsA = await deriveReplayMaterials(replayBase);
  const replayMaterialsB = await deriveReplayMaterials(replayBase);
  add('contract-r13-3-replay-guard-version', 'Version anti-rejeu locale épinglée', INTENT_REPLAY_GUARD_VERSION === 1 && INTENT_REPLAY_RELEASE === 'R13.3-INTENT-REPLAY-GUARD', INTENT_REPLAY_RELEASE);
  add('contract-r13-3-replay-scope-explicit', 'Portée explicitement limitée à la fenêtre locale récente', intentReplayPolicy.scope === 'LOCAL_RECENT_WINDOW_ONLY' && intentReplayPolicy.strongAntiReplayClaim === false, intentReplayPolicy.scope);
  add('contract-r13-3-replay-clock-skew', 'Skew horloge local borné à 5 secondes', MAX_CLOCK_SKEW_MS === 5_000 && intentReplayPolicy.maxClockSkewMs === 5_000, `${MAX_CLOCK_SKEW_MS}ms`);
  add('contract-r13-3-replay-retention', 'Fenêtre locale anti-rejeu bornée', MAX_REPLAY_EVENTS === 16 && intentReplayPolicy.maxEvents === 16, `${MAX_REPLAY_EVENTS} receipts`);
  add('contract-r13-3-replay-policy-digest', 'Digest de politique déterministe', replayPolicyDigestA === replayPolicyDigestB && /^RGP-[A-F0-9]{16}$/.test(replayPolicyDigestA), replayPolicyDigestA);
  add('contract-r13-3-replay-valid-draft', 'Intent contractuel valide accepté par le guard', replayInspect.ok, replayInspect.ok ? 'accepted' : replayInspect.code);
  add('contract-r13-3-replay-intent-digest', 'Digest intent déterministe et borné', replayMaterialsA.intentDigest === replayMaterialsB.intentDigest && /^RI-[A-F0-9]{16}$/.test(replayMaterialsA.intentDigest), replayMaterialsA.intentDigest);
  add('contract-r13-3-replay-nonce-hashed', 'Nonce conservé uniquement sous forme de digest', /^RN-[A-F0-9]{16}$/.test(replayMaterialsA.nonceDigest) && !replayMaterialsA.nonceDigest.includes(replayBase.nonce), replayMaterialsA.nonceDigest);
  add('contract-r13-3-replay-idem-hashed', 'Idempotence conservée uniquement sous forme de digest', /^RK-[A-F0-9]{16}$/.test(replayMaterialsA.idempotencyDigest) && !replayMaterialsA.idempotencyDigest.includes(replayBase.idempotencyKey), replayMaterialsA.idempotencyDigest);
  const replayFirst = await appendIntentReplayReceipt(null, replayBase, now + 1);
  add('contract-r13-3-replay-first-accept', 'Première observation acceptée', replayFirst.ok && replayFirst.receipt.seq === 1, replayFirst.ok ? replayFirst.receipt.digest : replayFirst.code);
  const replayExact = replayFirst.ok ? await appendIntentReplayReceipt(replayFirst.journal, replayBase, now + 2) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-exact-block', 'Replay exact rejeté', !replayExact.ok && replayExact.code === 'INTENT_REPLAY', replayExact.ok ? 'unexpected-pass' : replayExact.code);
  const replayNonce = replayFirst.ok ? await appendIntentReplayReceipt(replayFirst.journal, { ...replayBase, idempotencyKey: 'idem_replay_alt_12345678901', payload: { alpha: 2 } }, now + 2) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-nonce-block', 'Réutilisation nonce rejetée même si payload/idempotence changent', !replayNonce.ok && replayNonce.code === 'NONCE_REPLAY', replayNonce.ok ? 'unexpected-pass' : replayNonce.code);
  const replayIdem = replayFirst.ok ? await appendIntentReplayReceipt(replayFirst.journal, { ...replayBase, nonce: 'nonce_replay_alt_1234567890', payload: { alpha: 3 } }, now + 2) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-idem-block', 'Réutilisation idempotence rejetée même si nonce/payload changent', !replayIdem.ok && replayIdem.code === 'IDEMPOTENCY_REPLAY', replayIdem.ok ? 'unexpected-pass' : replayIdem.code);
  const replayExpired = inspectReplayDraft({ ...replayBase, issuedAt: now - 60_000, expiresAt: now - 1 }, now);
  add('contract-r13-3-replay-expired-block', 'Intent expiré fermé avant insertion', !replayExpired.ok && replayExpired.code === 'EXPIRED', replayExpired.ok ? 'unexpected-pass' : replayExpired.code);
  const replayFuture = inspectReplayDraft({ ...replayBase, issuedAt: now + MAX_CLOCK_SKEW_MS + 1, expiresAt: now + 60_000 }, now);
  add('contract-r13-3-replay-future-skew-block', 'Horloge future au-delà du skew rejetée', !replayFuture.ok && replayFuture.code === 'CLOCK_SKEW_FUTURE', replayFuture.ok ? 'unexpected-pass' : replayFuture.code);
  const replayNearFuture = inspectReplayDraft({ ...replayBase, issuedAt: now + MAX_CLOCK_SKEW_MS - 1, expiresAt: now + 60_000 }, now);
  add('contract-r13-3-replay-near-future-accept', 'Skew futur borné reste toléré', replayNearFuture.ok, replayNearFuture.ok ? 'within-skew' : replayNearFuture.code);
  const replayTtl = inspectReplayDraft({ ...replayBase, expiresAt: replayBase.issuedAt + MAX_INTENT_TTL_MS + 1 }, now);
  add('contract-r13-3-replay-ttl-block', 'TTL supérieur au contrat rejeté', !replayTtl.ok && replayTtl.code === 'TTL_TOO_LONG', replayTtl.ok ? 'unexpected-pass' : replayTtl.code);
  const replayUnknown = inspectReplayDraft({ ...replayBase, operation: 'root.shell' as LiveOperation }, now + 1);
  add('contract-r13-3-replay-operation-inherits-contract', 'Guard hérite du catalogue d’opérations contractuel', !replayUnknown.ok && replayUnknown.code === 'CONTRACT_OPERATION_UNKNOWN', replayUnknown.ok ? 'unexpected-pass' : replayUnknown.code);
  const replaySecondDraft: IntentDraft = { ...replayBase, nonce: 'nonce_replay_second_12345678', idempotencyKey: 'idem_replay_second_123456789', payload: { alpha: 4 } };
  const replaySecond = replayFirst.ok ? await appendIntentReplayReceipt(replayFirst.journal, replaySecondDraft, now + 2) : { ok: false as const, code: 'PRECONDITION' };
  const replayJournalStatus = replaySecond.ok ? await validateIntentReplayJournal(replaySecond.journal) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-chain-valid', 'Chaîne de reçus monotone et valide', replaySecond.ok && replayJournalStatus.ok && replaySecond.receipt.seq === 2, replaySecond.ok ? replaySecond.receipt.digest : replaySecond.code);
  const replayHeadTamper = replaySecond.ok ? await validateIntentReplayJournal({ ...replaySecond.journal, headDigest: 'RG-0000000000000000' }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-head-tamper', 'Altération tête replay détectée', !replayHeadTamper.ok && replayHeadTamper.code === 'HEAD_DIGEST_MISMATCH', replayHeadTamper.ok ? 'unexpected-pass' : replayHeadTamper.code);
  const replayLinkTamper = replaySecond.ok ? await validateIntentReplayJournal({ ...replaySecond.journal, events: [replaySecond.journal.events[0], { ...replaySecond.journal.events[1], prevDigest: 'RG-1111111111111111' }] }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-3-replay-link-tamper', 'Altération lien replay détectée', !replayLinkTamper.ok && replayLinkTamper.code === 'CHAIN_LINK_MISMATCH', replayLinkTamper.ok ? 'unexpected-pass' : replayLinkTamper.code);
  let replayBounded: IntentReplayJournal | null = null;
  for (let i = 0; i < 20; i += 1) {
    const suffix = String(i).padStart(20, '0');
    const draft: IntentDraft = {
      ...replayBase,
      nonce: `nonce_bound_${suffix}`,
      idempotencyKey: `idem_bound_${suffix}`,
      issuedAt: now + i,
      expiresAt: now + 60_000 + i,
      payload: { seq: i },
    };
    const appended = await appendIntentReplayReceipt(replayBounded, draft, now + i + 1);
    if (!appended.ok) throw new Error(`REPLAY_BOUND_TEST_${appended.code}`);
    replayBounded = appended.journal;
  }
  const replayBoundedStatus = replayBounded ? await validateIntentReplayJournal(replayBounded) : { ok: false as const, code: 'ABSENT' };
  add('contract-r13-3-replay-bounded-window', 'Rétention bornée conserve chaîne et séquence', Boolean(replayBounded && replayBoundedStatus.ok && replayBounded.events.length === MAX_REPLAY_EVENTS && replayBounded.events[0].seq === 5 && replayBounded.events[replayBounded.events.length - 1].seq === 20), replayBounded ? `${replayBounded.events.length}/${MAX_REPLAY_EVENTS}` : 'absent');
  const replaySnapshot = buildIntentReplaySnapshot(replaySecond.ok ? replaySecond.journal : null);
  add('contract-r13-3-replay-snapshot-redacted', 'Snapshot anti-rejeu expurgé des identifiants bruts', replaySnapshot.includes('identifiers=HASHED_ONLY') && replaySnapshot.includes('secrets=NONE') && !replaySnapshot.includes(replayBase.nonce) && !replaySnapshot.includes(replayBase.idempotencyKey), 'hashed-only · secrets none');
  add('contract-r13-3-replay-live-fuses', 'Anti-rejeu local ne desserre aucun fuse distant', intentReplayPolicy.serverReplayLedgerProvisioned === false && intentReplayPolicy.externalClockAnchorProvisioned === false && intentReplayPolicy.networkExecutionEnabled === false && intentReplayPolicy.strongAntiReplayClaim === false && backendContractPolicy.networkExecutionEnabled === false && backendContractPolicy.liveIntentSubmissionEnabled === false && backendContractPolicy.serverResponseTrustEnabled === false, 'server-ledger=off · clock-anchor=off · network=off · claim=local-only');


  const authDraft: IntentDraft = {
    ...replayBase,
    nonce: 'nonce_auth_1234567890123456',
    idempotencyKey: 'idem_auth_12345678901234567',
    subjectRef: 'wallet.auth.demo.001',
    amountMinor: 4200,
    currency: 'EUR',
    issuedAt: now,
    expiresAt: now + 60_000,
    payload: { purpose: 'authorization-lab', orderRef: 'order_demo_001' },
  };
  const authContext: AuthorizationContext = {
    principalRef: 'principal.demo.0001',
    deviceRef: 'device.demo.0001',
    authorizationNonce: 'authnonce_demo_1234567890',
    parentReplayProof: 'IRP-AAAAAAAAAAAAAAAA',
    parentBackendProof: 'BC-BBBBBBBBBBBBBBBB',
    boundaryLineage: ibLineageA,
    contractLineage: bcLineageA,
    issuedAt: now,
    expiresAt: now + 25_000,
  };
  const authInspect = inspectAuthorizationContext(authDraft, authContext, now + 1);
  const authPolicyDigestA = await deriveIntentAuthorizationPolicyDigest();
  const authPolicyDigestB = await deriveIntentAuthorizationPolicyDigest();
  const authMaterialsA = await deriveAuthorizationMaterials(authDraft, authContext);
  const authMaterialsB = await deriveAuthorizationMaterials(authDraft, authContext);
  const authEnvelopeA = await buildIntentAuthorizationEnvelope(authDraft, authContext, now + 1);
  const authEnvelopeB = await buildIntentAuthorizationEnvelope(authDraft, authContext, now + 1);
  add('contract-r13-4-auth-version', 'Version enveloppe autorisation épinglée', INTENT_AUTHORIZATION_VERSION === 1 && INTENT_AUTHORIZATION_RELEASE === 'R13.4-INTENT-AUTHORIZATION-ENVELOPE', INTENT_AUTHORIZATION_RELEASE);
  add('contract-r13-4-auth-scope', 'Portée limitée à la préautorisation locale', intentAuthorizationPolicy.scope === 'LOCAL_PREAUTHORIZATION_ONLY' && intentAuthorizationPolicy.strongAuthorizationClaim === false, intentAuthorizationPolicy.scope);
  add('contract-r13-4-auth-ttl', 'TTL autorisation local borné à 30 secondes', MAX_AUTHORIZATION_TTL_MS === 30_000 && intentAuthorizationPolicy.maxAuthorizationTtlMs === 30_000, `${MAX_AUTHORIZATION_TTL_MS}ms`);
  add('contract-r13-4-auth-trace-bound', 'Trace état bornée à quatre transitions', MAX_AUTHORIZATION_TRACE_EVENTS === 4 && intentAuthorizationPolicy.maxTraceEvents === 4, `${MAX_AUTHORIZATION_TRACE_EVENTS} events`);
  add('contract-r13-4-auth-policy-digest', 'Digest politique autorisation déterministe', authPolicyDigestA === authPolicyDigestB && /^AGP-[A-F0-9]{16}$/.test(authPolicyDigestA), authPolicyDigestA);
  add('contract-r13-4-auth-valid-context', 'Contexte d’autorisation complet accepté', authInspect.ok, authInspect.ok ? 'accepted' : authInspect.code);
  add('contract-r13-4-auth-envelope-deterministic', 'Enveloppe canonique déterministe', authEnvelopeA.ok && authEnvelopeB.ok && authEnvelopeA.envelope.digest === authEnvelopeB.envelope.digest && /^AE-[A-F0-9]{16}$/.test(authEnvelopeA.envelope.digest), authEnvelopeA.ok ? authEnvelopeA.envelope.digest : authEnvelopeA.code);
  add('contract-r13-4-auth-bind-intent', 'Enveloppe liée au digest anti-rejeu de l’intent', authEnvelopeA.ok && authEnvelopeA.envelope.intentDigest === authMaterialsA.intentDigest && authMaterialsA.intentDigest === authMaterialsB.intentDigest, authMaterialsA.intentDigest);
  add('contract-r13-4-auth-subject-hashed', 'Sujet conservé uniquement sous forme de digest', /^AS-[A-F0-9]{16}$/.test(authMaterialsA.subjectDigest) && !authMaterialsA.subjectDigest.includes(authDraft.subjectRef), authMaterialsA.subjectDigest);
  add('contract-r13-4-auth-principal-hashed', 'Principal conservé uniquement sous forme de digest', /^AP-[A-F0-9]{16}$/.test(authMaterialsA.principalDigest) && !authMaterialsA.principalDigest.includes(authContext.principalRef), authMaterialsA.principalDigest);
  add('contract-r13-4-auth-device-hashed', 'Device conservé uniquement sous forme de digest', /^AD-[A-F0-9]{16}$/.test(authMaterialsA.deviceDigest) && !authMaterialsA.deviceDigest.includes(authContext.deviceRef), authMaterialsA.deviceDigest);
  add('contract-r13-4-auth-nonce-hashed', 'Nonce d’autorisation conservé sous forme de digest', /^AN-[A-F0-9]{16}$/.test(authMaterialsA.authorizationNonceDigest) && !authMaterialsA.authorizationNonceDigest.includes(authContext.authorizationNonce), authMaterialsA.authorizationNonceDigest);
  add('contract-r13-4-auth-parent-proofs', 'Parents replay et contrat explicitement liés', authEnvelopeA.ok && authEnvelopeA.envelope.parentReplayProof === authContext.parentReplayProof && authEnvelopeA.envelope.parentBackendProof === authContext.parentBackendProof, `${authContext.parentReplayProof} · ${authContext.parentBackendProof}`);
  add('contract-r13-4-auth-lineages', 'Lignées frontière et contrat explicitement liées', authEnvelopeA.ok && authEnvelopeA.envelope.boundaryLineage === ibLineageA && authEnvelopeA.envelope.contractLineage === bcLineageA, `${ibLineageA} · ${bcLineageA}`);
  const authAmountChanged = await buildIntentAuthorizationEnvelope({ ...authDraft, amountMinor: (authDraft.amountMinor ?? 0) + 1 }, authContext, now + 1);
  add('contract-r13-4-auth-amount-sensitive', 'Variation montant invalide le digest autorisation', authEnvelopeA.ok && authAmountChanged.ok && authAmountChanged.envelope.digest !== authEnvelopeA.envelope.digest, authAmountChanged.ok ? authAmountChanged.envelope.digest : authAmountChanged.code);
  const authCurrencyChanged = await buildIntentAuthorizationEnvelope({ ...authDraft, currency: 'USD' }, authContext, now + 1);
  add('contract-r13-4-auth-currency-sensitive', 'Variation devise invalide le digest autorisation', authEnvelopeA.ok && authCurrencyChanged.ok && authCurrencyChanged.envelope.digest !== authEnvelopeA.envelope.digest, authCurrencyChanged.ok ? authCurrencyChanged.envelope.digest : authCurrencyChanged.code);
  const authOperationChanged = await buildIntentAuthorizationEnvelope({ ...authDraft, operation: 'deposit.create' }, authContext, now + 1);
  add('contract-r13-4-auth-operation-sensitive', 'Variation opération invalide le digest autorisation', authEnvelopeA.ok && authOperationChanged.ok && authOperationChanged.envelope.digest !== authEnvelopeA.envelope.digest, authOperationChanged.ok ? authOperationChanged.envelope.digest : authOperationChanged.code);
  const authSubjectChanged = await buildIntentAuthorizationEnvelope({ ...authDraft, subjectRef: 'wallet.auth.demo.002' }, authContext, now + 1);
  add('contract-r13-4-auth-subject-sensitive', 'Variation sujet invalide le digest autorisation', authEnvelopeA.ok && authSubjectChanged.ok && authSubjectChanged.envelope.digest !== authEnvelopeA.envelope.digest, authSubjectChanged.ok ? authSubjectChanged.envelope.digest : authSubjectChanged.code);
  const authPrincipalChanged = await buildIntentAuthorizationEnvelope(authDraft, { ...authContext, principalRef: 'principal.demo.0002' }, now + 1);
  add('contract-r13-4-auth-principal-sensitive', 'Variation principal invalide le digest autorisation', authEnvelopeA.ok && authPrincipalChanged.ok && authPrincipalChanged.envelope.digest !== authEnvelopeA.envelope.digest, authPrincipalChanged.ok ? authPrincipalChanged.envelope.digest : authPrincipalChanged.code);
  const authDeviceChanged = await buildIntentAuthorizationEnvelope(authDraft, { ...authContext, deviceRef: 'device.demo.0002' }, now + 1);
  add('contract-r13-4-auth-device-sensitive', 'Variation device invalide le digest autorisation', authEnvelopeA.ok && authDeviceChanged.ok && authDeviceChanged.envelope.digest !== authEnvelopeA.envelope.digest, authDeviceChanged.ok ? authDeviceChanged.envelope.digest : authDeviceChanged.code);
  const authNonceChanged = await buildIntentAuthorizationEnvelope(authDraft, { ...authContext, authorizationNonce: 'authnonce_demo_1234567891' }, now + 1);
  add('contract-r13-4-auth-nonce-sensitive', 'Variation nonce autorisation invalide le digest', authEnvelopeA.ok && authNonceChanged.ok && authNonceChanged.envelope.digest !== authEnvelopeA.envelope.digest, authNonceChanged.ok ? authNonceChanged.envelope.digest : authNonceChanged.code);
  const authTtlTooLong = inspectAuthorizationContext(authDraft, { ...authContext, expiresAt: authContext.issuedAt + MAX_AUTHORIZATION_TTL_MS + 1 }, now + 1);
  add('contract-r13-4-auth-ttl-block', 'TTL autorisation excessif rejeté', !authTtlTooLong.ok && authTtlTooLong.code === 'AUTH_TTL_TOO_LONG', authTtlTooLong.ok ? 'unexpected-pass' : authTtlTooLong.code);
  const authOutlivesIntent = inspectAuthorizationContext(authDraft, { ...authContext, expiresAt: authDraft.expiresAt + 1 }, now + 1);
  add('contract-r13-4-auth-outlives-intent-block', 'Autorisation ne peut survivre à l’intent', !authOutlivesIntent.ok && authOutlivesIntent.code === 'AUTH_OUTLIVES_INTENT', authOutlivesIntent.ok ? 'unexpected-pass' : authOutlivesIntent.code);
  const authFuture = inspectAuthorizationContext(authDraft, { ...authContext, issuedAt: now + MAX_CLOCK_SKEW_MS + 1, expiresAt: now + MAX_CLOCK_SKEW_MS + 20_000 }, now);
  add('contract-r13-4-auth-future-skew-block', 'Horloge autorisation future hors skew rejetée', !authFuture.ok && authFuture.code === 'AUTH_CLOCK_SKEW_FUTURE', authFuture.ok ? 'unexpected-pass' : authFuture.code);
  const authBadReplayParent = inspectAuthorizationContext(authDraft, { ...authContext, parentReplayProof: 'IRP-BAD' }, now + 1);
  add('contract-r13-4-auth-replay-parent-format-block', 'Parent anti-rejeu malformé rejeté', !authBadReplayParent.ok && authBadReplayParent.code === 'PARENT_REPLAY_PROOF_INVALID', authBadReplayParent.ok ? 'unexpected-pass' : authBadReplayParent.code);
  const authBadBackendParent = inspectAuthorizationContext(authDraft, { ...authContext, parentBackendProof: 'BC-BAD' }, now + 1);
  add('contract-r13-4-auth-backend-parent-format-block', 'Parent contrat malformé rejeté', !authBadBackendParent.ok && authBadBackendParent.code === 'PARENT_BACKEND_PROOF_INVALID', authBadBackendParent.ok ? 'unexpected-pass' : authBadBackendParent.code);
  const authBadLineage = inspectAuthorizationContext(authDraft, { ...authContext, contractLineage: 'BCL-BAD' }, now + 1);
  add('contract-r13-4-auth-lineage-format-block', 'Lignée malformée rejetée', !authBadLineage.ok && authBadLineage.code === 'CONTRACT_LINEAGE_INVALID', authBadLineage.ok ? 'unexpected-pass' : authBadLineage.code);
  const authStart = authEnvelopeA.ok ? await startAuthorizationTrace(authEnvelopeA.envelope, now + 1) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-start-draft', 'Machine d’état démarre obligatoirement en DRAFT', authStart.ok && authStart.event.stage === 'DRAFT' && authStart.event.seq === 1, authStart.ok ? authStart.event.digest : authStart.code);
  const authSkipReview = authEnvelopeA.ok && authStart.ok ? await advanceAuthorizationTrace(authStart.trace, authEnvelopeA.envelope, 'AUTHORIZED', now + 2) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-skip-review-block', 'DRAFT vers AUTHORIZED direct interdit', !authSkipReview.ok && authSkipReview.code === 'TRANSITION_INVALID', authSkipReview.ok ? 'unexpected-pass' : authSkipReview.code);
  const authReview = authEnvelopeA.ok && authStart.ok ? await advanceAuthorizationTrace(authStart.trace, authEnvelopeA.envelope, 'REVIEWED', now + 2) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-review', 'DRAFT vers REVIEWED accepté', authReview.ok && authReview.event.stage === 'REVIEWED' && authReview.event.seq === 2, authReview.ok ? authReview.event.digest : authReview.code);
  const authAuthorized = authEnvelopeA.ok && authReview.ok ? await advanceAuthorizationTrace(authReview.trace, authEnvelopeA.envelope, 'AUTHORIZED', now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-authorize', 'REVIEWED vers AUTHORIZED accepté', authAuthorized.ok && authAuthorized.event.stage === 'AUTHORIZED' && authAuthorized.event.seq === 3, authAuthorized.ok ? authAuthorized.event.digest : authAuthorized.code);
  const authConsumed = authEnvelopeA.ok && authAuthorized.ok ? await advanceAuthorizationTrace(authAuthorized.trace, authEnvelopeA.envelope, 'CONSUMED', now + 4) : { ok: false as const, code: 'PRECONDITION' };
  const authConsumedStatus = authConsumed.ok ? await validateAuthorizationTrace(authConsumed.trace) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-consume', 'AUTHORIZED vers CONSUMED accepté et chaîne valide', authConsumed.ok && authConsumedStatus.ok && authConsumed.event.stage === 'CONSUMED' && authConsumed.event.seq === 4, authConsumed.ok ? authConsumed.event.digest : authConsumed.code);
  const authConsumedAgain = authEnvelopeA.ok && authConsumed.ok ? await advanceAuthorizationTrace(authConsumed.trace, authEnvelopeA.envelope, 'CONSUMED', now + 5) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-consumed-terminal', 'CONSUMED est terminal et non rejouable', !authConsumedAgain.ok && authConsumedAgain.code === 'TRANSITION_INVALID', authConsumedAgain.ok ? 'unexpected-pass' : authConsumedAgain.code);
  const authChangedAfterReview = authReview.ok && authEnvelopeA.ok ? await advanceAuthorizationTrace(authReview.trace, { ...authEnvelopeA.envelope, amountMinor: authEnvelopeA.envelope.amountMinor + 1 }, 'AUTHORIZED', now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-context-change-block', 'Altération du contexte après review sans nouveau digest rejetée', !authChangedAfterReview.ok && authChangedAfterReview.code === 'ENVELOPE_DIGEST_MISMATCH', authChangedAfterReview.ok ? 'unexpected-pass' : authChangedAfterReview.code);
  const authExpired = authEnvelopeA.ok && authReview.ok ? await advanceAuthorizationTrace(authReview.trace, authEnvelopeA.envelope, 'AUTHORIZED', authContext.expiresAt + 1) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-expired-block', 'Autorisation expirée ne peut plus être accordée', !authExpired.ok && authExpired.code === 'AUTHORIZATION_EXPIRED', authExpired.ok ? 'unexpected-pass' : authExpired.code);
  const authRejected = authEnvelopeA.ok && authStart.ok ? await advanceAuthorizationTrace(authStart.trace, authEnvelopeA.envelope, 'REJECTED', now + 2) : { ok: false as const, code: 'PRECONDITION' };
  const authRejectedAdvance = authEnvelopeA.ok && authRejected.ok ? await advanceAuthorizationTrace(authRejected.trace, authEnvelopeA.envelope, 'REVIEWED', now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-reject-terminal', 'REJECTED est terminal', authRejected.ok && !authRejectedAdvance.ok && authRejectedAdvance.code === 'TRANSITION_INVALID', authRejected.ok ? authRejected.event.digest : authRejected.code);
  const authHeadTamper = authConsumed.ok ? await validateAuthorizationTrace({ ...authConsumed.trace, headDigest: 'AT-0000000000000000' }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-head-tamper', 'Altération tête trace détectée', !authHeadTamper.ok && authHeadTamper.code === 'HEAD_DIGEST_MISMATCH', authHeadTamper.ok ? 'unexpected-pass' : authHeadTamper.code);
  const authLinkTamper = authConsumed.ok ? await validateAuthorizationTrace({ ...authConsumed.trace, events: [authConsumed.trace.events[0], { ...authConsumed.trace.events[1], prevDigest: 'AT-1111111111111111' }, ...authConsumed.trace.events.slice(2)] }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-4-auth-link-tamper', 'Altération lien trace détectée', !authLinkTamper.ok && authLinkTamper.code === 'CHAIN_LINK_MISMATCH', authLinkTamper.ok ? 'unexpected-pass' : authLinkTamper.code);
  const authSnapshot = authEnvelopeA.ok && authConsumed.ok ? buildIntentAuthorizationSnapshot(authEnvelopeA.envelope, authConsumed.trace) : buildIntentAuthorizationSnapshot(null, null);
  add('contract-r13-4-auth-snapshot-redacted', 'Snapshot autorisation expurgé des références brutes', authSnapshot.includes('identifiers=HASHED_ONLY') && authSnapshot.includes('secrets=NONE') && !authSnapshot.includes(authContext.principalRef) && !authSnapshot.includes(authContext.deviceRef) && !authSnapshot.includes(authContext.authorizationNonce) && !authSnapshot.includes(authDraft.subjectRef), 'hashed-only · secrets none');
  add('contract-r13-4-auth-live-fuses', 'Enveloppe autorisation ne desserre aucun fuse distant', intentAuthorizationPolicy.serverAuthorizationVerifierProvisioned === false && intentAuthorizationPolicy.deviceAttestationProvisioned === false && intentAuthorizationPolicy.externalClockAnchorProvisioned === false && intentAuthorizationPolicy.networkExecutionEnabled === false && intentAuthorizationPolicy.strongAuthorizationClaim === false && intentReplayPolicy.networkExecutionEnabled === false && backendContractPolicy.networkExecutionEnabled === false && backendContractPolicy.liveIntentSubmissionEnabled === false && backendContractPolicy.serverResponseTrustEnabled === false, 'server-auth=off · device-attestation=off · network=off · claim=local-only');


  // R13.5 - Remote Authorization Boundary + Device Attestation Binding + Dry-run Execution Permit.
  // This remains a contract-preparation lab. No production server verifier, device-attestation verifier,
  // trusted clock, replay ledger, network execution or payment execution is provisioned here.
  if (!authEnvelopeA.ok) throw new Error(`R13_5_AUTH_ENVELOPE_PRECONDITION_${authEnvelopeA.code}`);
  const remoteEnvelope = authEnvelopeA.envelope;
  const attestationInput = {
    provider: 'APPLE_APP_ATTEST' as const,
    platform: 'ios' as const,
    keyId: 'appattest.demo.key.0001',
    challengeDigest: remoteEnvelope.authorizationNonceDigest,
    deviceDigest: remoteEnvelope.deviceDigest,
    issuedAt: now,
    expiresAt: now + 10_000,
    evidenceRef: 'device-evidence.demo.0001',
  };
  const remoteAttestationA = await buildDeviceAttestationBinding(attestationInput);
  const remoteAttestationB = await buildDeviceAttestationBinding(attestationInput);
  const remotePolicyDigestA = await deriveRemoteAuthorizationPolicyDigest();
  const remotePolicyDigestB = await deriveRemoteAuthorizationPolicyDigest();
  const remoteDecisionInput = {
    decision: 'ALLOW' as const,
    reasonCode: 'LAB_ALLOW',
    authorizationEnvelopeDigest: remoteEnvelope.digest,
    intentDigest: remoteEnvelope.intentDigest,
    principalDigest: remoteEnvelope.principalDigest,
    deviceDigest: remoteEnvelope.deviceDigest,
    authorizationNonceDigest: remoteEnvelope.authorizationNonceDigest,
    attestationDigest: remoteAttestationA.digest,
    parentAuthorizationProof: 'IAP-CCCCCCCCCCCCCCCC',
    serverKeyId: 'srvkey.demo.ed25519.0001',
    serverSequence: 1,
    replayLedgerRef: 'SRL-AAAAAAAAAAAAAAAA',
    timeAnchorRef: 'STA-BBBBBBBBBBBBBBBB',
    issuedAt: now,
    expiresAt: now + 12_000,
    signature: 'TESTSIGNATURE_VALID_1234567890',
  };
  const remoteDecisionA = await buildRemoteAuthorizationDecision(remoteDecisionInput);
  const remoteDecisionB = await buildRemoteAuthorizationDecision(remoteDecisionInput);
  const labVerifiers = {
    mode: 'LAB_INJECTED_VERIFIERS' as const,
    verifyServerSignature: async (_canonical: string, signature: string, keyId: string) => signature === 'TESTSIGNATURE_VALID_1234567890' && keyId === remoteDecisionInput.serverKeyId,
    verifyDeviceAttestation: async (binding: typeof remoteAttestationA) => binding.digest === remoteAttestationA.digest,
  };

  add('contract-r13-5-remote-version', 'Version frontière autorisation distante épinglée', REMOTE_AUTHORIZATION_VERSION === 1 && REMOTE_AUTHORIZATION_RELEASE === 'R13.5-REMOTE-AUTHORIZATION-BOUNDARY', REMOTE_AUTHORIZATION_RELEASE);
  add('contract-r13-5-remote-scope', 'Portée distante limitée à la préparation de contrat', remoteAuthorizationPolicy.scope === 'REMOTE_AUTHORIZATION_CONTRACT_PREP_ONLY' && remoteAuthorizationPolicy.strongRemoteAuthorizationClaim === false, remoteAuthorizationPolicy.scope);
  add('contract-r13-5-remote-algorithm', 'Algorithme distant contractuel Ed25519', REMOTE_AUTHORIZATION_ALGORITHM === 'Ed25519' && remoteAuthorizationPolicy.algorithm === 'Ed25519', REMOTE_AUTHORIZATION_ALGORITHM);
  add('contract-r13-5-server-verifier-fuse', 'Vérificateur signature serveur non provisionné', remoteAuthorizationPolicy.serverSignatureVerifierProvisioned === false, 'server-verifier=off');
  add('contract-r13-5-device-verifier-fuse', 'Vérificateur attestation device non provisionné', remoteAuthorizationPolicy.deviceAttestationVerifierProvisioned === false, 'device-verifier=off');
  add('contract-r13-5-ledger-fuse', 'Ledger replay serveur non provisionné', remoteAuthorizationPolicy.serverReplayLedgerProvisioned === false, 'server-ledger=off');
  add('contract-r13-5-clock-fuse', 'Ancre de temps serveur non provisionnée', remoteAuthorizationPolicy.trustedServerClockProvisioned === false, 'trusted-clock=off');
  add('contract-r13-5-network-fuses', 'Réseau et exécution paiement restent fermés', remoteAuthorizationPolicy.networkExecutionEnabled === false && remoteAuthorizationPolicy.livePaymentExecutionEnabled === false, 'network=off · payment=off');
  add('contract-r13-5-remote-policy-digest', 'Digest policy distante déterministe', remotePolicyDigestA === remotePolicyDigestB && /^RAPOL-[A-F0-9]{16}$/.test(remotePolicyDigestA), remotePolicyDigestA);
  const attestationStatus = await inspectDeviceAttestationBinding(remoteAttestationA, now + 1);
  add('contract-r13-5-attestation-provider', 'Couple fournisseur/plateforme attestation cohérent', attestationStatus.ok && remoteAttestationA.provider === 'APPLE_APP_ATTEST' && remoteAttestationA.platform === 'ios', `${remoteAttestationA.provider}/${remoteAttestationA.platform}`);
  add('contract-r13-5-attestation-deterministic', 'Binding attestation déterministe', remoteAttestationA.digest === remoteAttestationB.digest && /^DA-[A-F0-9]{16}$/.test(remoteAttestationA.digest), remoteAttestationA.digest);
  const attestationChallengeChanged = await buildDeviceAttestationBinding({ ...attestationInput, challengeDigest: 'AN-1111111111111111' });
  add('contract-r13-5-attestation-challenge-bound', 'Challenge attestation lié au nonce autorisation', attestationChallengeChanged.digest !== remoteAttestationA.digest, `${remoteAttestationA.challengeDigest} -> ${attestationChallengeChanged.challengeDigest}`);
  const attestationDeviceChanged = await buildDeviceAttestationBinding({ ...attestationInput, deviceDigest: 'AD-2222222222222222' });
  add('contract-r13-5-attestation-device-bound', 'Attestation liée au device haché', attestationDeviceChanged.digest !== remoteAttestationA.digest, `${remoteAttestationA.deviceDigest} -> ${attestationDeviceChanged.deviceDigest}`);
  const attestationTtl = await inspectDeviceAttestationBinding(await buildDeviceAttestationBinding({ ...attestationInput, expiresAt: now + MAX_DEVICE_ATTESTATION_TTL_MS + 1 }), now + 1);
  add('contract-r13-5-attestation-ttl-block', 'TTL attestation borné', !attestationTtl.ok && attestationTtl.code === 'ATTESTATION_TTL_TOO_LONG', attestationTtl.ok ? 'unexpected-pass' : attestationTtl.code);
  const attestationFuture = await inspectDeviceAttestationBinding(await buildDeviceAttestationBinding({ ...attestationInput, issuedAt: now + MAX_REMOTE_CLOCK_SKEW_MS + 1, expiresAt: now + MAX_REMOTE_CLOCK_SKEW_MS + 10_000 }), now);
  add('contract-r13-5-attestation-future-block', 'Attestation future hors skew rejetée', !attestationFuture.ok && attestationFuture.code === 'ATTESTATION_CLOCK_SKEW_FUTURE', attestationFuture.ok ? 'unexpected-pass' : attestationFuture.code);
  const attestationExpired = await inspectDeviceAttestationBinding(await buildDeviceAttestationBinding({ ...attestationInput, issuedAt: now - 10_000, expiresAt: now - 1 }), now);
  add('contract-r13-5-attestation-expired-block', 'Attestation expirée rejetée', !attestationExpired.ok && attestationExpired.code === 'ATTESTATION_EXPIRED', attestationExpired.ok ? 'unexpected-pass' : attestationExpired.code);
  const attestationTamper = await inspectDeviceAttestationBinding({ ...remoteAttestationA, evidenceRef: 'device-evidence.demo.9999' }, now + 1);
  add('contract-r13-5-attestation-tamper', 'Altération binding attestation détectée', !attestationTamper.ok && attestationTamper.code === 'ATTESTATION_DIGEST_MISMATCH', attestationTamper.ok ? 'unexpected-pass' : attestationTamper.code);
  add('contract-r13-5-decision-deterministic', 'Décision distante déterministe hors signature', remoteDecisionA.digest === remoteDecisionB.digest && /^RD-[A-F0-9]{16}$/.test(remoteDecisionA.digest), remoteDecisionA.digest);
  const decisionEnvelopeChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, authorizationEnvelopeDigest: 'AE-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-envelope-bound', 'Décision liée à enveloppe locale exacte', !decisionEnvelopeChanged.ok && decisionEnvelopeChanged.code === 'DECISION_ENVELOPE_MISMATCH', decisionEnvelopeChanged.ok ? 'unexpected-pass' : decisionEnvelopeChanged.code);
  const decisionIntentChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, intentDigest: 'RI-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-intent-bound', 'Décision liée au digest intent', !decisionIntentChanged.ok && decisionIntentChanged.code === 'DECISION_INTENT_MISMATCH', decisionIntentChanged.ok ? 'unexpected-pass' : decisionIntentChanged.code);
  const decisionPrincipalChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, principalDigest: 'AP-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-principal-bound', 'Décision liée au principal haché', !decisionPrincipalChanged.ok && decisionPrincipalChanged.code === 'DECISION_PRINCIPAL_MISMATCH', decisionPrincipalChanged.ok ? 'unexpected-pass' : decisionPrincipalChanged.code);
  const decisionDeviceChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, deviceDigest: 'AD-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-device-bound', 'Décision liée au device haché', !decisionDeviceChanged.ok && decisionDeviceChanged.code === 'DECISION_DEVICE_MISMATCH', decisionDeviceChanged.ok ? 'unexpected-pass' : decisionDeviceChanged.code);
  const decisionNonceChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, authorizationNonceDigest: 'AN-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-nonce-bound', 'Décision liée au nonce autorisation haché', !decisionNonceChanged.ok && decisionNonceChanged.code === 'DECISION_NONCE_MISMATCH', decisionNonceChanged.ok ? 'unexpected-pass' : decisionNonceChanged.code);
  const decisionAttestationChanged = await inspectRemoteAuthorizationDecision({ ...remoteDecisionA, attestationDigest: 'DA-1111111111111111' }, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-attestation-bound', 'Décision liée au binding attestation', !decisionAttestationChanged.ok && decisionAttestationChanged.code === 'DECISION_ATTESTATION_MISMATCH', decisionAttestationChanged.ok ? 'unexpected-pass' : decisionAttestationChanged.code);
  const decisionTtl = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, expiresAt: now + MAX_REMOTE_DECISION_TTL_MS + 1 }), remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-ttl-block', 'TTL décision distante borné', !decisionTtl.ok && decisionTtl.code === 'DECISION_TTL_TOO_LONG', decisionTtl.ok ? 'unexpected-pass' : decisionTtl.code);
  const decisionExpired = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, issuedAt: now - 10_000, expiresAt: now - 1 }), remoteEnvelope, remoteAttestationA, now);
  add('contract-r13-5-decision-expired-block', 'Décision distante expirée rejetée', !decisionExpired.ok && decisionExpired.code === 'DECISION_EXPIRED', decisionExpired.ok ? 'unexpected-pass' : decisionExpired.code);
  const decisionFuture = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, issuedAt: now + MAX_REMOTE_CLOCK_SKEW_MS + 1, expiresAt: now + MAX_REMOTE_CLOCK_SKEW_MS + 10_000 }), remoteEnvelope, remoteAttestationA, now);
  add('contract-r13-5-decision-future-block', 'Décision future hors skew rejetée', !decisionFuture.ok && decisionFuture.code === 'DECISION_CLOCK_SKEW_FUTURE', decisionFuture.ok ? 'unexpected-pass' : decisionFuture.code);
  const decisionBadKey = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, serverKeyId: 'bad' }), remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-key-block', 'Key ID serveur malformé rejeté', !decisionBadKey.ok && decisionBadKey.code === 'DECISION_SERVER_KEY_INVALID', decisionBadKey.ok ? 'unexpected-pass' : decisionBadKey.code);
  const decisionBadSeq = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, serverSequence: 0 }), remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-sequence-block', 'Séquence serveur non positive rejetée', !decisionBadSeq.ok && decisionBadSeq.code === 'DECISION_SEQUENCE_INVALID', decisionBadSeq.ok ? 'unexpected-pass' : decisionBadSeq.code);
  const decisionBadLedger = await inspectRemoteAuthorizationDecision(await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, replayLedgerRef: 'SRL-BAD' }), remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-decision-ledger-ref-block', 'Référence ledger serveur malformée rejetée', !decisionBadLedger.ok && decisionBadLedger.code === 'DECISION_LEDGER_REF_INVALID', decisionBadLedger.ok ? 'unexpected-pass' : decisionBadLedger.code);
  const defaultRemoteVerify = await verifyRemoteAuthorizationDecision(remoteDecisionA, remoteEnvelope, remoteAttestationA, now + 1);
  add('contract-r13-5-default-verifier-block', 'Absence vérificateur production ferme la décision', !defaultRemoteVerify.ok && defaultRemoteVerify.code === 'SERVER_AUTHORIZATION_VERIFIER_NOT_PROVISIONED', defaultRemoteVerify.ok ? 'unexpected-pass' : defaultRemoteVerify.code);
  const badSignatureVerify = await verifyRemoteAuthorizationDecision({ ...remoteDecisionA, signature: 'TESTSIGNATURE_BAD__1234567890' }, remoteEnvelope, remoteAttestationA, now + 1, labVerifiers);
  add('contract-r13-5-bad-signature-block', 'Signature serveur invalide rejetée dans harness injecté', !badSignatureVerify.ok && badSignatureVerify.code === 'SERVER_SIGNATURE_INVALID', badSignatureVerify.ok ? 'unexpected-pass' : badSignatureVerify.code);
  const validRemoteVerify = await verifyRemoteAuthorizationDecision(remoteDecisionA, remoteEnvelope, remoteAttestationA, now + 1, labVerifiers);
  add('contract-r13-5-lab-remote-verify', 'Chemin cryptographique abstrait validable uniquement par vérificateurs injectés', validRemoteVerify.ok && validRemoteVerify.verificationClass === 'LAB_INJECTED_ONLY', validRemoteVerify.ok ? validRemoteVerify.verificationClass : validRemoteVerify.code);

  const executionPolicyDigestA = await deriveExecutionPermitPolicyDigest();
  const executionPolicyDigestB = await deriveExecutionPermitPolicyDigest();
  const dryPermit = await buildDryRunExecutionPermit(validRemoteVerify, remoteEnvelope, remoteDecisionA.parentAuthorizationProof, now + 2);
  add('contract-r13-5-permit-version-scope', 'Permit exécution sec reste dry-run et versionné', EXECUTION_PERMIT_VERSION === 1 && EXECUTION_PERMIT_RELEASE === 'R13.5-DRY-RUN-EXECUTION-PERMIT' && executionPermitPolicy.scope === 'DRY_RUN_EXECUTION_GATE_ONLY', EXECUTION_PERMIT_RELEASE);
  add('contract-r13-5-permit-allow-required', 'Permit émis uniquement après décision distante ALLOW vérifiée', dryPermit.ok && validRemoteVerify.ok && validRemoteVerify.decision.decision === 'ALLOW', dryPermit.ok ? dryPermit.permit.digest : dryPermit.code);
  const denyDecision = await buildRemoteAuthorizationDecision({ ...remoteDecisionInput, decision: 'DENY', reasonCode: 'LAB_DENY' });
  const denyVerified = await verifyRemoteAuthorizationDecision(denyDecision, remoteEnvelope, remoteAttestationA, now + 1, { ...labVerifiers, verifyServerSignature: async () => true });
  const denyPermit = await buildDryRunExecutionPermit(denyVerified, remoteEnvelope, denyDecision.parentAuthorizationProof, now + 2);
  add('contract-r13-5-permit-deny-block', 'Décision DENY ne produit aucun permit', !denyPermit.ok && denyPermit.code === 'REMOTE_DECISION_NOT_ALLOW', denyPermit.ok ? 'unexpected-pass' : denyPermit.code);
  const dryPermitStatus = dryPermit.ok ? await validateDryRunExecutionPermit(dryPermit.permit, now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-5-permit-ttl', 'Permit dry-run TTL maximum 10 secondes', dryPermit.ok && dryPermitStatus.ok && dryPermit.permit.expiresAt - dryPermit.permit.issuedAt <= MAX_EXECUTION_PERMIT_TTL_MS, dryPermit.ok ? `${dryPermit.permit.expiresAt - dryPermit.permit.issuedAt}ms` : dryPermit.code);
  add('contract-r13-5-permit-decision-bound', 'Permit lié au digest décision distante', dryPermit.ok && dryPermit.permit.decisionDigest === remoteDecisionA.digest, dryPermit.ok ? dryPermit.permit.decisionDigest : dryPermit.code);
  add('contract-r13-5-permit-envelope-bound', 'Permit lié à enveloppe autorisation locale', dryPermit.ok && dryPermit.permit.authorizationEnvelopeDigest === remoteEnvelope.digest, dryPermit.ok ? dryPermit.permit.authorizationEnvelopeDigest : dryPermit.code);
  add('contract-r13-5-permit-parent-bound', 'Permit lié au passeport autorisation parent', dryPermit.ok && dryPermit.permit.parentAuthorizationProof === remoteDecisionA.parentAuthorizationProof, dryPermit.ok ? dryPermit.permit.parentAuthorizationProof : dryPermit.code);
  const permitStart = dryPermit.ok ? await startExecutionPermitTrace(dryPermit.permit, now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-5-permit-start-issued', 'Trace permit démarre en ISSUED', permitStart.ok && permitStart.event.stage === 'ISSUED' && permitStart.event.seq === 1, permitStart.ok ? permitStart.event.digest : permitStart.code);
  const permitSkip = dryPermit.ok && permitStart.ok ? await advanceExecutionPermitTrace(permitStart.trace, dryPermit.permit, 'CONSUMED', now + 4) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-5-permit-skip-reserve-block', 'ISSUED vers CONSUMED direct interdit', !permitSkip.ok && permitSkip.code === 'TRANSITION_INVALID', permitSkip.ok ? 'unexpected-pass' : permitSkip.code);
  const permitReserve = dryPermit.ok && permitStart.ok ? await advanceExecutionPermitTrace(permitStart.trace, dryPermit.permit, 'RESERVED', now + 4) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-5-permit-reserve', 'ISSUED vers RESERVED accepté', permitReserve.ok && permitReserve.event.stage === 'RESERVED' && permitReserve.event.seq === 2, permitReserve.ok ? permitReserve.event.digest : permitReserve.code);
  const permitConsume = dryPermit.ok && permitReserve.ok ? await advanceExecutionPermitTrace(permitReserve.trace, dryPermit.permit, 'CONSUMED', now + 5) : { ok: false as const, code: 'PRECONDITION' };
  const permitConsumeStatus = permitConsume.ok ? await validateExecutionPermitTrace(permitConsume.trace) : { ok: false as const, code: 'PRECONDITION' };
  const permitConsumeAgain = dryPermit.ok && permitConsume.ok ? await advanceExecutionPermitTrace(permitConsume.trace, dryPermit.permit, 'CONSUMED', now + 6) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-5-permit-consume-terminal', 'RESERVED vers CONSUMED accepté puis terminal', permitConsume.ok && permitConsumeStatus.ok && !permitConsumeAgain.ok && permitConsumeAgain.code === 'TRANSITION_INVALID', permitConsume.ok ? permitConsume.event.digest : permitConsume.code);

  add('contract-r13-5-execution-policy-digest', 'Digest policy execution dry-run déterministe', executionPolicyDigestA === executionPolicyDigestB && /^EPPOL-[A-F0-9]{16}$/.test(executionPolicyDigestA), executionPolicyDigestA);
  const remoteSnapshot = buildRemoteAuthorizationSnapshot(remoteDecisionA, remoteAttestationA);
  const permitSnapshot = buildExecutionPermitSnapshot(dryPermit.ok ? dryPermit.permit : null, permitConsume.ok ? permitConsume.trace : null);
  add('contract-r13-5-snapshot-redacted', 'Snapshots distants n’exportent ni preuve device brute ni signature serveur brute', remoteSnapshot.includes('rawDeviceEvidence=NOT_STORED') && remoteSnapshot.includes('rawServerSignature=NOT_EXPORTED') && remoteSnapshot.includes('secrets=NONE') && permitSnapshot.includes('secrets=NONE') && !remoteSnapshot.includes(remoteDecisionA.signature), 'no raw evidence/signature · secrets none');
  const noVerifyPermit = await buildDryRunExecutionPermit(defaultRemoteVerify, remoteEnvelope, remoteDecisionA.parentAuthorizationProof, now + 2);
  add('contract-r13-5-permit-fail-closed-unverified', 'Aucun permit sans décision distante vérifiée', !noVerifyPermit.ok && noVerifyPermit.code === 'REMOTE_VERIFICATION_REQUIRED', noVerifyPermit.ok ? 'unexpected-pass' : noVerifyPermit.code);
  add('contract-r13-5-all-live-fuses', 'Tous les fuses live restent fermés après 200 contrôles', remoteAuthorizationPolicy.serverSignatureVerifierProvisioned === false && remoteAuthorizationPolicy.deviceAttestationVerifierProvisioned === false && remoteAuthorizationPolicy.serverReplayLedgerProvisioned === false && remoteAuthorizationPolicy.trustedServerClockProvisioned === false && remoteAuthorizationPolicy.networkExecutionEnabled === false && remoteAuthorizationPolicy.livePaymentExecutionEnabled === false && remoteAuthorizationPolicy.strongRemoteAuthorizationClaim === false && executionPermitPolicy.networkExecutionEnabled === false && executionPermitPolicy.livePaymentExecutionEnabled === false && executionPermitPolicy.settlementEnabled === false && executionPermitPolicy.strongExecutionClaim === false && intentAuthorizationPolicy.networkExecutionEnabled === false && backendContractPolicy.networkExecutionEnabled === false && backendContractPolicy.liveIntentSubmissionEnabled === false, 'remote=off · device=off · ledger=off · clock=off · network=off · payment=off');


  // R13.6 - trust anchor, device attestation contract, server ledger/time anchor and release readiness gate.
  const r136KeyPrimary = { keyId: 'srvkey.demo.ed25519.0001', fingerprint: 'KF-AAAAAAAAAAAAAAAA', state: 'PRIMARY' as const, notBefore: now - 1_000, notAfter: now + 60_000 };
  const r136KeyNext = { keyId: 'srvkey.demo.ed25519.0002', fingerprint: 'KF-BBBBBBBBBBBBBBBB', state: 'NEXT' as const, notBefore: now - 1_000, notAfter: now + 60_000 };
  const r136AnchorA = await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [r136KeyPrimary, r136KeyNext] });
  const r136AnchorB = await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [r136KeyNext, r136KeyPrimary] });
  const r136AnchorStatus = await inspectServerTrustAnchorSet(r136AnchorA, now);
  const r136TrustPolicyA = await deriveServerTrustAnchorPolicyDigest();
  const r136TrustPolicyB = await deriveServerTrustAnchorPolicyDigest();
  add('contract-r13-6-trust-version', 'Trust anchor contract versionné et Ed25519 contractuel', SERVER_TRUST_ANCHOR_VERSION === 1 && SERVER_TRUST_ANCHOR_RELEASE === 'R13.6-SERVER-TRUST-ANCHOR-CONTRACT' && SERVER_TRUST_ALGORITHM === 'Ed25519', SERVER_TRUST_ANCHOR_RELEASE);
  add('contract-r13-6-trust-fuses', 'Trust anchor production/KMS/réseau restent non provisionnés', !serverTrustAnchorPolicy.productionKeySetProvisioned && !serverTrustAnchorPolicy.serverSignatureVerifierProvisioned && !serverTrustAnchorPolicy.remoteKmsProvisioned && !serverTrustAnchorPolicy.networkExecutionEnabled && !serverTrustAnchorPolicy.livePaymentExecutionEnabled && !serverTrustAnchorPolicy.strongTrustAnchorClaim, 'prod-keyset=off · verifier=off · kms=off · network=off');
  add('contract-r13-6-trust-valid', 'Jeu d’ancres synthétique conforme au contrat', r136AnchorStatus.ok && r136AnchorA.keys.length <= MAX_TRUST_ANCHOR_KEYS, r136AnchorA.digest);
  add('contract-r13-6-trust-deterministic', 'Digest trust anchor indépendant de l’ordre des clés', r136AnchorA.digest === r136AnchorB.digest && /^TA-[A-F0-9]{16}$/.test(r136AnchorA.digest), r136AnchorA.digest);
  add('contract-r13-6-trust-policy-digest', 'Digest policy trust anchor déterministe', r136TrustPolicyA === r136TrustPolicyB && /^TAPOL-[A-F0-9]{16}$/.test(r136TrustPolicyA), r136TrustPolicyA);
  const r136DupKid = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [r136KeyPrimary, { ...r136KeyNext, keyId: r136KeyPrimary.keyId }] }), now);
  add('contract-r13-6-trust-duplicate-kid', 'Key ID dupliqué rejeté', !r136DupKid.ok && r136DupKid.code === 'ANCHOR_DUPLICATE_KEY_ID', r136DupKid.ok ? 'unexpected-pass' : r136DupKid.code);
  const r136DupFp = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [r136KeyPrimary, { ...r136KeyNext, fingerprint: r136KeyPrimary.fingerprint }] }), now);
  add('contract-r13-6-trust-duplicate-fingerprint', 'Fingerprint dupliqué rejeté', !r136DupFp.ok && r136DupFp.code === 'ANCHOR_DUPLICATE_FINGERPRINT', r136DupFp.ok ? 'unexpected-pass' : r136DupFp.code);
  const r136BadAlgo = await inspectServerTrustAnchorSet({ ...r136AnchorA, algorithm: 'RSA' as typeof SERVER_TRUST_ALGORITHM }, now);
  add('contract-r13-6-trust-algorithm-pin', 'Algorithme trust anchor épinglé', !r136BadAlgo.ok && r136BadAlgo.code === 'ANCHOR_VERSION', r136BadAlgo.ok ? 'unexpected-pass' : r136BadAlgo.code);
  const r136LongTtl = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now, expiresAt: now + MAX_TRUST_ANCHOR_TTL_MS + 1, keys: [r136KeyPrimary] }), now);
  add('contract-r13-6-trust-ttl', 'TTL du jeu d’ancres borné', !r136LongTtl.ok && r136LongTtl.code === 'ANCHOR_TTL_TOO_LONG', r136LongTtl.ok ? 'unexpected-pass' : r136LongTtl.code);
  const r136Future = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now + 5_001, expiresAt: now + 65_000, keys: [{ ...r136KeyPrimary, notBefore: now, notAfter: now + 65_000 }] }), now);
  add('contract-r13-6-trust-future', 'Trust anchor futur hors skew rejeté', !r136Future.ok && r136Future.code === 'ANCHOR_CLOCK_SKEW_FUTURE', r136Future.ok ? 'unexpected-pass' : r136Future.code);
  const r136Expired = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 60_000, expiresAt: now - 1, keys: [{ ...r136KeyPrimary, notBefore: now - 60_000, notAfter: now - 1 }] }), now);
  add('contract-r13-6-trust-expired', 'Trust anchor expiré rejeté', !r136Expired.ok && r136Expired.code === 'ANCHOR_EXPIRED', r136Expired.ok ? 'unexpected-pass' : r136Expired.code);
  const r136NoPrimary = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [{ ...r136KeyPrimary, state: 'REVOKED' as const }] }), now);
  add('contract-r13-6-trust-primary-required', 'Exactement une clé primaire est requise', !r136NoPrimary.ok && r136NoPrimary.code === 'ANCHOR_PRIMARY_COUNT', r136NoPrimary.ok ? 'unexpected-pass' : r136NoPrimary.code);
  const r136TwoNext = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [r136KeyPrimary, r136KeyNext, { ...r136KeyNext, keyId: 'srvkey.demo.ed25519.0003', fingerprint: 'KF-CCCCCCCCCCCCCCCC' }] }), now);
  add('contract-r13-6-trust-next-bounded', 'Une seule clé NEXT maximum', !r136TwoNext.ok && r136TwoNext.code === 'ANCHOR_NEXT_COUNT', r136TwoNext.ok ? 'unexpected-pass' : r136TwoNext.code);
  const r136BadKeyWindow = await inspectServerTrustAnchorSet(await buildServerTrustAnchorSet({ generatedAt: now - 1_000, expiresAt: now + 60_000, keys: [{ ...r136KeyPrimary, notAfter: r136KeyPrimary.notBefore }] }), now);
  add('contract-r13-6-trust-key-window', 'Fenêtre temporelle de clé invalide rejetée', !r136BadKeyWindow.ok && r136BadKeyWindow.code === 'ANCHOR_KEY_TIME', r136BadKeyWindow.ok ? 'unexpected-pass' : r136BadKeyWindow.code);
  const r136Rotated = await buildServerTrustAnchorSet({ generatedAt: now, expiresAt: now + 60_000, keys: [{ ...r136KeyPrimary, state: 'RETIRED' as const }, { ...r136KeyNext, state: 'PRIMARY' as const }] });
  const r136RotationStatus = await inspectTrustAnchorRotation(r136AnchorA, r136Rotated, now);
  add('contract-r13-6-trust-rotation', 'Rotation annoncée NEXT vers PRIMARY acceptée', r136RotationStatus.ok, r136Rotated.digest);
  const r136WrongRotated = await buildServerTrustAnchorSet({ generatedAt: now, expiresAt: now + 60_000, keys: [{ ...r136KeyPrimary, state: 'RETIRED' as const }, { keyId: 'srvkey.demo.ed25519.0003', fingerprint: 'KF-CCCCCCCCCCCCCCCC', state: 'PRIMARY' as const, notBefore: now - 1_000, notAfter: now + 60_000 }] });
  const r136WrongRotation = await inspectTrustAnchorRotation(r136AnchorA, r136WrongRotated, now);
  add('contract-r13-6-trust-rotation-guard', 'Rotation vers clé non annoncée rejetée', !r136WrongRotation.ok && r136WrongRotation.code === 'ROTATION_NEXT_NOT_PROMOTED', r136WrongRotation.ok ? 'unexpected-pass' : r136WrongRotation.code);

  const r136ChallengeInput = { provider: 'APPLE_PROVIDER' as const, parentRemoteProof: 'RAP-AAAAAAAAAAAAAAAA', challengeNonceDigest: 'AN-BBBBBBBBBBBBBBBB', deviceDigest: 'AD-CCCCCCCCCCCCCCCC', appInstanceDigest: 'AI-DDDDDDDDDDDDDDDD', issuedAt: now, expiresAt: now + 10_000 };
  const r136ChallengeA = await buildDeviceAttestationChallenge(r136ChallengeInput);
  const r136ChallengeB = await buildDeviceAttestationChallenge(r136ChallengeInput);
  const r136ChallengeStatus = await inspectDeviceAttestationChallenge(r136ChallengeA, now + 1);
  const r136DevicePolicyA = await deriveDeviceAttestationPolicyDigest();
  const r136DevicePolicyB = await deriveDeviceAttestationPolicyDigest();
  add('contract-r13-6-device-version', 'Contrat attestation device versionné', DEVICE_ATTESTATION_CONTRACT_VERSION === 1 && DEVICE_ATTESTATION_CONTRACT_RELEASE === 'R13.6-DEVICE-ATTESTATION-CONTRACT', DEVICE_ATTESTATION_CONTRACT_RELEASE);
  add('contract-r13-6-device-fuses', 'Verifier/trust-roots/challenge-service device restent non provisionnés', !deviceAttestationPolicy.productionVerifierProvisioned && !deviceAttestationPolicy.providerTrustRootsProvisioned && !deviceAttestationPolicy.challengeServiceProvisioned && !deviceAttestationPolicy.networkExecutionEnabled && !deviceAttestationPolicy.strongDeviceAttestationClaim, 'verifier=off · roots=off · challenge-service=off');
  add('contract-r13-6-device-challenge-valid', 'Challenge attestation synthétique valide', r136ChallengeStatus.ok, r136ChallengeA.digest);
  add('contract-r13-6-device-challenge-deterministic', 'Challenge attestation déterministe', r136ChallengeA.digest === r136ChallengeB.digest && /^DAC-[A-F0-9]{16}$/.test(r136ChallengeA.digest), r136ChallengeA.digest);
  add('contract-r13-6-device-policy-digest', 'Digest policy attestation déterministe', r136DevicePolicyA === r136DevicePolicyB && /^DAPOL-[A-F0-9]{16}$/.test(r136DevicePolicyA), r136DevicePolicyA);
  const r136ChallengeParent = await buildDeviceAttestationChallenge({ ...r136ChallengeInput, parentRemoteProof: 'RAP-1111111111111111' });
  add('contract-r13-6-device-parent-bound', 'Challenge lié au passeport distant parent', r136ChallengeParent.digest !== r136ChallengeA.digest, `${r136ChallengeA.parentRemoteProof} -> ${r136ChallengeParent.parentRemoteProof}`);
  const r136ChallengeDevice = await buildDeviceAttestationChallenge({ ...r136ChallengeInput, deviceDigest: 'AD-1111111111111111' });
  add('contract-r13-6-device-device-bound', 'Challenge lié au device haché', r136ChallengeDevice.digest !== r136ChallengeA.digest, `${r136ChallengeA.deviceDigest} -> ${r136ChallengeDevice.deviceDigest}`);
  const r136ChallengeApp = await buildDeviceAttestationChallenge({ ...r136ChallengeInput, appInstanceDigest: 'AI-1111111111111111' });
  add('contract-r13-6-device-app-bound', 'Challenge lié à l’instance applicative', r136ChallengeApp.digest !== r136ChallengeA.digest, `${r136ChallengeA.appInstanceDigest} -> ${r136ChallengeApp.appInstanceDigest}`);
  const r136ChallengeTtl = await inspectDeviceAttestationChallenge(await buildDeviceAttestationChallenge({ ...r136ChallengeInput, expiresAt: now + MAX_ATTESTATION_CHALLENGE_TTL_MS + 1 }), now);
  add('contract-r13-6-device-challenge-ttl', 'TTL challenge attestation borné', !r136ChallengeTtl.ok && r136ChallengeTtl.code === 'CHALLENGE_TTL_TOO_LONG', r136ChallengeTtl.ok ? 'unexpected-pass' : r136ChallengeTtl.code);
  const r136ChallengeFuture = await inspectDeviceAttestationChallenge(await buildDeviceAttestationChallenge({ ...r136ChallengeInput, issuedAt: now + MAX_ATTESTATION_CLOCK_SKEW_MS + 1, expiresAt: now + MAX_ATTESTATION_CLOCK_SKEW_MS + 10_000 }), now);
  add('contract-r13-6-device-challenge-future', 'Challenge futur hors skew rejeté', !r136ChallengeFuture.ok && r136ChallengeFuture.code === 'CHALLENGE_FUTURE', r136ChallengeFuture.ok ? 'unexpected-pass' : r136ChallengeFuture.code);
  const r136ChallengeExpired = await inspectDeviceAttestationChallenge(await buildDeviceAttestationChallenge({ ...r136ChallengeInput, issuedAt: now - 10_000, expiresAt: now - 1 }), now);
  add('contract-r13-6-device-challenge-expired', 'Challenge expiré rejeté', !r136ChallengeExpired.ok && r136ChallengeExpired.code === 'CHALLENGE_EXPIRED', r136ChallengeExpired.ok ? 'unexpected-pass' : r136ChallengeExpired.code);
  const r136VerdictInput = { challengeDigest: r136ChallengeA.digest, statementDigest: 'DS-EEEEEEEEEEEEEEEE', verifierKeyId: 'attkey.demo.device.0001', verdict: 'MEETS_CONTRACT' as const, issuedAt: now, expiresAt: now + 10_000 };
  const r136Verdict = await buildDeviceAttestationVerdict(r136VerdictInput);
  const r136VerdictStatus = await inspectDeviceAttestationVerdict(r136Verdict, r136ChallengeA, now + 1);
  add('contract-r13-6-device-verdict-valid', 'Verdict attestation structurellement valide', r136VerdictStatus.ok && /^DAV-[A-F0-9]{16}$/.test(r136Verdict.digest), r136Verdict.digest);
  const r136VerdictWrongChallenge = await inspectDeviceAttestationVerdict({ ...r136Verdict, challengeDigest: 'DAC-1111111111111111' }, r136ChallengeA, now + 1);
  add('contract-r13-6-device-verdict-bound', 'Verdict lié au challenge exact', !r136VerdictWrongChallenge.ok && r136VerdictWrongChallenge.code === 'VERDICT_BINDING', r136VerdictWrongChallenge.ok ? 'unexpected-pass' : r136VerdictWrongChallenge.code);
  const r136VerdictBadKey = await inspectDeviceAttestationVerdict(await buildDeviceAttestationVerdict({ ...r136VerdictInput, verifierKeyId: 'bad' }), r136ChallengeA, now + 1);
  add('contract-r13-6-device-verdict-key', 'Key ID attestation malformé rejeté', !r136VerdictBadKey.ok && r136VerdictBadKey.code === 'VERDICT_KEY', r136VerdictBadKey.ok ? 'unexpected-pass' : r136VerdictBadKey.code);
  const r136DefaultDeviceVerify = await verifyDeviceAttestationVerdict(r136Verdict, r136ChallengeA, now + 1);
  add('contract-r13-6-device-default-verifier', 'Absence verifier device production ferme le chemin', !r136DefaultDeviceVerify.ok && r136DefaultDeviceVerify.code === 'DEVICE_ATTESTATION_VERIFIER_NOT_PROVISIONED', r136DefaultDeviceVerify.ok ? 'unexpected-pass' : r136DefaultDeviceVerify.code);
  const r136LabDeviceVerify = await verifyDeviceAttestationVerdict(r136Verdict, r136ChallengeA, now + 1, { mode: 'LAB_INJECTED_VERIFIER', verifyStatement: async (value) => value.statementDigest === r136Verdict.statementDigest });
  add('contract-r13-6-device-lab-verifier', 'Verifier device injecté limité au lab', r136LabDeviceVerify.ok && r136LabDeviceVerify.verificationClass === 'LAB_INJECTED_ONLY', r136LabDeviceVerify.ok ? r136LabDeviceVerify.verificationClass : r136LabDeviceVerify.code);

  const r136TimeInput = { serverTime: now, sequence: 1, keyId: 'srvkey.demo.ed25519.0001', signatureRef: 'SIGREF-AAAAAAAAAAAAAAAA', issuedAt: now - 1, expiresAt: now + 10_000 };
  const r136TimeA = await buildSignedServerTimeAnchor(r136TimeInput);
  const r136TimeB = await buildSignedServerTimeAnchor(r136TimeInput);
  const r136TimeStatus = await inspectSignedServerTimeAnchor(r136TimeA, now);
  const r136LedgerPolicyA = await deriveServerLedgerAnchorPolicyDigest();
  const r136LedgerPolicyB = await deriveServerLedgerAnchorPolicyDigest();
  add('contract-r13-6-ledger-version', 'Contrat ledger/temps serveur versionné', SERVER_LEDGER_ANCHOR_VERSION === 1 && SERVER_LEDGER_ANCHOR_RELEASE === 'R13.6-SERVER-LEDGER-TIME-ANCHOR', SERVER_LEDGER_ANCHOR_RELEASE);
  add('contract-r13-6-ledger-fuses', 'Ledger/clock/verifier/réseau restent non provisionnés', !serverLedgerAnchorPolicy.serverReplayLedgerProvisioned && !serverLedgerAnchorPolicy.trustedServerClockProvisioned && !serverLedgerAnchorPolicy.serverSignatureVerifierProvisioned && !serverLedgerAnchorPolicy.networkExecutionEnabled && !serverLedgerAnchorPolicy.antiRollbackClaim, 'ledger=off · clock=off · verifier=off');
  add('contract-r13-6-ledger-time-valid', 'Ancre de temps synthétique valide', r136TimeStatus.ok, r136TimeA.digest);
  add('contract-r13-6-ledger-policy-digest', 'Digest policy ledger déterministe', r136LedgerPolicyA === r136LedgerPolicyB && /^LAPOL-[A-F0-9]{16}$/.test(r136LedgerPolicyA), r136LedgerPolicyA);
  const r136TimeSkew = await inspectSignedServerTimeAnchor(await buildSignedServerTimeAnchor({ ...r136TimeInput, serverTime: now + MAX_SERVER_TIME_SKEW_MS + 1 }), now);
  add('contract-r13-6-ledger-time-skew', 'Skew temps serveur hors borne rejeté', !r136TimeSkew.ok && r136TimeSkew.code === 'TIME_SKEW', r136TimeSkew.ok ? 'unexpected-pass' : r136TimeSkew.code);
  const r136TimeExpired = await inspectSignedServerTimeAnchor(await buildSignedServerTimeAnchor({ ...r136TimeInput, serverTime: now - 1, issuedAt: now - 10_000, expiresAt: now - 1 }), now);
  add('contract-r13-6-ledger-time-expired', 'Ancre de temps expirée rejetée', !r136TimeExpired.ok && r136TimeExpired.code === 'TIME_EXPIRED', r136TimeExpired.ok ? 'unexpected-pass' : r136TimeExpired.code);
  const r136TimeTtl = await inspectSignedServerTimeAnchor(await buildSignedServerTimeAnchor({ ...r136TimeInput, expiresAt: r136TimeInput.issuedAt + MAX_SERVER_TIME_TTL_MS + 1 }), now);
  add('contract-r13-6-ledger-time-ttl', 'TTL ancre de temps borné', !r136TimeTtl.ok && r136TimeTtl.code === 'TIME_TTL_TOO_LONG', r136TimeTtl.ok ? 'unexpected-pass' : r136TimeTtl.code);
  const r136LedgerStart = await startLedgerAnchorJournal('RAP-AAAAAAAAAAAAAAAA', { at: now, intentDigest: 'RI-AAAAAAAAAAAAAAAA', decisionDigest: 'RD-BBBBBBBBBBBBBBBB', timeAnchorDigest: r136TimeA.digest });
  add('contract-r13-6-ledger-start', 'Ledger démarre en séquence 1 depuis genesis', r136LedgerStart.ok && r136LedgerStart.event.seq === 1 && r136LedgerStart.event.prevDigest === LEDGER_GENESIS, r136LedgerStart.ok ? r136LedgerStart.event.digest : r136LedgerStart.code);
  const r136LedgerAppend = r136LedgerStart.ok ? await appendLedgerAnchorEvent(r136LedgerStart.journal, { at: now + 1, intentDigest: 'RI-CCCCCCCCCCCCCCCC', decisionDigest: 'RD-DDDDDDDDDDDDDDDD', timeAnchorDigest: r136TimeA.digest }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-append', 'Ledger incrémente séquence et chaîne', r136LedgerAppend.ok && r136LedgerStart.ok && r136LedgerAppend.event.seq === 2 && r136LedgerAppend.event.prevDigest === r136LedgerStart.event.digest, r136LedgerAppend.ok ? r136LedgerAppend.event.digest : r136LedgerAppend.code);
  const r136LedgerDuplicate = r136LedgerAppend.ok ? await appendLedgerAnchorEvent(r136LedgerAppend.journal, { at: now + 2, intentDigest: 'RI-CCCCCCCCCCCCCCCC', decisionDigest: 'RD-DDDDDDDDDDDDDDDD', timeAnchorDigest: r136TimeA.digest }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-duplicate', 'Décision ledger dupliquée rejetée', !r136LedgerDuplicate.ok && r136LedgerDuplicate.code === 'LEDGER_DUPLICATE_DECISION', r136LedgerDuplicate.ok ? 'unexpected-pass' : r136LedgerDuplicate.code);
  const r136LedgerRollback = r136LedgerAppend.ok ? await appendLedgerAnchorEvent(r136LedgerAppend.journal, { at: now - 1, intentDigest: 'RI-EEEEEEEEEEEEEEEE', decisionDigest: 'RD-FFFFFFFFFFFFFFFF', timeAnchorDigest: r136TimeA.digest }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-rollback', 'Retour temporel ledger rejeté', !r136LedgerRollback.ok && r136LedgerRollback.code === 'LEDGER_TIME_ROLLBACK', r136LedgerRollback.ok ? 'unexpected-pass' : r136LedgerRollback.code);
  const r136LedgerValid = r136LedgerAppend.ok ? await validateLedgerAnchorJournal(r136LedgerAppend.journal) : { ok: false as const, code: 'PRECONDITION' };
  const r136LedgerLinkTamper = r136LedgerAppend.ok ? await validateLedgerAnchorJournal({ ...r136LedgerAppend.journal, events: [r136LedgerAppend.journal.events[0], { ...r136LedgerAppend.journal.events[1], prevDigest: 'LAE-0000000000000000' }] }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-link-tamper', 'Altération lien ledger détectée', !r136LedgerLinkTamper.ok && r136LedgerLinkTamper.code === 'LEDGER_LINK', r136LedgerLinkTamper.ok ? 'unexpected-pass' : r136LedgerLinkTamper.code);
  const r136LedgerDigestTamper = r136LedgerAppend.ok ? await validateLedgerAnchorJournal({ ...r136LedgerAppend.journal, headDigest: 'LAE-0000000000000000' }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-head-tamper', 'Altération tête ledger détectée', !r136LedgerDigestTamper.ok && r136LedgerDigestTamper.code === 'LEDGER_HEAD', r136LedgerDigestTamper.ok ? 'unexpected-pass' : r136LedgerDigestTamper.code);
  let r136FullJournal = r136LedgerStart.ok ? r136LedgerStart.journal : null;
  if (r136FullJournal) {
    for (let i = 2; i <= MAX_LEDGER_ANCHOR_EVENTS; i += 1) {
      const suffix = i.toString(16).toUpperCase().padStart(16, '0');
      const next = await appendLedgerAnchorEvent(r136FullJournal, { at: now + i, intentDigest: `RI-${suffix}`, decisionDigest: `RD-${suffix}`, timeAnchorDigest: r136TimeA.digest });
      if (!next.ok) { r136FullJournal = null; break; }
      r136FullJournal = next.journal;
    }
  }
  add('contract-r13-6-ledger-bounded', 'Ledger local de preuve borné à 16 événements', Boolean(r136FullJournal && r136FullJournal.events.length === MAX_LEDGER_ANCHOR_EVENTS), r136FullJournal ? `${r136FullJournal.events.length}/${MAX_LEDGER_ANCHOR_EVENTS}` : 'build-failed');
  const r136LedgerFull = r136FullJournal ? await appendLedgerAnchorEvent(r136FullJournal, { at: now + 99, intentDigest: 'RI-9999999999999999', decisionDigest: 'RD-9999999999999999', timeAnchorDigest: r136TimeA.digest }) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-ledger-full-block', '17e événement ledger rejeté', !r136LedgerFull.ok && r136LedgerFull.code === 'LEDGER_FULL', r136LedgerFull.ok ? 'unexpected-pass' : r136LedgerFull.code);
  add('contract-r13-6-ledger-parent-bound', 'Journal ledger lié au RAP parent', r136LedgerStart.ok && r136LedgerStart.journal.parentRemoteProof === 'RAP-AAAAAAAAAAAAAAAA', r136LedgerStart.ok ? r136LedgerStart.journal.parentRemoteProof : r136LedgerStart.code);

  const r136ReleaseBase: ReleaseReadinessInput = {
    parentRemoteProof: 'RAP-AAAAAAAAAAAAAAAA',
    trustAnchorDigest: r136AnchorA.digest,
    attestationVerdictDigest: r136Verdict.digest,
    ledgerHeadDigest: r136LedgerAppend.ok ? r136LedgerAppend.journal.headDigest : 'LAE-0000000000000000',
    timeAnchorDigest: r136TimeA.digest,
    environmentDigest: 'ENV-AAAAAAAAAAAAAAAA',
    killSwitchEngaged: false,
    serverVerifierProvisioned: false,
    deviceVerifierProvisioned: false,
    serverLedgerProvisioned: false,
    trustedServerClockProvisioned: false,
    productionTrustAnchorProvisioned: false,
    networkExecutionEnabled: false,
    livePaymentExecutionEnabled: false,
    settlementEnabled: false,
  };
  const r136ReleasePolicyA = await deriveReleaseReadinessPolicyDigest();
  const r136ReleasePolicyB = await deriveReleaseReadinessPolicyDigest();
  add('contract-r13-6-release-version', 'Release readiness gate versionné et dry-run only', RELEASE_READINESS_VERSION === 1 && RELEASE_READINESS_RELEASE === 'R13.6-RELEASE-READINESS-GATE' && releaseReadinessPolicy.scope === 'DRY_RUN_RELEASE_READINESS_ONLY', RELEASE_READINESS_RELEASE);
  add('contract-r13-6-release-fuses', 'Tous les fuses production release restent fermés', !releaseReadinessPolicy.serverVerifierProvisioned && !releaseReadinessPolicy.deviceVerifierProvisioned && !releaseReadinessPolicy.serverLedgerProvisioned && !releaseReadinessPolicy.trustedServerClockProvisioned && !releaseReadinessPolicy.productionTrustAnchorProvisioned && !releaseReadinessPolicy.networkExecutionEnabled && !releaseReadinessPolicy.livePaymentExecutionEnabled && !releaseReadinessPolicy.settlementEnabled && !releaseReadinessPolicy.productionReleaseClaim, 'server/device/ledger/clock/trust/network/payment/settlement=off');
  const r136ProdServer = inspectProductionReleaseReadiness(r136ReleaseBase);
  add('contract-r13-6-release-server-block', 'Production bloquée sans verifier serveur', !r136ProdServer.ok && r136ProdServer.code === 'RELEASE_SERVER_VERIFIER_NOT_PROVISIONED', r136ProdServer.ok ? 'unexpected-pass' : r136ProdServer.code);
  const r136ProdDevice = inspectProductionReleaseReadiness({ ...r136ReleaseBase, serverVerifierProvisioned: true });
  add('contract-r13-6-release-device-block', 'Production bloquée sans verifier device', !r136ProdDevice.ok && r136ProdDevice.code === 'RELEASE_DEVICE_VERIFIER_NOT_PROVISIONED', r136ProdDevice.ok ? 'unexpected-pass' : r136ProdDevice.code);
  const r136ProdLedger = inspectProductionReleaseReadiness({ ...r136ReleaseBase, serverVerifierProvisioned: true, deviceVerifierProvisioned: true });
  add('contract-r13-6-release-ledger-block', 'Production bloquée sans ledger serveur', !r136ProdLedger.ok && r136ProdLedger.code === 'RELEASE_LEDGER_NOT_PROVISIONED', r136ProdLedger.ok ? 'unexpected-pass' : r136ProdLedger.code);
  const r136ProdClock = inspectProductionReleaseReadiness({ ...r136ReleaseBase, serverVerifierProvisioned: true, deviceVerifierProvisioned: true, serverLedgerProvisioned: true });
  add('contract-r13-6-release-clock-block', 'Production bloquée sans horloge serveur fiable', !r136ProdClock.ok && r136ProdClock.code === 'RELEASE_CLOCK_NOT_PROVISIONED', r136ProdClock.ok ? 'unexpected-pass' : r136ProdClock.code);
  const r136ProdTrust = inspectProductionReleaseReadiness({ ...r136ReleaseBase, serverVerifierProvisioned: true, deviceVerifierProvisioned: true, serverLedgerProvisioned: true, trustedServerClockProvisioned: true });
  add('contract-r13-6-release-trust-block', 'Production bloquée sans trust anchor provisionné', !r136ProdTrust.ok && r136ProdTrust.code === 'RELEASE_TRUST_ANCHOR_NOT_PROVISIONED', r136ProdTrust.ok ? 'unexpected-pass' : r136ProdTrust.code);
  const r136ProdAll = inspectProductionReleaseReadiness({ ...r136ReleaseBase, serverVerifierProvisioned: true, deviceVerifierProvisioned: true, serverLedgerProvisioned: true, trustedServerClockProvisioned: true, productionTrustAnchorProvisioned: true });
  add('contract-r13-6-release-intentional-block', 'Même raccordée, activation production reste explicitement bloquée dans R13.6', !r136ProdAll.ok && r136ProdAll.code === 'RELEASE_PRODUCTION_PATH_INTENTIONALLY_BLOCKED', r136ProdAll.ok ? 'unexpected-pass' : r136ProdAll.code);
  const r136Kill = inspectProductionReleaseReadiness({ ...r136ReleaseBase, killSwitchEngaged: true });
  add('contract-r13-6-release-killswitch', 'Kill-switch engagé bloque avant toute autre décision', !r136Kill.ok && r136Kill.code === 'RELEASE_KILL_SWITCH', r136Kill.ok ? 'unexpected-pass' : r136Kill.code);
  const r136Network = inspectProductionReleaseReadiness({ ...r136ReleaseBase, networkExecutionEnabled: true });
  add('contract-r13-6-release-network-fuse', 'Fuse réseau ouvert rejeté', !r136Network.ok && r136Network.code === 'RELEASE_NETWORK_FUSE', r136Network.ok ? 'unexpected-pass' : r136Network.code);
  const r136Payment = inspectProductionReleaseReadiness({ ...r136ReleaseBase, livePaymentExecutionEnabled: true });
  add('contract-r13-6-release-payment-fuse', 'Fuse paiement live ouvert rejeté', !r136Payment.ok && r136Payment.code === 'RELEASE_PAYMENT_FUSE', r136Payment.ok ? 'unexpected-pass' : r136Payment.code);
  const r136Settlement = inspectProductionReleaseReadiness({ ...r136ReleaseBase, settlementEnabled: true });
  add('contract-r13-6-release-settlement-fuse', 'Fuse settlement ouvert rejeté', !r136Settlement.ok && r136Settlement.code === 'RELEASE_SETTLEMENT_FUSE', r136Settlement.ok ? 'unexpected-pass' : r136Settlement.code);
  const r136LabRelease = r136LedgerAppend.ok ? inspectLabReleaseReadiness(r136ReleaseBase, r136AnchorA, r136Verdict, r136LedgerAppend.journal, r136TimeA) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-release-lab', 'Readiness positive uniquement au lab et dry-run', r136LabRelease.ok && r136LabRelease.readinessClass === 'LAB_READY_DRY_RUN_ONLY', r136LabRelease.ok ? r136LabRelease.readinessClass : r136LabRelease.code);
  const r136Receipt = r136LedgerAppend.ok ? await buildReleaseReadinessReceipt(r136ReleaseBase, now + 2, r136AnchorA, r136Verdict, r136LedgerAppend.journal, r136TimeA) : { ok: false as const, code: 'PRECONDITION' };
  const r136ReceiptStatus = r136Receipt.ok ? await inspectReleaseReadinessReceipt(r136Receipt.receipt, now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-release-receipt', 'Receipt readiness court terme valide', r136Receipt.ok && r136ReceiptStatus.ok && r136Receipt.receipt.expiresAt - r136Receipt.receipt.issuedAt <= MAX_RELEASE_RECEIPT_TTL_MS, r136Receipt.ok ? r136Receipt.receipt.digest : r136Receipt.code);
  const r136ReceiptTamper = r136Receipt.ok ? await inspectReleaseReadinessReceipt({ ...r136Receipt.receipt, environmentDigest: 'ENV-BBBBBBBBBBBBBBBB' }, now + 3) : { ok: false as const, code: 'PRECONDITION' };
  add('contract-r13-6-release-environment-bound', 'Receipt lié à l’environnement exact', !r136ReceiptTamper.ok && r136ReceiptTamper.code === 'RECEIPT_DIGEST_MISMATCH', r136ReceiptTamper.ok ? 'unexpected-pass' : r136ReceiptTamper.code);
  const r136TrustSnapshot = buildServerTrustAnchorSnapshot(r136AnchorA);
  const r136DeviceSnapshot = buildDeviceAttestationContractSnapshot(r136ChallengeA, r136Verdict);
  const r136LedgerSnapshot = buildServerLedgerAnchorSnapshot(r136TimeA, r136LedgerAppend.ok ? r136LedgerAppend.journal : null);
  const r136ReleaseSnapshot = buildReleaseReadinessSnapshot(r136Receipt.ok ? r136Receipt.receipt : null);
  add('contract-r13-6-release-snapshot-redacted', 'Snapshots readiness restent expurgés', [r136TrustSnapshot, r136DeviceSnapshot, r136LedgerSnapshot, r136ReleaseSnapshot].every((value) => value.includes('secrets=NONE')) && r136TrustSnapshot.includes('rawPublicKey=NOT_STORED') && r136DeviceSnapshot.includes('rawAttestationStatement=NOT_STORED') && r136LedgerSnapshot.includes('rawSignature=NOT_STORED'), 'raw keys/attestation/signature absent · secrets none');


  const r138eHsmBindingStatus = await inspectStagingHsmP256Binding(stagingHsmP256Binding);
  const r138eHsmBindingDigest = await deriveStagingHsmP256BindingDigest();
  const r137Approvals: TrustCeremonyApproval[] = [
    { role: 'SECURITY', approverDigest: 'APR-AAAAAAAAAAAAAAAA', approvedAt: now + 1 },
    { role: 'OPERATIONS', approverDigest: 'APR-BBBBBBBBBBBBBBBB', approvedAt: now + 2 },
  ];
  const r137Ceremony = await buildTrustCeremonyManifest({ trustAnchorDigest: 'TA-AAAAAAAAAAAAAAAA', environmentDigest: 'ENV-AAAAAAAAAAAAAAAA', stagingHsmBindingDigest:r138eHsmBindingDigest, keysetVersion: 'ks-2026-08-20-01', kmsKeyRefDigest: 'KMS-AAAAAAAAAAAAAAAA', issuedAt: now, expiresAt: now + 600_000, approvals: r137Approvals });
  const r137CeremonyStatus = await inspectTrustCeremonyManifest(r137Ceremony, now + 3);
  const r137CeremonyPolicyA = await deriveTrustCeremonyPolicyDigest();
  const r137CeremonyPolicyB = await deriveTrustCeremonyPolicyDigest();
  add('contract-r13-8e-ceremony-version', 'Contrat cérémonie staging HSM P-256 versionné', TRUST_CEREMONY_VERSION === 2 && TRUST_CEREMONY_RELEASE === 'R13.8E-STAGING-HSM-P256-TRUST-CEREMONY-CONTRACT', TRUST_CEREMONY_RELEASE);
  add('contract-r13-8e-ceremony-scope', 'Cérémonie limitée au staging HSM P-256', trustCeremonyPolicy.scope === 'STAGING_HSM_P256_TRUST_CEREMONY_CONTRACT_ONLY' && trustCeremonyPolicy.environment === 'STAGING' && trustCeremonyPolicy.productionCeremonyClaim === false, trustCeremonyPolicy.scope);
  add('contract-r13-8e-ceremony-algorithm', 'Algorithme staging épinglé P-256/SHA-256 et lié au HSM attesté', TRUST_CEREMONY_ALGORITHM === STAGING_HSM_ALGORITHM && trustCeremonyPolicy.algorithm === STAGING_HSM_ALGORITHM && stagingHsmP256Binding.algorithm === STAGING_HSM_ALGORITHM, TRUST_CEREMONY_ALGORITHM);
  add('contract-r13-8e-ceremony-fuses', 'HSM staging attesté, KMS production/import/service distant/réseau restent fermés', trustCeremonyPolicy.stagingHsmP256Provisioned && trustCeremonyPolicy.stagingHsmAttestationVerified && !trustCeremonyPolicy.productionKmsProvisioned && !trustCeremonyPolicy.productionKeyMaterialImported && !trustCeremonyPolicy.remoteCeremonyServiceProvisioned && !trustCeremonyPolicy.networkExecutionEnabled, 'staging-hsm=on · production/import/network=off');
  add('contract-r13-7-ceremony-quorum', 'Quorum à deux rôles distincts', REQUIRED_TRUST_CEREMONY_APPROVALS === 2 && r137Ceremony.approvals.length === 2, 'SECURITY + OPERATIONS');
  add('contract-r13-8e-ceremony-valid', 'Manifest staging lié à l’evidence HSM R13.8D-R2 valide', r137CeremonyStatus.ok && r138eHsmBindingStatus.ok && /^HSMB-[A-F0-9]{16}$/.test(r138eHsmBindingDigest) && stagingHsmP256Binding.r13_8dR2BundleSha256 === STAGING_HSM_R13_8D_R2_BUNDLE_SHA256, r137CeremonyStatus.ok ? `${r137Ceremony.digest}/${r138eHsmBindingDigest}` : r137CeremonyStatus.code);
  const r137Ceremony2 = await buildTrustCeremonyManifest({ ...r137Ceremony, approvals: [...r137Approvals].reverse() });
  add('contract-r13-7-ceremony-deterministic', 'Digest cérémonie indépendant ordre approbations', r137Ceremony.digest === r137Ceremony2.digest, r137Ceremony.digest);
  const r137DupRole = await buildTrustCeremonyManifest({ ...r137Ceremony, approvals: [{ role:'SECURITY', approverDigest:'APR-AAAAAAAAAAAAAAAA', approvedAt:now+1 }, { role:'SECURITY', approverDigest:'APR-BBBBBBBBBBBBBBBB', approvedAt:now+2 }] });
  const r137DupRoleStatus = await inspectTrustCeremonyManifest(r137DupRole, now + 3);
  add('contract-r13-7-ceremony-duplicate-role', 'Deux approbations du même rôle rejetées', !r137DupRoleStatus.ok && r137DupRoleStatus.code === 'CEREMONY_DUPLICATE_ROLE', r137DupRoleStatus.ok ? 'unexpected-pass' : r137DupRoleStatus.code);
  const r137DupApprover = await buildTrustCeremonyManifest({ ...r137Ceremony, approvals: [{ role:'SECURITY', approverDigest:'APR-AAAAAAAAAAAAAAAA', approvedAt:now+1 }, { role:'OPERATIONS', approverDigest:'APR-AAAAAAAAAAAAAAAA', approvedAt:now+2 }] });
  const r137DupApproverStatus = await inspectTrustCeremonyManifest(r137DupApprover, now + 3);
  add('contract-r13-7-ceremony-duplicate-approver', 'Même approbateur logique rejeté deux fois', !r137DupApproverStatus.ok && r137DupApproverStatus.code === 'CEREMONY_DUPLICATE_APPROVER', r137DupApproverStatus.ok ? 'unexpected-pass' : r137DupApproverStatus.code);
  const r137MissingApproval = await buildTrustCeremonyManifest({ ...r137Ceremony, approvals: [r137Approvals[0]] });
  const r137MissingApprovalStatus = await inspectTrustCeremonyManifest(r137MissingApproval, now + 3);
  add('contract-r13-7-ceremony-missing-quorum', 'Quorum incomplet rejeté', !r137MissingApprovalStatus.ok && r137MissingApprovalStatus.code === 'CEREMONY_QUORUM', r137MissingApprovalStatus.ok ? 'unexpected-pass' : r137MissingApprovalStatus.code);
  const r137BadApproval = await buildTrustCeremonyManifest({ ...r137Ceremony, approvals: [{ ...r137Approvals[0], approverDigest:'BAD' }, r137Approvals[1]] });
  const r137BadApprovalStatus = await inspectTrustCeremonyManifest(r137BadApproval, now + 3);
  add('contract-r13-7-ceremony-approval-format', 'Digest approbateur invalide rejeté', !r137BadApprovalStatus.ok && r137BadApprovalStatus.code === 'CEREMONY_APPROVAL', r137BadApprovalStatus.ok ? 'unexpected-pass' : r137BadApprovalStatus.code);
  const r137BadBinding = await buildTrustCeremonyManifest({ ...r137Ceremony, trustAnchorDigest:'BAD' });
  const r137BadBindingStatus = await inspectTrustCeremonyManifest(r137BadBinding, now + 3);
  add('contract-r13-7-ceremony-anchor-binding', 'Trust anchor invalide rejeté', !r137BadBindingStatus.ok && r137BadBindingStatus.code === 'CEREMONY_BINDING_FORMAT', r137BadBindingStatus.ok ? 'unexpected-pass' : r137BadBindingStatus.code);
  const r137BadKeyset = await buildTrustCeremonyManifest({ ...r137Ceremony, keysetVersion:'latest' });
  const r137BadKeysetStatus = await inspectTrustCeremonyManifest(r137BadKeyset, now + 3);
  add('contract-r13-7-ceremony-keyset-version', 'Version keyset non canonique rejetée', !r137BadKeysetStatus.ok && r137BadKeysetStatus.code === 'CEREMONY_BINDING_FORMAT', r137BadKeysetStatus.ok ? 'unexpected-pass' : r137BadKeysetStatus.code);
  const r137Future = await buildTrustCeremonyManifest({ ...r137Ceremony, issuedAt:now + MAX_TRUST_CEREMONY_CLOCK_SKEW_MS + 1, expiresAt:now + MAX_TRUST_CEREMONY_CLOCK_SKEW_MS + 60_000, approvals:[{...r137Approvals[0],approvedAt:now+MAX_TRUST_CEREMONY_CLOCK_SKEW_MS+2},{...r137Approvals[1],approvedAt:now+MAX_TRUST_CEREMONY_CLOCK_SKEW_MS+3}] });
  const r137FutureStatus = await inspectTrustCeremonyManifest(r137Future, now);
  add('contract-r13-7-ceremony-skew', 'Cérémonie future au-delà du skew rejetée', !r137FutureStatus.ok && r137FutureStatus.code === 'CEREMONY_CLOCK_SKEW_FUTURE', r137FutureStatus.ok ? 'unexpected-pass' : r137FutureStatus.code);
  const r137Expired = await buildTrustCeremonyManifest({ ...r137Ceremony, issuedAt:now-60_000, expiresAt:now-1, approvals:[{...r137Approvals[0],approvedAt:now-50_000},{...r137Approvals[1],approvedAt:now-40_000}] });
  const r137ExpiredStatus = await inspectTrustCeremonyManifest(r137Expired, now);
  add('contract-r13-7-ceremony-expired', 'Cérémonie expirée rejetée', !r137ExpiredStatus.ok && r137ExpiredStatus.code === 'CEREMONY_EXPIRED', r137ExpiredStatus.ok ? 'unexpected-pass' : r137ExpiredStatus.code);
  const r137Long = await buildTrustCeremonyManifest({ ...r137Ceremony, expiresAt:now + MAX_TRUST_CEREMONY_TTL_MS + 1 });
  const r137LongStatus = await inspectTrustCeremonyManifest(r137Long, now + 3);
  add('contract-r13-7-ceremony-ttl', 'TTL cérémonie borné', !r137LongStatus.ok && r137LongStatus.code === 'CEREMONY_TTL_TOO_LONG', r137LongStatus.ok ? 'unexpected-pass' : r137LongStatus.code);
  const r137CeremonyTamper = await inspectTrustCeremonyManifest({ ...r137Ceremony, environmentDigest:'ENV-BBBBBBBBBBBBBBBB' }, now + 3);
  add('contract-r13-7-ceremony-tamper', 'Altération matière cérémonie détectée', !r137CeremonyTamper.ok && r137CeremonyTamper.code === 'CEREMONY_DIGEST_MISMATCH', r137CeremonyTamper.ok ? 'unexpected-pass' : r137CeremonyTamper.code);
  add('contract-r13-7-ceremony-policy-digest', 'Digest politique cérémonie déterministe', r137CeremonyPolicyA === r137CeremonyPolicyB && /^TCPOL-[A-F0-9]{16}$/.test(r137CeremonyPolicyA), r137CeremonyPolicyA);
  const r137CeremonySnapshot = buildTrustCeremonySnapshot(r137Ceremony);
  add('contract-r13-7-ceremony-redaction', 'Snapshot cérémonie exclut clés et identités brutes', r137CeremonySnapshot.includes('rawKeyMaterial=NOT_STORED') && r137CeremonySnapshot.includes('rawApproverIdentity=NOT_STORED') && r137CeremonySnapshot.includes('secrets=NONE'), 'raw material absent');
  add('contract-r13-8e-ceremony-no-production', 'Staging HSM réel sans revendication production', trustCeremonyPolicy.productionCeremonyClaim === false && trustCeremonyPolicy.environment === 'STAGING' && stagingHsmP256BindingPolicy.productionEligible === false && stagingHsmP256BindingPolicy.manufacturerRootCurrentTimeValid === false, `${trustCeremonyPolicy.environment}/production-blocked`);

  const r137Providers: ProviderTrustDescriptor[] = [
    { provider:'APPLE_APP_ATTEST', appBindingDigest:'APP-AAAAAAAAAAAAAAAA', rootSetDigest:'ROOT-AAAAAAAAAAAAAAAA', verifierProfileDigest:'VPF-AAAAAAAAAAAAAAAA', state:'UNPROVISIONED' },
    { provider:'GOOGLE_PLAY_INTEGRITY', appBindingDigest:'APP-BBBBBBBBBBBBBBBB', rootSetDigest:'ROOT-BBBBBBBBBBBBBBBB', verifierProfileDigest:'VPF-BBBBBBBBBBBBBBBB', state:'UNPROVISIONED' },
  ];
  const r137Registry = await buildProviderTrustRegistry({ environmentDigest:'ENV-AAAAAAAAAAAAAAAA', issuedAt:now, expiresAt:now+600_000, providers:r137Providers });
  const r137RegistryStatus = await inspectProviderTrustRegistry(r137Registry, now+1);
  const r137RegistryPolicyA = await deriveProviderTrustRegistryPolicyDigest(); const r137RegistryPolicyB = await deriveProviderTrustRegistryPolicyDigest();
  add('contract-r13-7-registry-version', 'Provider registry versionné', PROVIDER_TRUST_REGISTRY_VERSION === 1 && PROVIDER_TRUST_REGISTRY_RELEASE === 'R13.7-PROVIDER-TRUST-REGISTRY-CONTRACT', PROVIDER_TRUST_REGISTRY_RELEASE);
  add('contract-r13-7-registry-scope', 'Registry limité au contrat', providerTrustRegistryPolicy.scope === 'PROVIDER_TRUST_REGISTRY_CONTRACT_ONLY' && providerTrustRegistryPolicy.strongProviderTrustClaim === false, providerTrustRegistryPolicy.scope);
  add('contract-r13-7-registry-fuses', 'Racines Apple/Google et verifiers restent non provisionnés', !providerTrustRegistryPolicy.appleProviderRootsProvisioned && !providerTrustRegistryPolicy.androidProviderRootsProvisioned && !providerTrustRegistryPolicy.providerVerifiersProvisioned && !providerTrustRegistryPolicy.networkExecutionEnabled, 'provider roots/verifiers/network=off');
  add('contract-r13-7-registry-provider-count', 'Deux fournisseurs requis', REQUIRED_ATTESTATION_PROVIDERS === 2 && r137Registry.providers.length === 2, `${r137Registry.providers.length}/${REQUIRED_ATTESTATION_PROVIDERS}`);
  add('contract-r13-7-registry-valid', 'Registry synthétique valide', r137RegistryStatus.ok, r137RegistryStatus.ok ? r137Registry.digest : r137RegistryStatus.code);
  const r137Registry2 = await buildProviderTrustRegistry({ ...r137Registry, providers:[...r137Providers].reverse() });
  add('contract-r13-7-registry-deterministic', 'Digest registry indépendant ordre providers', r137Registry.digest === r137Registry2.digest, r137Registry.digest);
  const r137RegistryMissing = await buildProviderTrustRegistry({ ...r137Registry, providers:[r137Providers[0]] }); const r137RegistryMissingStatus = await inspectProviderTrustRegistry(r137RegistryMissing,now+1);
  add('contract-r13-7-registry-missing-provider', 'Provider manquant rejeté', !r137RegistryMissingStatus.ok && r137RegistryMissingStatus.code === 'REGISTRY_PROVIDER_COUNT', r137RegistryMissingStatus.ok ? 'unexpected-pass' : r137RegistryMissingStatus.code);
  const r137RegistryDup = await buildProviderTrustRegistry({ ...r137Registry, providers:[r137Providers[0],{...r137Providers[0],rootSetDigest:'ROOT-CCCCCCCCCCCCCCCC'}] }); const r137RegistryDupStatus=await inspectProviderTrustRegistry(r137RegistryDup,now+1);
  add('contract-r13-7-registry-duplicate-provider', 'Provider dupliqué rejeté', !r137RegistryDupStatus.ok && r137RegistryDupStatus.code === 'REGISTRY_DUPLICATE_PROVIDER', r137RegistryDupStatus.ok ? 'unexpected-pass' : r137RegistryDupStatus.code);
  const r137RegistryDupRoot = await buildProviderTrustRegistry({ ...r137Registry, providers:[r137Providers[0],{...r137Providers[1],rootSetDigest:r137Providers[0].rootSetDigest}] }); const r137RegistryDupRootStatus=await inspectProviderTrustRegistry(r137RegistryDupRoot,now+1);
  add('contract-r13-7-registry-duplicate-root', 'Root-set digest partagé rejeté', !r137RegistryDupRootStatus.ok && r137RegistryDupRootStatus.code === 'REGISTRY_DUPLICATE_ROOTSET', r137RegistryDupRootStatus.ok ? 'unexpected-pass' : r137RegistryDupRootStatus.code);
  const r137RegistryBadRoot=await buildProviderTrustRegistry({...r137Registry,providers:[{...r137Providers[0],rootSetDigest:'BAD'},r137Providers[1]]}); const r137RegistryBadRootStatus=await inspectProviderTrustRegistry(r137RegistryBadRoot,now+1);
  add('contract-r13-7-registry-root-format','Root-set digest invalide rejeté',!r137RegistryBadRootStatus.ok&&r137RegistryBadRootStatus.code==='REGISTRY_BINDING_FORMAT',r137RegistryBadRootStatus.ok?'unexpected-pass':r137RegistryBadRootStatus.code);
  const r137RegistryBadApp=await buildProviderTrustRegistry({...r137Registry,providers:[{...r137Providers[0],appBindingDigest:'BAD'},r137Providers[1]]}); const r137RegistryBadAppStatus=await inspectProviderTrustRegistry(r137RegistryBadApp,now+1);
  add('contract-r13-7-registry-app-binding','App binding invalide rejeté',!r137RegistryBadAppStatus.ok&&r137RegistryBadAppStatus.code==='REGISTRY_BINDING_FORMAT',r137RegistryBadAppStatus.ok?'unexpected-pass':r137RegistryBadAppStatus.code);
  const r137RegistryBadProfile=await buildProviderTrustRegistry({...r137Registry,providers:[{...r137Providers[0],verifierProfileDigest:'BAD'},r137Providers[1]]}); const r137RegistryBadProfileStatus=await inspectProviderTrustRegistry(r137RegistryBadProfile,now+1);
  add('contract-r13-7-registry-profile-binding','Verifier profile invalide rejeté',!r137RegistryBadProfileStatus.ok&&r137RegistryBadProfileStatus.code==='REGISTRY_BINDING_FORMAT',r137RegistryBadProfileStatus.ok?'unexpected-pass':r137RegistryBadProfileStatus.code);
  const r137RegistryFuture=await buildProviderTrustRegistry({...r137Registry,issuedAt:now+MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS+1,expiresAt:now+MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS+60_000}); const r137RegistryFutureStatus=await inspectProviderTrustRegistry(r137RegistryFuture,now);
  add('contract-r13-7-registry-skew','Registry futur au-delà du skew rejeté',!r137RegistryFutureStatus.ok&&r137RegistryFutureStatus.code==='REGISTRY_CLOCK_SKEW_FUTURE',r137RegistryFutureStatus.ok?'unexpected-pass':r137RegistryFutureStatus.code);
  const r137RegistryExpired=await buildProviderTrustRegistry({...r137Registry,issuedAt:now-60_000,expiresAt:now-1}); const r137RegistryExpiredStatus=await inspectProviderTrustRegistry(r137RegistryExpired,now);
  add('contract-r13-7-registry-expired','Registry expiré rejeté',!r137RegistryExpiredStatus.ok&&r137RegistryExpiredStatus.code==='REGISTRY_EXPIRED',r137RegistryExpiredStatus.ok?'unexpected-pass':r137RegistryExpiredStatus.code);
  const r137RegistryLong=await buildProviderTrustRegistry({...r137Registry,expiresAt:now+MAX_PROVIDER_REGISTRY_TTL_MS+1}); const r137RegistryLongStatus=await inspectProviderTrustRegistry(r137RegistryLong,now+1);
  add('contract-r13-7-registry-ttl','TTL registry borné',!r137RegistryLongStatus.ok&&r137RegistryLongStatus.code==='REGISTRY_TTL_TOO_LONG',r137RegistryLongStatus.ok?'unexpected-pass':r137RegistryLongStatus.code);
  const r137RegistryTamper=await inspectProviderTrustRegistry({...r137Registry,environmentDigest:'ENV-BBBBBBBBBBBBBBBB'},now+1);
  add('contract-r13-7-registry-tamper','Altération registry détectée',!r137RegistryTamper.ok&&r137RegistryTamper.code==='REGISTRY_DIGEST_MISMATCH',r137RegistryTamper.ok?'unexpected-pass':r137RegistryTamper.code);
  add('contract-r13-7-registry-policy-digest','Digest politique registry déterministe',r137RegistryPolicyA===r137RegistryPolicyB&&/^PTRPOL-[A-F0-9]{16}$/.test(r137RegistryPolicyA),r137RegistryPolicyA);
  const r137RegistrySnapshot=buildProviderTrustRegistrySnapshot(r137Registry);
  add('contract-r13-7-registry-redaction','Snapshot registry sans racines ni statements bruts',r137RegistrySnapshot.includes('rawTrustRoots=NOT_STORED')&&r137RegistrySnapshot.includes('rawAttestationStatements=NOT_STORED')&&r137RegistrySnapshot.includes('secrets=NONE'),'raw provider material absent');
  add('contract-r13-7-registry-no-provider-claim','Aucune revendication trust provider forte',providerTrustRegistryPolicy.strongProviderTrustClaim===false&&!providerTrustRegistryPolicy.appleProviderRootsProvisioned&&!providerTrustRegistryPolicy.androidProviderRootsProvisioned,'provider trust false');
  add('contract-r13-7-registry-window','Fenêtre registry bornée à 24h et skew 5s',MAX_PROVIDER_REGISTRY_TTL_MS===86_400_000&&MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS===5_000,`${MAX_PROVIDER_REGISTRY_TTL_MS}/${MAX_PROVIDER_REGISTRY_CLOCK_SKEW_MS}`);

  const r137Profile = await buildServerVerificationProfile({ parentTrustPassport:'TAP-AAAAAAAAAAAAAAAA', trustAnchorDigest:'TA-AAAAAAAAAAAAAAAA', providerRegistryDigest:r137Registry.digest, stagingHsmBindingDigest:r138eHsmBindingDigest, ledgerHeadDigest:'LAE-AAAAAAAAAAAAAAAA', trustedTimeDigest:'STA-AAAAAAAAAAAAAAAA', environmentDigest:'ENV-AAAAAAAAAAAAAAAA', verifierKeyId:'srvkey.staging.p256.2026', decisionDigest:'RDEC-AAAAAAAAAAAAAAAA', signatureDigest:'SIG-AAAAAAAAAAAAAAAA', issuedAt:now, expiresAt:now+10_000 });
  const r137ProfileStatus=await inspectServerVerificationProfile(r137Profile,now+1); const r137ProfilePolicyA=await deriveServerVerificationProfilePolicyDigest(); const r137ProfilePolicyB=await deriveServerVerificationProfilePolicyDigest();
  add('contract-r13-8e-verify-version','Server verification profile staging versionné',SERVER_VERIFICATION_PROFILE_VERSION===2&&SERVER_VERIFICATION_PROFILE_RELEASE==='R13.8E-STAGING-P256-SERVER-VERIFICATION-PROFILE-CONTRACT',SERVER_VERIFICATION_PROFILE_RELEASE);
  add('contract-r13-8e-verify-algorithm','Server profile staging épinglé P-256/SHA-256',SERVER_VERIFICATION_ALGORITHM===STAGING_HSM_ALGORITHM&&STAGING_HSM_PROTECTION_LEVEL==='HSM',SERVER_VERIFICATION_ALGORITHM);
  add('contract-r13-8e-verify-scope','Server profile limité au staging P-256',serverVerificationProfilePolicy.scope==='STAGING_P256_SERVER_VERIFICATION_PROFILE_CONTRACT_ONLY'&&serverVerificationProfilePolicy.stagingHsmP256Provisioned&&serverVerificationProfilePolicy.stagingHsmAttestationVerified&&serverVerificationProfilePolicy.strongServerVerificationClaim===false,serverVerificationProfilePolicy.scope);
  add('contract-r13-8e-verify-fuses','HSM staging lié mais verifier/keyset/ledger/clock/network/payment production fermés',serverVerificationProfilePolicy.stagingHsmP256Provisioned&&serverVerificationProfilePolicy.stagingHsmAttestationVerified&&!serverVerificationProfilePolicy.productionVerifierProvisioned&&!serverVerificationProfilePolicy.productionKeySetProvisioned&&!serverVerificationProfilePolicy.serverReplayLedgerProvisioned&&!serverVerificationProfilePolicy.trustedServerClockProvisioned&&!serverVerificationProfilePolicy.networkExecutionEnabled&&!serverVerificationProfilePolicy.livePaymentExecutionEnabled,'staging hsm on · production fuses off');
  add('contract-r13-7-verify-valid','Profil serveur synthétique valide',r137ProfileStatus.ok,r137ProfileStatus.ok?r137Profile.digest:r137ProfileStatus.code);
  const r137Profile2=await buildServerVerificationProfile({...r137Profile}); add('contract-r13-7-verify-deterministic','Digest profil serveur déterministe',r137Profile.digest===r137Profile2.digest,r137Profile.digest);
  const r137ProdVerify=await verifyProductionServerDecision(r137Profile,now+1); add('contract-r13-7-verify-production-block','Verification production fail-closed sans verifier',!r137ProdVerify.ok&&r137ProdVerify.code==='SERVER_VERIFIER_NOT_PROVISIONED',r137ProdVerify.ok?'unexpected-pass':r137ProdVerify.code);
  const r137LabVerify=await verifyLabServerDecision(r137Profile,now+1,{mode:'LAB_INJECTED_VERIFIER',verifyDigest:async(v)=>v.signatureDigest==='SIG-AAAAAAAAAAAAAAAA'}); add('contract-r13-7-verify-lab-pass','Verifier injecté autorisé uniquement au lab',r137LabVerify.ok,r137LabVerify.ok?'LAB_INJECTED_VERIFIER':r137LabVerify.code);
  const r137LabReject=await verifyLabServerDecision(r137Profile,now+1,{mode:'LAB_INJECTED_VERIFIER',verifyDigest:async()=>false}); add('contract-r13-7-verify-lab-reject','Verifier lab peut rejeter la signature',!r137LabReject.ok&&r137LabReject.code==='LAB_SIGNATURE_REJECTED',r137LabReject.ok?'unexpected-pass':r137LabReject.code);
  const r137ProfileBadParent=await buildServerVerificationProfile({...r137Profile,parentTrustPassport:'BAD'}); const r137ProfileBadParentStatus=await inspectServerVerificationProfile(r137ProfileBadParent,now+1); add('contract-r13-7-verify-parent','Parent TAP invalide rejeté',!r137ProfileBadParentStatus.ok&&r137ProfileBadParentStatus.code==='SERVER_PROFILE_BINDING_FORMAT',r137ProfileBadParentStatus.ok?'unexpected-pass':r137ProfileBadParentStatus.code);
  const r137ProfileBadKey=await buildServerVerificationProfile({...r137Profile,verifierKeyId:'x'}); const r137ProfileBadKeyStatus=await inspectServerVerificationProfile(r137ProfileBadKey,now+1); add('contract-r13-7-verify-key-id','Key-id serveur strict',!r137ProfileBadKeyStatus.ok&&r137ProfileBadKeyStatus.code==='SERVER_PROFILE_BINDING_FORMAT',r137ProfileBadKeyStatus.ok?'unexpected-pass':r137ProfileBadKeyStatus.code);
  const r137ProfileBadSig=await buildServerVerificationProfile({...r137Profile,signatureDigest:'BAD'}); const r137ProfileBadSigStatus=await inspectServerVerificationProfile(r137ProfileBadSig,now+1); add('contract-r13-7-verify-signature-digest','Signature conservée sous digest strict',!r137ProfileBadSigStatus.ok&&r137ProfileBadSigStatus.code==='SERVER_PROFILE_BINDING_FORMAT',r137ProfileBadSigStatus.ok?'unexpected-pass':r137ProfileBadSigStatus.code);
  const r137ProfileBadRegistry=await buildServerVerificationProfile({...r137Profile,providerRegistryDigest:'BAD'}); const r137ProfileBadRegistryStatus=await inspectServerVerificationProfile(r137ProfileBadRegistry,now+1); add('contract-r13-7-verify-registry-binding','Binding provider registry obligatoire',!r137ProfileBadRegistryStatus.ok&&r137ProfileBadRegistryStatus.code==='SERVER_PROFILE_BINDING_FORMAT',r137ProfileBadRegistryStatus.ok?'unexpected-pass':r137ProfileBadRegistryStatus.code);
  const r137ProfileFuture=await buildServerVerificationProfile({...r137Profile,issuedAt:now+MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS+1,expiresAt:now+MAX_SERVER_VERIFICATION_CLOCK_SKEW_MS+10_000}); const r137ProfileFutureStatus=await inspectServerVerificationProfile(r137ProfileFuture,now); add('contract-r13-7-verify-skew','Profil futur au-delà du skew rejeté',!r137ProfileFutureStatus.ok&&r137ProfileFutureStatus.code==='SERVER_PROFILE_CLOCK_SKEW_FUTURE',r137ProfileFutureStatus.ok?'unexpected-pass':r137ProfileFutureStatus.code);
  const r137ProfileExpired=await buildServerVerificationProfile({...r137Profile,issuedAt:now-20_000,expiresAt:now-1}); const r137ProfileExpiredStatus=await inspectServerVerificationProfile(r137ProfileExpired,now); add('contract-r13-7-verify-expired','Profil serveur expiré rejeté',!r137ProfileExpiredStatus.ok&&r137ProfileExpiredStatus.code==='SERVER_PROFILE_EXPIRED',r137ProfileExpiredStatus.ok?'unexpected-pass':r137ProfileExpiredStatus.code);
  const r137ProfileLong=await buildServerVerificationProfile({...r137Profile,expiresAt:now+MAX_SERVER_VERIFICATION_TTL_MS+1}); const r137ProfileLongStatus=await inspectServerVerificationProfile(r137ProfileLong,now+1); add('contract-r13-7-verify-ttl','TTL profil serveur borné',!r137ProfileLongStatus.ok&&r137ProfileLongStatus.code==='SERVER_PROFILE_TTL_TOO_LONG',r137ProfileLongStatus.ok?'unexpected-pass':r137ProfileLongStatus.code);
  const r137ProfileTamper=await inspectServerVerificationProfile({...r137Profile,decisionDigest:'RDEC-BBBBBBBBBBBBBBBB'},now+1); add('contract-r13-7-verify-tamper','Altération décision détectée',!r137ProfileTamper.ok&&r137ProfileTamper.code==='SERVER_PROFILE_DIGEST_MISMATCH',r137ProfileTamper.ok?'unexpected-pass':r137ProfileTamper.code);
  add('contract-r13-7-verify-policy-digest','Digest politique verifier déterministe',r137ProfilePolicyA===r137ProfilePolicyB&&/^SVPPOL-[A-F0-9]{16}$/.test(r137ProfilePolicyA),r137ProfilePolicyA);
  const r137ProfileSnapshot=buildServerVerificationProfileSnapshot(r137Profile); add('contract-r13-7-verify-redaction','Snapshot serveur exclut signature et clé brutes',r137ProfileSnapshot.includes('rawSignature=NOT_STORED')&&r137ProfileSnapshot.includes('rawPublicKey=NOT_STORED')&&r137ProfileSnapshot.includes('secrets=NONE'),'raw signature/key absent');
  add('contract-r13-7-verify-no-strong-claim','Aucune revendication vérification serveur forte',serverVerificationProfilePolicy.strongServerVerificationClaim===false&&!serverVerificationProfilePolicy.productionVerifierProvisioned,'strongServerVerification=false');

  const r137ExternalBase: ExternalTrustReadinessInput = { parentTrustProof:'TAP-AAAAAAAAAAAAAAAA', ceremonyDigest:r137Ceremony.digest, providerRegistryDigest:r137Registry.digest, serverVerificationProfileDigest:r137Profile.digest, stagingHsmBindingDigest:r138eHsmBindingDigest, environmentDigest:'ENV-AAAAAAAAAAAAAAAA', killSwitchEngaged:false, stagingHsmP256Verified:true, stagingHsmAttestationVerified:true, ceremonyEvidenceProvisioned:false, productionKmsProvisioned:false, serverVerifierProvisioned:false, providerTrustRootsProvisioned:false, serverReplayLedgerProvisioned:false, trustedServerClockProvisioned:false, networkExecutionEnabled:false, livePaymentExecutionEnabled:false, settlementEnabled:false };
  const r137ExternalPolicyA=await deriveExternalTrustReadinessPolicyDigest(); const r137ExternalPolicyB=await deriveExternalTrustReadinessPolicyDigest();
  const r138gProviderReview=await buildProviderRootReviewContract(); const r138gProviderReviewStatus=await inspectProviderRootReviewContract(r138gProviderReview); const r138gProviderPolicyA=await deriveProviderRootReviewPolicyDigest(); const r138gProviderPolicyB=await deriveProviderRootReviewPolicyDigest();
  const r138hAdmission=await buildProductionAdmissionAssessment(); const r138hAdmissionStatus=await inspectProductionAdmissionAssessment(r138hAdmission); const r138hAdmissionPolicyA=await deriveProductionAdmissionPolicyDigest(); const r138hAdmissionPolicyB=await deriveProductionAdmissionPolicyDigest();
  const r138iFoundation=await buildProductionFoundationBlueprint(); const r138iFoundationStatus=await inspectProductionFoundationBlueprint(r138iFoundation); const r138iFoundationPolicyA=await deriveProductionFoundationPolicyDigest(); const r138iFoundationPolicyB=await deriveProductionFoundationPolicyDigest();
  add('contract-r13-8i-foundation-version','Blueprint fondations R13.8I parenté à l’admission R13.8H certifiée',EXTERNAL_TRUST_READINESS_VERSION===2&&EXTERNAL_TRUST_READINESS_RELEASE==='R13.8G-STAGING-HSM-P256-PROVIDER-REVIEW-GATE'&&PROVIDER_ROOT_REVIEW_RELEASE==='R13.8G-PROVIDER-ROOT-STAGING-EXCEPTION'&&PRODUCTION_ADMISSION_SHADOW_RELEASE==='R13.8H-PRODUCTION-ADMISSION-SHADOW-CONTRACT'&&PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE==='R13.8I-PRODUCTION-FOUNDATION-BLUEPRINT'&&R13_8I_PARENT_MANIFEST_SHA256==='05f67be8dc4510a769906207c68356c15e484d7f6c1f82de9b965baf00364780'&&R13_8I_PARENT_R13_8H_R3_EVIDENCE_SHA256==='c877b58a7c158c8c66d5a963c100b736d10ab33136687389e6614df34916f7d5'&&R13_8I_DEVICE_PAP_PANEL_SHA256==='3f97d3d62b190a0625a7b6fdc1e4a419ad6beea7bbcb10e468f9d9b9e9ec75b1',PRODUCTION_FOUNDATION_BLUEPRINT_RELEASE);
  add('contract-r13-8i-foundation-matrix','Les six blockers R13.8H deviennent six exigences de fondation sans les fermer',r138hAdmissionStatus.ok&&r138iFoundationStatus.ok&&r138iFoundation.requirements.length===6&&r138iFoundation.requiredCount===6&&r138iFoundation.provisionedCount===0&&r138iFoundation.requirements.every((r,i)=>r.blocker===r138hAdmission.blockers[i]&&!r.provisioned&&!r.closureAuthorized&&(i<5?r.state==='NOT_PROVISIONED':r.state==='GATE_OPEN')),r138iFoundation.requirements.map(r=>`${r.component}:${r.state}`).join(','));
  add('contract-r13-8i-foundation-fuses','Blueprint seulement : provisioning/cloud/credentials/live restent tous interdits',r138gProviderReviewStatus.ok&&r138hAdmissionStatus.ok&&r138iFoundationStatus.ok&&productionAdmissionPolicy.stagingAssessmentEnabled&&!productionAdmissionPolicy.productionAdmissionEnabled&&productionFoundationPolicy.blueprintSealingEnabled&&!productionFoundationPolicy.provisioningExecutionEnabled&&!productionFoundationPolicy.cloudMutationEnabled&&!productionFoundationPolicy.credentialMaterialAllowed&&!r138iFoundation.provisioningAuthorized&&!r138iFoundation.productionEligible&&!r138iFoundation.productionRelease&&!r138iFoundation.networkExecution&&!r138iFoundation.livePaymentExecution&&!r138iFoundation.settlement&&providerRootReviewPolicy.productionProviderRootGateOpen,'blueprint=on · provisioning/cloud/credentials/live=off');
  let r137Prod=inspectProductionExternalTrustReadiness(r137ExternalBase); add('contract-r13-7-external-ceremony-block','Production bloquée sans preuve cérémonie',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_CEREMONY_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true}); add('contract-r13-7-external-kms-block','Production bloquée sans KMS',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_KMS_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true,productionKmsProvisioned:true}); add('contract-r13-7-external-server-block','Production bloquée sans verifier serveur',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_SERVER_VERIFIER_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true,productionKmsProvisioned:true,serverVerifierProvisioned:true}); add('contract-r13-7-external-provider-block','Production bloquée sans racines provider',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_PROVIDER_ROOTS_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true,productionKmsProvisioned:true,serverVerifierProvisioned:true,providerTrustRootsProvisioned:true}); add('contract-r13-7-external-ledger-block','Production bloquée sans ledger',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_LEDGER_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true,productionKmsProvisioned:true,serverVerifierProvisioned:true,providerTrustRootsProvisioned:true,serverReplayLedgerProvisioned:true}); add('contract-r13-7-external-clock-block','Production bloquée sans horloge fiable',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_CLOCK_NOT_PROVISIONED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,ceremonyEvidenceProvisioned:true,productionKmsProvisioned:true,serverVerifierProvisioned:true,providerTrustRootsProvisioned:true,serverReplayLedgerProvisioned:true,trustedServerClockProvisioned:true}); add('contract-r13-7-external-intentional-block','Même entièrement simulée, voie production reste bloquée',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_PRODUCTION_PATH_INTENTIONALLY_BLOCKED',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,killSwitchEngaged:true}); add('contract-r13-7-external-killswitch','Kill-switch prioritaire',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_KILL_SWITCH',r137Prod.ok?'unexpected-pass':r137Prod.code);
  r137Prod=inspectProductionExternalTrustReadiness({...r137ExternalBase,networkExecutionEnabled:true}); add('contract-r13-7-external-network','Fuse réseau ouvert rejeté',!r137Prod.ok&&r137Prod.code==='EXTERNAL_TRUST_NETWORK_FUSE',r137Prod.ok?'unexpected-pass':r137Prod.code);
  const r137Lab=await inspectLabExternalTrustReadiness(r137ExternalBase,r137Ceremony,r137Registry,r137Profile,now+3); add('contract-r13-8i-foundation-parent','Blueprint lié au PAD R13.8H certifié sans promouvoir la readiness staging',r137Lab.ok&&r137Lab.readinessClass==='STAGING_HSM_P256_SHADOW_READY_ONLY'&&r138gProviderReviewStatus.ok&&r138hAdmissionStatus.ok&&r138iFoundationStatus.ok&&r138hAdmission.digest===R13_8I_PARENT_ADMISSION_DIGEST&&r138iFoundation.parentAdmissionDigest===r138hAdmission.digest&&!r138iFoundation.productionEligible,r137Lab.ok?`${r137Lab.readinessClass||'ok'} · ${r138hAdmission.digest} · ${r138iFoundation.digest}`:r137Lab.code);
  const r137LabCeremony=await inspectLabExternalTrustReadiness({...r137ExternalBase,ceremonyDigest:'TC-BBBBBBBBBBBBBBBB'},r137Ceremony,r137Registry,r137Profile,now+3); add('contract-r13-7-external-ceremony-binding','Binding cérémonie strict',!r137LabCeremony.ok&&r137LabCeremony.code==='LAB_CEREMONY_BINDING',r137LabCeremony.ok?'unexpected-pass':r137LabCeremony.code);
  const r137LabRegistry=await inspectLabExternalTrustReadiness({...r137ExternalBase,providerRegistryDigest:'PTR-BBBBBBBBBBBBBBBB'},r137Ceremony,r137Registry,r137Profile,now+3); add('contract-r13-7-external-registry-binding','Binding registry strict',!r137LabRegistry.ok&&r137LabRegistry.code==='LAB_REGISTRY_BINDING',r137LabRegistry.ok?'unexpected-pass':r137LabRegistry.code);
  const r137LabProfile=await inspectLabExternalTrustReadiness({...r137ExternalBase,serverVerificationProfileDigest:'SVP-BBBBBBBBBBBBBBBB'},r137Ceremony,r137Registry,r137Profile,now+3); add('contract-r13-7-external-profile-binding','Binding profile serveur strict',!r137LabProfile.ok&&r137LabProfile.code==='LAB_PROFILE_BINDING',r137LabProfile.ok?'unexpected-pass':r137LabProfile.code);
  const r137Receipt=await buildExternalTrustReadinessReceipt(r137ExternalBase,now+3,r137Ceremony,r137Registry,r137Profile); const r137ReceiptStatus=r137Receipt.ok?await inspectExternalTrustReadinessReceipt(r137Receipt.receipt,now+4):{ok:false as const,code:'PRECONDITION'}; add('contract-r13-7-external-receipt','Receipt external trust valide et court terme',r137Receipt.ok&&r137ReceiptStatus.ok&&r137Receipt.receipt.expiresAt-r137Receipt.receipt.issuedAt===MAX_EXTERNAL_TRUST_RECEIPT_TTL_MS,r137Receipt.ok?r137Receipt.receipt.digest:r137Receipt.code);
  const r137ReceiptTamper=r137Receipt.ok?await inspectExternalTrustReadinessReceipt({...r137Receipt.receipt,environmentDigest:'ENV-BBBBBBBBBBBBBBBB'},now+4):{ok:false as const,code:'PRECONDITION'}; add('contract-r13-7-external-receipt-tamper','Altération receipt détectée',!r137ReceiptTamper.ok&&r137ReceiptTamper.code==='EXTERNAL_RECEIPT_DIGEST_MISMATCH',r137ReceiptTamper.ok?'unexpected-pass':r137ReceiptTamper.code);
  add('contract-r13-8i-foundation-policy-digest','Digests external/provider/admission/foundation déterministes',r137ExternalPolicyA===r137ExternalPolicyB&&/^ETPOL-[A-F0-9]{16}$/.test(r137ExternalPolicyA)&&r138gProviderPolicyA===r138gProviderPolicyB&&/^PRRPOL-[A-F0-9]{16}$/.test(r138gProviderPolicyA)&&r138hAdmissionPolicyA===r138hAdmissionPolicyB&&/^PADPOL-[A-F0-9]{16}$/.test(r138hAdmissionPolicyA)&&r138iFoundationPolicyA===r138iFoundationPolicyB&&/^PFBPOL-[A-F0-9]{16}$/.test(r138iFoundationPolicyA),`${r137ExternalPolicyA}/${r138gProviderPolicyA}/${r138hAdmissionPolicyA}/${r138iFoundationPolicyA}`);
  const r137ExternalSnapshot=buildExternalTrustReadinessSnapshot(r137Receipt.ok?r137Receipt.receipt:null); const r138gProviderSnapshot=await buildProviderRootReviewSnapshot(); const r138hAdmissionSnapshot=await buildProductionAdmissionSnapshot(); const r138iFoundationSnapshot=await buildProductionFoundationSnapshot(); add('contract-r13-8i-foundation-redaction','Snapshots jusqu’au blueprint restent expurgés, 0/6 provisionné et production bloquée',r137ExternalSnapshot.includes('providerReviewStagingExceptionAccepted=true')&&r137ExternalSnapshot.includes('productionProviderRootGate=OPEN')&&r138gProviderSnapshot.includes('rawProviderRoots=NOT_STORED')&&r138gProviderSnapshot.includes('productionEligible=false')&&r138hAdmissionSnapshot.includes('rawProviderRoots=NOT_STORED')&&r138hAdmissionSnapshot.includes('rawServerKeys=NOT_STORED')&&r138hAdmissionSnapshot.includes('productionEligible=false')&&r138iFoundationSnapshot.includes('provisioned=0')&&r138iFoundationSnapshot.includes('provisioningAuthorized=false')&&r138iFoundationSnapshot.includes('rawKeys=NOT_STORED')&&r138iFoundationSnapshot.includes('credentials=NOT_STORED')&&r138iFoundationSnapshot.includes('providerDocuments=NOT_STORED')&&r137ExternalSnapshot.includes('secrets=NONE')&&r138gProviderSnapshot.includes('secrets=NONE')&&r138hAdmissionSnapshot.includes('secrets=NONE')&&r138iFoundationSnapshot.includes('secrets=NONE'),'parent evidence bound · six requirements specified · raw material absent');

  const passed = checks.filter((check) => check.pass).length;
  return { checks, passed, total: checks.length, allPass: passed === checks.length, ranAt: Date.now() };
}
