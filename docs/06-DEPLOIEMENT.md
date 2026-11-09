# 06 — Déploiement sur whatmedia.nealix.org

## 0. Informations à confirmer avec Roger avant le premier déploiement

Claude Code **doit demander** ces informations (et ne jamais les inventer) :

| # | Information | Exemple |
|---|---|---|
| 1 | Adresse IP / nom d'hôte du serveur | `203.0.113.10` |
| 2 | Utilisateur SSH et méthode d'accès (clé) | `deploy@…` |
| 3 | OS du serveur | Ubuntu 24.04 |
| 4 | Reverse proxy déjà en place ? (Nginx, Caddy, Traefik, aucun) — ports 80/443 déjà pris ? | Nginx existant pour codebox.nealix.org |
| 5 | Docker et Docker Compose installés ? | oui / non |
| 6 | Qui gère le DNS de `nealix.org` ? | Cloudflare / registrar |
| 7 | Compte ou organisation GitHub pour le dépôt public | `github.com/<owner>/whatmedia` |
| 8 | Activer le serveur de secours en v1 ? (CPU disponible) | oui / non |
| 9 | E-mail de contact public (mentions légales, sécurité) | |

Si le serveur héberge déjà d'autres sites (CodeBox…), **ne jamais modifier leur configuration** : ajouter un nouveau bloc de site uniquement, et vérifier la config (`nginx -t` / `caddy validate`) avant de recharger.

## 1. DNS

Créer l'enregistrement :
```
whatmedia.nealix.org.   A      <IP_DU_SERVEUR>     TTL 300
(whatmedia.nealix.org.  AAAA   <IPv6>              si disponible)
```
Si Cloudflare : proxy **désactivé** (nuage gris) au premier déploiement pour laisser Caddy obtenir le certificat ; on peut l'activer ensuite en mode SSL « Full (strict) ». Attention : le proxy Cloudflare gratuit limite la taille des uploads (100 Mo) → si le serveur de secours est actif, utiliser un sous-domaine non proxifié pour l'API ou garder le proxy désactivé.

Vérification : `dig +short whatmedia.nealix.org`.

## 2. Préparation du serveur (une fois)

```bash
# Docker (si absent)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Dossier de déploiement
sudo mkdir -p /opt/whatmedia && sudo chown $USER: /opt/whatmedia
cd /opt/whatmedia
# y copier deploy/docker-compose.yml, deploy/Caddyfile, deploy/.env (depuis .env.example)

# Pare-feu
sudo ufw allow 80,443/tcp
```

## 3. Deux modes selon le serveur

### Mode A — Serveur sans reverse proxy (Caddy dans Compose)
`docker compose --profile edge --profile api up -d` (retirer `--profile api` si le serveur de secours est désactivé). Caddy écoute 80/443 et gère HTTPS automatiquement.

### Mode B — Reverse proxy existant (Nginx, cas probable si CodeBox est déjà là)
- Lancer Compose **sans** le profil `edge` : `docker compose --profile api up -d` (ou `docker compose up -d` sans API).
- `web` expose `127.0.0.1:8081`, `api` expose `127.0.0.1:8082`.
- Ajouter `deploy/nginx-whatmedia.conf` dans `/etc/nginx/sites-available/`, lien vers `sites-enabled/`, puis :
```bash
sudo certbot --nginx -d whatmedia.nealix.org
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Images Docker

| Image | Contenu |
|---|---|
| `ghcr.io/<owner>/whatmedia-web` | Build Astro (`/`) + build Vite (`/app`) servis par Caddy en mode fichiers statiques (`caddy file-server`) |
| `ghcr.io/<owner>/whatmedia-api` | Node 22 slim + ffmpeg 7 (avec libzimg, libx264) + API Fastify, utilisateur non-root |

Tags : `latest`, `vX.Y.Z`, `sha-<court>`.

## 5. CI/CD (GitHub Actions)

- `ci.yml` (chaque PR et push) : install pnpm, lint, typecheck, tests unitaires, build, tests Playwright (Chromium + WebKit).
- `deploy.yml` (push sur `main` ou tag `v*`) : build et push des images vers GHCR, puis SSH sur le serveur : `docker compose pull && docker compose up -d && docker image prune -f` (avec les mêmes `--profile` que ceux choisis au §3 — à mettre dans `COMPOSE_PROFILES` du `.env`), puis vérification `curl -fsS https://whatmedia.nealix.org/api/v1/health` (ou `/` si API désactivée).

Secrets GitHub à créer : `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (clé dédiée, restreinte), `DEPLOY_PATH` (`/opt/whatmedia`).

## 6. Variables d'environnement (`deploy/.env`)

Voir `deploy/.env.example`. Ne jamais committer `.env`.

## 7. Exploitation

| Sujet | Action |
|---|---|
| Logs | `docker compose logs -f --tail=200 api` |
| Mises à jour | Automatiques via `deploy.yml` ; retour arrière : `IMAGE_TAG=v1.0.1 docker compose up -d` |
| Supervision | Uptime Kuma (ou similaire) sur `/` et `/api/v1/health` |
| Nettoyage | Le service `api` purge `/data/jobs` toutes les minutes ; volume `tmpfs` ou disque dédié |
| Sauvegardes | Rien à sauvegarder côté données (sans état) ; la config est dans Git |

## 8. Checklist de mise en ligne

- [ ] DNS résout vers le serveur
- [ ] `https://whatmedia.nealix.org` → landing, certificat valide, HTTP → HTTPS
- [ ] `/app` s'installe sur iPhone (icône, nom, splash) et fonctionne hors ligne
- [ ] En-têtes de sécurité présents (vérifier avec securityheaders.com)
- [ ] Lighthouse ≥ 95 sur `/`
- [ ] Test complet sur iPhone réel : vidéo HDR 4K → statut publié
- [ ] `/api/v1/health` OK (si activé) ; upload > limite refusé avec 413
- [ ] Les autres sites du serveur (CodeBox, etc.) fonctionnent toujours
