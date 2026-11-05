# OrchidPay P0 — correction transitive du 15 octobre 2026

STATUT : DRAFT / NO-GO Store.

Point de depart : PR #16, SHA 2309ec98ea009e2f7e8743b9605ff411e9031a50.

Le controle des dependances de production a retrouve 23 alertes HIGH et 1 CRITICAL avant modification.

Les resolutions suivantes ont ete mises a jour uniquement dans package.json et package-lock.json :

- shell-quote 1.11.0
- source-map-js 1.2.2
- brace-expansion generation 1 en 1.1.21
- brace-expansion generation 5 en 5.0.12

Apres regeneration du lockfile et nouvel audit : 21 HIGH, 0 CRITICAL. Le correctif reste PARTIEL.

Expo 55, React Native 0.83 et React 19 sont inchanges. Les dependances restantes relevent notamment de Metro, Jest, node-forge, braces et micromatch.

Le garde-fou CI doit continuer a refuser toute vulnérabilité HIGH ou CRITICAL. Aucun contournement, aucun merge, aucun build payant, aucun paiement actif, aucun deploiement. Verification de compatibilite native et revue independante requises.
