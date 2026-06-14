import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rawDir = path.join(root, "_raw");
const siteDir = path.join(root, "site");
const imagesDir = path.join(siteDir, "assets", "images");
const dataDir = path.join(siteDir, "data");

function decodeHtml(html = "") {
  return html
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(cents) {
  return (Number(cents) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  execSync(`curl.exe -sL "${url}" -o "${dest}"`, { stdio: "pipe" });
  return dest;
}

function parsePriceStr(priceStr) {
  return parseFloat(String(priceStr).replace(/\./g, "").replace(",", "."));
}

function seedPriceForYears(product, years) {
  const min = parsePriceStr(product.priceMin);
  const max = parsePriceStr(product.priceMax);
  if (!product.priceRange) {
    if (years === 1) return min;
    if (years === 2) return Math.round(min * 1.35 * 100) / 100;
    return Math.round(min * 1.7 * 100) / 100;
  }
  if (years === 1) return min;
  if (years === 2) return Math.round(((min + max) / 2) * 100) / 100;
  return max;
}

function buildPricingKey(type, model, a3Variant, years) {
  if (model === "A3" && a3Variant) return `${type}|A3|${a3Variant}|${years}`;
  return `${type}|${model}|${years}`;
}

function seedPricingEntries(productList) {
  const catalog = Object.fromEntries(productList.map((p) => [p.slug, p]));
  const specs = [
    ["ecpf", "A1", null, "e-cpf-a1-em-arquivo"],
    ["ecpf", "A3", "token", "e-cpf-a3-token"],
    ["ecpf", "A3", "leitora", "e-cpf-a3-leitora-smart-card"],
    ["ecpf", "A3", "sem_midia", "e-cpf-a3-sem-midia-inclusa"],
    ["ecnpj", "A1", null, "e-cnpj-a1-em-arquivo"],
    ["ecnpj", "A3", "token", "e-cnpj-a3-token"],
    ["ecnpj", "A3", "leitora", "e-cnpj-a3-leitora-smart-card"],
    ["ecnpj", "A3", "sem_midia", "e-cnpj-a3-sem-midia-inclusa"],
  ];

  const entries = [];
  for (const [type, model, a3Variant, slug] of specs) {
    const product = catalog[slug];
    if (!product) continue;
    for (const years of [1, 2, 3]) {
      entries.push({
        key: buildPricingKey(type, model, a3Variant, years),
        type,
        model,
        a3Variant,
        years,
        price: seedPriceForYears(product, years),
        slug,
      });
    }
  }
  return entries;
}

function mergePricingFile(productList) {
  const pricingPath = path.join(dataDir, "pricing.json");
  let existing = { version: "2026.06.14", effectiveFrom: new Date().toISOString(), currency: "BRL", entries: [] };
  try {
    existing = JSON.parse(fs.readFileSync(pricingPath, "utf8"));
  } catch {
    /* novo arquivo */
  }

  const byKey = new Map((existing.entries || []).map((e) => [e.key, e]));
  for (const entry of seedPricingEntries(productList)) {
    if (!byKey.has(entry.key)) byKey.set(entry.key, entry);
  }

  const merged = {
    ...existing,
    currency: existing.currency || "BRL",
    entries: [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };

  fs.writeFileSync(pricingPath, JSON.stringify(merged, null, 2));
}

const productsRaw = JSON.parse(
  fs.readFileSync(path.join(rawDir, "products.json"), "utf8")
);

const products = productsRaw.map((p) => {
  const imageUrl = p.images?.[0]?.src || "";
  let imageLocal = "";
  if (imageUrl) {
    const filename = `${p.slug}${path.extname(new URL(imageUrl).pathname) || ".avif"}`;
    imageLocal = `assets/images/products/${filename}`;
    download(imageUrl, path.join(siteDir, imageLocal));
  }

  const min = p.prices?.price_range?.min_amount || p.prices?.price;
  const max = p.prices?.price_range?.max_amount || p.prices?.price;
  const priceMin = formatPrice(min);
  const priceMax = formatPrice(max);
  const installment = (Number(min) / 100 / 3).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const validity =
    p.attributes?.find((a) => a.name === "Validade")?.terms?.[0]?.name || "12 Meses";

  return {
    id: p.id,
    slug: p.slug,
    name: decodeHtml(p.name),
    permalink: p.permalink,
    type: p.type,
    category: "Sem categoria",
    image: imageLocal,
    imageUrl,
    priceMin,
    priceMax,
    priceRange: priceMin !== priceMax,
    installment,
    validity,
    description: decodeHtml(p.description),
    shortDescription: decodeHtml(p.short_description),
  };
});

const productPageTemplate = (slug) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Produto | Link Forte</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="../assets/css/style.css">
  <link rel="stylesheet" href="../assets/css/mega-nav.css">
  <link rel="stylesheet" href="../assets/css/product-layout.css">
  <link rel="stylesheet" href="../assets/css/product-original.css">
  <link rel="icon" href="../assets/images/LINKFORTE-vetor.png">
</head>
<body data-page="produto" data-slug="${slug}">
  <div class="topbar"><div class="container"><a href="https://wa.me/554130263491" target="_blank" rel="noopener">(41) 3026-3491</a><a href="mailto:linkforte@linkforte.com.br">linkforte@linkforte.com.br</a></div></div>
  <header class="header">
    <div class="container">
      <a href="../index.html" class="logo"><img src="../assets/images/LINKFORTE-vetor.png" alt="Link Forte"></a>
      <nav class="nav js-mega-nav" aria-label="Menu principal"></nav>
      <button class="menu-toggle" aria-label="Abrir menu"><svg viewBox="0 0 1000 1000"><path d="M104 333H896C929 333 958 304 958 271S929 208 896 208H104C71 208 42 237 42 271S71 333 104 333ZM104 583H896C929 583 958 554 958 521S929 458 896 458H104C71 458 42 487 42 521S71 583 104 583ZM104 833H896C929 833 958 804 958 771S929 708 896 708H104C71 708 42 737 42 771S71 833 104 833Z"/></svg></button>
    </div>
  </header>
  <main id="product-page-root"></main>
  <footer class="footer"><div class="container"><div class="footer-bottom"><p>© 2026 Link Forte Solucoes Digitais LTDA - CNPJ: 30.284.480/0001-20</p></div></div></footer>
  <a href="https://wa.me/554130263491" class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg></a>
  <script src="../assets/js/main.js"></script>
</body>
</html>`;

const produtoDir = path.join(siteDir, "produto");
fs.mkdirSync(produtoDir, { recursive: true });
for (const product of products) {
  fs.writeFileSync(
    path.join(produtoDir, `${product.slug}.html`),
    productPageTemplate(product.slug)
  );
}

const pagesRaw = JSON.parse(
  fs.readFileSync(path.join(rawDir, "pages.json"), "utf8")
);

const pageSlugs = {
  "sobre-nos": "quem-somos",
  "seja-parceiro": "seja-parceiro",
  contato: "contato",
  loja: "loja",
};

const pages = {};
for (const page of pagesRaw) {
  const key = pageSlugs[page.slug];
  if (!key) continue;
  pages[key] = {
    title: decodeHtml(page.title.rendered),
    slug: key,
    excerpt: decodeHtml(page.excerpt?.rendered || ""),
    contentText: decodeHtml(page.content.rendered),
    link: page.link,
  };
}

const sitePath = path.join(dataDir, "site.json");
let existingHero;
let existingNavigation;
try {
  const existing = JSON.parse(fs.readFileSync(sitePath, "utf8"));
  existingHero = existing.hero;
  existingNavigation = existing.navigation;
} catch {
  existingHero = undefined;
  existingNavigation = undefined;
}

const site = {
  name: "Link Forte",
  tagline: "Certificado Digital | Curitiba",
  phone: "(41) 3026-3491",
  whatsapp: "554130263491",
  email: "linkforte@linkforte.com.br",
  address: "Rua Chile, 2211 - Sobreloja, Rebouças, CEP 80220-181 - Curitiba - Paraná",
  cnpj: "30.284.480/0001-20",
  social: {
    instagram: "https://www.instagram.com/linkforte",
    facebook: "https://www.facebook.com/linkforte",
  },
  scrapedAt: new Date().toISOString(),
  source: "https://linkforte.com.br",
};

if (existingHero) site.hero = existingHero;
if (existingNavigation) site.navigation = existingNavigation;

fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(
  path.join(dataDir, "products.json"),
  JSON.stringify(products, null, 2)
);
fs.writeFileSync(path.join(dataDir, "pages.json"), JSON.stringify(pages, null, 2));
fs.writeFileSync(sitePath, JSON.stringify(site, null, 2));
mergePricingFile(products);

console.log(`Produtos: ${products.length}`);
console.log(`Páginas de produto geradas: ${products.length}`);
console.log(`Páginas: ${Object.keys(pages).length}`);
console.log("Dados salvos em site/data/");
