# ADR 0005: Banc d'Essai Scientifique VMAF / SSIM & Transparence

## Statut
Accepté & Implémenté

## Contexte
Les éditeurs d'applications de compression affichent fréquemment des chiffres fantaisistes ou des pourcentages de gain inventés par leur service marketing. WhatMedia vise à établir un standard d'honnêteté et de rigueur scientifique.

## Décision
1. **Règle d'honnêteté scientifique** : Ne jamais afficher de chiffres fictifs. Afficher « Mesures en cours » tant que les tests de laboratoire réels ne sont pas finalisés.
2. **Standard Netflix libvmaf** : Exécuter le modèle officiel Netflix VMAF v0.6.1 combiné aux mesures SSIM et PSNR recommandées par l'ITU-R BT.500.
3. **Corpus de test standardisé** : 5 scènes de référence couvrant les cas critiques (Paysage 4K HDR, Visage intérieur 1080p, Action sportive 60fps, Basse lumière urbaine HDR, Texte fin UI).
4. **Source de vérité unique** : Enregistrement des résultats bruts dans `packages/config/src/measurements.json` vérifié par tests unitaires Zod et injecté dynamiquement dans la landing page et les pages de mesures.

## Conséquences
- Crédibilité technique maximale auprès des développeurs et créateurs de contenu.
- Reproductibilité intégrale du banc d'essai via `tools/quality/measure.mjs` et `tools/quality/vmaf.sh`.

