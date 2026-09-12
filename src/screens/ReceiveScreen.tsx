import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { walletSnapshot } from '../data/mock';

export default function ReceiveScreen({ navigate }: { navigate: Navigate }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <TouchableOpacity onPress={() => navigate('home')}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>RECEVOIR</Text>
        <Text style={styles.title}>Votre identifiant OrchidPay</Text>
        <Text style={styles.subtitle}>Partagez cet alias pour préparer une réception de fonds.</Text>

        <View style={styles.qrCard}>
          <View style={styles.qrMock}>
            {Array.from({ length: 49 }).map((_, i) => <View key={i} style={[styles.pixel, i % 3 === 0 || i % 7 === 0 ? styles.pixelOn : null]} />)}
          </View>
          <Text style={styles.alias}>{walletSnapshot.publicAlias}</Text>
          <Text style={styles.account}>{walletSnapshot.maskedAccount}</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Réception mock</Text>
          <Text style={styles.noticeText}>Le QR est volontairement non-exécutable dans cette tranche. Le payload signé sera généré côté backend avant activation.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { flex: 1, padding: spacing.lg, backgroundColor: colors.ink },
  back: { color: colors.purpleSoft, fontWeight: '800', marginBottom: spacing.xl },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
  qrCard: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.xl, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  qrMock: { width: 210, height: 210, backgroundColor: colors.white, padding: 15, borderRadius: radius.md, flexDirection: 'row', flexWrap: 'wrap' },
  pixel: { width: '14.285%', height: '14.285%', backgroundColor: '#FFFFFF' },
  pixelOn: { backgroundColor: '#111111' },
  alias: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: spacing.lg },
  account: { color: colors.textMuted, marginTop: 5 },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.inkSoft, borderWidth: 1, borderColor: colors.panelBorder },
  noticeTitle: { color: colors.purpleSoft, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
