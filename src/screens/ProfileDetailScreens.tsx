import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../security/SessionContext';
import { colors, radius, spacing } from '../theme';
import type { Navigate } from '../types';

type DetailPageProps = React.PropsWithChildren<{
  eyebrow: string;
  title: string;
  subtitle: string;
  navigate: Navigate;
}>;

function DetailPage({ eyebrow, title, subtitle, navigate, children }: DetailPageProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigate('profile')} activeOpacity={0.8}>
          <Text style={styles.back}>‹ Profil</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, good === true && styles.good, good === false && styles.warn]}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  secondary,
  disabled,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[secondary ? styles.secondary : styles.primary, disabled && styles.disabled]}
      onPress={() => void onPress()}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={secondary ? styles.secondaryText : styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AuthorizedDevicesScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      await session.refreshNativeSecurity();
    } finally {
      setBusy(false);
    }
  }, [session.refreshNativeSecurity]);

  const validateDevice = async () => {
    setBusy(true);
    try {
      const ok = await session.requireStrongAuth('Vérifier cet appareil OrchidPay');
      Alert.alert(
        ok ? 'Appareil vérifié' : 'Vérification non confirmée',
        ok
          ? 'La protection biométrique de cet appareil a été confirmée.'
          : session.securityError || 'Aucune modification n’a été effectuée.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DetailPage
      navigate={navigate}
      eyebrow="CET APPAREIL"
      title="Protection de l’appareil"
      subtitle="État des protections locales utilisées par OrchidPay."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>État actuel</Text>
        <MetricRow label="Stockage sécurisé" value={session.secureStoreAvailable ? 'ACTIF' : 'À VÉRIFIER'} good={session.secureStoreAvailable} />
        <MetricRow label="Biométrie" value={session.biometricState === 'ready' ? 'PRÊTE' : 'À VÉRIFIER'} good={session.biometricState === 'ready'} />
        <MetricRow label="Liaison appareil" value={session.deviceBindingReady ? 'ACTIVE' : 'À INITIALISER'} good={session.deviceBindingReady} />
        <MetricRow label="Session" value={session.status === 'authenticated' ? 'OUVERTE' : 'VERROUILLÉE'} good={session.status === 'authenticated'} />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Données minimisées</Text>
        <Text style={styles.noticeText}>
          OrchidPay n’affiche ni identifiant de sécurité brut, ni donnée carte sensible dans cet écran.
        </Text>
      </View>

      <ActionButton label={busy ? 'Vérification…' : 'Vérifier avec la biométrie'} onPress={validateDevice} disabled={busy} />
      <ActionButton label="Actualiser" onPress={refresh} secondary disabled={busy} />
    </DetailPage>
  );
}

export function LimitsSecurityScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();

  return (
    <DetailPage
      navigate={navigate}
      eyebrow="LIMITES & SÉCURITÉ"
      title="Contrôles renforcés"
      subtitle="Les actions sensibles restent protégées avant toute confirmation."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Protections actives</Text>
        <MetricRow label="Biométrie forte" value={session.biometricState === 'ready' ? 'REQUISE' : 'À VÉRIFIER'} good={session.biometricState === 'ready'} />
        <MetricRow label="Appareil lié" value={session.deviceBindingReady ? 'ACTIF' : 'À INITIALISER'} good={session.deviceBindingReady} />
        <MetricRow label="Stockage sécurisé" value={session.secureStoreAvailable ? 'ACTIF' : 'À VÉRIFIER'} good={session.secureStoreAvailable} />
        <MetricRow label="Verrouillage automatique" value="60 S" good />
        <MetricRow label="PAN / CVV bruts" value="NON STOCKÉS" good />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Confirmation explicite</Text>
        <Text style={styles.noticeText}>
          OrchidPay ne déclenche aucune opération financière automatiquement. Les actions sensibles exigent une validation explicite sur l’appareil.
        </Text>
      </View>

      <ActionButton label="Ouvrir le centre de sécurité" onPress={() => navigate('security')} />
    </DetailPage>
  );
}

export function ComplianceScreen({ navigate }: { navigate: Navigate }) {
  const session = useSession();

  return (
    <DetailPage
      navigate={navigate}
      eyebrow="DOCUMENTS & CONFIDENTIALITÉ"
      title="Protection des données"
      subtitle="Principes appliqués par cette version d’OrchidPay aux données sensibles."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Protection locale</Text>
        <MetricRow label="Stockage sécurisé" value={session.secureStoreAvailable ? 'ACTIF' : 'À VÉRIFIER'} good={session.secureStoreAvailable} />
        <MetricRow label="Biométrie" value={session.biometricState === 'ready' ? 'PRÊTE' : 'À VÉRIFIER'} good={session.biometricState === 'ready'} />
        <MetricRow label="PAN / CVV bruts" value="NON STOCKÉS" good />
        <MetricRow label="Identifiants de sécurité bruts" value="NON AFFICHÉS" good />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Périmètre de cette version</Text>
        <Text style={styles.panelText}>
          Les contrôles de sécurité présents dans l’application ne constituent pas une autorisation réglementaire, une licence financière ou une homologation externe.
        </Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Protection par défaut</Text>
        <Text style={styles.noticeText}>
          Les fonctions dépendant de services financiers externes restent séparées et ne sont pas exécutées automatiquement depuis cette version.
        </Text>
      </View>

      <ActionButton label="Ouvrir le centre de sécurité" onPress={() => navigate('security')} />
    </DetailPage>
  );
}

export function HelpCenterScreen({ navigate }: { navigate: Navigate }) {
  return (
    <DetailPage
      navigate={navigate}
      eyebrow="CENTRE D’AIDE"
      title="Aide OrchidPay"
      subtitle="Accès rapide aux protections et informations essentielles."
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sécurité</Text>
        <Text style={styles.panelText}>Biométrie, verrouillage automatique et protection de session.</Text>
        <ActionButton label="Ouvrir la sécurité" onPress={() => navigate('security')} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Cet appareil</Text>
        <Text style={styles.panelText}>État du stockage sécurisé et de la liaison de l’appareil.</Text>
        <ActionButton label="Voir cet appareil" onPress={() => navigate('authorized-devices')} secondary />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Limites & confirmations</Text>
        <Text style={styles.panelText}>Protections appliquées avant toute action sensible.</Text>
        <ActionButton label="Voir les contrôles" onPress={() => navigate('limits-security')} secondary />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Protection des données</Text>
        <Text style={styles.panelText}>Principes appliqués aux données sensibles dans cette version.</Text>
        <ActionButton label="Voir la confidentialité" onPress={() => navigate('compliance')} secondary />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Aide intégrée</Text>
        <Text style={styles.noticeText}>Ce centre d’aide ne déclenche ni opération financière ni navigation externe.</Text>
      </View>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { padding: spacing.lg, paddingBottom: 50, backgroundColor: colors.ink },
  back: { color: colors.purpleSoft, fontWeight: '800', marginBottom: spacing.xl },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.xl },
  panel: { marginTop: spacing.md, padding: spacing.lg, backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.panelBorder },
  panelTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  panelText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', flex: 1 },
  metricValue: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', textAlign: 'right', flex: 1 },
  good: { color: colors.success },
  warn: { color: colors.warning },
  primary: { marginTop: spacing.md, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  primaryText: { color: colors.white, fontWeight: '900', textAlign: 'center' },
  secondary: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.purpleSoft, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});