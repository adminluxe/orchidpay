# OrchidPay — P0 production dependency gate (DRAFT)

Date : 14 octobre 2026. Scope : CI uniquement, aucun code de paiement ni build Store.

Le dernier audit factuel sur le verrouillage npm actuel, GitHub Actions run 38544097493, a relevé **23 vulnérabilités HIGH et 1 CRITICAL** dans le résultat `npm audit --omit=dev`. La dépendance vulnérable CRITICAL est `shell-quote`. Le fichier package-lock.json du HEAD main au moment de ce correctif a le même Git blob `4f24be95ffe29de1975288b5abf17e06c94aa09b` que celui de l'audit.

L'ancien workflow imprimait le rapport complet sans échouer sur ces vulnérabilités. La modification fait échouer le job `build` lorsque le rapport npm production est indisponible ou que HIGH/CRITICAL n'est pas égal à zéro. Le ruleset du dépôt exige déjà le job `build`, ce qui rend ce contrôle pertinent si la correction est approuvée et promue.

**Un échec de cette nouvelle CI est ATTENDU tant que les dépendances restent vulnérables.** Il prouve le fonctionnement du blocage, pas la correction des 24 vulnérabilités. Ne pas supprimer le contrôle pour obtenir du vert. Ne pas utiliser `npm audit fix --force` ou de mise à jour Expo/React Native majeure sans matrice de compatibilité, QA mobile, approbation et validation des deux Stores.

Statut : DRAFT. OrchidPay Store NO-GO, aucun paiement LIVE, aucun push de build payant ni soumission.
