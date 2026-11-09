# Prompt de démarrage pour Claude Code

Copie ce dossier à la racine d'un nouveau dépôt vide, ouvre Claude Code dedans, et colle le message ci-dessous.

---

```
Tu démarres le projet WhatMedia. Lis CLAUDE.md puis tous les fichiers de docs/ dans l'ordre (00 à 09).

1. Résume-moi en 10 lignes ce que tu as compris et liste les points qui te paraissent flous ou contradictoires.
2. Pose-moi les questions de docs/06-DEPLOIEMENT.md §0 (serveur, DNS, GitHub).
3. Ensuite, attaque la Phase 0 de docs/09-ROADMAP-TACHES.md :
   - crée le monorepo minimal (pnpm + Turborepo + TypeScript) nécessaire aux spikes,
   - construis une page de test /spikes déployable en local (et accessible depuis mon iPhone sur le réseau local en HTTPS via `vite --host` + certificat mkcert, ou via un tunnel),
   - pour chaque spike, dis-moi exactement quoi tester sur mon iPhone et quels résultats te renvoyer.
4. Une fois les spikes rédigés et décidés, enchaîne les phases 1 à 5, une tâche à la fois, avec CI verte et cases cochées.

Ne déploie rien sur le serveur sans m'avoir montré la configuration et obtenu mon accord.
```

---

## Accès dont Claude Code aura besoin

| Besoin | Comment |
|---|---|
| GitHub (dépôt, Actions, GHCR, releases) | `gh auth login` dans le terminal où tourne Claude Code |
| Serveur | Clé SSH dans `~/.ssh/` + entrée `Host whatmedia-prod` dans `~/.ssh/config` |
| DNS | À faire par toi (ou via l'API/CLI de ton fournisseur DNS si tu la fournis) |
| npm (publication de `@whatmedia/core`) | `npm login` (phase 5 seulement) |

Aucun serveur MCP n'est indispensable : `gh`, `ssh` et `docker` suffisent. Optionnel mais utile : un serveur MCP GitHub (issues/PR) et un serveur MCP Playwright (pour que Claude Code vérifie visuellement la landing).
