---
name: jenkinsfile-setup
description: "Use when initializing or editing CI/CD scaffolding (Jenkinsfile, Dockerfile, .dockerignore, server/ folder with docker-compose, nginx, deploy script) for a backend that deploys via Docker Hub image + SSH to a VPS. `init` scaffolds everything with defaults and returns a review checklist; `verify` audits the result."
---

# Jenkinsfile Setup

Declarative pipeline modeled on `gym-app/Jenkinsfile` (Strivio backend). Template: `templates/Jenkinsfile`. Fill the `<PLACEHOLDERS>`; delete stages the project doesn't need (e.g. seed, nginx copy).

## Init flow (`/jenkinsfile-setup init`)

Default mode. **No questions asked.** Scaffold every file fully filled in with defaults, then hand back a review checklist. The user edits only what's wrong.

1. **Detect** `<BACKEND_DIR>` (see below) and derive `<APP>` from its name (strip `-be`/`-backend`, e.g. `gym-app-be` → `gym-app`). If the backend folder is generic (`backend`, `api`, `server`), use the repo root folder name instead (e.g. `test-placeholder`).
2. **Scaffold** every file in the "Deploy files" table below from `templates/`, **including `<REPO_ROOT>/Jenkinsfile`** (copy `templates/Jenkinsfile` to the folder containing the backend folder, not into it). Skip only files that already exist (report as "skipped"). Substitute every `<PLACEHOLDER>` while copying (step 3); no `<NAME>` may remain in the output. Afterwards verify with Glob that the Jenkinsfile exists at the root.
3. **Fill every placeholder**, repo facts first, then the gym-app defaults (the `gym-app/Jenkinsfile` + `gym-app-be/server/` setup, with `<APP>` swapped in for `strivio`):

   | Placeholder | Source / default |
   |---|---|
   | `<BACKEND_DIR>`, `<APP>` | detected (step 1) |
   | `<NODE_VERSION>` | `engines` / `.nvmrc` / `@types/node` major; else `22` |
   | `<APP_PORT>` | `main.ts` / `.env.example`; else `3001` |
   | `<REPO_SSH_URL>` | `git remote get-url origin` as SSH; no remote → `git@github.com:JohnOGama/<APP>.git` |
   | `<BRANCH>` | `main` |
   | `<IMAGE_NAME>` | `johnogama19/<APP>-backend` |
   | `<PROJECT_PATH>` | `/home/jogama/projects/<APP>` |
   | `<PROD_DOMAIN>` / `<STAGING_DOMAIN>` | `api.<APP>.fitness` / `api-staging.<APP>.fitness` |
   | `<NGINX_PORT>` | `80` |
   | `<PROD_HOST_PORT>` / `<STAGING_HOST_PORT>` | `3001` / `3002` |
   | `<MAX_BODY_SIZE>` | `4m` |
   | `<DATABASE_URL_CRED>` | `<APP uppercase>_DATABASE_URL` |
   | shared credential IDs | keep as in gym-app: `JENKINS_GITHUB_PRIVATE_KEY`, `UBUNTU_SERVER_SSH_KEY`, `DOCKER_HUB_CREDS`, `SERVER_IP` |

   Delete the DB migrate/seed stages (and `<DATABASE_URL_CRED>`) if `package.json` has no `migrate` / `seed:*` scripts. Keep one seed line per `seed:*` script found.
4. **Reply in exactly this shape**, nothing else (no file tour, no explanation). Values are the ones actually written to the files:

```
Created: <paths, one line>
Skipped (exist): <paths or "none">

Check these values (edit in the files if wrong):
- [ ] IMAGE_NAME = johnogama19/<APP>-backend  → Jenkinsfile, docker-compose.yml
- [ ] PROJECT_PATH = /home/jogama/projects/<APP>  → Jenkinsfile, deploy-docker.sh
- [ ] PROD_DOMAIN = api.<APP>.fitness  → nginx <APP>-production.conf
- [ ] STAGING_DOMAIN = api-staging.<APP>.fitness  → nginx <APP>-staging.conf
- [ ] REPO_SSH_URL = git@github.com:JohnOGama/<APP>.git  → Jenkinsfile
- [ ] APP_PORT = 3001 · host ports 3001/3002 · NGINX_PORT = 80  → Dockerfile, compose, nginx
- [ ] Jenkins credentials exist: <list of credential IDs used>
- [ ] Server: .env.production / .env.staging in <PROJECT_PATH>; DNS for both domains points at the server
```

   Mark a value `(guessed)` when it came from a default rather than the repo.
5. **If the user then gives corrected values**, replace the old values across the scaffolded files, grep for the old value to confirm none remain, then stop. Don't commit.

Other modes (edit the Jenkinsfile, generate one file) skip steps 2-4 and just do the requested change.

## Verify flow (`/jenkinsfile-setup verify`)

Read-only: read the files, change nothing. Run every check, then reply with one pass/fail checklist (`- [x]` pass, `- [ ]` fail + what's wrong and the file to fix), failures first, nothing else.

1. **Location**: `Jenkinsfile` in the folder containing the backend; `Dockerfile`, `.dockerignore`, `server/docker/docker-compose.yml`, `server/nginx/<APP>-production.conf` + `<APP>-staging.conf`, `server/scripts/deploy-docker.sh` inside `<BACKEND_DIR>`; none of them in the frontend folder.
2. **No leftovers**: grep the scaffolded files for `<[A-Z_]+>` placeholders.
3. **Consistency** (same value everywhere):
   - image name: Jenkinsfile `IMAGE_NAME` = compose `image:`
   - `PROJECT_PATH`: Jenkinsfile = `cd` in `deploy-docker.sh`
   - app port: Dockerfile `EXPOSE` = compose container port = `main.ts` / `.env.example`
   - host ports: compose `127.0.0.1:<host>:<app>` = nginx `proxy_pass` port per env
   - nginx conf names in the Jenkinsfile `mv`/`ln` lines = files under `server/nginx/`
   - Jenkinsfile `dir('<BACKEND_DIR>')` and scp source paths exist
   - `npm run` scripts the Jenkinsfile calls (`build`, `generate`, `migrate`, `seed:*`, `test`) exist in the backend `package.json`
   - Dockerfile `CMD` entry file matches `start:prod` in `package.json`
4. **Safety**: no secrets or literal passwords in any file; `.dockerignore` excludes `.env*`; deploy script path is under `$PROJECT_PATH`, not a shared folder.
5. **Can't check from the repo**, always list as unchecked for the user: Jenkins credential IDs exist, DNS points at the server, `.env.production` / `.env.staging` exist in `$PROJECT_PATH`, deploy user has passwordless sudo for nginx.

## Stage order (keep it)

1. **Github Clone**: `checkout scmGit` on `*/main` via SSH deploy key credential.
2. **Install + Build**: `npm ci`, `npm run build` inside `dir('<BACKEND_DIR>')`.
3. **DB generate + migrate**: `generate` without creds, `migrate` inside `withCredentials(string DATABASE_URL)`.
4. **DB seed**: one `npm run seed:*` per seed, same DB credential.
5. **Tests**: `npm run test`.
6. **Copy compose + nginx**: ssh `mkdir -p $PROJECT_PATH/scripts $PROJECT_PATH/temp`, scp `deploy-docker.sh` (to `$PROJECT_PATH/scripts/`), `docker-compose.yml`, nginx confs to the server, then ssh: `mv` to `sites-available`, `ln -sfn` to `sites-enabled`, `nginx -t && systemctl reload nginx`.
7. **Docker login**: `--password-stdin` only.
8. **Docker build + push**: tag = `${BUILD_NUMBER}`.
9. **Nginx revalidate**: `nginx -t && reload`.
10. **Deploy**: ssh, run `IMAGE_TAG=$IMAGE_TAG $PROJECT_PATH/scripts/deploy-docker.sh`.

## Conventions

- `tools { nodejs("Node 22") }`; Node version name must match Jenkins Global Tool Config.
- `environment`: `SERVER_IP = credentials('SERVER_IP')`, `IMAGE_NAME`, `IMAGE_TAG = "${BUILD_NUMBER}"`, `PROJECT_PATH` (server path).
- Secrets only via `credentials()` / `withCredentials`; shell blocks use single-quoted `'''` so Groovy never interpolates secrets (shell expands `$VAR`).
- SSH creds: `sshUserPrivateKey(credentialsId, keyFileVariable, usernameVariable)`; always `scp/ssh -i "$KEY"`.
- Credential IDs in use: `JENKINS_GITHUB_PRIVATE_KEY`, `STRIVIO_DATABASE_URL`, `UBUNTU_SERVER_SSH_KEY`, `DOCKER_HUB_CREDS`, `SERVER_IP`. Reuse for same project; new project = new IDs, tell the user to create them in Jenkins.
- `post`: `always` → `docker logout`; `cleanup` → `deleteDir()`.

## Placeholders

`<REPO_SSH_URL>`, `<BRANCH>`, `<BACKEND_DIR>`, `<IMAGE_NAME>` (dockerhub user/app), `<PROJECT_PATH>`, `<APP>` (nginx conf basename), credential IDs.

## Deploy files (generate when missing)

The pipeline needs these files. Only the `Jenkinsfile` goes in the repo root (`<REPO_ROOT>/Jenkinsfile`; `<REPO_ROOT>` = the folder that contains `<BACKEND_DIR>`, i.e. the session's working directory. Don't rely on git: the project may not be a git repo. Never inside `<BACKEND_DIR>`); everything else goes under `<BACKEND_DIR>/`. Create any that don't exist from `templates/`, filling placeholders from `package.json` (Node version, scripts), `src/main.ts` / `.env.example` (app port), and the user:

**Find `<BACKEND_DIR>` first.** The repo is a monorepo (backend + frontend/mobile folders). Don't assume a name: list the repo root and pick the folder whose `package.json` depends on `@nestjs/core` (here `gym-app-be`; other repos may use `backend`, `api`, `*-be`). Ask the user only if more than one matches or none do. Never write the Dockerfile or `.dockerignore` into the root or the frontend folder.

| Write to (repo path) | Template |
|---|---|
| `Jenkinsfile` (repo root, next to the backend and frontend folders) | `templates/Jenkinsfile` |
| `<BACKEND_DIR>/Dockerfile` | `templates/Dockerfile` (multi-stage, non-root, `node dist/src/main`) |
| `<BACKEND_DIR>/.dockerignore` | `templates/.dockerignore` (keeps env files, `.git`, `server/` out of the image) |
| `<BACKEND_DIR>/server/docker/docker-compose.yml` | `templates/docker-compose.yml` (prod + staging, bound to 127.0.0.1) |
| `<BACKEND_DIR>/server/nginx/<APP>-production.conf` and `<APP>-staging.conf` | `templates/nginx.conf` (simple proxy: socket.io + Better Auth + catch-all; no tunnel, rate limits or security headers) |
| `<BACKEND_DIR>/server/scripts/deploy-docker.sh` | `templates/deploy-docker.sh` |

The Dockerfile and `.dockerignore` sit beside the backend's `package.json` because the Jenkins build runs `docker build` inside that dir.

Where the Jenkinsfile copies them on the server (`$PROJECT_PATH` = `/home/<user>/projects/<app>`):

| Repo file | Server path |
|---|---|
| `deploy-docker.sh` | `$PROJECT_PATH/scripts/deploy-docker.sh` (per-project, never the shared `/home/<user>/scripts/`; the pipeline `chmod +x`'s it) |
| `docker-compose.yml` | `$PROJECT_PATH/docker-compose.yml` |
| nginx confs | `$PROJECT_PATH/temp/` then `/etc/nginx/sites-available/` + symlink in `sites-enabled/` |
| env files (created by hand) | `$PROJECT_PATH/.env.production`, `$PROJECT_PATH/.env.staging` |

Extra placeholders: `<NODE_VERSION>`, `<APP_PORT>`, `<PROD_HOST_PORT>`/`<STAGING_HOST_PORT>` (e.g. 3001/3002), `<NGINX_PORT>` (port nginx listens on, e.g. 80), `<DOMAIN>`, `<MAX_BODY_SIZE>`, `<ENV>`. Never overwrite an existing file without asking. Rate limits and security headers: copy from `server/nginx/strivio-prod.conf` when wanted.

## Check before finishing

- Files scp'd exist in repo (`server/scripts/deploy-docker.sh`, `server/docker/docker-compose.yml`, `server/nginx/*.conf`); generate from the templates above if missing.
- User creates `.env.production` / `.env.staging` in `<PROJECT_PATH>` on the server and points each domain's DNS at the server (nginx listens on `<NGINX_PORT>`).
- Nothing is written to shared server paths: scripts, compose and env files all live under `$PROJECT_PATH`; nginx confs are named `<APP>-<env>` so they can't clash with other sites. The pipeline creates `$PROJECT_PATH/scripts` and `temp` itself.
- Deploy user has passwordless sudo for `mv`, `ln`, `nginx`, `systemctl reload nginx`.
- Don't commit; leave that to the user.
