
- Per-route search titles/descriptions live in src/seo/routeMeta.ts; seo-prerender.ts writes a static dist/<route>/index.html for each at build so crawlers that skip JavaScript see unique pages. Add new public routes there.
