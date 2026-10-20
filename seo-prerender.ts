import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import { ROUTE_META, type RouteMeta } from "./src/seo/routeMeta";

const SITE = "https://newtonai.site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Read blog post slugs/titles/excerpts from the blog list source. */
function blogMeta(root: string): RouteMeta[] {
  try {
    const src = fs.readFileSync(path.join(root, "src/pages/Blog.tsx"), "utf8");
    const out: RouteMeta[] = [];
    const re = /slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*(?:excerpt|description):\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      out.push({ path: `/blog/${m[1]}`, title: `${m[2]} | NewtonAI`.slice(0, 90), description: m[3], h1: m[2] });
    }
    return out;
  } catch {
    return [];
  }
}

function render(base: string, r: RouteMeta): string {
  const target = r.redirectTo ?? r.path;
  const url = `${SITE}${target}`;
  const t = esc(r.title);
  const d = esc(r.description);
  let html = base
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${d}">`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title"[^>]*>/g, `<meta property="og:title" content="${t}">`)
    .replace(/<meta name="twitter:title"[^>]*>/g, `<meta name="twitter:title" content="${t}">`)
    .replace(/<meta property="og:description"[^>]*>/g, `<meta property="og:description" content="${d}">`)
    .replace(/<meta name="twitter:description"[^>]*>/g, `<meta name="twitter:description" content="${d}">`)
    .replace(/<link rel="canonical"[^>]*>/g, "");
  let head = `<link rel="canonical" href="${url}" />`;
  if (r.redirectTo) head += `<meta http-equiv="refresh" content="0; url=${r.redirectTo}" />`;
  html = html.replace("</head>", `${head}\n</head>`);
  // Readable content for crawlers that don't run JavaScript. React replaces it on load.
  const body = `<div id="seo-static" style="position:absolute;left:-9999px;top:0"><h1>${esc(r.h1)}</h1><p>${d}</p><p><a href="/">NewtonAI home</a> · <a href="/tools">AI study tools</a> · <a href="/pricing">Pricing</a></p></div>`;
  return html.replace('<div id="root">', `<div id="root">${body}`);
}

/** Writes dist/<route>/index.html for every public route with unique head tags. */
export function seoPrerender(): Plugin {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "newtonai-seo-prerender",
    apply: "build",
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
      root = c.root;
    },
    closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, "utf8");
      for (const r of [...ROUTE_META, ...blogMeta(root)]) {
        const dir = path.join(outDir, r.path);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), render(base, r));
      }
      // Home page also gets an explicit canonical.
      if (!/rel="canonical"/.test(base)) {
        fs.writeFileSync(indexPath, base.replace("</head>", `<link rel="canonical" href="${SITE}/" />\n</head>`));
      }
    },
  };
}
