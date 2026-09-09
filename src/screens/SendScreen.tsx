import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { createTransferIntent } from '../services/orchidpayApi';
import { paymentSecurityPolicy, validatePaymentDraft } from '../security/paymentPolicy';

export default function SendScreen({ navigate }: { navigate: Navigate }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const preview = async () => {
    const validation = validatePaymentDraft({ recipient, amountText: amount, currency: 'XAF' });
    if (!validation.ok) {
      setValidationMessage(validation.message);
      Alert.alert('Vérification requise', validation.message);
      return;
    }

    setValidationMessage('');
    setBusy(true);
    try {
      const intent = await createTransferIntent();
      Alert.alert(
        'Simulation sécurisée',
        `Destinataire : ${validation.recipient}\nMontant : ${validation.amountDisplay}\nRéférence : ${intent.reference}\n\nAucun mouvement réel ne sera exécuté dans cette version.`,
      );
    } catch {
      Alert.alert('Indisponible', 'La préparation du transfert a échoué. Aucun débit n’a été effectué.');
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
        <Text style={styles.subtitle}>Préparez le transfert. Une validation forte et un intent signé seront exigés avant toute exécution réelle.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Destinataire</Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder="@alias ou téléphone"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={80}
          />
          <Text style={styles.label}>Montant</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0 XAF"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            style={styles.input}
            maxLength={16}
          />
          {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}
          <TouchableOpacity style={[styles.primary, busy && styles.primaryDisabled]} onPress={preview} disabled={busy} activeOpacity={0.85}>
            <Text style={styles.primaryText}>{busy ? 'Préparation…' : 'Continuer'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Exécution live</Text><Text style={styles.policyOff}>{paymentSecurityPolicy.liveExecutionEnabled ? 'ON' : 'OFF'}</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Validation forte</Text><Text style={styles.policyOn}>REQUISE</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Intent serveur signé</Text><Text style={styles.policyOn}>REQUIS</Text>
        </View>

        <View style={styles.guard}><Text style={styles.guardTitle}>Mode sécurisé</Text><Text style={styles.guardText}>L’application n’autorise aucun débit réel tant que les contrats API signés, l’idempotence et l’authentification forte ne sont pas branchés.</Text></View>
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
  validation: { color: colors.warning, fontSize: 12, marginTop: spacing.sm, fontWeight: '700' },
  primary: { backgroundColor: colors.purple, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: spacing.xl },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  policyLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  policyOff: { color: colors.success, fontSize: 11, fontWeight: '900' },
  policyOn: { color: colors.goldSoft, fontSize: 11, fontWeight: '900' },
  guard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
