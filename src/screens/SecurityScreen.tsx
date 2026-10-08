import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { readAuditSummary, type AuditSummary } from '../security/auditLedger';
import { useSession } from '../security/SessionContext';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';

function lockReasonLabel(reason: 'startup' | 'manual' | 'background-timeout') {
  if (reason === 'background-timeout') return 'VERROUILLAGE AUTOMATIQUE';
  if (reason === 'manual') return 'VERROUILLAGE MANUEL';
  return 'OUVERTURE DE SESSION';
}

export default function SecurityScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();
  const [audit, setAudit] = React.useState<AuditSummary | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      await session.refreshNativeSecurity();
      setAudit(await readAuditSummary());
    } finally {
      setBusy(false);
    }
  }, [session.refreshNativeSecurity]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const testBiometry = async () => {
    const ok = await session.requireStrongAuth('Vérifier la protection biométrique OrchidPay');
    Alert.alert(
      ok ? 'Biométrie validée' : 'Validation non confirmée',
      ok ? 'La protection biométrique native répond correctement.' : session.securityError || 'Le contrôle n’a pas été validé.',
    );
    await refresh();
  };

  const backgroundSeconds = Math.round(session.lastBackgroundDurationMs / 1000);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('profile')} activeOpacity={0.8}>
          <Text style={styles.back}>‹ Profil</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>CENTRE DE SÉCURITÉ</Text>
        <Text style={styles.title}>Protection OrchidPay</Text>
        <Text style={styles.subtitle}>Les contrôles essentiels de cet appareil, présentés sans données sensibles.</Text>

        <View style={styles.grid}>
          <StatusCard label="Session" value={session.status === 'authenticated' ? 'OUVERTE' : 'VERROUILLÉE'} good={session.status === 'authenticated'} />
          <StatusCard label="Stockage sécurisé" value={session.secureStoreAvailable ? 'ACTIF' : 'INDISPONIBLE'} good={session.secureStoreAvailable} />
          <StatusCard label="Biométrie" value={session.biometricState === 'ready' ? 'PRÊTE' : 'À VÉRIFIER'} good={session.biometricState === 'ready'} />
          <StatusCard label="Appareil" value={session.deviceBindingReady ? 'LIÉ' : 'À INITIALISER'} good={session.deviceBindingReady} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Validation biométrique</Text>
          <Text style={styles.panelText}>Les actions sensibles nécessitent une validation biométrique forte sur cet appareil.</Text>
          <TouchableOpacity style={styles.primary} onPress={testBiometry} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Vérifier la biométrie</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Journal de sécurité</Text>
          <EvidenceRow label="Intégrité" value={audit?.valid ? 'VÉRIFIÉE' : 'À VÉRIFIER'} />
          <EvidenceRow label="Événements protégés" value={String(audit?.entries ?? 0)} />
          <EvidenceRow label="Dernier verrouillage" value={lockReasonLabel(session.lastLockReason)} />
          <Text style={styles.panelText}>Les références techniques restent pseudonymisées et les identifiants de sécurité bruts ne sont pas affichés.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Verrouillage automatique</Text>
          <Text style={styles.panelText}>
            Après 60 secondes en arrière-plan, la session est automatiquement verrouillée.
            {backgroundSeconds > 0 ? ' Dernière durée observée : ' + backgroundSeconds + ' s.' : ''}
          </Text>
          <TouchableOpacity style={styles.secondary} onPress={session.lock} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>Verrouiller maintenant</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Confidentialité par défaut</Text>
          <Text style={styles.panelText}>OrchidPay ne stocke pas de PAN ni de CVV bruts. Les contrôles sensibles restent liés à l’appareil et au stockage sécurisé.</Text>
        </View>

        <TouchableOpacity style={styles.secondary} onPress={refresh} disabled={busy} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>{busy ? 'Actualisation…' : 'Actualiser la protection'}</Text>
        </TouchableOpacity>

        <View style={styles.guard}>
          <Text style={styles.guardTitle}>Protection active</Text>
          <Text style={styles.guardText}>La sécurité locale, la biométrie et le verrouillage automatique restent actifs avant toute action sensible.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <View style={styles.statusCard}>
      <View style={[styles.dot, good ? styles.dotGood : styles.dotWarn]} />
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.evidenceRow}>
      <Text style={styles.evidenceLabel}>{label}</Text>
      <Text style={styles.evidenceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 44, backgroundColor: colors.ink },
  back: { color: colors.purpleSoft, fontWeight: '800', marginBottom: spacing.xl },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusCard: { width: '48%', minHeight: 112, padding: spacing.md, backgroundColor: colors.panel, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.md },
  dotGood: { backgroundColor: colors.success },
  dotWarn: { backgroundColor: colors.warning },
  statusLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  statusValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 5 },
  panel: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  panelText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  primary: { marginTop: spacing.md, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: '900' },
  secondary: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.purpleSoft, fontWeight: '900' },
  evidenceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  evidenceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', flex: 1 },
  evidenceValue: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', textAlign: 'right', flex: 1 },
  guard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});