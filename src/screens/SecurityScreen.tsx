import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiConfig, healthCheck } from '../services/orchidpayApi';
import { useSession } from '../security/SessionContext';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';

export default function SecurityScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();
  const [health, setHealth] = React.useState('Non vérifié');

  const runHealth = async () => {
    setHealth('Vérification…');
    try {
      const result = await healthCheck();
      setHealth(`${result.mode.toUpperCase()} · HTTP ${result.status} · ${result.ok ? 'OK' : 'ERREUR'}`);
    } catch {
      setHealth('Indisponible');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('home')} activeOpacity={0.8}>
          <Text style={styles.back}>‹ Accueil</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>CENTRE DE SÉCURITÉ</Text>
        <Text style={styles.title}>Protection OrchidPay</Text>
        <Text style={styles.subtitle}>Un cockpit lisible avant toute activation des opérations live.</Text>

        <View style={styles.grid}>
          <StatusCard label="Session" value={session.status === 'authenticated' ? 'OUVERTE' : 'VERROUILLÉE'} good={session.status === 'authenticated'} />
          <StatusCard label="API" value={apiConfig.mode.toUpperCase()} good={apiConfig.mode === 'mock'} />
          <StatusCard label="Biométrie" value="PENDING" good={false} />
          <StatusCard label="Transferts live" value="OFF" good />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Verrouillage automatique</Text>
          <Text style={styles.panelText}>Après 60 secondes en arrière-plan, la session repasse automatiquement en état verrouillé.</Text>
          <TouchableOpacity style={styles.secondary} onPress={session.lock} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>Verrouiller maintenant</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Santé du canal API</Text>
          <Text style={styles.panelText}>En mode mock, aucune opération monétaire réelle n’est envoyée. Ce test valide uniquement le chemin applicatif.</Text>
          <Text style={styles.health}>{health}</Text>
          <TouchableOpacity style={styles.primary} onPress={runHealth} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Tester le canal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guard}>
          <Text style={styles.guardTitle}>Règle non négociable</Text>
          <Text style={styles.guardText}>Face ID, stockage sécurisé, jetons de session et signatures de paiement seront ajoutés via modules natifs validés avant passage en environnement live.</Text>
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
  statusValue: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  panel: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  panelText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  health: { color: colors.goldSoft, fontWeight: '900', marginTop: spacing.md },
  primary: { marginTop: spacing.md, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: '900' },
  secondary: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.purpleSoft, fontWeight: '900' },
  guard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
