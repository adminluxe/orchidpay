import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrchidMark from '../components/OrchidMark';
import { colors, radius, spacing } from '../theme';
import { useSession } from './SessionContext';

export default function LockScreen() {
  const session = useSession();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await session.unlock();
    } finally {
      setBusy(false);
    }
  };

  const stateLabel = (() => {
    switch (session.biometricState) {
      case 'checking': return 'Vérification du dispositif…';
      case 'ready': return session.biometricTypes.includes('FACE') ? 'Face ID prêt' : 'Biométrie forte prête';
      case 'not-enrolled': return 'Biométrie non configurée';
      case 'unavailable': return 'Biométrie forte indisponible';
      case 'error': return 'Contrôle natif en erreur';
    }
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <OrchidMark size={72} />
          <Text style={styles.brand}>OrchidPay</Text>
          <Text style={styles.title}>Session verrouillée</Text>
          <Text style={styles.subtitle}>
            L’accès à OrchidPay nécessite une validation biométrique forte sur cet appareil.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badge}><Text style={styles.badgeText}>PROTECTION LOCALE</Text></View>
          <Text style={styles.cardTitle}>{stateLabel}</Text>
          <Text style={styles.cardText}>
            Stockage sécurisé : {session.secureStoreAvailable ? 'disponible' : 'indisponible'} · liaison appareil : {session.deviceBindingReady ? 'active' : 'à initialiser'}.
          </Text>
          {session.securityError ? <Text style={styles.error}>{session.securityError}</Text> : null}
          <TouchableOpacity
            style={[styles.primary, (busy || session.biometricState !== 'ready') && styles.disabled]}
            onPress={unlock}
            disabled={busy || session.biometricState !== 'ready'}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{busy ? 'Validation…' : 'Déverrouiller avec la biométrie'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refresh} onPress={session.refreshNativeSecurity} activeOpacity={0.8}>
            <Text style={styles.refreshText}>Recontrôler l’appareil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { flex: 1, justifyContent: 'space-between', padding: spacing.lg, backgroundColor: colors.ink },
  hero: { alignItems: 'center', marginTop: 55 },
  brand: { color: colors.goldSoft, fontWeight: '900', letterSpacing: 1.3, marginTop: spacing.md },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: spacing.lg, textAlign: 'center' },
  subtitle: { color: colors.textMuted, lineHeight: 21, textAlign: 'center', marginTop: spacing.sm, maxWidth: 340 },
  card: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder, padding: spacing.lg, marginBottom: spacing.xl },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(102,208,139,0.12)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  badgeText: { color: colors.success, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 17, marginTop: spacing.md },
  cardText: { color: colors.textMuted, lineHeight: 19, fontSize: 12, marginTop: spacing.sm },
  error: { color: colors.warning, fontSize: 12, fontWeight: '800', marginTop: spacing.md },
  primary: { backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 16, marginTop: spacing.lg },
  disabled: { opacity: 0.45 },
  primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 },
  refresh: { alignItems: 'center', paddingVertical: 13, marginTop: 6 },
  refreshText: { color: colors.purpleSoft, fontWeight: '800', fontSize: 12 },
});
