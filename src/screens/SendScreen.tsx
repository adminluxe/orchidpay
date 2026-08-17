import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { createTransferIntent } from '../services/orchidpayApi';

export default function SendScreen({ navigate }: { navigate: Navigate }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    if (!recipient.trim() || !amount.trim()) {
      Alert.alert('Informations manquantes', 'Ajoutez un destinataire et un montant.');
      return;
    }
    setBusy(true);
    try {
      const intent = await createTransferIntent();
      Alert.alert(
        'Simulation sécurisée',
        `Référence ${intent.reference}\n\nAucun mouvement réel ne sera exécuté dans cette version.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <TouchableOpacity onPress={() => navigate('home')}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>TRANSFERT</Text>
        <Text style={styles.title}>Envoyer de l’argent</Text>
        <Text style={styles.subtitle}>Préparez le transfert. La validation forte arrivera avant toute exécution réelle.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Destinataire</Text>
          <TextInput value={recipient} onChangeText={setRecipient} placeholder="@alias ou téléphone" placeholderTextColor={colors.textMuted} style={styles.input} autoCapitalize="none" />
          <Text style={styles.label}>Montant</Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="0 XAF" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
          <TouchableOpacity style={styles.primary} onPress={preview} disabled={busy} activeOpacity={0.85}>
            <Text style={styles.primaryText}>{busy ? 'Préparation…' : 'Continuer'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guard}><Text style={styles.guardTitle}>Mode sécurisé</Text><Text style={styles.guardText}>Cette interface est en mode mock. Aucun débit réseau n’est autorisé tant que le contrat API signé n’est pas branché.</Text></View>
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
  card: { marginTop: spacing.xl, backgroundColor: colors.panel, borderColor: colors.panelBorder, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { color: colors.text, backgroundColor: colors.inkSoft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder, paddingHorizontal: spacing.md, height: 52, fontSize: 16 },
  primary: { backgroundColor: colors.purple, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.xl },
  primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 },
  guard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
