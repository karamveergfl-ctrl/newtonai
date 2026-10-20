
- Per-route search titles/descriptions live in src/seo/routeMeta.ts; seo-prerender.ts writes a static dist/<route>/index.html for each at build so crawlers that skip JavaScript see unique pages. Add new public routes there.
- Mobile-view guard: index.html includes an inline script after the viewport meta that forces a phone-width layout when the physical screen is <500 CSS px but the layout viewport is wider (browser "Desktop site" mode); it re-checks on resize/orientationchange. Why: QR visitors on phones whose browser requests the desktop version must still see the mobile layout.
