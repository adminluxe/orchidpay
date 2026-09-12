import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { mockTransactions, walletSnapshot } from '../data/mock';

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

export function CardsScreen() {
  const [locked, setLocked] = useState(true);
  return (
    <Page eyebrow="CARTES" title="OrchidPay Black" subtitle="Contrôlez vos moyens de paiement depuis un seul endroit.">
      <View style={styles.virtualCard}>
        <Text style={styles.cardBrand}>ORCHIDPAY</Text>
        <Text style={styles.cardTier}>BLACK · VIRTUAL</Text>
        <Text style={styles.cardNumber}>••••   ••••   ••••   2874</Text>
        <View style={styles.cardFooter}><Text style={styles.cardOwner}>AFRIPAY</Text><Text style={styles.cardState}>{locked ? 'VERROUILLÉE' : 'ACTIVE'}</Text></View>
      </View>
      <View style={styles.rowCard}>
        <View><Text style={styles.rowTitle}>Verrouillage instantané</Text><Text style={styles.rowMeta}>État local de démonstration</Text></View>
        <Switch value={locked} onValueChange={setLocked} trackColor={{ false: colors.panelBorder, true: colors.purple }} />
      </View>
      <View style={styles.notice}><Text style={styles.noticeTitle}>Tokenisation obligatoire</Text><Text style={styles.noticeText}>Aucun PAN, CVV ou secret carte ne sera conservé dans l’application. Le futur portefeuille carte utilisera uniquement des identifiants tokenisés.</Text></View>
    </Page>
  );
}

export function ActivityScreen() {
  return (
    <Page eyebrow="ACTIVITÉ" title="Historique" subtitle="Une vue claire de tous vos mouvements OrchidPay.">
      <View style={styles.listCard}>
        {mockTransactions.map((item, index) => (
          <View key={item.id} style={[styles.txRow, index < mockTransactions.length - 1 && styles.divider]}>
            <View style={styles.txIcon}><Text style={styles.txIconText}>{item.amount.startsWith('+') ? '↓' : '↑'}</Text></View>
            <View style={styles.txCopy}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowMeta}>{item.meta}</Text></View>
            <Text style={[styles.amount, item.tone === 'success' ? styles.success : styles.danger]}>{item.amount}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}

export function ScanScreen() {
  return (
    <Page eyebrow="SCAN" title="Scanner pour payer" subtitle="Le scanner signé sera activé après validation des payloads QR OrchidPay.">
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.tl]} /><View style={[styles.corner, styles.tr]} /><View style={[styles.corner, styles.bl]} /><View style={[styles.corner, styles.br]} />
        <Text style={styles.scanGlyph}>⌁</Text>
        <Text style={styles.scanText}>CAMÉRA NON ACTIVÉE EN V1</Text>
      </View>
      <View style={styles.notice}><Text style={styles.noticeTitle}>Anti-fraude par design</Text><Text style={styles.noticeText}>Un QR ne déclenchera jamais un paiement automatiquement. Il devra être parsé, vérifié, affiché à l’utilisateur puis validé explicitement.</Text></View>
    </Page>
  );
}

export function ProfileScreen() {
  return (
    <Page eyebrow="PROFIL" title={walletSnapshot.accountName} subtitle="Identité, sécurité et préférences de votre compte.">
      <View style={styles.profileHero}><View style={styles.avatar}><Text style={styles.avatarText}>AF</Text></View><View><Text style={styles.rowTitle}>{walletSnapshot.publicAlias}</Text><Text style={styles.rowMeta}>{walletSnapshot.maskedAccount}</Text></View></View>
      <View style={styles.listCard}>
        {['Biométrie & authentification', 'Appareils autorisés', 'Limites & sécurité', 'Documents & conformité', 'Centre d’aide'].map((item, index, arr) => (
          <TouchableOpacity key={item} style={[styles.menuRow, index < arr.length - 1 && styles.divider]} activeOpacity={0.8}>
            <Text style={styles.rowTitle}>{item}</Text><Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.build}>OrchidPay Dev · Runtime 1.0.0</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 28, backgroundColor: colors.ink },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  virtualCard: { height: 210, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: '#120E18', borderWidth: 1, borderColor: '#4B3562', justifyContent: 'space-between' },
  cardBrand: { color: colors.goldSoft, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  cardTier: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4 },
  cardNumber: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardOwner: { color: colors.text, fontWeight: '800' },
  cardState: { color: colors.purpleSoft, fontWeight: '900', fontSize: 10 },
  rowCard: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.panel, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder },
  rowTitle: { color: colors.text, fontWeight: '800', fontSize: 14 },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
  listCard: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder, paddingHorizontal: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  txIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#211830', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  txIconText: { color: colors.goldSoft, fontSize: 18, fontWeight: '800' },
  txCopy: { flex: 1 },
  amount: { fontWeight: '900', fontSize: 12 },
  success: { color: colors.success },
  danger: { color: colors.danger },
  scanFrame: { height: 320, borderRadius: radius.lg, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.panelBorder },
  scanGlyph: { color: colors.purpleSoft, fontSize: 74 },
  scanText: { color: colors.textMuted, fontSize: 10, letterSpacing: 1.4, marginTop: 12, fontWeight: '800' },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: colors.goldSoft },
  tl: { left: 24, top: 24, borderLeftWidth: 3, borderTopWidth: 3 },
  tr: { right: 24, top: 24, borderRightWidth: 3, borderTopWidth: 3 },
  bl: { left: 24, bottom: 24, borderLeftWidth: 3, borderBottomWidth: 3 },
  br: { right: 24, bottom: 24, borderRightWidth: 3, borderBottomWidth: 3 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '900' },
  menuRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevron: { color: colors.purpleSoft, fontSize: 25 },
  build: { color: '#665F70', textAlign: 'center', marginTop: spacing.xl, fontSize: 11 },
});
