# OrchidPay® — alignement du site public avec l'IPA B12 et les métadonnées Apple

**12 octobre 2026 · Chantier documentaire QA uniquement · NON PUBLIÉ / NO-GO STORE**

## Source de vérité et coordination

Cette étape se superpose **sans le remplacer** au paquet de textes déjà préparé dans la branche `docs/orchidpay-apple231-metadata-review-20261012`, commit `4cccc5d`.
La seule version à présenter à l'équipe est :

- `docs/ORCHIDPAY_APPSTORE_COPY_B12_EN_FR_2026-10-12.json` : **métadonnées App Store canoniques EN-US et FR-FR**, avec sous-titre, promotion, description et mots-clés.
- `docs/ORCHIDPAY_APPSTORE_READY_TO_PASTE_B12_2026-10-12.md` : pack lisible à copier **uniquement si le statut ASC le permet et après approbation**.
- `docs/ORCHIDPAY_APPLE_REVIEW_REPLY_HOLD_2026-10-12.md` : message supplémentaire conservé **en attente**, pas de nouvelle réponse automatique.
- `scripts/orchidpay_apple231_copy_gate.py` : vérification du pack App Store, sans réseau ni opération Apple.

Le présent chantier ajoute **seulement la source complète des six pages publiques**, la vérification de liens, la cohérence site ↔ métadonnées ↔ routeur B12 et sa preuve CI. Les brouillons du worktree d'audit antérieur ne sont pas une deuxième source éditoriale autoritaire.

## Fichiers corrigés dans la présente branche QA

| Fichier complet | Correctif |
|---|---|
| `site/index.html` | Remplacement du slogan « Move money », des cartes SEND/RECEIVE et du « private pilot » présenté comme fonctionnalité ; vraie UX Accueil/Sécurité/QR/Activité/Profil ; distinction explicite des services financiers futurs |
| `site/support/index.html` | Contact existant conservé, aide EN/FR, parcours pour Apple App Review et limites réelles du scanner QR |
| `site/terms/index.html` | Conditions cohérentes avec l'application disponible ; retrait des formulations qui présentent des cartes/soldes/transferts fictifs comme visibles dans B12 |
| `site/privacy/index.html` | Information sur session, événements de sécurité et QR locaux ; maintien du responsable du traitement déclaré, des prestataires et droits RGPD |
| `site/privacy-choices/index.html` | Droits de confidentialité et données réellement présentes sur l'appareil plutôt que soldes de démonstration |
| `site/legal/index.html` | Précision des fonctions B12 et séparation du projet financier futur ; **aucun agrément ou immatriculation revendiqué** |

Les documents juridiques constituent un **candidat rédactionnel**. La vérification de l'identité de l'éditeur, de l'adresse, du statut de constitution, du traitement réel des données et des mentions obligatoires reste requise avant déploiement.

## Tests automatiques

`scripts/orchidpay_apple231_site_gate.py` effectue **en lecture seule et sans dépendances tierces** :

1. Lecture des métadonnées canoniques FR/EN déjà qualifiées par leur propre gate.
2. Contrôle des six pages HTML et de tous leurs liens locaux/canoniques (sans réseau).
3. Refus d'anciens slogans financiers affirmatifs et recherche des limites QR/paiement.
4. Comparaison statique du périmètre produit avec `src/AppShell.tsx` et `src/screens/ScanScreen.tsx`.
5. Vérification du canal de support actuel sans ajout de contact fictif.

La création d’un nouveau workflow GitHub a été refusée par la protection OAuth (autorisation `workflow` absente) ; **aucun nouveau workflow n’est versionné**. Les deux commandes de vérification restent exécutables localement : `python3 -B scripts/orchidpay_apple231_copy_gate.py` puis `python3 -B scripts/orchidpay_apple231_site_gate.py`. Une automatisation CI dédiée nécessite une autorisation et une procédure distinctes, sans contourner cette sécurité.

**Limite des preuves :** les tests statiques ne remplacent ni une capture sur l'IPA Apple exactement soumise, ni un essai caméra/biométrie sur de vrais appareils, ni la certification Apple 2.3.1(a)/4.2.

## Prérequis avant le feu vert du propriétaire

- Confirmer le statut actuel de la version B12 dans App Store Connect : le message Apple du 12 octobre dit seulement « We will continue the review ».
- Auditer le binaire envoyé, les captures App Store et le contenu de l'écran Home. Les indicateurs « VAULT PROTÉGÉ », « BIOMÉTRIE FORTE » et « CONFIRMATION RENFORCÉE » sont affichés statiquement dans `src/screens/HomeScreen.tsx`, même quand la biométrie n'est pas disponible ; **risque de tromperie à tester sur appareil**, potentiellement correctif binaire B13.
- Faire valider les métadonnées, la catégorie, les screenshots et la politique de confidentialité. Ne pas créer de fausse description de service financier juste pour satisfaire la revue.
- Si Apple permet une correction des champs pendant ce statut précis, enregistrer l'avant/après. **Ne pas retirer la soumission en cours par défaut : cela redémarrerait la revue après resoumission.**
- Publier le site seulement après relecture des pages juridiques et approbation explicite ; vérifier alors les URLs HTTPS publiques.
- Aucune build EAS, aucun changement de `main`, aucun push Store ou publication Vercel de production ici.

**Dernier état :** site source corrigé en QA ; **production inchangée**, App Store Connect inchangé ; Apple B12 non approuvé sur la seule base du message communiqué.
