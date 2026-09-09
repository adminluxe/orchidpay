import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OrchidMark from '../components/OrchidMark';
import { colors, radius, spacing } from '../theme';
import { useSession } from './SessionContext';

export default function LockScreen() {
  const session = useSession();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <OrchidMark size={68} />
          <Text style={styles.brand}>OrchidPay</Text>
          <Text style={styles.title}>Session verrouillée</Text>
          <Text style={styles.subtitle}>
            Les données sensibles restent masquées tant que l’identité n’a pas été revalidée.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badge}><Text style={styles.badgeText}>DEV SECURITY GATE</Text></View>
          <Text style={styles.cardTitle}>Face ID sera branché au prochain build natif.</Text>
          <Text style={styles.cardText}>
            Pour cette tranche JavaScript, le bouton ci-dessous simule uniquement le succès de la validation locale. Aucun secret ni jeton n’est stocké ici.
          </Text>
          <TouchableOpacity style={styles.primary} onPress={session.unlockDemo} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Déverrouiller la démo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { flex: 1, justifyContent: 'space-between', padding: spacing.lg, backgroundColor: colors.ink },
  hero: { alignItems: 'center', marginTop: 74 },
  brand: { color: colors.goldSoft, fontWeight: '900', letterSpacing: 1.3, marginTop: spacing.md },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: spacing.lg, textAlign: 'center' },
  subtitle: { color: colors.textMuted, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm, maxWidth: 340 },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder, padding: spacing.lg, marginBottom: spacing.xl },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(102,208,139,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  badgeText: { color: colors.success, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 17, marginTop: spacing.md },
  cardText: { color: colors.textMuted, lineHeight: 19, fontSize: 12, marginTop: spacing.sm },
  primary: { backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 16, marginTop: spacing.lg },
  primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 },
});
