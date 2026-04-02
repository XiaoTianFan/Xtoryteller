# Deploy to Vercel

Read this guide when the user wants to publish the Xtoryteller app — and the presentation(s) inside it — to a live URL (SKILL Phase 6).

Unlike standalone HTML decks, Xtoryteller is a **Next.js application**. The entire app (dashboard + all presentations) deploys as one project. Each presentation becomes accessible at `https://<vercel-domain>/<slug>`. The dashboard is at `https://<vercel-domain>/`.

---

## Step 1: Detect the deployment situation

Run the following checks before choosing a deploy path:

```bash
# Check if a Vercel project is already linked to this repo
cat .vercel/project.json

# Check git remotes (GitHub/GitLab = Vercel Git integration likely exists)
git remote -v

# Check Vercel CLI login status
npx vercel whoami

# If linked, list existing deployments
npx vercel ls
```

Choose the path that matches the situation:

| Situation | Path |
| --- | --- |
| `.vercel/project.json` exists AND GitHub/GitLab remote → Vercel Git integration assumed | **Path A** |
| `.vercel/project.json` exists but no GitHub remote, or user says Git integration is not set up | **Path B** |
| No `.vercel/project.json` — not yet deployed | **Path C** |

If unsure, ask the user: "Have you deployed Xtoryteller to Vercel before? Is it connected to a GitHub repository?"

---

## Path A: Existing Xtoryteller on Vercel with Git integration (commit + push)

This is the preferred path for teams already hosting the app. Pushing to the connected branch triggers an automatic Vercel redeploy; no CLI interaction needed.

```bash
# Stage only the new or changed presentation (and any shared assets)
git add presentations/<slug>/
git add skills/xtoryteller/skill-manifest.json  # if registries were refreshed

# Commit
git commit -m "add: <presentation-title>"

# Push — Vercel redeploys automatically
git push origin main
```

After the push, Vercel will rebuild and redeploy the Next.js app. The deployment usually completes within 1–3 minutes.

**To find the live URL:** Check the Vercel dashboard at https://vercel.com/dashboard, or run `npx vercel ls` and look for the most recent production URL.

The presentation will be live at: `https://<vercel-domain>/<slug>`

**Gotcha:** If `presentations/` is listed in `.gitignore`, the YAML files will not be tracked. Check `git status` before committing — if the folder appears as untracked or ignored, show the user and help them remove or adjust the relevant `.gitignore` rule.

---

## Path B: Existing Vercel project, no Git integration (Vercel CLI deploy)

```bash
# From the project root
npx vercel --prod
```

Vercel auto-detects Next.js. It will ask for confirmation on first run in a given environment; accept the defaults (build command: `npm run build`, output directory: `.next`).

After deploy completes, the CLI prints the production URL. The presentation will be at `<production-url>/<slug>`.

---

## Path C: First-time deployment (fresh Vercel setup)

### 1. Check for Node.js and Vercel CLI

```bash
node --version   # must be 18+
npx vercel --version
```

If Vercel CLI is not installed, it will be installed on first `npx vercel` invocation automatically.

### 2. Log in to Vercel

```bash
npx vercel login
```

If the user does not have a Vercel account, direct them to https://vercel.com/signup (free tier is sufficient). They can sign up with GitHub, Google, or email.

### 3. Deploy

```bash
# From the project root
npx vercel
```

Vercel detects Next.js automatically. Accept the prompts:

- Framework preset: Next.js (auto-detected)
- Build command: `npm run build` (default)
- Output directory: `.next` (default)
- Do not override other settings unless the user has specific requirements

For a production deployment (not just a preview):

```bash
npx vercel --prod
```

### 4. Environment variables

The following env vars may be needed on Vercel. Set them in the Vercel project dashboard under **Settings → Environment Variables**, or via CLI:

```bash
npx vercel env add NEXT_PUBLIC_BASE_URL production
# Enter: https://<your-vercel-domain>.vercel.app
```

| Variable | Required in production | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Recommended (used for meta and canonical URLs) | Not set |
| `NEXT_PUBLIC_WS_PORT` | No (dev-only hot-reload server) | Omit in production |
| `SKIP_THUMBNAILS` | Optional | `false` |

After setting env vars, trigger a fresh deploy: `npx vercel --prod`

---

## Step 2: Confirm and share

After any path completes, confirm with the user:

1. The production URL of the app (e.g., `https://xtoryteller-abc123.vercel.app`)
2. The direct URL to the new presentation: `https://<domain>/<slug>`
3. The dashboard URL: `https://<domain>/`

Remind the user that the Vercel free tier is generous — they will not be charged for a self-hosted Next.js app at typical usage volumes. To take it down later: visit https://vercel.com/dashboard and delete the project.

---

## Gotchas

- **Build time**: The Next.js build (`npm run build`) runs `validate:all` first. If any presentation YAML is invalid, the build fails. Always complete Phase 5 (verify) before deploying.
- **Presentations not appearing**: If a newly added presentation does not appear after deploy, check that its folder exists at `presentations/<slug>/` and that `presentation.yaml` passes validation locally.
- **First deploy is slow**: Vercel installs dependencies and runs the full Next.js build. Expect 2–5 minutes on first deploy; subsequent deploys targeting unchanged dependencies are much faster.
- **Custom domain**: To use a custom domain, add it in the Vercel project dashboard under **Settings → Domains**. Update `NEXT_PUBLIC_BASE_URL` to match.
- **Static export alternative**: If the user wants a fully static site (no serverless functions), they can run `npm run export` locally to produce an `out/` folder, then deploy that folder to any static host. This is outside the standard Vercel Next.js path.
