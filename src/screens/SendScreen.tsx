import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';
import { createTransferIntent } from '../services/orchidpayApi';
import { appendAuditEvent } from '../security/auditLedger';
import { inspectTransferIntent } from '../security/intentFirewall';
import { getDeviceBindingFingerprint } from '../security/nativeSecurity';
import { paymentSecurityPolicy, validatePaymentDraft } from '../security/paymentPolicy';
import { useSession } from '../security/SessionContext';

type SimulationReceipt = {
  recipient: string;
  amount: string;
  reference: string;
  idempotencyPrefix: string;
  firewall: string;
  expiresAt: number;
};

export default function SendScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [lastGate, setLastGate] = useState('AUCUNE TENTATIVE');
  const [preAuthBlockCount, setPreAuthBlockCount] = useState(0);
  const [lastPreAuthBlock, setLastPreAuthBlock] = useState('AUCUN');
  const [lastSimulation, setLastSimulation] = useState<SimulationReceipt | null>(null);

  const preview = async () => {
    const validation = validatePaymentDraft({ recipient, amountText: amount, currency: 'XAF' });
    if (!validation.ok) {
      setValidationMessage(validation.message);
      const block = `BLOCKED_BEFORE_BIOMETRY · ${validation.code.toUpperCase()}`;
      setLastGate(block);
      setLastPreAuthBlock(block);
      setPreAuthBlockCount((count) => count + 1);
      await appendAuditEvent('transfer-draft', 'blocked', validation.code.toUpperCase(), 'PREAUTH').catch(() => null);
      Alert.alert('Vérification requise', validation.message);
      return;
    }

    setValidationMessage('');
    setLastGate('DRAFT_OK · AWAITING_STRONG_AUTH');
    setBusy(true);

    try {
      const strongAuth = await session.requireStrongAuth(
        `Confirmer ${validation.amountDisplay} pour ${validation.recipient}`,
      );

      if (!strongAuth) {
        setLastGate('STRONG_AUTH_REJECTED · NO_INTENT');
        await appendAuditEvent('transfer-intent', 'blocked', 'AUTH_REJECTED', 'NO_INTENT').catch(() => null);
        Alert.alert(
          'Validation forte requise',
          session.securityError || 'La biométrie forte n’a pas été validée. Aucun débit n’a été effectué.',
        );
        return;
      }

      const deviceFingerprint = session.deviceBindingFingerprint || await getDeviceBindingFingerprint();
      if (!deviceFingerprint) {
        setLastGate('DEVICE_BINDING_REQUIRED · NO_INTENT');
        await appendAuditEvent('transfer-intent', 'blocked', 'DEVICE_BINDING_REQUIRED', 'NO_INTENT').catch(() => null);
        Alert.alert('Liaison appareil requise', 'Aucun intent ne peut être préparé sans binding SecureStore actif.');
        return;
      }

      const intent = await createTransferIntent({
        recipient: validation.recipient,
        amountMinor: validation.amountMinor,
        currency: 'XAF',
        deviceFingerprint,
      });
      const firewall = inspectTransferIntent(intent, deviceFingerprint);
      if (!firewall.ok) {
        setLastGate(`INTENT_FIREWALL_REJECTED · ${firewall.code}`);
        await appendAuditEvent('transfer-intent', 'blocked', firewall.code, intent.reference).catch(() => null);
        Alert.alert('Intent refusé', `${firewall.code} · Aucun débit n’a été effectué.`);
        return;
      }

      setLastSimulation({
        recipient: validation.recipient,
        amount: validation.amountDisplay,
        reference: intent.reference,
        idempotencyPrefix: intent.idempotencyKey.slice(0, 12),
        firewall: firewall.disposition,
        expiresAt: intent.expiresAt,
      });
      setLastGate('INTENT_FIREWALL_PASS · SIMULATION_ONLY');
      await appendAuditEvent('transfer-intent', 'simulated', firewall.disposition, intent.reference).catch(() => null);

      Alert.alert(
        'Simulation sécurisée',
        `Destinataire : ${validation.recipient}
Montant : ${validation.amountDisplay}
Référence : ${intent.reference}
Idempotence : ${intent.idempotencyKey.slice(0, 12)}…
Firewall : ${firewall.disposition}

Biométrie forte validée. Aucun mouvement réel ne sera exécuté dans cette version.`,
      );
    } catch {
      setLastGate('FAIL_CLOSED · NO_DEBIT');
      Alert.alert('Indisponible', 'La préparation du transfert a échoué. Aucun débit n’a été effectué.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('home')}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <Text style={styles.eyebrow}>TRANSFERT</Text>
        <Text style={styles.title}>Envoyer de l’argent</Text>
        <Text style={styles.subtitle}>Le brouillon est vérifié puis une validation biométrique forte est exigée avant toute préparation d’intent.</Text>

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
            <Text style={styles.primaryText}>{busy ? 'Validation sécurisée…' : 'Continuer'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.audit}>
          <Text style={styles.auditTitle}>Trace de gate locale</Text>
          <Text style={styles.auditValue}>{lastGate}</Text>
          <Text style={styles.auditMeta}>Blocages pré-auth · {preAuthBlockCount} · dernier : {lastPreAuthBlock}</Text>
          <Text style={styles.auditText}>La validation du montant s’exécute avant toute demande biométrique. Un brouillon rejeté ne peut donc pas créer d’intent.</Text>
        </View>

        {lastSimulation ? (
          <View style={styles.receipt}>
            <Text style={styles.receiptTitle}>Dernière simulation · NON EXÉCUTABLE</Text>
            <Text style={styles.receiptLine}>Destinataire · {lastSimulation.recipient}</Text>
            <Text style={styles.receiptLine}>Montant · {lastSimulation.amount}</Text>
            <Text style={styles.receiptLine}>Référence · {lastSimulation.reference}</Text>
            <Text style={styles.receiptLine}>Idempotence · {lastSimulation.idempotencyPrefix}…</Text>
            <Text style={styles.receiptLine}>Firewall · {lastSimulation.firewall}</Text>
            <Text style={styles.receiptLine}>Expiration · {new Date(lastSimulation.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        ) : null}

        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Exécution live</Text><Text style={styles.policyOff}>{paymentSecurityPolicy.liveExecutionEnabled ? 'ON' : 'OFF'}</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Biométrie forte</Text><Text style={styles.policyOn}>REQUISE</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Liaison appareil</Text><Text style={styles.policyOn}>{session.deviceBindingReady ? 'ACTIVE' : 'À INITIALISER'}</Text>
        </View>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Intent serveur signé</Text><Text style={styles.policyOn}>REQUIS POUR LIVE</Text>
        </View>

        <View style={styles.guard}><Text style={styles.guardTitle}>Fail closed + Intent Firewall</Text><Text style={styles.guardText}>Validation du brouillon → biométrie forte → binding appareil → firewall intent. Un intent mock reste SIMULATION_ONLY et les transferts réels restent désactivés.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 44, backgroundColor: colors.ink },
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
  audit: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.panel, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder },
  auditTitle: { color: colors.text, fontWeight: '900', fontSize: 13 },
  auditValue: { color: colors.goldSoft, fontWeight: '900', fontSize: 11, marginTop: 6 },
  auditMeta: { color: colors.warning, fontWeight: '800', fontSize: 10, marginTop: 5 },
  auditText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  receipt: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  receiptTitle: { color: colors.success, fontWeight: '900', fontSize: 11 },
  receiptLine: { color: colors.textMuted, marginTop: 5, fontSize: 11 },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  policyLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  policyOff: { color: colors.success, fontSize: 11, fontWeight: '900' },
  policyOn: { color: colors.goldSoft, fontSize: 11, fontWeight: '900' },
  guard: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  guardTitle: { color: colors.success, fontWeight: '900' },
  guardText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});
