import React from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import type { EngineeringNavigate } from '../types';
import { backendBoundaryPolicy, evaluateBackendReadiness } from '../security/backendBoundary';
import {
  BACKEND_CONTRACT_VERSION,
  MAX_INTENT_TTL_MS,
  backendContractPolicy,
  buildBackendContractSnapshot,
  liveOperations,
} from '../security/backendContract';
import { runBackendContractSuite, type BackendContractSuiteResult } from '../security/backendContractSuite';
import { issueBackendContractPassport, readBackendContractPassport, type BackendContractPassport } from '../security/backendContractPassport';
import { buildContinuitySnapshot, MAX_CONTINUITY_EVENTS, type AttestationContinuityJournal } from '../security/attestationContinuity';
import { readIntegrationBoundaryPassport, type IntegrationBoundaryPassport } from '../security/integrationBoundaryPassport';
import { deriveIntegrationBoundaryLineage } from '../security/passportLineage';
import { intentReplayPolicy } from '../security/intentReplayGuard';
import { buildIntentReplayPassportSnapshot, issueIntentReplayPassport, readIntentReplayPassport, type IntentReplayPassport } from '../security/intentReplayPassport';
import { intentAuthorizationPolicy } from '../security/intentAuthorizationEnvelope';
import { buildIntentAuthorizationPassportSnapshot, issueIntentAuthorizationPassport, readIntentAuthorizationPassport, type IntentAuthorizationPassport } from '../security/intentAuthorizationPassport';
import { remoteAuthorizationPolicy } from '../security/remoteAuthorizationBoundary';
import { executionPermitPolicy } from '../security/executionPermit';
import { buildRemoteAuthorizationReadinessSnapshot, issueRemoteAuthorizationReadinessPassport, readRemoteAuthorizationReadinessPassport, type RemoteAuthorizationReadinessPassport } from '../security/remoteAuthorizationPassport';
import { serverTrustAnchorPolicy } from '../security/serverTrustAnchor';
import { deviceAttestationPolicy } from '../security/deviceAttestationContract';
import { serverLedgerAnchorPolicy } from '../security/serverLedgerAnchor';
import { releaseReadinessPolicy } from '../security/releaseReadinessGate';
import { buildTrustAnchorReadinessSnapshot, issueTrustAnchorReadinessPassport, readTrustAnchorReadinessPassport, type TrustAnchorReadinessPassport } from '../security/trustAnchorPassport';
import { trustCeremonyPolicy } from '../security/trustCeremonyContract';
import { providerTrustRegistryPolicy } from '../security/providerTrustRegistry';
import { serverVerificationProfilePolicy } from '../security/serverVerificationProfile';
import { externalTrustReadinessPolicy } from '../security/externalTrustReadinessGate';
import { buildExternalTrustPassportSnapshot, issueExternalTrustReadinessPassport, readExternalTrustReadinessPassport, type ExternalTrustReadinessPassport } from '../security/externalTrustPassport';
import { stagingHsmP256Binding, stagingHsmP256BindingPolicy, STAGING_HSM_PROVIDER_REVIEW_CLASSIFICATION } from '../security/stagingHsmP256Binding';
import { providerRootReviewPolicy } from '../security/providerRootReviewContract';
import { buildStagingTrustPolicySnapshot, issueStagingTrustPolicyPassport, readStagingTrustPolicyPassport, type StagingTrustPolicyPassport } from '../security/stagingTrustPolicyPassport';
import { buildProductionAdmissionPassportSnapshot, issueProductionAdmissionShadowPassport, readProductionAdmissionShadowPassport, type ProductionAdmissionShadowPassport } from '../security/productionAdmissionPassport';
import { buildProductionFoundationPassportSnapshot, issueProductionFoundationPassport, readProductionFoundationPassport, type ProductionFoundationPassport } from '../security/productionFoundationPassport';

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, good && styles.good]}>{value}</Text></View>;
}

export default function BackendContractLabScreen({ navigate }: { navigate: EngineeringNavigate }) {
  const [suite, setSuite] = React.useState<BackendContractSuiteResult | null>(null);
  const [boundaryPassport, setBoundaryPassport] = React.useState<IntegrationBoundaryPassport | null>(null);
  const [boundaryValid, setBoundaryValid] = React.useState(true);
  const [boundaryLineage, setBoundaryLineage] = React.useState('IBL-…');
  const [passport, setPassport] = React.useState<BackendContractPassport | null>(null);
  const [passportValid, setPassportValid] = React.useState(true);
  const [continuity, setContinuity] = React.useState<AttestationContinuityJournal | null>(null);
  const [replayPassport, setReplayPassport] = React.useState<IntentReplayPassport | null>(null);
  const [replayPassportValid, setReplayPassportValid] = React.useState(true);
  const [authorizationPassport, setAuthorizationPassport] = React.useState<IntentAuthorizationPassport | null>(null);
  const [authorizationPassportValid, setAuthorizationPassportValid] = React.useState(true);
  const [remotePassport, setRemotePassport] = React.useState<RemoteAuthorizationReadinessPassport | null>(null);
  const [remotePassportValid, setRemotePassportValid] = React.useState(true);
  const [trustPassport, setTrustPassport] = React.useState<TrustAnchorReadinessPassport | null>(null);
  const [trustPassportValid, setTrustPassportValid] = React.useState(true);
  const [externalTrustPassport, setExternalTrustPassport] = React.useState<ExternalTrustReadinessPassport | null>(null);
  const [externalTrustPassportValid, setExternalTrustPassportValid] = React.useState(true);
  const [stagingPolicyPassport, setStagingPolicyPassport] = React.useState<StagingTrustPolicyPassport | null>(null);
  const [stagingPolicyPassportValid, setStagingPolicyPassportValid] = React.useState(true);
  const [productionAdmissionPassport, setProductionAdmissionPassport] = React.useState<ProductionAdmissionShadowPassport | null>(null);
  const [productionAdmissionPassportValid, setProductionAdmissionPassportValid] = React.useState(true);
  const [productionFoundationPassport, setProductionFoundationPassport] = React.useState<ProductionFoundationPassport | null>(null);
  const [productionFoundationPassportValid, setProductionFoundationPassportValid] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const boundary = evaluateBackendReadiness();

  const refresh = React.useCallback(async () => {
    const [ib, bc, replay, authorization, remote, trust, externalTrust, stagingPolicy, productionAdmission, productionFoundation] = await Promise.all([readIntegrationBoundaryPassport(), readBackendContractPassport(), readIntentReplayPassport(), readIntentAuthorizationPassport(), readRemoteAuthorizationReadinessPassport(), readTrustAnchorReadinessPassport(), readExternalTrustReadinessPassport(), readStagingTrustPolicyPassport(), readProductionAdmissionShadowPassport(), readProductionFoundationPassport()]);
    setBoundaryPassport(ib.passport);
    setBoundaryValid(ib.valid);
    setBoundaryLineage(ib.valid && ib.passport ? await deriveIntegrationBoundaryLineage(ib.passport) : 'IBL-…');
    setPassport(bc.passport);
    setPassportValid(bc.valid);
    setContinuity(bc.continuity);
    setReplayPassport(replay.passport);
    setReplayPassportValid(replay.valid);
    setAuthorizationPassport(authorization.passport);
    setAuthorizationPassportValid(authorization.valid);
    setRemotePassport(remote.passport);
    setRemotePassportValid(remote.valid);
    setTrustPassport(trust.passport);
    setTrustPassportValid(trust.valid);
    setExternalTrustPassport(externalTrust.passport);
    setExternalTrustPassportValid(externalTrust.valid);
    setStagingPolicyPassport(stagingPolicy.passport);
    setStagingPolicyPassportValid(stagingPolicy.valid);
    setProductionAdmissionPassport(productionAdmission.passport);
    setProductionAdmissionPassportValid(productionAdmission.valid);
    setProductionFoundationPassport(productionFoundation.passport);
    setProductionFoundationPassportValid(productionFoundation.valid);
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const runLab = async () => {
    setBusy(true);
    try {
      const ib = await readIntegrationBoundaryPassport();
      if (!ib.valid || !ib.passport) {
        Alert.alert('Passeport IB requis', 'Scelle d’abord la frontière R12.9 en 40/40. Aucun live ne sera activé.');
        return;
      }
      const result = await runBackendContractSuite();
      setSuite(result);
      if (!result.allPass || result.passed !== 344 || result.total !== 344) {
        Alert.alert('Contrat backend à revoir', `${result.passed}/${result.total} contrôles. Réseau live toujours OFF.`);
        return;
      }
      const contractIssued = await issueBackendContractPassport(88, 88);
      if (!contractIssued.ok) {
        Alert.alert('Socle R13.2 non scellé', contractIssued.reason);
        return;
      }
      const replayIssued = await issueIntentReplayPassport(112, 112);
      if (!replayIssued.ok) {
        Alert.alert('Passeport replay non émis', replayIssued.reason);
        return;
      }
      const authorizationIssued = await issueIntentAuthorizationPassport(152, 152);
      if (!authorizationIssued.ok) {
        Alert.alert('Passeport autorisation non émis', authorizationIssued.reason);
        return;
      }
      const remoteIssued = await issueRemoteAuthorizationReadinessPassport(200, 200);
      if (!remoteIssued.ok) {
        Alert.alert('Passeport frontière distante non émis', remoteIssued.reason);
        return;
      }
      const trustIssued = await issueTrustAnchorReadinessPassport(264, 264);
      if (!trustIssued.ok) { Alert.alert('Passeport trust anchor non émis', trustIssued.reason); return; }
      const externalTrustIssued = await issueExternalTrustReadinessPassport(result.passed, result.total);
      if (!externalTrustIssued.ok) { Alert.alert('Passeport external trust v2 non émis', externalTrustIssued.reason); return; }
      const stagingPolicyIssued = await issueStagingTrustPolicyPassport(result.passed, result.total);
      if (!stagingPolicyIssued.ok) { Alert.alert('Passeport politique staging non émis', stagingPolicyIssued.reason); return; }
      const productionAdmissionIssued = await issueProductionAdmissionShadowPassport(result.passed, result.total);
      if (!productionAdmissionIssued.ok) { Alert.alert('Passeport admission production non émis', productionAdmissionIssued.reason); return; }
      const productionFoundationIssued = await issueProductionFoundationPassport(result.passed, result.total);
      await refresh();
      Alert.alert(
        productionFoundationIssued.ok ? 'R13.8I · Blueprint fondations production scellé' : 'Passeport blueprint production non émis',
        productionFoundationIssued.ok ? `${productionFoundationIssued.passport.proof} · parent ${productionAdmissionIssued.passport.proof} · 344/344 · 6/6 exigences décrites · 0/6 provisionnée · provisioning INTERDIT · production INÉLIGIBLE · live BLOQUÉ.` : productionFoundationIssued.reason,
      );
    } catch {
      Alert.alert('Lab arrêté', 'Le contrat backend s’est fermé en mode fail-closed.');
    } finally {
      setBusy(false);
    }
  };

  const shareSnapshot = async () => {
    const [ib, bc, replay, authorization, remote, trust, externalTrust, stagingPolicy, productionAdmission, productionFoundation] = await Promise.all([readIntegrationBoundaryPassport(), readBackendContractPassport(), readIntentReplayPassport(), readIntentAuthorizationPassport(), readRemoteAuthorizationReadinessPassport(), readTrustAnchorReadinessPassport(), readExternalTrustReadinessPassport(), readStagingTrustPolicyPassport(), readProductionAdmissionShadowPassport(), readProductionFoundationPassport()]);
    const lineage = ib.valid && ib.passport ? await deriveIntegrationBoundaryLineage(ib.passport) : 'IBL-NOT-PROVIDED';
    await Share.share({
      message: [
        buildBackendContractSnapshot(ib.passport?.proof || 'IB-NOT-PROVIDED'),
        `boundaryLineage=${lineage}`,
        `contractLineage=${bc.passport?.contractLineage || 'BCL-NOT-PROVIDED'}`,
        buildContinuitySnapshot(bc.continuity),
        buildIntentReplayPassportSnapshot(replay.passport),
        buildIntentAuthorizationPassportSnapshot(authorization.passport),
        buildRemoteAuthorizationReadinessSnapshot(remote.passport),
        buildTrustAnchorReadinessSnapshot(trust.passport),
        buildExternalTrustPassportSnapshot(externalTrust.passport),
        buildStagingTrustPolicySnapshot(stagingPolicy.passport),
        buildProductionAdmissionPassportSnapshot(productionAdmission.passport),
        buildProductionFoundationPassportSnapshot(productionFoundation.passport),
        'secrets=NONE',
      ].join('\n'),
      title: 'OrchidPay · R13.8I Production Foundation Blueprint',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('integration-readiness')}><Text style={styles.back}>‹ Frontière backend</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>R13.8I · PRODUCTION FOUNDATION BLUEPRINT</Text>
        <Text style={styles.title}>Fondations production · PAP parent · provisioning fail-closed</Text>
        <Text style={styles.subtitle}>R13.8I conserve le PAP R13.8H certifié et transforme ses six blockers en exigences de fondation précisément spécifiées. Le blueprint est scellé, mais 0/6 composant est provisionné : aucune mutation cloud, credential, activation production, réseau, paiement ou settlement n’est autorisée.</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Chaîne de confiance locale</Text>
          <Metric label="Passeport IB R12.9" value={boundaryPassport ? (boundaryValid ? 'PASS' : 'ERREUR') : 'REQUIS'} good={Boolean(boundaryPassport && boundaryValid)} />
          <Metric label="Scellé IB actif" value={boundaryPassport?.proof || 'IB-…'} good={Boolean(boundaryPassport)} />
          <Metric label="Lignée IB stable" value={boundaryLineage} good={Boolean(boundaryPassport && boundaryValid)} />
          <Metric label="Frontière live" value={`${boundary.status} · ${boundary.blockers.length} blockers`} good={!boundary.readyForLive} />
          <Metric label="Allowlist live" value={backendBoundaryPolicy.allowedLiveHosts.length === 0 ? 'VIDE' : `${backendBoundaryPolicy.allowedLiveHosts.length}`} good={backendBoundaryPolicy.allowedLiveHosts.length === 0} />
          <Metric label="Vérif. serveur" value={backendBoundaryPolicy.serverIntentVerifierProvisioned ? 'PROVISIONNÉE' : 'NON PROVISIONNÉE'} good={!backendBoundaryPolicy.serverIntentVerifierProvisioned} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Contrat R13.2 · socle immuable</Text>
          <Metric label="Version" value={BACKEND_CONTRACT_VERSION} good />
          <Metric label="Opérations bornées" value={`${liveOperations.length}`} good={liveOperations.length === 5} />
          <Metric label="TTL intent max" value={`${MAX_INTENT_TTL_MS / 1000}s`} good />
          <Metric label="Exécution réseau" value={backendContractPolicy.networkExecutionEnabled ? 'ON' : 'OFF'} good={!backendContractPolicy.networkExecutionEnabled} />
          <Metric label="Soumission live" value={backendContractPolicy.liveIntentSubmissionEnabled ? 'ON' : 'OFF'} good={!backendContractPolicy.liveIntentSubmissionEnabled} />
          <Metric label="Trust réponse serveur" value={backendContractPolicy.serverResponseTrustEnabled ? 'ON' : 'OFF'} good={!backendContractPolicy.serverResponseTrustEnabled} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Suite cumulée · 344 contrôles</Text>
          <Text style={styles.panelText}>Suite maintenue à 344 contrôles : les six contrôles R13.8H sont migrés en place vers le blueprint fondations R13.8I. Aucun gonflement artificiel ; les six blockers deviennent six exigences documentées, 0/6 reste provisionné et tous les fuses live restent fermés.</Text>
          <Metric label="Résultat" value={suite ? `${suite.passed}/${suite.total}` : 'NON LANCÉ'} good={suite?.allPass} />
          <TouchableOpacity style={styles.primary} disabled={busy} onPress={runLab} activeOpacity={0.85}><Text style={styles.primaryText}>{busy ? 'Contrôles…' : 'Lancer 344/344 + sceller blueprint fondations'}</Text></TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport contrat local · R13.2</Text>
          <Metric label="Intégrité" value={passport ? (passportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(passport && passportValid)} />
          <Metric label="Preuve" value={passport?.proof || 'À ÉMETTRE'} good={Boolean(passport)} />
          <Metric label="Parent IB actif" value={passport?.boundaryProof || 'N/A'} good={Boolean(passport)} />
          <Metric label="Lignée parent" value={passport?.boundaryLineage || 'N/A'} good={Boolean(passport)} />
          <Metric label="Lignée contrat" value={passport?.contractLineage || 'N/A'} good={Boolean(passport)} />
          <Metric label="Référence contrat" value={passport?.contractRef || 'N/A'} good={Boolean(passport)} />
          <Metric label="Continuité tête" value={passport?.continuityHead || 'N/A'} good={Boolean(passport)} />
          <Metric label="Séquence locale" value={passport ? `${passport.continuitySequence}` : 'N/A'} good={Boolean(passport)} />
          <Metric label="Journal borné" value={continuity ? `${continuity.events.length}/${MAX_CONTINUITY_EVENTS}` : 'N/A'} good={Boolean(continuity)} />
          <Metric label="Live ready" value={passport ? 'FALSE' : 'N/A'} good={Boolean(passport)} />
          <Metric label="Signature serveur" value="NON · LOCALE UNIQUEMENT" good />
          <TouchableOpacity style={styles.secondary} onPress={shareSnapshot} activeOpacity={0.85}><Text style={styles.secondaryText}>Partager snapshot contrat expurgé</Text></TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport anti-rejeu local · R13.3</Text>
          <Metric label="Intégrité" value={replayPassport ? (replayPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(replayPassport && replayPassportValid)} />
          <Metric label="Preuve" value={replayPassport?.proof || 'À ÉMETTRE'} good={Boolean(replayPassport)} />
          <Metric label="Parent contrat" value={replayPassport?.parentBackendProof || 'N/A'} good={Boolean(replayPassport)} />
          <Metric label="Lignée parent" value={replayPassport?.boundaryLineage || 'N/A'} good={Boolean(replayPassport)} />
          <Metric label="Lignée contrat" value={replayPassport?.contractLineage || 'N/A'} good={Boolean(replayPassport)} />
          <Metric label="Fenêtre locale" value={replayPassport ? `${replayPassport.replayWindowMax}` : `${intentReplayPolicy.maxEvents}`} good />
          <Metric label="Skew horloge" value={replayPassport ? `${replayPassport.clockSkewMs / 1000}s` : `${intentReplayPolicy.maxClockSkewMs / 1000}s`} good />
          <Metric label="Ledger serveur" value="NON PROVISIONNÉ" good />
          <Metric label="Ancre temps externe" value="NON PROVISIONNÉE" good />
          <Metric label="Portée" value="LOCALE · FENÊTRE RÉCENTE" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport autorisation locale · R13.4</Text>
          <Metric label="Intégrité" value={authorizationPassport ? (authorizationPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(authorizationPassport && authorizationPassportValid)} />
          <Metric label="Preuve" value={authorizationPassport?.proof || 'À ÉMETTRE'} good={Boolean(authorizationPassport)} />
          <Metric label="Parent anti-rejeu" value={authorizationPassport?.parentReplayProof || 'N/A'} good={Boolean(authorizationPassport)} />
          <Metric label="Parent contrat" value={authorizationPassport?.parentBackendProof || 'N/A'} good={Boolean(authorizationPassport)} />
          <Metric label="Lignée parent" value={authorizationPassport?.boundaryLineage || 'N/A'} good={Boolean(authorizationPassport)} />
          <Metric label="Lignée contrat" value={authorizationPassport?.contractLineage || 'N/A'} good={Boolean(authorizationPassport)} />
          <Metric label="TTL autorisation" value={`${(authorizationPassport?.authorizationTtlMs || intentAuthorizationPolicy.maxAuthorizationTtlMs) / 1000}s`} good />
          <Metric label="Machine d’état" value="DRAFT → REVIEWED → AUTHORIZED → CONSUMED" good />
          <Metric label="Serveur autorisation" value="NON PROVISIONNÉ" good />
          <Metric label="Attestation device" value="NON PROVISIONNÉE" good />
          <Metric label="Portée" value="PRÉAUTORISATION LOCALE" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport frontière distante · R13.5</Text>
          <Metric label="Intégrité" value={remotePassport ? (remotePassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(remotePassport && remotePassportValid)} />
          <Metric label="Preuve" value={remotePassport?.proof || 'À ÉMETTRE'} good={Boolean(remotePassport)} />
          <Metric label="Parent autorisation" value={remotePassport?.parentAuthorizationProof || 'N/A'} good={Boolean(remotePassport)} />
          <Metric label="Lignée parent" value={remotePassport?.boundaryLineage || 'N/A'} good={Boolean(remotePassport)} />
          <Metric label="Lignée contrat" value={remotePassport?.contractLineage || 'N/A'} good={Boolean(remotePassport)} />
          <Metric label="Algorithme futur" value={remoteAuthorizationPolicy.algorithm} good />
          <Metric label="Permit dry-run" value={executionPermitPolicy.scope} good />
          <Metric label="Vérif. signature serveur" value="NON PROVISIONNÉE" good />
          <Metric label="Vérif. attestation device" value="NON PROVISIONNÉE" good />
          <Metric label="Ledger / temps serveur" value="NON PROVISIONNÉS" good />
          <Metric label="Exécution paiement" value="OFF" good />
          <Metric label="Portée" value="CONTRAT DISTANT · PREP ONLY" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport trust anchor readiness · R13.6</Text>
          <Metric label="Intégrité" value={trustPassport ? (trustPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(trustPassport && trustPassportValid)} />
          <Metric label="Preuve" value={trustPassport?.proof || 'À ÉMETTRE'} good={Boolean(trustPassport)} />
          <Metric label="Parent frontière distante" value={trustPassport?.parentRemoteProof || 'N/A'} good={Boolean(trustPassport)} />
          <Metric label="Lignée parent" value={trustPassport?.boundaryLineage || 'N/A'} good={Boolean(trustPassport)} />
          <Metric label="Lignée contrat" value={trustPassport?.contractLineage || 'N/A'} good={Boolean(trustPassport)} />
          <Metric label="Trust anchor" value={serverTrustAnchorPolicy.productionKeySetProvisioned ? 'PROVISIONNÉ' : 'CONTRACT ONLY'} good={!serverTrustAnchorPolicy.productionKeySetProvisioned} />
          <Metric label="Verifier device" value={deviceAttestationPolicy.productionVerifierProvisioned ? 'PROVISIONNÉ' : 'NON PROVISIONNÉ'} good={!deviceAttestationPolicy.productionVerifierProvisioned} />
          <Metric label="Ledger / temps serveur" value={serverLedgerAnchorPolicy.serverReplayLedgerProvisioned || serverLedgerAnchorPolicy.trustedServerClockProvisioned ? 'PROVISIONNÉS' : 'NON PROVISIONNÉS'} good={!serverLedgerAnchorPolicy.serverReplayLedgerProvisioned && !serverLedgerAnchorPolicy.trustedServerClockProvisioned} />
          <Metric label="Release production" value={releaseReadinessPolicy.productionReleaseClaim ? 'ON' : 'OFF'} good={!releaseReadinessPolicy.productionReleaseClaim} />
          <Metric label="Réseau / paiement" value="OFF / OFF" good />
          <Metric label="Portée" value="READINESS · DRY-RUN ONLY" good />
        </View>

                <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport external-trust v2 · staging HSM P-256 · R13.8G</Text>
          <Metric label="Intégrité" value={externalTrustPassport ? (externalTrustPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(externalTrustPassport && externalTrustPassportValid)} />
          <Metric label="Preuve" value={externalTrustPassport?.proof || 'À ÉMETTRE'} good={Boolean(externalTrustPassport)} />
          <Metric label="Parent trust anchor" value={externalTrustPassport?.parentTrustProof || 'N/A'} good={Boolean(externalTrustPassport)} />
          <Metric label="Lignée parent" value={externalTrustPassport?.boundaryLineage || 'N/A'} good={Boolean(externalTrustPassport)} />
          <Metric label="Lignée contrat" value={externalTrustPassport?.contractLineage || 'N/A'} good={Boolean(externalTrustPassport)} />
          <Metric label="Cérémonie trust" value={trustCeremonyPolicy.stagingHsmP256Provisioned ? 'STAGING HSM P-256' : 'NON LIÉE'} good={trustCeremonyPolicy.stagingHsmP256Provisioned && !trustCeremonyPolicy.productionCeremonyClaim} />
          <Metric label="Racines providers" value={providerTrustRegistryPolicy.appleProviderRootsProvisioned || providerTrustRegistryPolicy.androidProviderRootsProvisioned ? 'PROVISIONNÉES' : 'NON PROVISIONNÉES'} good={!providerTrustRegistryPolicy.appleProviderRootsProvisioned && !providerTrustRegistryPolicy.androidProviderRootsProvisioned} />
          <Metric label="Clé staging" value={`${stagingHsmP256Binding.algorithm} · ${stagingHsmP256Binding.protectionLevel}`} good={stagingHsmP256BindingPolicy.hsmKeyProvisioned && stagingHsmP256BindingPolicy.attestationVerified} />
          <Metric label="Verifier serveur prod" value={serverVerificationProfilePolicy.productionVerifierProvisioned ? 'PROVISIONNÉ' : 'NON PROVISIONNÉ'} good={!serverVerificationProfilePolicy.productionVerifierProvisioned} />
          <Metric label="Racine fabricant" value={stagingHsmP256BindingPolicy.manufacturerRootCurrentTimeValid ? 'VALIDE' : 'EXPIRÉE · EXCEPTION STAGING'} good={!stagingHsmP256BindingPolicy.manufacturerRootCurrentTimeValid && providerRootReviewPolicy.stagingExceptionAccepted} />
          <Metric label="Review provider" value={STAGING_HSM_PROVIDER_REVIEW_CLASSIFICATION} good={providerRootReviewPolicy.stagingExceptionAccepted && providerRootReviewPolicy.productionProviderRootGateOpen} />
          <Metric label="External trust release" value={externalTrustReadinessPolicy.productionReleaseClaim ? 'ON' : 'OFF'} good={!externalTrustReadinessPolicy.productionReleaseClaim} />
          <Metric label="Réseau / paiement / settlement" value="OFF / OFF / OFF" good />
          <Metric label="Portée" value="STAGING/SHADOW · PRODUCTION BLOCKED" good />
        </View>


        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Ratification staging policy · R13.8G</Text>
          <Metric label="Intégrité" value={stagingPolicyPassport ? (stagingPolicyPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(stagingPolicyPassport && stagingPolicyPassportValid)} />
          <Metric label="Preuve" value={stagingPolicyPassport?.proof || 'À ÉMETTRE'} good={Boolean(stagingPolicyPassport)} />
          <Metric label="Parent ETP v2" value={stagingPolicyPassport?.parentExternalTrustProof || 'N/A'} good={Boolean(stagingPolicyPassport)} />
          <Metric label="Provider review" value={stagingPolicyPassport?.providerReviewDigest || 'N/A'} good={Boolean(stagingPolicyPassport)} />
          <Metric label="Clôture device" value={stagingPolicyPassport ? 'COMPOSITE PASS · 344/344 + HSM PANEL' : 'N/A'} good={Boolean(stagingPolicyPassport)} />
          <Metric label="Gate racine production" value={stagingPolicyPassport?.productionProviderRootGateOpen ? 'OPEN · PROD BLOCKED' : 'N/A'} good={Boolean(stagingPolicyPassport?.productionProviderRootGateOpen)} />
          <Metric label="Réseau / paiement / settlement" value="OFF / OFF / OFF" good />
          <Metric label="Portée" value="STAGING POLICY ONLY · NO PROD CLAIM" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Admission production shadow · R13.8H</Text>
          <Metric label="Intégrité" value={productionAdmissionPassport ? (productionAdmissionPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(productionAdmissionPassport && productionAdmissionPassportValid)} />
          <Metric label="Preuve" value={productionAdmissionPassport?.proof || 'À ÉMETTRE'} good={Boolean(productionAdmissionPassport)} />
          <Metric label="Parent STP" value={productionAdmissionPassport?.parentStagingPolicyProof || 'N/A'} good={Boolean(productionAdmissionPassport)} />
          <Metric label="Assessment" value={productionAdmissionPassport?.assessmentDigest || 'N/A'} good={Boolean(productionAdmissionPassport)} />
          <Metric label="Blockers production" value={productionAdmissionPassport ? `${productionAdmissionPassport.blockers.length}/6` : '6/6 requis'} good={Boolean(productionAdmissionPassport && productionAdmissionPassport.blockers.length === 6)} />
          <Metric label="KMS / verifier / roots" value="NON PROVISIONNÉS" good />
          <Metric label="Ledger / trusted clock" value="NON PROVISIONNÉS" good />
          <Metric label="Gate racine production" value="OPEN · PROD INÉLIGIBLE" good />
          <Metric label="Réseau / paiement / settlement" value="OFF / OFF / OFF" good />
          <Metric label="Portée" value="SHADOW ADMISSION ONLY · NO PROD CLAIM" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Blueprint fondations production · R13.8I</Text>
          <Metric label="Intégrité" value={productionFoundationPassport ? (productionFoundationPassportValid ? 'PASS' : 'ERREUR') : 'À ÉMETTRE'} good={Boolean(productionFoundationPassport && productionFoundationPassportValid)} />
          <Metric label="Preuve" value={productionFoundationPassport?.proof || 'À ÉMETTRE'} good={Boolean(productionFoundationPassport)} />
          <Metric label="Parent PAP" value={productionFoundationPassport?.parentProductionAdmissionProof || 'N/A'} good={Boolean(productionFoundationPassport)} />
          <Metric label="Blueprint" value={productionFoundationPassport?.blueprintDigest || 'N/A'} good={Boolean(productionFoundationPassport)} />
          <Metric label="Exigences" value={productionFoundationPassport ? `${productionFoundationPassport.requiredCount}/6` : '6/6 requises'} good={Boolean(productionFoundationPassport && productionFoundationPassport.requiredCount === 6)} />
          <Metric label="Provisionné" value={productionFoundationPassport ? `${productionFoundationPassport.provisionedCount}/6` : '0/6'} good={Boolean(productionFoundationPassport && productionFoundationPassport.provisionedCount === 0)} />
          <Metric label="Autorisation provisioning" value="OFF" good />
          <Metric label="KMS / verifier / roots" value="SPÉCIFIÉS · NON PROVISIONNÉS" good />
          <Metric label="Ledger / trusted clock" value="SPÉCIFIÉS · NON PROVISIONNÉS" good />
          <Metric label="Gate racine production" value="OPEN · CLOSURE NON AUTORISÉE" good />
          <Metric label="Réseau / paiement / settlement" value="OFF / OFF / OFF" good />
          <Metric label="Portée" value="BLUEPRINT ONLY · NO CLOUD MUTATION" good />
        </View>

<View style={styles.notice}><Text style={styles.noticeTitle}>Blueprint scellé · provisioning explicitement refusé</Text><Text style={styles.noticeText}>R13.8I précise les six fondations sans en provisionner une seule. KMS production, verifier serveur, racines App Attest/Play Integrity, replay ledger, trusted clock et fermeture de la gate provider-root restent non satisfaits ; credentials, mutation cloud, allowlist réseau, PSP, KYC/AML, settlement et paiement live restent hors périmètre et OFF.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 50, backgroundColor: colors.ink },
  back: { color: colors.purpleSoft, fontWeight: '800', marginBottom: spacing.xl },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.lg },
  panel: { marginTop: spacing.md, padding: spacing.lg, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 6 },
  panelText: { color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm, fontSize: 12 },
  metric: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', flex: 1 },
  metricValue: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', textAlign: 'right', flex: 1 },
  good: { color: colors.success },
  primary: { marginTop: spacing.md, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: '900', textAlign: 'center' },
  secondary: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.purpleSoft, fontWeight: '900', textAlign: 'center' },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
