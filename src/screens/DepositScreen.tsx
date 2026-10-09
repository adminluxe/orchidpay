import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { depositChannels, surfacePolicy } from '../security/surfacePolicy';

export default function DepositScreen({ navigate }: { navigate: Navigate }) {
  const explainChannel = (title: string) => {
    Alert.alert(
      `${title} · non activé`,
      'Cette tranche n’exécute aucun dépôt. Aucun navigateur, PSP, opérateur Mobile Money ni endpoint bancaire n’est appelé.',
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <TouchableOpacity onPress={() => navigate('home')}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>ALIMENTER</Text>
        <Text style={styles.title}>Déposer des fonds</Text>
        <Text style={styles.subtitle}>Les canaux sont visibles pour préparer l’UX, mais restent explicitement non exécutables.</Text>

        <View style={styles.stack}>
          {depositChannels.map((channel, index) => (
            <TouchableOpacity key={channel.id} style={styles.channel} activeOpacity={0.85} onPress={() => explainChannel(channel.title)}>
              <View style={styles.index}><Text style={styles.indexText}>{index + 1}</Text></View>
              <View style={styles.copy}>
                <Text style={styles.channelTitle}>{channel.title}</Text>
                <Text style={styles.channelMeta}>{channel.meta}</Text>
                <Text style={styles.offline}>INACTIF · LOCAL UNIQUEMENT</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.guard}><Text style={styles.guardTitle}>Séparation des responsabilités</Text><Text style={styles.guardText}>Exécution dépôt : {surfacePolicy.depositExecutionEnabled ? 'ON' : 'OFF'}. L’application ne stocke aucune donnée carte brute. Les futurs dépôts devront être délégués à des prestataires tokenisés et à des endpoints signés.</Text></View>
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
  stack: { marginTop: spacing.xl, gap: spacing.md },
  channel: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  index: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#211830' },
  indexText: { color: colors.goldSoft, fontWeight: '900' },
  copy: { flex: 1, marginLeft: spacing.md },
  channelTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  channelMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  offline: { color: colors.warning, fontSize: 9, fontWeight: '900', marginTop: 5, letterSpacing: 0.5 },
  chevron: { color: colors.purpleSoft, fontSize: 26 },
  guard: { marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
