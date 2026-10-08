import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastPayload, setLastPayload] = useState('');

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const raw = String(result.data || '').slice(0, 4096);
    const printable = raw
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    const preview = printable.length > 180 ? printable.slice(0, 180) + '…' : printable;
    setScanned(true);
    setLastPayload(preview || '[contenu vide ou non affichable]');
    Alert.alert(
      'QR détecté',
      'Le contenu a été lu localement. OrchidPay ne déclenche aucune action ni aucun paiement automatiquement.',
    );
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}><Text style={styles.title}>Initialisation caméra…</Text></View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.page}>
          <Text style={styles.eyebrow}>VÉRIFICATION QR</Text>
          <Text style={styles.title}>Vérifier un QR</Text>
          <Text style={styles.subtitle}>OrchidPay utilise la caméra uniquement pour lire le QR que vous choisissez de vérifier.</Text>
          <TouchableOpacity style={styles.primary} onPress={requestPermission} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Continuer</Text>
          </TouchableOpacity>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Lecture sous votre contrôle</Text>
            <Text style={styles.noticeText}>Le scan ne déclenche aucune navigation, opération financière ou partage automatique.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>VÉRIFICATION QR</Text>
        <Text style={styles.title}>Vérifier un QR</Text>
        <Text style={styles.subtitle}>Le contenu lu reste affiché localement pour votre vérification.</Text>

        <View style={styles.cameraFrame}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
          />
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>

        {lastPayload ? (
          <View style={styles.payload}>
            <Text style={styles.payloadTitle}>Contenu détecté</Text>
            <Text style={styles.payloadText}>{lastPayload}</Text>
          </View>
        ) : null}

        {scanned ? (
          <TouchableOpacity style={styles.primary} onPress={() => { setScanned(false); setLastPayload(''); }} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Scanner de nouveau</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Aucune action automatique</Text>
          <Text style={styles.noticeText}>Le QR est uniquement lu et affiché. Toute décision reste sous votre contrôle.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  page: { flex: 1, padding: spacing.lg, backgroundColor: colors.ink },
  eyebrow: { color: colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: spacing.sm },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 8, marginBottom: spacing.lg },
  cameraFrame: { height: 360, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.panelBorder, backgroundColor: colors.panel },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: colors.goldSoft },
  tl: { left: 22, top: 22, borderLeftWidth: 3, borderTopWidth: 3 },
  tr: { right: 22, top: 22, borderRightWidth: 3, borderTopWidth: 3 },
  bl: { left: 22, bottom: 22, borderLeftWidth: 3, borderBottomWidth: 3 },
  br: { right: 22, bottom: 22, borderRightWidth: 3, borderBottomWidth: 3 },
  payload: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.panel, borderRadius: radius.md, borderWidth: 1, borderColor: colors.panelBorder },
  payloadTitle: { color: colors.goldSoft, fontSize: 11, fontWeight: '900' },
  payloadText: { color: colors.textMuted, marginTop: 6, fontSize: 11, lineHeight: 17 },
  primary: { marginTop: spacing.lg, backgroundColor: colors.purple, borderRadius: radius.md, alignItems: 'center', paddingVertical: 15 },
  primaryText: { color: colors.white, fontWeight: '900' },
  notice: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#0E1512', borderWidth: 1, borderColor: '#1C3929' },
  noticeTitle: { color: colors.success, fontWeight: '900' },
  noticeText: { color: colors.textMuted, lineHeight: 18, marginTop: 6, fontSize: 12 },
});