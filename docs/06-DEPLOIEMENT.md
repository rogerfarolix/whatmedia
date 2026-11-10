# 06 — Déploiement

WhatMedia se déploie avec deux conteneurs Docker construits depuis ce dépôt :

| Service | Image | Rôle | Port local |
|---|---|---|---|
| `web` | `deploy/Dockerfile.web` | Caddy : site Astro (`/`), application (`/app/`), relais de `/api/v1/*` vers `api` | `127.0.0.1:8096` |
| `api` | `deploy/Dockerfile.api` | Fastify + ffmpeg : serveur de secours | `127.0.0.1:8097` |

Un reverse proxy HTTPS de l’hôte (nginx, Caddy, Traefik…) envoie tout le trafic vers `web`. Aucune règle particulière n’est nécessaire pour l’API.

## 1. Prérequis

- Docker et Docker Compose v2.
- Un nom de domaine pointant vers le serveur (enregistrements A/AAAA).
- Un reverse proxy HTTPS avec certificat (Let’s Encrypt).

## 2. Premier déploiement

```bash
git clone https://github.com/rogerfarolix/whatmedia.git
cd whatmedia
cp deploy/.env.example deploy/.env      # facultatif
docker compose -f deploy/docker-compose.server.yml up -d --build
curl -fsS http://127.0.0.1:8096/api/v1/health
```

Exemple de bloc nginx (voir aussi `deploy/whatmedia.nealix.org.conf`) :

```nginx
server {
    server_name whatmedia.example.org;
    client_max_body_size 500m;          # aligné sur MAX_UPLOAD_BYTES
    location / {
        proxy_pass http://127.0.0.1:8096;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
    }
    # listen 443 ssl + certificats (certbot --nginx)
}
```

Valider puis recharger : `sudo nginx -t && sudo systemctl reload nginx`.

## 3. Mise à jour

```bash
cd /chemin/vers/whatmedia && git pull
docker tag whatmedia-web whatmedia-web:rollback && docker tag whatmedia-api whatmedia-api:rollback
docker compose -f deploy/docker-compose.server.yml up -d --build
curl -fsS https://whatmedia.example.org/api/v1/health
```

Retour arrière :

```bash
docker tag whatmedia-web:rollback whatmedia-web && docker tag whatmedia-api:rollback whatmedia-api
docker compose -f deploy/docker-compose.server.yml up -d --no-build
```

## 4. Réglages

Les valeurs par défaut sont dans `deploy/docker-compose.server.yml` :

| Variable (service `api`) | Défaut | Rôle |
|---|---|---|
| `MAX_UPLOAD_BYTES` | 500 Mo | Taille maximale d’un envoi |
| `MAX_DURATION_SEC` | 600 | Durée maximale d’une vidéo |
| `RETENTION_MINUTES` | 15 | Suppression des résultats |
| `FFMPEG_TIMEOUT_SEC` | 900 | Arrêt d’un traitement bloqué |
| `CONCURRENCY` / `QUEUE_MAX` | 2 / 20 | Traitements simultanés / en attente |
| `RATE_LIMIT_PER_HOUR` | 10 | Envois par heure et par adresse IP |
| `TRUST_PROXY_HOPS` | 2 | Proxys devant l’API (hôte → `web` → `api`) pour lire la vraie IP |

`deploy/.env` (facultatif) : `GOOGLE_SITE_VERIFICATION` pour la balise Google Search Console. La vérification par enregistrement DNS TXT est préférable et ne demande aucune configuration.

## 5. Sécurité des conteneurs

- Système de fichiers en lecture seule, `tmpfs` pour `/tmp`, capacités Linux retirées, `no-new-privileges`.
- `api` : utilisateur non-root, limites de 3 CPU, 3 Go de mémoire et 256 processus.
- Journaux Docker limités à 3 × 10 Mo par conteneur (ils contiennent des adresses IP).
- Les fichiers de travail vivent dans le volume `jobs_data`, vidé au démarrage et purgé toutes les minutes.

## 6. Déploiement automatique (facultatif)

`.github/workflows/deploy.yml` déploie `main` par SSH après une CI verte, avec les mêmes commandes qu’au §3. Il est désactivé tant que ces éléments ne sont pas définis dans le dépôt GitHub :

- variable `DEPLOY_ENABLED=true` ;
- secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (clé privée dédiée, clé publique dans `~/.ssh/authorized_keys` du serveur), `DEPLOY_PATH`.

## 7. Vérifications après mise en ligne

- `https://<domaine>/`, `/app/`, `/sitemap.xml`, `/robots.txt` répondent 200 ; une page inconnue répond 404.
- `https://<domaine>/api/v1/health` renvoie `{"status":"ok"}`.
- En-têtes : `Content-Security-Policy` présent, un seul `X-Frame-Options`, `Cache-Control: no-cache` sur `/app/sw.js`.
- Une vidéo traitée de bout en bout sur un téléphone, partagée vers WhatsApp.
