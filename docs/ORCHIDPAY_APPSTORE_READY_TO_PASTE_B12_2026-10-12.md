# OrchidPay — Pack de remplacement App Store (B12, 12 octobre 2026)

**Statut : textes QA préparés, non enregistrés dans App Store Connect.**

Le 12 octobre, Apple a répondu qu’il poursuivrait la revue après notre réponse relative à 2.3.1(a). Ce message n’est pas une approbation. Pas de nouvelle soumission, de retrait de build, de modification ASC ou de site public sans état vérifié et décision du propriétaire.

## EN-US — remplacement intégral

### Nom / Name

OrchidPay

### Sous-titre / Subtitle

Local Security & QR Reader

### Texte promotionnel / Promotional Text

Check app-session security, review local security activity and read QR code contents on your device. No banking, card or money-transfer features in this release.

### Description — contenu complet

OrchidPay helps you review local app-session security information and inspect QR codes directly on your device.

WHAT YOU CAN DO
• Check biometric authentication and secure-storage availability for this app.
• Use supported on-device authentication to access protected OrchidPay screens and lock your session.
• Review a local log of session and security events.
• Scan a QR code and preview its readable content locally, without automatic navigation or payment initiation.
• Find security, privacy and support information.

IMPORTANT
Reading a QR code does not validate its sender, a payment recipient or the safety of its contents. OrchidPay does not verify financial transactions.

This release has no banking account, customer balance, virtual or physical payment card, deposits, withdrawals, money transfers or settlement. OrchidPay does not hold or move customer funds.

Some capabilities depend on biometric and secure-storage features supported by your device and operating system.

Support: https://www.orchidpay.online/support/

### Mots-clés / Keywords

qr scanner,local security,biometrics,session lock,privacy,activity log


## FR-FR — proposition pour une future localisation (ne pas ajouter pendant la revue en cours)

### Nom / Name

OrchidPay

### Sous-titre / Subtitle

Sécurité locale et lecteur QR

### Texte promotionnel / Promotional Text

Consultez la sécurité de votre session, le journal local et le contenu de QR codes. Aucun compte bancaire ni transfert d’argent dans cette version.

### Description — contenu complet

OrchidPay vous permet de consulter des informations de sécurité liées à votre session et de lire le contenu de QR codes sur votre appareil.

FONCTIONS DISPONIBLES
• Consultez la disponibilité de la biométrie et du stockage sécurisé utilisés par l’application.
• Utilisez l’authentification proposée par votre appareil pour accéder aux écrans protégés et verrouiller la session.
• Retrouvez le journal local des événements de session et de sécurité.
• Scannez un QR code pour en afficher un aperçu lisible sur l’appareil, sans navigation ni paiement automatiques.
• Accédez aux informations d’assistance, de sécurité et de confidentialité.

IMPORTANT
Lire un QR code ne permet pas de certifier son auteur, un bénéficiaire de paiement ou la fiabilité de son contenu. OrchidPay ne vérifie aucune transaction financière.

Cette version ne propose aucun compte bancaire, solde client, carte de paiement virtuelle ou physique, dépôt, retrait, transfert d’argent ou règlement financier. OrchidPay ne conserve ni ne transfère de fonds clients.

Certaines fonctions dépendent des capacités biométriques et de stockage sécurisé de votre appareil et de son système d’exploitation.

Assistance : https://www.orchidpay.online/support/

### Mots-clés / Keywords

lecteur qr,sécurité locale,biométrie,session,confidentialité,journal

## Notes App Review — remplacer uniquement si le champ est éditable et avec validation

Les titres des écrans iOS B12 sont en français ; les étapes destinées aux reviewers utilisent donc les libellés exacts.

OrchidPay iOS 1.0.0 (build 12) provides local app-session protection, native biometric/secure-storage status, a local security-event journal and a QR-content reader. It does not provide bank accounts, balances, cards, deposits, withdrawals, transfers or payment execution.

The current UI is in French. Reviewer steps:
1. Open the app; the Accueil (Home) tab shows shortcuts. Tap Sécurité for the session state, biometric availability and on-device authentication check.
2. Tap Vérifier un QR (QR tab). Tap Continuer if iOS requests camera permission, scan a QR code, and see a local text preview. Nothing is opened, verified as trustworthy or paid automatically.
3. Tap Activité to see locally recorded security/session entries. The list can be empty before events occur.
4. Tap Profil for device information, privacy and Centre d’aide (Help). The session can also be locked manually; after about 60 seconds in the background, it is locked automatically.

No financial credentials, PSP access or banking user account are required for review. Face ID/biometrics and secure storage depend on device capabilities. We identified and are correcting older metadata and site references that incorrectly described unimplemented banking features. Future financial functionality, if ever offered, will require separate authorization, full disclosure and App Review; it will not be silently enabled in this build. If you encountered an actual financial screen, please send the navigation steps so we can reproduce and remedy it.

## Captures et visuels à vérifier sur le binaire B12

- Actual Accueil home (no money promises)
- Actual Sécurité biometric status (no false guarantee)
- Actual Vérifier un QR camera and local preview (no payment verification)
- Actual Activité local session events
- Actual Profil and support

## Références et frontières de publication

- Source UI : `src/AppShell.tsx`, `src/screens/ScanScreen.tsx`, `src/screens/SecurityScreen.tsx` et `src/screens/TabScreens.tsx` (build iOS 1.0.0/12).
- Une fiche App Store n’est pas une preuve de conformité à la règle 4.2 (utilité minimale). Un audit manuel sur appareil réel demeure obligatoire.
- Les captures existantes et la fiche EN-US réellement en cours de revue doivent être comparées visuellement ; cette préparation ne les modifie pas.
- Le site `www.orchidpay.online` et ses pages support/conditions/confidentialité possèdent encore des références au projet de paiement pilote dans la version publiée contrôlée le 12/10.
- La politique légale/financière du projet ne doit pas être effacée ni remplacer les informations réglementaires requises. Les textes publics doivent préciser la portée actuelle de B12.
- Réponse Apple du 12/10 : demande reçue, examen en cours ; **pas de deuxième réponse non sollicitée**.
- Aucun changement de catégorie automatique : « Utilities » à examiner seulement si la véritable utilité autonome est démontrée et approuvée.
- `https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information`
- `https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/remove-a-submission-from-review`

**NO-GO : publication, submit, TestFlight, nouvelle build, OTA, site de production et activation financière.**
