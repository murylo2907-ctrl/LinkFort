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

const NAV_CHEVRON = `<svg class="mega-nav__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>`;

const NAV_ICONS = {
  certificate: `<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5.05-3.03 9.67-7.75 11.65L12 22l-.25-.35C7.03 19.67 4 15.05 4 12V6l8-4zm0 2.18L6 7.5V12c0 2.45 1.85 5.83 6 7.88 4.15-2.05 6-5.43 6-7.88V7.5l-6-3.32z"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.62-9.6 4.8V22h19.2v-2.4c0-3.18-6.4-4.8-9.6-4.8z"/></svg>`,
  building: `<svg viewBox="0 0 24 24"><path d="M4 21V3h10v18H4zm12 0V9h4v12h-4zM8 7h2v2H8V7zm0 4h2v2H8v-2zm4-4h2v2h-2V7zm0 4h2v2h-2v-2z"/></svg>`,
  stethoscope: `<svg viewBox="0 0 24 24"><path d="M19 8a3 3 0 00-3 3v1.5a4.5 4.5 0 01-4.5 4.5h-.5a4.5 4.5 0 01-4.5-4.5V11a3 3 0 10-6 0v2.5A6.5 6.5 0 0010 20h.5v2h3v-2H14a6.5 6.5 0 006-6.5V11a3 3 0 003-3z"/></svg>`,
  scale: `<svg viewBox="0 0 24 24"><path d="M12 2l3 7h4l-5.5 6.5L16 22H8l2.5-6.5L5 9h4l3-7z"/></svg>`,
  handshake: `<svg viewBox="0 0 24 24"><path d="M11 6V3h2v3h3v2h-3v3h-2V8H8V6h3zm-1 5.5l2 2 4-4 1.4 1.4-5.4 5.4-3.4-3.4L6 14.9 4.6 13.5 10 8.1l2 2 2-2 1.4 1.4-2 2z"/></svg>`,
  headset: `<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7v4a3 3 0 003 3h1v-5H7v-2a5 5 0 0110 0v2h-2v5h1a3 3 0 003-3V9a7 7 0 00-7-7z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.4 4.8 6.2 6.2l2.1-2.1c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.1 21 3 13.9 3 5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.4 5.3L2 22l4.9-1.3A9.9 9.9 0 0012 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm5.2 14.2c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .2-2.4-.5-2-.8-3.3-2.7-3.4-2.8-.1-.1-1.4-1.8-1.4-3.5s.9-2.5 1.2-2.8c.3-.3.7-.4 1-.4h.7c.2 0 .5-.1.7.5.2.6.8 2 .9 2.1.1.1.1.3 0 .4-.1.2-.2.3-.3.5-.1.1-.2.2-.3.3-.1.1-.2.2-.1.4.1.2.6 1 1.3 1.6.9.8 1.6 1 1.9 1.1.3.1.5.1.7-.1.2-.2.8-1 1-1.3.2-.3.5-.2.7-.1.2.1 1.4.7 1.6.8.2.1.3.2.4.3-.1.1-.1.1-.3.7z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A5.5 5.5 0 1111.5 18 5.5 5.5 0 0112 7.5zm0 2A3.5 3.5 0 1015.5 13 3.5 3.5 0 0012 9.5zM17.8 6.2a1.2 1.2 0 11-1.2 1.2 1.2 1.2 0 011.2-1.2z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24"><path d="M13 3h4a1 1 0 011 1v3h-3a2 2 0 00-2 2v3h5l-1 4h-4v8h-4v-8H7v-4h4V8a5 5 0 015-5z"/></svg>`,
};

function navHref(href, basePath) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href;
  return `${basePath}${href}`;
}

function navIcon(name) {
  return NAV_ICONS[name] || NAV_ICONS.certificate;
}

function groupProductsForNav(products) {
  const groups = { ecpf: [], ecnpj: [], profissionais: [] };
  for (const product of products) {
    const name = product.name.toLowerCase();
    const slug = product.slug.toLowerCase();
    if (name.includes("e-cpf") || slug.startsWith("e-cpf")) groups.ecpf.push(product);
    else if (name.includes("e-cnpj") || slug.startsWith("e-cnpj")) groups.ecnpj.push(product);
    else if (
      name.includes("médico") ||
      name.includes("medico") ||
      slug.includes("medico") ||
      name.includes("advogado") ||
      slug.includes("advogado")
    ) {
      groups.profissionais.push(product);
    }
  }
  return groups;
}

function renderNavProductLink(product, iconName) {
  const price = formatPriceDisplay(product);
  const slugAttr = product.slug ? ` data-nav-product="${product.slug}"` : "";
  return `
    <li>
      <a href="${productPath(product.slug)}" class="mega-nav__col-link"${slugAttr}>
        <span class="mega-nav__col-link-icon">${navIcon(iconName)}</span>
        <span class="mega-nav__col-link-text">
          <span>${product.name}</span>
          <span class="mega-nav__col-link-price">${price}</span>
        </span>
      </a>
    </li>`;
}

function renderNavColLink(link, basePath) {
  const href = navHref(link.href, basePath);
  const external = link.external ? ' target="_blank" rel="noopener"' : "";
  const dataNav = link.dataNav ? ` data-nav="${link.dataNav}"` : "";
  return `
    <li>
      <a href="${href}" class="mega-nav__col-link"${dataNav}${external}>
        <span class="mega-nav__col-link-icon">${navIcon(link.icon || "certificate")}</span>
        <span class="mega-nav__col-link-text"><span>${link.label}</span></span>
      </a>
    </li>`;
}

function renderPromoAside(promo, { priceLine, whatsappHref } = {}) {
  const href = whatsappHref || navHref(promo.href || "#", getBasePath());
  const external = whatsappHref ? ' target="_blank" rel="noopener"' : "";
  return `
    <aside class="mega-nav__promo">
      <h3 class="mega-nav__promo-title">${promo.title}</h3>
      ${promo.text ? `<p class="mega-nav__promo-text">${promo.text}</p>` : ""}
      ${priceLine ? `<p class="mega-nav__promo-price">${priceLine}</p>` : ""}
      <a href="${href}" class="mega-nav__promo-cta"${external}>${promo.cta || "Saiba mais"}</a>
    </aside>`;
}

function renderCertificadosPanel(groups, navConfig, lowest, basePath) {
  const promo = navConfig?.certificados?.promo || {};
  const priceLine = lowest ? `A partir de <strong>R$&nbsp;${lowest.priceMin}</strong>` : "";
  const promoHtml = renderPromoAside(
    { ...promo, href: promo.href || "loja.html#cotador-certificado", cta: promo.cta || "Abrir configurador" },
    { priceLine }
  );

  const col = (title, items, icon, showFooter) => `
    <div class="mega-nav__col">
      <h3 class="mega-nav__col-title">${title}</h3>
      <ul class="mega-nav__col-links">${items.map((p) => renderNavProductLink(p, icon)).join("")}</ul>
      ${showFooter ? `<div class="mega-nav__col-footer"><a href="${navHref("loja.html", basePath)}" data-nav="loja">Ver todos os certificados</a></div>` : ""}
    </div>`;

  return `
    <div id="mega-panel-certificados" class="mega-nav__panel" role="region" aria-label="Certificados" hidden>
      <div class="mega-nav__panel-inner">
        <div class="mega-nav__grid mega-nav__grid--cert">
          ${col("Pessoa física", groups.ecpf, "user", false)}
          ${col("Pessoa jurídica", groups.ecnpj, "building", false)}
          ${col("Profissionais", groups.profissionais, "stethoscope", true)}
          ${promoHtml}
        </div>
      </div>
    </div>`;
}

function renderParceriasPanel(navConfig, basePath) {
  const section = navConfig?.parcerias || {};
  const links = (section.links || []).map((l) => renderNavColLink(l, basePath)).join("");
  const promo = section.promo || {
    title: "Seja parceiro Link Forte",
    text: "Revenda certificados digitais com suporte da nossa equipe.",
    cta: "Quero ser parceiro",
    href: "seja-parceiro.html",
  };

  return `
    <div id="mega-panel-parcerias" class="mega-nav__panel" role="region" aria-label="Parcerias" hidden>
      <div class="mega-nav__panel-inner">
        <div class="mega-nav__grid mega-nav__grid--duo">
          <div class="mega-nav__col">
            <h3 class="mega-nav__col-title">Parcerias</h3>
            <ul class="mega-nav__col-links">${links}</ul>
          </div>
          <div class="mega-nav__col">
            <h3 class="mega-nav__col-title">Benefícios</h3>
            <ul class="mega-nav__bullets">
              <li>Comissão por venda de certificados</li>
              <li>Suporte técnico e comercial</li>
              <li>Material e treinamento para revenda</li>
            </ul>
          </div>
          ${renderPromoAside(promo)}
        </div>
      </div>
    </div>`;
}

function renderSuportePanel(navConfig, basePath) {
  const section = navConfig?.suporte || {};
  const links = section.links || [];
  const atendimento = links.filter((l) => !["whatsapp", "instagram", "facebook"].includes(l.icon));
  const social = links.filter((l) => ["instagram", "facebook"].includes(l.icon));
  const canais = [
    {
      label: "WhatsApp",
      href: `https://wa.me/${SITE.whatsapp}`,
      icon: "whatsapp",
      external: true,
    },
    ...social,
  ];
  const promo = section.promo || {};
  const waMsg = promo.whatsappMessage || "Olá! Preciso de ajuda com certificado digital.";
  const whatsappHref = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(waMsg)}`;
  const promoHtml = renderPromoAside({ ...promo, cta: promo.cta || "Iniciar conversa" }, { whatsappHref });

  return `
    <div id="mega-panel-suporte" class="mega-nav__panel" role="region" aria-label="Suporte" hidden>
      <div class="mega-nav__panel-inner">
        <div class="mega-nav__grid mega-nav__grid--duo">
          <div class="mega-nav__col">
            <h3 class="mega-nav__col-title">Atendimento</h3>
            <ul class="mega-nav__col-links">${atendimento.map((l) => renderNavColLink(l, basePath)).join("")}</ul>
          </div>
          <div class="mega-nav__col">
            <h3 class="mega-nav__col-title">Canais rápidos</h3>
            <ul class="mega-nav__col-links">${canais.map((l) => renderNavColLink(l, basePath)).join("")}</ul>
          </div>
          ${promoHtml}
        </div>
      </div>
    </div>`;
}

function renderMegaNav(navConfig, products, basePath) {
  const groups = groupProductsForNav(products);
  const lowest = findLowestPrice(products);

  return `
    <ul class="mega-nav__list">
      <li><a href="${navHref("index.html", basePath)}" class="mega-nav__link" data-nav="home">Início</a></li>
      <li class="mega-nav__item" data-mega="certificados">
        <button type="button" class="mega-nav__trigger" aria-expanded="false" aria-controls="mega-panel-certificados" data-nav="loja">
          Certificados ${NAV_CHEVRON}
        </button>
        ${renderCertificadosPanel(groups, navConfig, lowest, basePath)}
      </li>
      <li><a href="${navHref("quem-somos.html", basePath)}" class="mega-nav__link" data-nav="quem-somos">Quem Somos</a></li>
      <li class="mega-nav__item" data-mega="parcerias">
        <button type="button" class="mega-nav__trigger" aria-expanded="false" aria-controls="mega-panel-parcerias" data-nav="seja-parceiro">
          Parcerias ${NAV_CHEVRON}
        </button>
        ${renderParceriasPanel(navConfig, basePath)}
      </li>
      <li class="mega-nav__item" data-mega="suporte">
        <button type="button" class="mega-nav__trigger" aria-expanded="false" aria-controls="mega-panel-suporte" data-nav="contato">
          Suporte ${NAV_CHEVRON}
        </button>
        ${renderSuportePanel(navConfig, basePath)}
      </li>
    </ul>`;
}

function isDesktopNav() {
  return window.matchMedia("(min-width: 901px)").matches;
}

function updateHeaderBottomVar() {
  const header = document.querySelector(".header");
  if (!header) return;
  document.documentElement.style.setProperty("--header-bottom", `${header.getBoundingClientRect().bottom}px`);
}

function closeMegaItem(item) {
  if (!item) return;
  item.classList.remove("is-open");
  item.dataset.suppressHover = "true";
  const trigger = item.querySelector(".mega-nav__trigger");
  const panel = item.querySelector(".mega-nav__panel");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (panel) panel.hidden = true;
}

function openMegaItem(item) {
  if (!item) return;
  document.querySelectorAll(".mega-nav__item.is-open").forEach((other) => {
    if (other !== item) closeMegaItem(other);
  });
  delete item.dataset.suppressHover;
  item.classList.add("is-open");
  const trigger = item.querySelector(".mega-nav__trigger");
  const panel = item.querySelector(".mega-nav__panel");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
  if (panel) panel.hidden = false;
  updateHeaderBottomVar();
}

function closeAllMegaItems() {
  document.querySelectorAll(".mega-nav__item.is-open").forEach(closeMegaItem);
}

function initMegaNavA11y(nav) {
  const triggers = [...nav.querySelectorAll(".mega-nav__trigger")];

  triggers.forEach((trigger) => {
    const item = trigger.closest(".mega-nav__item");
    const panelId = trigger.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = item.classList.contains("is-open");

      if (isOpen) {
        closeMegaItem(item);
        if (isDesktopNav()) item.dataset.suppressHover = "true";
      } else {
        delete item.dataset.suppressHover;
        openMegaItem(item);
      }
    });

    trigger.addEventListener("keydown", (e) => {
      const idx = triggers.indexOf(trigger);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        triggers[(idx + 1) % triggers.length].focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggers[(idx - 1 + triggers.length) % triggers.length].focus();
      } else if (e.key === "Escape") {
        closeMegaItem(item);
        trigger.focus();
      } else if ((e.key === "Enter" || e.key === " ") && isDesktopNav()) {
        e.preventDefault();
        if (item.classList.contains("is-open")) closeMegaItem(item);
        else openMegaItem(item);
      }
    });

    if (panel) {
      panel.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeMegaItem(item);
          trigger.focus();
        }
      });
    }

    item.addEventListener("mouseenter", () => {
      if (isDesktopNav() && item.dataset.suppressHover !== "true") openMegaItem(item);
    });

    item.addEventListener("mouseleave", () => {
      delete item.dataset.suppressHover;
      if (isDesktopNav() && !item.contains(document.activeElement)) closeMegaItem(item);
    });

    item.addEventListener("focusin", () => {
      if (isDesktopNav()) openMegaItem(item);
    });

    item.addEventListener("focusout", (e) => {
      if (isDesktopNav() && !item.contains(e.relatedTarget)) closeMegaItem(item);
    });
  });

  document.addEventListener("click", (e) => {
    if (isDesktopNav() && !nav.contains(e.target)) closeAllMegaItems();
  });

  document.addEventListener("keydown", (e) => {
    if (isDesktopNav() && e.key === "Escape") closeAllMegaItems();
  });

  window.addEventListener("resize", updateHeaderBottomVar);
  window.addEventListener("scroll", updateHeaderBottomVar, { passive: true });
}

function setupMobileDrawer(nav) {
  const version = "2";
  if (nav.dataset.mobileDrawerReady === version) {
    return document.querySelector(".mobile-drawer__backdrop");
  }

  nav.querySelector(".mobile-drawer__head")?.remove();
  nav.querySelector(".mobile-drawer__cta")?.remove();
  const oldScroll = nav.querySelector(".mobile-drawer__scroll");
  if (oldScroll) {
    const list = oldScroll.querySelector(".mega-nav__list");
    if (list) oldScroll.parentNode.insertBefore(list, oldScroll);
    oldScroll.remove();
  }

  const list = nav.querySelector(".mega-nav__list");
  if (!list) return null;

  let backdrop = document.querySelector(".mobile-drawer__backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "mobile-drawer__backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
  }

  const head = document.createElement("div");
  head.className = "mobile-drawer__head";
  head.innerHTML = `
    <div class="mobile-drawer__head-inner">
      <div class="mobile-drawer__brand">
        <p class="mobile-drawer__label">Menu</p>
        <p class="mobile-drawer__title">Link Forte</p>
      </div>
      <button type="button" class="mobile-drawer__close" aria-label="Fechar menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
      </button>
    </div>
  `;

  const scroll = document.createElement("div");
  scroll.className = "mobile-drawer__scroll";
  list.parentNode.insertBefore(scroll, list);
  scroll.appendChild(list);

  nav.prepend(head);
  nav.dataset.mobileDrawerReady = version;
  return backdrop;
}

function openMobileDrawer(nav, toggle, backdrop) {
  nav.classList.add("open");
  backdrop?.classList.add("is-visible");
  document.body.classList.add("drawer-open");
  toggle?.setAttribute("aria-expanded", "true");
}

function closeMobileDrawer(nav, toggle, backdrop) {
  nav.classList.remove("open");
  backdrop?.classList.remove("is-visible");
  document.body.classList.remove("drawer-open");
  toggle?.setAttribute("aria-expanded", "false");
  closeAllMegaItems();
}

function bindMegaNavLinks(nav) {
  nav.querySelectorAll("a.mega-nav__link, a.mega-nav__col-link, a.mega-nav__promo-cta").forEach((link) => {
    link.addEventListener("click", (e) => {
      const toggle = document.querySelector(".menu-toggle");
      const backdrop = document.querySelector(".mobile-drawer__backdrop");
      closeMobileDrawer(nav, toggle, backdrop);

      const href = link.getAttribute("href");
      if (!href?.includes("#")) return;

      const hashIndex = href.indexOf("#");
      const pathPart = href.slice(0, hashIndex);
      const hash = href.slice(hashIndex + 1);
      if (!hash) return;

      const currentFile = window.location.pathname.split("/").pop() || "index.html";
      const targetFile = pathPart ? pathPart.replace(/^\.\//, "") : currentFile;

      if (targetFile === currentFile || pathPart === "") {
        const target = document.getElementById(hash);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", `#${hash}`);
        }
      }
    });
  });
}

async function initMegaNav() {
  const nav = document.querySelector(".js-mega-nav");
  if (!nav) return;

  try {
    const [config, products] = await Promise.all([loadSiteConfig(), loadProducts()]);
    nav.innerHTML = renderMegaNav(config.navigation || {}, products, getBasePath());
    initMegaNavA11y(nav);
    updateHeaderBottomVar();
    setActiveNav();
    setupMobileDrawer(nav);
    bindMegaNavLinks(nav);
  } catch {
    nav.innerHTML = `
      <ul class="mega-nav__list">
        <li><a href="${navHref("index.html", getBasePath())}" class="mega-nav__link" data-nav="home">Início</a></li>
        <li><a href="${navHref("loja.html", getBasePath())}" class="mega-nav__link" data-nav="loja">Loja</a></li>
        <li><a href="${navHref("quem-somos.html", getBasePath())}" class="mega-nav__link" data-nav="quem-somos">Quem Somos</a></li>
        <li><a href="${navHref("seja-parceiro.html", getBasePath())}" class="mega-nav__link" data-nav="seja-parceiro">Parcerias</a></li>
        <li><a href="${navHref("contato.html", getBasePath())}" class="mega-nav__link" data-nav="contato">Suporte</a></li>
      </ul>`;
    setActiveNav();
    setupMobileDrawer(nav);
    bindMegaNavLinks(nav);
  }
}

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;

  const backdrop = setupMobileDrawer(nav) || document.querySelector(".mobile-drawer__backdrop");

  nav.querySelector(".mobile-drawer__close")?.addEventListener("click", () => {
    closeMobileDrawer(nav, toggle, backdrop);
  });

  backdrop?.addEventListener("click", () => {
    closeMobileDrawer(nav, toggle, backdrop);
  });

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("open")) closeMobileDrawer(nav, toggle, backdrop);
    else openMobileDrawer(nav, toggle, backdrop);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMobileDrawer(nav, toggle, backdrop);
      toggle.focus();
    }
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
  const slug = document.body.dataset.slug;
  if (!page) return;

  document.querySelectorAll(".mega-nav__link, .mega-nav__trigger").forEach((el) => {
    el.classList.remove("active");
  });

  const direct = document.querySelector(`.mega-nav__link[data-nav="${page}"], .mega-nav__trigger[data-nav="${page}"]`);
  if (direct) {
    direct.classList.add("active");
    return;
  }

  if (page === "produto" && slug) {
    const productLink = document.querySelector(`.mega-nav__col-link[data-nav-product="${slug}"]`);
    if (productLink) {
      document.querySelector('.mega-nav__trigger[data-nav="loja"]')?.classList.add("active");
    }
  }
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

const QUOTE_TYPE_LABELS = { ecpf: "e-CPF", ecnpj: "e-CNPJ" };
const QUOTE_VARIANT_LABELS = {
  token: "Token USB",
  leitora: "Leitora + Smart Card",
  sem_midia: "Sem mídia inclusa",
};

function buildQuoteKey(type, model, a3Variant, years) {
  if (model === "A3") return `${type}|A3|${a3Variant}|${years}`;
  return `${type}|${model}|${years}`;
}

function getQuoteSelection(root) {
  const read = (group) =>
    root.querySelector(`[data-quote-group="${group}"] .quote-option[aria-pressed="true"]`)?.dataset.value;

  const type = read("type") || "ecpf";
  const model = read("model") || "A1";
  const years = Number(read("years") || "1");
  const a3Variant = model === "A3" ? read("a3Variant") || "token" : null;

  return { type, model, years, a3Variant };
}

function formatQuoteSummary({ type, model, years, a3Variant }) {
  const parts = [QUOTE_TYPE_LABELS[type] || type, model, `${years} ano${years > 1 ? "s" : ""}`];
  if (model === "A3" && a3Variant) parts.splice(2, 0, QUOTE_VARIANT_LABELS[a3Variant] || a3Variant);
  return parts.join(" · ");
}

async function initCertificateQuoter() {
  const root = document.getElementById("cotador-certificado");
  if (!root || document.body.dataset.page !== "loja") return;

  const priceEl = root.querySelector("[data-quote-price]");
  const installmentEl = root.querySelector("[data-quote-installment]");
  const summaryEl = root.querySelector("[data-quote-summary]");
  const versionEl = root.querySelector("[data-quote-version]");
  const buyBtn = root.querySelector(".js-quote-buy");
  const a3Panel = root.querySelector("[data-quote-a3-panel]");
  const modelStep = a3Panel?.closest(".quote-step--model");

  let pricing;
  let priceMap;

  try {
    const res = await fetch(`${getBasePath()}data/pricing.json`);
    pricing = await res.json();
    priceMap = new Map((pricing.entries || []).map((e) => [e.key, e]));
  } catch {
    if (priceEl) priceEl.textContent = "Indisponível";
    buyBtn?.classList.add("is-disabled");
    return;
  }

  if (versionEl && pricing.version) {
    const date = pricing.effectiveFrom
      ? new Date(pricing.effectiveFrom).toLocaleDateString("pt-BR")
      : "";
    versionEl.textContent = date ? `Tabela v${pricing.version} · vigente desde ${date}` : `Tabela v${pricing.version}`;
  }

  const params = new URLSearchParams(window.location.search);
  const preset = {
    type: params.get("tipo") || undefined,
    model: params.get("modelo") || undefined,
    years: params.get("anos") ? Number(params.get("anos")) : undefined,
    a3Variant: params.get("variante") || undefined,
  };

  function setGroupValue(group, value) {
    root.querySelectorAll(`[data-quote-group="${group}"] .quote-option`).forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.value === value ? "true" : "false");
    });
  }

  if (preset.type) setGroupValue("type", preset.type);
  if (preset.model) setGroupValue("model", preset.model);
  if (preset.years) setGroupValue("years", String(preset.years));
  if (preset.a3Variant) setGroupValue("a3Variant", preset.a3Variant);

  function updateQuote() {
    const selection = getQuoteSelection(root);
    a3Panel?.classList.toggle("is-hidden", selection.model !== "A3");
    modelStep?.classList.toggle("quote-step--a3-open", selection.model === "A3");

    const key = buildQuoteKey(selection.type, selection.model, selection.a3Variant, selection.years);
    const entry = priceMap.get(key);

    if (!entry) {
      if (summaryEl) summaryEl.textContent = formatQuoteSummary(selection);
      if (priceEl) priceEl.innerHTML = '<span class="quote-unavailable">Consulte nosso time</span>';
      if (installmentEl) installmentEl.textContent = "";
      buyBtn?.classList.add("is-disabled");
      return;
    }

    const installment = entry.price / 3;
    if (summaryEl) summaryEl.textContent = formatQuoteSummary(selection);
    if (priceEl) priceEl.textContent = `R$ ${formatBRL(entry.price)}`;
    if (installmentEl) {
      installmentEl.textContent = `Em até 3x de R$ ${formatBRL(installment)} sem juros · À vista no Pix`;
    }

    if (buyBtn) {
      buyBtn.href = productPath(entry.slug);
      buyBtn.classList.remove("is-disabled");
    }
  }

  root.querySelectorAll(".quote-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest("[data-quote-group]")?.dataset.quoteGroup;
      if (!group) return;
      setGroupValue(group, btn.dataset.value);
      updateQuote();
    });
  });

  updateQuote();
}

document.addEventListener("DOMContentLoaded", () => {
  initMegaNav().then(() => {
    initMobileMenu();
  });
  initContactForm();
  initHeroHome();
  initCertificateQuoter();
  renderProductGrid("#products-home", 8);
  renderProductGrid("#products-shop");
  renderProductDetail();
});
