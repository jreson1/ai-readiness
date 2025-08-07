# Diversicom AI Readiness Finder (Next.js App Router)

This is a minimal Next.js project that serves the AI Readiness Finder at `/apps/ai-readiness`.
It uses TailwindCSS for styling and `recharts` + `lucide-react` for charts/icons.
No shadcn/ui required for this packaged version.

## Quick Start (Local)
```bash
npm install
npm run dev
# Open http://localhost:3000/apps/ai-readiness
```

## Configure iframe embedding (already set)
`next.config.js` adds a CSP header that allows embedding the app on:
- https://www.diversicomcorp.com
- https://diversicomcorp.com

If you use a WordPress security/CSP plugin, also allowlist https://apps.diversicomcorp.com

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import the repo in Vercel, deploy with defaults.
3. Add a custom domain `apps.diversicomcorp.com` under Project → Settings → Domains.
4. Create a CNAME DNS record for `apps` pointing to the target Vercel provides.
5. Visit `https://apps.diversicomcorp.com/apps/ai-readiness`

## Embed in Elementor
Use an HTML widget and paste:
```html
<div style="max-width:1200px;margin:0 auto;">
  <iframe
    src="https://apps.diversicomcorp.com/apps/ai-readiness"
    title="AI Readiness Finder"
    loading="lazy"
    style="width:100%;min-height:1600px;border:0;border-radius:16px;overflow:hidden;"
    allow="clipboard-read; clipboard-write"
  ></iframe>
</div>
```

## Lead Capture (optional)
Open `app/apps/ai-readiness/page.tsx` and set:
```ts
const WEBHOOK_URL = "https://hooks.zapier.com/your-webhook";
const CTA_URL = "https://www.diversicomcorp.com/contact/";
const ORG_NAME = "Diversicom";
```

When `WEBHOOK_URL` is set, the page will POST results to your endpoint from the browser.
