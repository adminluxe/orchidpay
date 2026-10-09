import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrchidMark from '../components/OrchidMark';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';

const actions = [
  { label: 'Sécurité', detail: 'Protection de l’appareil', symbol: '◈', route: 'security' as const },
  { label: 'Vérifier un QR', detail: 'Lecture sans action automatique', symbol: '⌁', route: 'scan' as const },
  { label: 'Activité', detail: 'Journal de sécurité local', symbol: '↺', route: 'activity' as const },
  { label: 'Aide', detail: 'Réglages & confidentialité', symbol: '?', route: 'help' as const },
];

export default function HomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <OrchidMark size={44} />
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>OrchidPay</Text>
              <Text style={styles.brandTagline}>PAY. SECURE. GROW.</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.82}
              onPress={() => navigate('notifications')}
              accessibilityLabel="Centre de sécurité"
            >
              <Text style={styles.iconButtonText}>◌</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.82}
              onPress={() => navigate('profile')}
              accessibilityLabel="Profil"
            >
              <Text style={styles.iconButtonText}>◎</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>ESPACE PRIVÉ · PROTÉGÉ</Text>
          <Text style={styles.heroTitle}>Votre espace OrchidPay, <Text style={styles.heroAccent}>sécurisé par design.</Text></Text>
          <Text style={styles.heroText}>
            Biométrie forte, stockage sécurisé et verrouillage automatique protègent les actions sensibles sur cet appareil.
          </Text>

          <View style={styles.statusRail}>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>VAULT</Text>
              <Text style={styles.statusValue}>PROTÉGÉ</Text>
            </View>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>BIOMÉTRIE</Text>
              <Text style={styles.statusValue}>FORTE</Text>
            </View>
            <View style={styles.statusCell}>
              <Text style={styles.statusLabel}>CONFIRMATION</Text>
              <Text style={styles.statusValue}>RENFORCÉE</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.sectionEyebrow}>ACCÈS RAPIDES</Text>
            <Text style={styles.sectionTitle}>Votre contrôle</Text>
          </View>
          <Text style={styles.sectionCount}>4 espaces</Text>
        </View>

        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.action}
              activeOpacity={0.84}
              onPress={() => navigate(action.route)}
            >
              <View style={styles.actionIcon}><Text style={styles.actionSymbol}>{action.symbol}</Text></View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.note}>
          <View style={styles.noteHead}>
            <Text style={styles.noteEyebrow}>SÉCURITÉ</Text>
            <Text style={styles.noteState}>ACTIVE</Text>
          </View>
          <Text style={styles.noteTitle}>La confirmation forte reste souveraine.</Text>
          <Text style={styles.noteText}>
            OrchidPay ne déclenche aucune opération financière automatiquement. Les fonctions dépendant de services externes restent séparées de cette expérience de protection.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandCopy: { marginLeft: spacing.sm },
  brandName: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.35 },
  brandTagline: { color: colors.textMuted, marginTop: 2, fontSize: 9, letterSpacing: 1.5 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelBorder, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { color: colors.text, fontSize: 18 },
  notificationDot: { position: 'absolute', right: 7, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  hero: { overflow: 'hidden', marginTop: spacing.xl, backgroundColor: colors.panelElevated, borderRadius: radius.lg, borderWidth: 1, borderColor: '#3B2556', padding: spacing.lg },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(138,63,252,0.20)', right: -68, top: -98 },
  heroGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(240,185,11,0.07)', left: -54, bottom: -68 },
  heroEyebrow: { color: colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  heroTitle: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.05, marginTop: spacing.md },
  heroAccent: { color: colors.purpleSoft },
  heroText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: spacing.md, maxWidth: 330 },
  statusRail: { flexDirection: 'row', marginTop: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, paddingTop: spacing.md },
  statusCell: { flex: 1 },
  statusLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  statusValue: { color: colors.success, fontSize: 10, fontWeight: '900', marginTop: 4 },
  sectionHead: { marginTop: spacing.xl, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionEyebrow: { color: colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  sectionCount: { color: colors.textMuted, fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { width: '48%', minHeight: 132, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder, backgroundColor: colors.panel, padding: spacing.md },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(138,63,252,0.17)' },
  actionSymbol: { color: colors.purpleSoft, fontSize: 19, fontWeight: '900' },
  actionLabel: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: spacing.sm },
  actionDetail: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  note: { marginTop: spacing.xl, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteEyebrow: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  noteState: { color: colors.success, fontSize: 9, fontWeight: '900' },
  noteTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: spacing.sm },
  noteText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
});