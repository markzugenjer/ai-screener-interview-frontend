# AI Screener Interview — Frontend

Next.js app for **Dicy**, the AI screening interviewer at **FDC Dental Clinic**: job board, candidate accounts, the live voice
interview room, feedback pages, and the recruiter area.

Backend: [ai-screener-interview-backend](https://github.com/markzugenjer/ai-screener-interview-backend)

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, LiveKit (`livekit-client`, `@livekit/components-react`), Zod, Plus Jakarta Sans (self-hosted).

## Run it

```bash
pnpm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000 — the Go API must be running on :8080
```

Production: `pnpm build && pnpm start`. On Vercel, set `API_INTERNAL_URL` to your API's URL.

## Pages

| Route | Who | What |
| --- | --- | --- |
| `/` | Everyone | Landing page with open roles |
| `/register`, `/login` | Guests | Account with full name, email, password, WhatsApp and resume |
| `/dashboard` | Candidates | Past interviews (cards with score and summary) and open roles |
| `/jobs/[slug]` | Candidates | Role details, interview checklist, start button |
| `/interview/[id]` | Candidates | Mic check, then the call: Dicy and you, live subtitles, mute, reset, leave |
| `/interview/[id]/feedback` | Candidates | Score, breakdown, strengths, tips, screening disclaimer, retake |
| `/admin` | Recruiters | Overview and highest-scoring candidates waiting for review |
| `/admin/results` | Recruiters | Filterable, shareable (URL-based) results table |
| `/admin/results/[id]` | Recruiters | Full evaluation, per-question evidence, transcript, contact, resume, decision |
| `/admin/jobs` | Recruiters | Create and edit jobs, score weights and the question bank |

## Design

White, soft green and soft pink, with one rule: **pink is always Dicy (the AI), green is always you**, in the call
tiles, the subtitles and the brand mark. Type is Plus Jakarta Sans, designed in Jakarta. Motion is reserved for the
voice orbs (they react to real audio volume) and the landing-page preview; `prefers-reduced-motion` is respected.

Design tokens live in `src/app/globals.css` (`@theme`). Shared UI is in `src/components/ui.tsx`.

## Security

- **Same-origin API.** The browser only calls `/api/v1/*` on this site; Next.js forwards it to the Go API. Session
  cookies stay first-party and `HttpOnly`, and no CORS is needed. The agent-only `/internal/*` routes are never forwarded.
- **Strict Content-Security-Policy** with a fresh nonce per request (`src/proxy.ts`): only our own scripts run.
- **Security headers:** HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict `Referrer-Policy`, and a `Permissions-Policy` that allows only the microphone.
- **CSRF:** every state-changing request sends the double-submit token (`src/lib/api-client.ts`).
- **Safe redirects:** `?next=` only accepts paths on this site.
- **Validation:** forms are checked in the browser with the same rules as the server, which always re-validates.
- **Route protection:** `src/proxy.ts` redirects guests away from private pages; each page also verifies the session
  and role with the API before rendering.
