const SITE = {
  phone: "(41) 3026-3491",
  whatsapp: "554130263491",
  email: "linkforte@linkforte.com.br",
  address: "Rua Chile, 2211 - Sobreloja, Rebouças, CEP 80220-181 - Curitiba - Paraná",
  cnpj: "30.284.480/0001-20",
};

function getBasePath() {
  const path = window.location.pathname.replace(/\\/g, "/");
  return path.includes("/produto/") ? "../" : "";
}

function assetPath(relativePath) {
  return `${getBasePath()}${relativePath}`;
}

function productPath(slug) {
  return `${getBasePath()}produto/${slug}.html`;
}

function formatPriceDisplay(product) {
  if (product.priceRange) {
    return `R$ ${product.priceMin} - R$ ${product.priceMax}`;
  }
  return `R$ ${product.priceMin}`;
}

function getProductSlug() {
  const fromBody = document.body.dataset.slug;
  if (fromBody) return fromBody;

  const params = new URLSearchParams(window.location.search);
  if (params.get("slug")) return params.get("slug");

  const parts = window.location.pathname.replace(/\\/g, "/").split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "produto");
  if (idx >= 0 && parts[idx + 1]) {
    return parts[idx + 1].replace(/\.html$/, "");
  }

  return null;
}

const INFO_ICON = `<svg aria-hidden="true" viewBox="0 0 512 512" width="18" height="18"><path fill="currentColor" d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"/></svg>`;

function productCard(product) {
  const price = formatPriceDisplay(product);
  const url = productPath(product.slug);
  const img = assetPath(product.image);
  return `
    <article class="product-card">
      <a href="${url}" class="product-card__image">
        <img src="${img}" alt="${product.name}" loading="lazy" onerror="this.src='${assetPath("assets/images/LINKFORTE-vetor.png")}'">
      </a>
      <div class="product-card__body">
        <h3 class="product-card__title">
          <a href="${url}">${product.name}</a>
        </h3>
        <div class="product-card__price">${price}</div>
        <div class="product-card__installment">Em até 3x de R$ ${product.installment} sem juros</div>
        <div class="product-card__pix">À vista R$ ${product.priceMin} no Pix</div>
        <a href="${url}" class="product-card__info-btn">${INFO_ICON} Saiba mais</a>
      </div>
      <a href="${url}" class="product-card__buy-btn">Comprar</a>
    </article>
  `;
}

async function loadProducts(limit) {
  const res = await fetch(`${getBasePath()}data/products.json`);
  const products = await res.json();
  return limit ? products.slice(0, limit) : products;
}

async function renderProductGrid(selector, limit, excludeSlug) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    let products = await loadProducts();
    if (excludeSlug) {
      products = products.filter((p) => p.slug !== excludeSlug);
    }
    if (limit) products = products.slice(0, limit);
    el.innerHTML = products.map(productCard).join("");
  } catch {
    el.innerHTML = '<p class="text-center">Não foi possível carregar os produtos.</p>';
  }
}

const WPP_ICON = `<svg aria-hidden="true" viewBox="0 0 448 512" width="20" height="20" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>`;

function parsePrice(priceMin) {
  return parseFloat(priceMin.replace(/\./g, "").replace(",", "."));
}

function formatBRL(value) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildInstallmentTableRows(priceMin) {
  const price = parsePrice(priceMin);
  const rows = [];
  for (let i = 1; i <= 9; i++) {
    const parcel = price / i;
    const withFee = i > 3;
    const total = withFee ? parcel * i * 1.05 : price;
    const label = withFee ? "com juros" : "sem juros";
    rows.push(`<tr class="${withFee ? "with-fee" : "no-fee"}"><th class="final-text">${i}x de <span class="amount">R$&nbsp;${formatBRL(parcel)}</span> ${label}</th><th class="final-price"><span class="amount">R$&nbsp;${formatBRL(withFee ? total : price)}</span></th></tr>`);
  }
  return rows.join("");
}

function priceBlockHtml(product) {
  const mainPrice = product.priceRange
    ? `R$&nbsp;${product.priceMin} - R$&nbsp;${product.priceMax}`
    : `R$&nbsp;${product.priceMin}`;

  return `
    <div class="woo-custom-installments-group">
      <div class="woo-custom-installments-group-main-price">
        <span class="woo-custom-installments-price"><span class="amount">${mainPrice}</span></span>
      </div>
      <span class="woo-custom-installments-card-container">
        <span class="woo-custom-installments-details-without-fee">
          <i class="fa-regular fa-credit-card"></i>
          <span class="woo-custom-installments-details best-value no-fee">Em até 3x de <span class="amount">R$&nbsp;${product.installment}</span> sem juros</span>
        </span>
      </span>
      <span class="woo-custom-installments-offer">
        <i class="fa-brands fa-pix"></i>
        <span class="discount-before-price">À vista</span>
        <span class="discounted-price"><span class="amount">R$&nbsp;${product.priceMin}</span></span>
        <span class="discount-after-price">no Pix</span>
      </span>
    </div>
  `;
}

function initProductPageInteractions(root, product) {
  const wppUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Olá! Quero comprar: ${product.name}`)}`;

  root.querySelector(".js-wpp-buy")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(wppUrl, "_blank");
  });

  root.querySelector(".js-add-cart")?.addEventListener("click", (e) => {
    e.preventDefault();
    const qty = root.querySelector(".qty")?.value || "1";
    window.open(`${wppUrl} (Quantidade: ${qty})`, "_blank");
  });

  const qtyInput = root.querySelector(".qty");
  root.querySelector(".minus")?.addEventListener("click", () => {
    if (qtyInput && Number(qtyInput.value) > 1) qtyInput.value = String(Number(qtyInput.value) - 1);
  });
  root.querySelector(".plus")?.addEventListener("click", () => {
    if (qtyInput && Number(qtyInput.value) < 10) qtyInput.value = String(Number(qtyInput.value) + 1);
  });

  const modal = root.querySelector(".wci-modal");
  root.querySelector(".wci-open-popup")?.addEventListener("click", () => modal?.classList.add("open"));
  root.querySelector(".wci-modal__close")?.addEventListener("click", () => modal?.classList.remove("open"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  const tabs = root.querySelectorAll(".woocommerce-tabs ul.tabs li a");
  const panels = root.querySelectorAll(".woocommerce-Tabs-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const id = tab.getAttribute("href")?.replace("#", "");
      root.querySelectorAll(".woocommerce-tabs ul.tabs li").forEach((li) => li.classList.remove("active"));
      tab.parentElement?.classList.add("active");
      panels.forEach((p) => p.classList.toggle("active", p.id === id));
    });
  });
}

async function renderProductDetail() {
  const slug = getProductSlug();
  const container = document.getElementById("product-page-root");
  if (!container) return;

  if (!slug) {
    container.innerHTML = `<div class="product-not-found"><h2>Produto não encontrado</h2><p><a href="${assetPath("loja.html")}">Ir para a loja</a></p></div>`;
    return;
  }

  try {
    const products = await loadProducts();
    const product = products.find((p) => p.slug === slug);
    if (!product) {
      container.innerHTML = "<p>Produto não encontrado.</p>";
      return;
    }

    document.title = `${product.name} | Link Forte`;
    const img = assetPath(product.image);
    const desc = product.description || "Consulte nossa equipe para mais detalhes sobre este certificado.";

    container.innerHTML = `
      <div class="elementor elementor-626 product-page-wrapper">
        <section class="elementor-section elementor-top-section elementor-element elementor-element-2535920">
          <div class="elementor-background-overlay"></div>
          <div class="elementor-container elementor-column-gap-default">
            <div class="elementor-column elementor-col-100 elementor-top-column elementor-element elementor-element-951f3f4">
              <div class="elementor-widget-wrap elementor-element-populated">
                <section class="elementor-section elementor-inner-section elementor-element elementor-element-ecb86cb">
                  <div class="elementor-container elementor-column-gap-default">
                    <div class="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-34c2fe9">
                      <div class="elementor-widget-wrap elementor-element-populated">
                        <div class="elementor-element elementor-element-6e556d6 elementor-widget elementor-widget-shopengine-breadcrumbs">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-breadcrumbs">
                                <nav class="woocommerce-breadcrumb">
                                  <a href="${assetPath("index.html")}">Início</a>
                                  <i class="fas fa-arrow-right" aria-hidden="true"></i>
                                  <a href="${assetPath("loja.html")}">${product.category}</a>
                                  <i class="fas fa-arrow-right" aria-hidden="true"></i>
                                  ${product.name}
                                </nav>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="elementor-element elementor-element-7acbb84 elementor-widget elementor-widget-shopengine-single-product-images">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-product-image shopengine-gallery-slider-no">
                                <button type="button" class="shopengine-product-image-toggle position-top-right" aria-label="Ampliar imagem">
                                  <svg aria-hidden="true" viewBox="0 0 448 512" width="18" height="18" fill="currentColor"><path d="M212.686 315.314 120 408l32.922 31.029c15.12 15.12 4.412 40.971-16.97 40.971h-112C10.697 480 0 469.255 0 456V344c0-21.382 25.803-32.09 40.922-16.971L72 360l92.686-92.686c6.248-6.248 16.379-6.248 22.627 0l25.373 25.373c6.249 6.248 6.249 16.378 0 22.627zm22.628-118.628L328 104l-32.922-31.029C279.958 57.851 290.666 32 312.048 32h112C437.303 32 448 42.745 448 56v112c0 21.382-25.803 32.09-40.922 16.971L376 152l-92.686 92.686c-6.248 6.248-16.379 6.248-22.627 0l-25.373-25.373c-6.249-6.248-6.249-16.378 0-22.627z"/></svg>
                                </button>
                                <div class="woocommerce-product-gallery images">
                                  <div class="woocommerce-product-gallery__wrapper">
                                    <div class="woocommerce-product-gallery__image">
                                      <img src="${img}" alt="${product.name}" onerror="this.src='${assetPath("assets/images/LINKFORTE-vetor.png")}'">
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="elementor-column elementor-col-50 elementor-inner-column elementor-element elementor-element-458b62a">
                      <div class="elementor-widget-wrap elementor-element-populated">
                        <div class="elementor-element elementor-element-bdbe255 shopengine_product_title_h2 elementor-widget elementor-widget-shopengine-product-title">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-product-title"><h2 class="product-title">${product.name}</h2></div>
                            </div>
                          </div>
                        </div>
                        <div class="elementor-element elementor-element-74953e5 elementor-widget elementor-widget-shopengine-product-price">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-product-price">
                                <p class="woo-custom-installments-price-container price">${priceBlockHtml(product)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="elementor-element elementor-element-194d8a5 elementor-widget elementor-widget-button">
                          <div class="elementor-widget-container">
                            <div class="elementor-button-wrapper">
                              <a href="#" class="elementor-button elementor-size-sm js-wpp-buy">
                                <span class="elementor-button-content-wrapper">
                                  <span class="elementor-button-icon">${WPP_ICON}</span>
                                  <span class="elementor-button-text">COMPRAR PELO WPP</span>
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div class="elementor-element elementor-element-45013da shopengine-add-to-cart-ordering-yes elementor-widget elementor-widget-shopengine-add-to-cart">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-swatches">
                                <button type="button" class="wci-open-popup"><span class="open-popup-text">Detalhes do parcelamento</span></button>
                                <form class="cart">
                                  <div class="quantity-wrap both">
                                    <button type="button" class="minus" aria-label="Diminuir">−</button>
                                    <div class="quantity">
                                      <input type="number" class="qty" value="1" min="1" max="10" aria-label="Quantidade">
                                    </div>
                                    <button type="button" class="plus" aria-label="Aumentar">+</button>
                                    <button type="button" class="single_add_to_cart_button button alt js-add-cart">Adicionar ao carrinho</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="elementor-element elementor-element-e595f3b elementor-widget elementor-widget-shopengine-product-meta">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-product-meta">
                                <div class="product_meta">
                                  <span class="posted_in">Categoria: <a href="${assetPath("loja.html")}">${product.category}</a></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
                <section class="elementor-section elementor-inner-section elementor-element elementor-element-f7240e6">
                  <div class="elementor-container elementor-column-gap-default">
                    <div class="elementor-column elementor-col-100 elementor-inner-column elementor-element elementor-element-a135216">
                      <div class="elementor-widget-wrap elementor-element-populated">
                        <div class="elementor-element elementor-element-010deea elementor-widget elementor-widget-shopengine-product-tabs">
                          <div class="elementor-widget-container">
                            <div class="shopengine shopengine-widget">
                              <div class="shopengine-product-tabs">
                                <div class="woocommerce-tabs wc-tabs-wrapper">
                                  <ul class="tabs wc-tabs" role="tablist">
                                    <li class="description_tab active" id="tab-title-description"><a href="#tab-description" role="tab">Descrição</a></li>
                                    <li class="additional_information_tab" id="tab-title-additional_information"><a href="#tab-additional_information" role="tab">Informação adicional</a></li>
                                  </ul>
                                  <div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--description panel entry-content wc-tab active" id="tab-description" role="tabpanel">
                                    ${desc}
                                  </div>
                                  <div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--additional_information panel entry-content wc-tab" id="tab-additional_information" role="tabpanel">
                                    <h2>Informação adicional</h2>
                                    <table class="woocommerce-product-attributes shop_attributes">
                                      <tr class="woocommerce-product-attributes-item">
                                        <th class="woocommerce-product-attributes-item__label" scope="row">Validade</th>
                                        <td class="woocommerce-product-attributes-item__value"><a href="#">${product.validity || "12 Meses"}</a></td>
                                      </tr>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
        <section class="lf-related-section">
          <div class="elementor-container">
            <h2>Você pode gostar também</h2>
            <div id="related-products" class="products-grid"></div>
          </div>
        </section>
        <div class="wci-modal" aria-hidden="true">
          <div class="wci-modal__content">
            <div class="wci-modal__header">
              <h5>Formas de pagamento</h5>
              <button type="button" class="wci-modal__close" aria-label="Fechar">&times;</button>
            </div>
            <div class="wci-modal__body">
              <h4>Parcelas:</h4>
              <table class="woo-custom-installments-table">
                <tbody>${buildInstallmentTableRows(product.priceMin)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    initProductPageInteractions(container, product);
    renderProductGrid("#related-products", 4, slug);
  } catch {
    container.innerHTML = "<p>Erro ao carregar produto. Use um servidor local (npm run serve).</p>";
  }
}

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = data.get("nome") || "";
    const msg = data.get("mensagem") || "";
    const text = `Olá! Meu nome é ${nome}. ${msg}`;
    window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  });
}

function setActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });
}

async function loadSiteConfig() {
  const res = await fetch(`${getBasePath()}data/site.json`);
  return res.json();
}

function findLowestPrice(products) {
  let lowest = null;
  for (const product of products) {
    const value = parsePrice(product.priceMin);
    if (lowest === null || value < lowest.value) {
      lowest = { value, priceMin: product.priceMin, installment: product.installment };
    }
  }
  return lowest;
}

function initHeroRotator(headlines, intervalMs) {
  const el = document.querySelector("[data-hero-rotator]");
  if (!el || !headlines?.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || headlines.length <= 1) return;

  let index = 0;

  setInterval(() => {
    el.classList.add("is-fading");
    setTimeout(() => {
      index = (index + 1) % headlines.length;
      el.innerHTML = headlines[index];
      el.classList.remove("is-fading");
    }, 500);
  }, intervalMs || 4000);
}

async function renderHeroPriceWidget() {
  const el = document.getElementById("hero-price");
  if (!el) return;

  try {
    const products = await loadProducts();
    const lowest = findLowestPrice(products);
    if (!lowest) return;

    const installment = (lowest.value / 3).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    el.innerHTML = `
      <p class="hero-price__main">A partir de <strong>R$&nbsp;${lowest.priceMin}</strong></p>
      <p class="hero-price__sub">Em até 3x de R$&nbsp;${installment} sem juros · À vista no Pix</p>
    `;
  } catch {
    /* mantém fallback estático do HTML */
  }
}

function initHeroWhatsApp(message) {
  const btn = document.querySelector(".js-hero-wpp");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const text = message || "Olá! Gostaria de falar com um especialista sobre certificado digital.";
    window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  });
}

async function initHeroHome() {
  if (document.body.dataset.page !== "home") return;

  try {
    const config = await loadSiteConfig();
    const hero = config.hero || {};

    if (hero.eyebrow) {
      const eyebrow = document.querySelector(".hero-eyebrow");
      if (eyebrow) eyebrow.textContent = hero.eyebrow;
    }

    if (hero.subtitle) {
      const subtitle = document.querySelector(".hero-subtitle");
      if (subtitle) {
        subtitle.innerHTML = hero.subtitle.replace(
          /certificado digital/gi,
          '<span>certificado digital</span>'
        );
      }
    }

    initHeroRotator(hero.headlines, hero.rotateIntervalMs);
    initHeroWhatsApp(hero.whatsappMessage);
  } catch {
    initHeroWhatsApp();
  }

  renderHeroPriceWidget();
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initContactForm();
  setActiveNav();
  initHeroHome();
  renderProductGrid("#products-home", 8);
  renderProductGrid("#products-shop");
  renderProductDetail();
});
