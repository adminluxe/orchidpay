import React from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import type { EngineeringNavigate } from '../types';
import { buildRedactedIntegrationSnapshot, evaluateBackendReadiness, type BackendReadiness } from '../security/backendBoundary';
import { runBackendBoundarySuite, type BackendBoundarySuiteResult } from '../security/backendBoundarySuite';
import { issueIntegrationBoundaryPassport, readIntegrationBoundaryPassport, type IntegrationBoundaryPassport } from '../security/integrationBoundaryPassport';
import { readLocalReleasePassport } from '../security/releasePassport';

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, good && styles.good]}>{value}</Text></View>;
}

export default function IntegrationReadinessScreen({ navigate }: { navigate: EngineeringNavigate }) {
  const [readiness, setReadiness] = React.useState<BackendReadiness>(() => evaluateBackendReadiness());
  const [suite, setSuite] = React.useState<BackendBoundarySuiteResult | null>(null);
  const [passport, setPassport] = React.useState<IntegrationBoundaryPassport | null>(null);
  const [passportValid, setPassportValid] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setReadiness(evaluateBackendReadiness());
    const stored = await readIntegrationBoundaryPassport();
    setPassport(stored.passport);
    setPassportValid(stored.valid);
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const runLab = async () => {
    setBusy(true);
    try {
      const result = await runBackendBoundarySuite();
      const boundary = evaluateBackendReadiness();
      const rc = await readLocalReleasePassport();
      setSuite(result);
      setReadiness(boundary);
      if (!result.allPass || result.passed !== 40 || result.total !== 40) {
        Alert.alert('Frontière backend à revoir', `${result.passed}/${result.total} contrôles. Aucun live n’a été activé.`);
        return;
      }
      if (!rc.valid || !rc.passport) {
        Alert.alert('RC local requis', 'Le passeport R12.8 RP-… doit rester valide avant d’émettre la frontière d’intégration.');
        return;
      }
      const issued = await issueIntegrationBoundaryPassport(boundary, rc.passport.proof, result.passed, result.total);
      await refresh();
      Alert.alert(
        issued.ok ? 'R12.9 · Frontière intégration scellée' : 'Frontière non émise',
        issued.ok ? `${issued.passport.proof} · 40/40 · live toujours BLOCKED · aucun secret.` : issued.reason,
      );
    } catch {
      Alert.alert('Contrôle arrêté', 'Le lab backend s’est fermé en mode fail-closed.');
    } finally { setBusy(false); }
  };

  const shareSnapshot = async () => {
    const rc = await readLocalReleasePassport();
    const text = buildRedactedIntegrationSnapshot(rc.passport?.proof || 'RP-NOT-PROVIDED');
    await Share.share({ message: text, title: 'OrchidPay · Integration Boundary' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('profile')}><Text style={styles.back}>‹ Profil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>PRÉPARATION BACKEND & LIVE</Text>
        <Text style={styles.title}>Frontière d’intégration</Text>
        <Text style={styles.subtitle}>Ce cockpit ne connecte aucun PSP, banque, KYC/AML ou endpoint live. Il prouve au contraire que l’application reste bloquée tant que les dépendances externes et la vérification cryptographique serveur ne sont pas provisionnées.</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>État live</Text>
          <Metric label="Statut" value="BLOCKED" good />
          <Metric label="Live ready" value="NON" good />
          <Metric label="Blockers externes" value={`${readiness.blockers.length}`} good={readiness.blockers.length === 8} />
          <Metric label="Allowlist hosts live" value="VIDE" good />
          <Metric label="Clé serveur" value="NON PROVISIONNÉE" good />
          <Metric label="Vérif. signature" value="NON PROVISIONNÉE" good />
          <Metric label="KYC / AML" value="NON PROVISIONNÉ" good />
          <Metric label="PSP tokenisé" value="NON PROVISIONNÉ" good />
          <Metric label="Connecteurs dépôt" value="NON PROVISIONNÉS" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Suite de frontière · R12.9</Text>
          <Text style={styles.panelText}>Réutilise les 32 contrôles R12.8 et ajoute 8 tests de frontière backend : fusible live, allowlist vide, HTTPS-only, signature serveur non usurpable, expiration et redaction.</Text>
          <Metric label="Résultat" value={suite ? `${suite.passed}/${suite.total}` : 'NON LANCÉ'} good={suite?.allPass} />
          <TouchableOpacity style={styles.primary} disabled={busy} onPress={runLab} activeOpacity={0.85}><Text style={styles.primaryText}>{busy ? 'Contrôles…' : 'Lancer 40/40 + sceller la frontière'}</Text></TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Passeport frontière local</Text>
          <Metric label="Intégrité" value={passportValid ? 'PASS' : 'ERREUR'} good={passportValid} />
          <Metric label="Preuve" value={passport?.proof || 'À ÉMETTRE'} good={Boolean(passport)} />
          <Metric label="Live ready" value={passport ? 'FALSE' : 'N/A'} good={Boolean(passport)} />
          <Metric label="Signature serveur" value="NON · LOCALE UNIQUEMENT" good />
          <TouchableOpacity style={styles.secondary} onPress={shareSnapshot} activeOpacity={0.85}><Text style={styles.secondaryText}>Partager snapshot expurgé</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => navigate('backend-contract-lab')} activeOpacity={0.85}><Text style={styles.secondaryText}>Ouvrir le lab contrats R13.0</Text></TouchableOpacity>
        </View>

        <View style={styles.notice}><Text style={styles.noticeTitle}>Passage au backend</Text><Text style={styles.noticeText}>La prochaine phase live exigera des contrats API réels, une allowlist explicite, une clé publique de vérification, un KYC/AML, un PSP tokenisé, les connecteurs de dépôt et les validations juridiques. Aucun de ces éléments n’est inventé ni activé ici.</Text></View>
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
  secondaryText: { color: colors.purpleSoft, fontWeight: '900' },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
