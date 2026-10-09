import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrchidMark from '../components/OrchidMark';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { readAuditTrail, type AuditTrailItem } from '../security/auditLedger';

function Page({ eyebrow, title, subtitle, children }: React.PropsWithChildren<{ eyebrow: string; title: string; subtitle: string }>) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function eventLabel(item: AuditTrailItem) {
  if (item.kind.includes('auth')) return 'Authentification';
  if (item.kind.includes('session')) return 'Session';
  if (item.kind.includes('channel')) return 'Protection';
  if (item.kind.includes('transfer')) return 'Action protégée';
  return 'Événement de sécurité';
}

function outcomeLabel(item: AuditTrailItem) {
  if (item.outcome === 'success') return 'VALIDÉ';
  if (item.outcome === 'blocked' || item.outcome === 'rejected') return 'BLOQUÉ';
  if (item.outcome === 'simulated') return 'VÉRIFIÉ';
  return 'OBSERVÉ';
}

export function ActivityScreen() {
  const [trail, setTrail] = React.useState<AuditTrailItem[]>([]);
  const refresh = React.useCallback(async () => setTrail(await readAuditTrail(12)), []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Page eyebrow="ACTIVITÉ" title="Journal de sécurité" subtitle="Événements enregistrés localement sur cet appareil.">
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        <TouchableOpacity onPress={refresh} activeOpacity={0.8}><Text style={styles.sectionLink}>Actualiser</Text></TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {trail.length ? trail.map((item, index) => (
          <View key={String(item.seq) + '-' + String(item.at)} style={[styles.auditRow, index < trail.length - 1 && styles.divider]}>
            <View style={styles.auditCopy}>
              <Text style={styles.rowTitle}>{eventLabel(item)}</Text>
              <Text style={styles.rowMeta}>
                {new Date(item.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.auditState}>{outcomeLabel(item)}</Text>
          </View>
        )) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune activité récente</Text>
            <Text style={styles.emptyText}>Les événements de sécurité utiles apparaîtront ici après utilisation.</Text>
          </View>
        )}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Lecture seule</Text>
        <Text style={styles.noticeText}>Le journal n’affiche ni donnée carte brute ni identifiant de sécurité sensible.</Text>
      </View>
    </Page>
  );
}

export function ProfileScreen({ navigate }: { navigate: Navigate }) {
  const items = [
    { label: 'Authentification & sécurité', onPress: () => navigate('security') },
    { label: 'Cet appareil', onPress: () => navigate('authorized-devices') },
    { label: 'Limites & sécurité', onPress: () => navigate('limits-security') },
    { label: 'Protection des données', onPress: () => navigate('compliance') },
    { label: 'Centre d’aide', onPress: () => navigate('help') },
  ];

  return (
    <Page eyebrow="PROFIL" title="OrchidPay Secure" subtitle="Sécurité, appareil et confidentialité.">
      <View style={styles.profileHero}>
        <OrchidMark size={64} />
        <View style={styles.profileCopy}>
          <Text style={styles.profileTitle}>Espace protégé</Text>
          <Text style={styles.rowMeta}>Sécurité liée à cet appareil</Text>
        </View>
      </View>

      <View style={styles.listCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuRow, index < items.length - 1 && styles.divider]}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <Text style={styles.rowTitle}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.build}>OrchidPay · Protection active</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 30, backgroundColor: colors.ink },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  sectionLink: { color: colors.purpleSoft, fontSize: 11, fontWeight: '900' },
  listCard: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder, paddingHorizontal: spacing.md },
  auditRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center' },
  auditCopy: { flex: 1 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  auditState: { color: colors.goldSoft, fontSize: 10, fontWeight: '900' },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontWeight: '900' },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 6, maxWidth: 280 },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  profileCopy: { flex: 1 },
  profileTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevron: { color: colors.purpleSoft, fontSize: 25 },
  build: { color: '#665F70', textAlign: 'center', marginTop: spacing.xl, fontSize: 11 },
});