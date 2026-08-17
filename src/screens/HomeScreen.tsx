import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import OrchidMark from '../components/OrchidMark';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { mockTransactions, walletSnapshot } from '../data/mock';

const actions = [
  { label: 'Envoyer', symbol: '↗', route: 'send' as const },
  { label: 'Recevoir', symbol: '↙', route: 'receive' as const },
  { label: 'Déposer', symbol: '+', route: 'deposit' as const },
];

export default function HomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <OrchidMark size={42} />
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>OrchidPay</Text>
              <Text style={styles.brandTagline}>Pay. Secure. Grow.</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}><Text style={styles.iconButtonText}>◌</Text><View style={styles.notificationDot} /></TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => navigate('profile')}><Text style={styles.iconButtonText}>◎</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Bonjour, {walletSnapshot.accountName}</Text>
          <Text style={styles.greetingAccent}>Votre argent. Votre rythme.</Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceGlowTop} />
          <View style={styles.balanceGlowBottom} />
          <View style={styles.balanceHeader}><Text style={styles.balanceLabel}>Solde disponible</Text><Text style={styles.balanceEye}>◉</Text></View>
          <Text style={styles.balanceValue}>{walletSnapshot.balance}</Text>
          <Text style={styles.balanceFiat}>{walletSnapshot.fiat}</Text>
          <View style={styles.actionRow}>
            {actions.map((action) => (
              <TouchableOpacity key={action.label} style={styles.actionButton} activeOpacity={0.85} onPress={() => navigate(action.route)}>
                <View style={styles.actionSymbolWrap}><Text style={styles.actionSymbol}>{action.symbol}</Text></View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigate('activity')}><Text style={styles.sectionLink}>Tout voir</Text></TouchableOpacity>
        </View>

        <View style={styles.transactionCard}>
          {mockTransactions.map((item, index) => (
            <View key={item.id} style={[styles.transactionRow, index < mockTransactions.length - 1 && styles.transactionDivider]}>
              <View style={styles.transactionIcon}><Text style={styles.transactionIconText}>{item.amount.startsWith('+') ? '↓' : '↑'}</Text></View>
              <View style={styles.transactionCopy}><Text style={styles.transactionTitle}>{item.title}</Text><Text style={styles.transactionMeta}>{item.meta}</Text></View>
              <Text style={[styles.transactionAmount, item.tone === 'success' ? styles.amountSuccess : styles.amountDanger]}>{item.amount}</Text>
            </View>
          ))}
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightBadge}><Text style={styles.insightBadgeText}>Sécurité</Text></View>
          <Text style={styles.insightTitle}>Votre portefeuille est protégé.</Text>
          <Text style={styles.insightText}>Les mouvements sensibles demanderont toujours une validation forte avant exécution.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandCopy: { marginLeft: spacing.sm },
  brandName: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  brandTagline: { color: colors.textMuted, marginTop: 1, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.panelBorder, alignItems: 'center', justifyContent: 'center' },
  iconButtonText: { color: colors.text, fontSize: 18 },
  notificationDot: { position: 'absolute', right: 7, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  greetingBlock: { marginTop: spacing.xl, marginBottom: spacing.lg },
  greeting: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.9 },
  greetingAccent: { color: colors.purpleSoft, fontSize: 13, marginTop: 5, fontWeight: '600' },
  balanceCard: { overflow: 'hidden', backgroundColor: colors.panelElevated, borderWidth: 1, borderColor: '#35214E', borderRadius: radius.lg, padding: spacing.lg },
  balanceGlowTop: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(138,63,252,0.20)', right: -60, top: -100 },
  balanceGlowBottom: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(240,185,11,0.08)', left: -70, bottom: -100 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  balanceEye: { color: colors.textMuted },
  balanceValue: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: spacing.sm },
  balanceFiat: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  actionButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, alignItems: 'center', paddingVertical: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionSymbolWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(138,63,252,0.22)', marginBottom: spacing.xs },
  actionSymbol: { color: colors.purpleSoft, fontSize: 21, fontWeight: '700' },
  actionLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  sectionLink: { color: colors.purpleSoft, fontSize: 12, fontWeight: '700' },
  transactionCard: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder, paddingHorizontal: spacing.md },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  transactionDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  transactionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#211830', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  transactionIconText: { color: colors.goldSoft, fontSize: 18, fontWeight: '800' },
  transactionCopy: { flex: 1 },
  transactionTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  transactionMeta: { color: colors.textMuted, marginTop: 3, fontSize: 11 },
  transactionAmount: { fontSize: 13, fontWeight: '800' },
  amountSuccess: { color: colors.success },
  amountDanger: { color: colors.danger },
  insightCard: { marginTop: spacing.xl, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  insightBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(102,208,139,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5, marginBottom: spacing.sm },
  insightBadgeText: { color: colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  insightTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  insightText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
