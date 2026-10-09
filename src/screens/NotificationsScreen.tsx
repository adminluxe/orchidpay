import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { readAuditSummary, type AuditSummary } from '../security/auditLedger';
import { readDeviceGatePassport, type DeviceGateSnapshot } from '../security/deviceGatePassport';

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, good && styles.good]}>{value}</Text>
    </View>
  );
}

export default function NotificationsScreen({ navigate }: { navigate: Navigate }) {
  const [audit, setAudit] = React.useState<AuditSummary | null>(null);
  const [gate, setGate] = React.useState<DeviceGateSnapshot | null>(null);

  const refresh = React.useCallback(async () => {
    const [nextAudit, nextGate] = await Promise.all([
      readAuditSummary(),
      readDeviceGatePassport(),
    ]);
    setAudit(nextAudit);
    setGate(nextGate);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const deviceReady = Boolean(gate?.valid && gate.signalsPassed === 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('home')} activeOpacity={0.8}>
          <Text style={styles.back}>‹ Accueil</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>CENTRE SÉCURITÉ</Text>
        <Text style={styles.title}>Protection & appareil</Text>
        <Text style={styles.subtitle}>Vue d’ensemble des protections actives sur cet appareil.</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>État de protection</Text>
          <Metric label="Journal sécurisé" value={audit?.valid ? 'INTÈGRE' : 'À VÉRIFIER'} good={Boolean(audit?.valid)} />
          <Metric label="Vérifications appareil" value={deviceReady ? 'COMPLÈTES' : 'À FINALISER'} good={deviceReady} />
        </View>

        <TouchableOpacity style={styles.primary} onPress={() => navigate('security')} activeOpacity={0.85}>
          <Text style={styles.primaryText}>Ouvrir la sécurité</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => navigate('compliance')} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Protection des données</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={refresh} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Actualiser</Text>
        </TouchableOpacity>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Sécurité par défaut</Text>
          <Text style={styles.noticeText}>Ce centre présente uniquement l’état de protection de l’appareil.</Text>
        </View>
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
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginBottom: 4 },
  metric: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', flex: 1 },
  metricValue: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', textAlign: 'right', flex: 1 },
  good: { color: colors.success },
  primary: { marginTop: spacing.lg, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: '900' },
  secondary: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.purpleSoft, fontWeight: '900' },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});