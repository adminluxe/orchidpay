import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { walletSnapshot } from '../data/mock';
import { buildReceiveSharePayload, surfacePolicy } from '../security/surfacePolicy';

export default function ReceiveScreen({ navigate }: { navigate: Navigate }) {
  const shareAlias = async () => {
    try {
      await Share.share({ message: buildReceiveSharePayload(walletSnapshot.publicAlias, walletSnapshot.maskedAccount) });
    } catch {
      Alert.alert('Partage indisponible', 'Aucun payload de paiement n’a été créé. Vous pouvez revenir à l’accueil sans risque.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <TouchableOpacity onPress={() => navigate('home')}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>RECEVOIR</Text>
        <Text style={styles.title}>Votre identifiant OrchidPay</Text>
        <Text style={styles.subtitle}>Partagez uniquement votre alias public. Aucun montant ni ordre de paiement n’est encodé dans cette tranche.</Text>

        <View style={styles.qrCard}>
          <View style={styles.qrMock}>
            {Array.from({ length: 49 }).map((_, i) => <View key={i} style={[styles.pixel, i % 3 === 0 || i % 7 === 0 ? styles.pixelOn : null]} />)}
          </View>
          <Text style={styles.alias}>{walletSnapshot.publicAlias}</Text>
          <Text style={styles.account}>{walletSnapshot.maskedAccount}</Text>
          <Text style={styles.qrState}>APERÇU VISUEL · NON EXÉCUTABLE</Text>
        </View>

        <TouchableOpacity style={styles.primary} onPress={shareAlias} activeOpacity={0.85}>
          <Text style={styles.primaryText}>Partager l’alias public</Text>
        </TouchableOpacity>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Réception fail-closed</Text>
          <Text style={styles.noticeText}>Le QR reste volontairement non exécutable ({surfacePolicy.receiveQrExecutable ? 'ON' : 'OFF'}). Le partage iOS contient seulement l’alias et le compte masqué, sans URL, montant ni instruction de débit.</Text>
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
  qrState: { color: colors.warning, fontSize: 10, fontWeight: '900', marginTop: spacing.sm, letterSpacing: 0.7 },
  primary: { marginTop: spacing.lg, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 15 },
  primaryText: { color: colors.white, fontWeight: '900' },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.inkSoft, borderWidth: 1, borderColor: colors.panelBorder },
  noticeTitle: { color: colors.purpleSoft, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
