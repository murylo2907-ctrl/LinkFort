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

function productPageToCartItem(product) {
  const slug = (product.slug || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  let tipo = "e-CPF";
  if (name.includes("e-cnpj") || slug.includes("e-cnpj")) tipo = "e-CNPJ";
  else if (name.includes("médico") || name.includes("medico") || slug.includes("medico")) tipo = "e-MÉDICO";
  else if (name.includes("advogado") || slug.includes("advogado")) tipo = "e-ADVOGADO";

  let midia = "A3";
  if (slug.includes("a1") || name.includes("a1")) midia = "A1";
  else if (slug.includes("nuvem") || name.includes("nuvem")) midia = "Nuvem";

  let validade_anos = 1;
  const validityMatch = (product.validity || "").match(/(\d+)\s*mes/i);
  if (validityMatch) {
    const meses = parseInt(validityMatch[1], 10);
    validade_anos = meses >= 36 ? 3 : meses >= 24 ? 2 : 1;
  }

  return {
    id: product.id,
    nome: product.name,
    tipo,
    midia,
    validade_anos,
    preco: parsePrice(product.priceMin),
  };
}

function initProductPageInteractions(root, product) {
  root.querySelector(".js-add-cart")?.addEventListener("click", (e) => {
    e.preventDefault();
    const qty = root.querySelector(".qty")?.value || "1";
    if (typeof adicionarAoCarrinho === "function") {
      adicionarAoCarrinho(productPageToCartItem(product), qty);
    }
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
  calculator: `<svg viewBox="0 0 24 24"><path d="M7 2h10a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2zm0 4v2h2V6H7zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM7 10v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM7 14v2h2v-2H7zm4 0v4h6v-4h-6z"/></svg>`,
  cart: `<svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>`,
  videocam: `<svg viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>`,
  "shield-check": `<svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5.05-3.03 9.67-7.75 11.65L12 22l-.25-.35C7.03 19.67 4 15.05 4 12V6l8-4zm-1.03 13.03l5.66-5.66-1.41-1.41-4.25 4.25-2.12-2.12-1.41 1.41 3.54 3.53z"/></svg>`,
  download: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
  file: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h8v2H8v-2zm0 4h5v2H8v-2z"/></svg>`,
  token: `<svg viewBox="0 0 24 24"><path d="M2 10.5c0-.83.67-1.5 1.5-1.5H4v5H3.5A1.5 1.5 0 012 14.5v-4z"/><path d="M5.5 8.75h14A2.25 2.25 0 0121.75 11v2A2.25 2.25 0 0119.5 15.25H5.5A2.25 2.25 0 013.25 13v-2A2.25 2.25 0 015.5 8.75z"/></svg>`,
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

const DEFAULT_CERTIFICADOS_PROMO = {
  title: "Acesse a loja",
  text: "Configure tipo, modelo e validade — veja o preço na hora.",
  cta: "Abrir configurador",
  href: "loja.html#cotador-certificado",
};

const DEFAULT_SUPORTE_PROMO = {
  title: "Fale agora no WhatsApp",
  text: "Atendimento humanizado para tirar dúvidas e concluir sua compra.",
  cta: "Iniciar conversa",
  whatsappMessage: "Olá! Preciso de ajuda com certificado digital.",
};

const DEFAULT_SUPORTE_LINKS = [
  { label: "Página de contato", href: "contato.html", icon: "mail", dataNav: "contato" },
  { label: "Telefone (41) 3026-3491", href: "https://wa.me/554130263491", icon: "phone", external: true },
  { label: "linkforte@linkforte.com.br", href: "mailto:linkforte@linkforte.com.br", icon: "mail", external: true },
  { label: "Instagram", href: "https://www.instagram.com/linkforte", icon: "instagram", external: true },
  { label: "Facebook", href: "https://www.facebook.com/linkforte", icon: "facebook", external: true },
];

function renderCertificadosPanel(groups, navConfig, lowest, basePath) {
  const promo = navConfig?.certificados?.promo || DEFAULT_CERTIFICADOS_PROMO;
  const priceLine = lowest ? `A partir de <strong>R$&nbsp;${lowest.priceMin}</strong>` : "";
  const promoHtml = renderPromoAside(
    { ...promo, href: promo.href || "loja.html#cotador-certificado", cta: promo.cta || "Abrir configurador" },
    { priceLine }
  );

  const col = (title, items, icon, showFooter) => `
    <div class="mega-nav__col">
      <h3 class="mega-nav__col-title">${title}</h3>
      <ul class="mega-nav__col-links">${items.map((p) => renderNavProductLink(p, icon)).join("")}</ul>
      ${showFooter ? `<div class="mega-nav__col-footer"><a href="${navHref("loja.html", basePath)}" data-nav="loja">Ver toda a loja</a></div>` : ""}
    </div>`;

  return `
    <div id="mega-panel-certificados" class="mega-nav__panel" role="region" aria-label="Loja" hidden>
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

function renderSuportePanel(navConfig, basePath) {
  const section = navConfig?.suporte || {};
  const links = section.links?.length ? section.links : DEFAULT_SUPORTE_LINKS;
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
  const promo = section.promo?.title ? section.promo : DEFAULT_SUPORTE_PROMO;
  const waMsg = promo.whatsappMessage || DEFAULT_SUPORTE_PROMO.whatsappMessage;
  const whatsappHref = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(waMsg)}`;
  const promoHtml = renderPromoAside({ ...promo, cta: promo.cta || "Iniciar conversa" }, { whatsappHref });

  return `
    <div id="mega-panel-suporte" class="mega-nav__panel" role="region" aria-label="Contato" hidden>
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
        <button type="button" class="mega-nav__trigger" aria-expanded="false" aria-controls="mega-panel-certificados" data-nav="loja" title="Clique duas vezes para abrir a loja">
          Loja ${NAV_CHEVRON}
        </button>
        ${renderCertificadosPanel(groups, navConfig, lowest, basePath)}
      </li>
      <li><a href="${navHref("quem-somos.html", basePath)}" class="mega-nav__link" data-nav="quem-somos">Quem Somos</a></li>
      <li class="mega-nav__item" data-mega="suporte">
        <button type="button" class="mega-nav__trigger" aria-expanded="false" aria-controls="mega-panel-suporte" data-nav="contato" title="Clique duas vezes para abrir contato">
          Contato ${NAV_CHEVRON}
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

const MEGA_NAV_LANDING = {
  certificados: "loja.html",
  suporte: "contato.html",
};

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

    trigger.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const landing = MEGA_NAV_LANDING[item.dataset.mega];
      if (!landing) return;
      closeAllMegaItems();
      window.location.assign(navHref(landing, getBasePath()));
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
        <li><a href="${navHref("contato.html", getBasePath())}" class="mega-nav__link" data-nav="contato">Contato</a></li>
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

  const perfilMessages = {
    contador: "Sou contador(a) e gostaria de saber sobre emissão de certificados digitais para meus clientes.",
  };
  const perfil = new URLSearchParams(window.location.search).get("perfil");
  const msgField = form.querySelector('[name="mensagem"]');
  if (perfil && perfilMessages[perfil] && msgField && !msgField.value) {
    msgField.value = perfilMessages[perfil];
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nome = data.get("nome") || "";
    const msg = data.get("mensagem") || "";
    const text = appendReferralToMessage(`Olá! Meu nome é ${nome}. ${msg}`);
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
    const text = appendReferralToMessage(message || "Olá! Gostaria de falar com um especialista sobre certificado digital.");
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

function resolvePersonaHref(persona, basePath) {
  if (persona.whatsappMessage) {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(persona.whatsappMessage)}`;
  }
  return navHref(persona.href, basePath);
}

function renderPersonaCard(persona, basePath) {
  const href = resolvePersonaHref(persona, basePath);
  const external =
    persona.external || persona.whatsappMessage ? ' target="_blank" rel="noopener"' : "";
  return `
    <a href="${href}" class="persona-card persona-card--${persona.id}"${external}>
      <span class="persona-card__icon" aria-hidden="true">${navIcon(persona.icon)}</span>
      <div class="persona-card__body">
        <h3 class="persona-card__title">${persona.title}</h3>
        <p class="persona-card__desc">${persona.description}</p>
        <span class="persona-card__cta">${persona.cta}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg></span>
      </div>
    </a>`;
}

const DEFAULT_PERSONAS = {
  title: "Qual é o seu perfil?",
  subtitle: "Escolha abaixo e vá direto ao conteúdo certo — sem precisar navegar pelo site",
  items: [
    {
      id: "pf",
      title: "Pessoa Física",
      description: "e-CPF para IR, eSocial, assinatura digital e serviços gov.br",
      cta: "Configurar e-CPF",
      href: "loja.html?tipo=ecpf#cotador-certificado",
      icon: "user",
    },
    {
      id: "pj",
      title: "Pessoa Jurídica",
      description: "e-CNPJ para NF-e, SPED, contratos e obrigações da empresa",
      cta: "Configurar e-CNPJ",
      href: "loja.html?tipo=ecnpj#cotador-certificado",
      icon: "building",
    },
    {
      id: "contador",
      title: "Contador",
      description: "Emissão para clientes PF e PJ com atendimento especializado",
      cta: "Falar com especialista",
      href: "contato.html?perfil=contador",
      icon: "calculator",
    },
  ],
};

async function initPersonaCards() {
  const container = document.getElementById("personas-home");
  if (!container || document.body.dataset.page !== "home") return;

  let section = DEFAULT_PERSONAS;
  try {
    const config = await loadSiteConfig();
    if (config.personas?.items?.length) section = config.personas;
  } catch {
    /* fallback */
  }

  const block = container.closest(".section-personas");
  const titleEl = block?.querySelector(".section-header h2");
  const subtitleEl = block?.querySelector(".section-header p");
  if (titleEl && section.title) titleEl.textContent = section.title;
  if (subtitleEl && section.subtitle) subtitleEl.textContent = section.subtitle;

  const basePath = getBasePath();
  container.innerHTML = section.items.map((persona) => renderPersonaCard(persona, basePath)).join("");
}

const DEFAULT_ACQUISITION_STEPS = {
  title: "Como funciona a aquisição?",
  subtitle: "Entenda em poucos passos e siga para a compra com segurança",
  items: [
    {
      title: "Escolha o certificado",
      description: "e-CPF ou e-CNPJ, A1 em arquivo ou A3 em token/mídia.",
      icon: "certificate",
    },
    {
      title: "Compre com segurança",
      description: "Pix, parcelamento em até 3x e preço transparente na hora.",
      icon: "cart",
    },
    {
      title: "Valide sua identidade",
      description: "Videoconferência ou validação presencial, conforme o certificado.",
      icon: "videocam",
    },
    {
      title: "Receba a emissão",
      description: "Certificado ICP-Brasil com validade jurídica reconhecida.",
      icon: "shield-check",
    },
    {
      title: "Instale e use",
      description: "IR, NF-e, gov.br, assinaturas digitais e muito mais.",
      icon: "download",
    },
  ],
};

function acquisitionStepIcon(name) {
  return NAV_ICONS[name] || NAV_ICONS.certificate;
}

function renderAcquisitionStep(step, index) {
  return `
    <li class="acquisition-step" style="--step-index: ${index}">
      <div class="acquisition-step__card">
        <span class="acquisition-step__icon" aria-hidden="true">${acquisitionStepIcon(step.icon)}</span>
        <div class="acquisition-step__body">
          <span class="acquisition-step__num" aria-hidden="true">${index + 1}</span>
          <h3 class="acquisition-step__title">${step.title}</h3>
          <p class="acquisition-step__desc">${step.description}</p>
        </div>
      </div>
    </li>`;
}

function initScrollReveal() {
  const blocks = document.querySelectorAll(".js-reveal");
  if (!blocks.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    blocks.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );

  blocks.forEach((el) => observer.observe(el));
}

async function initAcquisitionSteps() {
  const track = document.getElementById("acquisition-steps");
  if (!track) return;

  let section = DEFAULT_ACQUISITION_STEPS;
  try {
    const config = await loadSiteConfig();
    if (config.acquisitionSteps?.items?.length) section = config.acquisitionSteps;
  } catch {
    /* fallback */
  }

  const headerEl = document.getElementById("acquisition-header");

  if (headerEl) {
    headerEl.innerHTML = `
      <h2 id="acquisition-title">${section.title}</h2>
      <p>${section.subtitle}</p>
      <div class="section-divider"></div>`;
  }

  track.innerHTML = section.items.map((step, i) => renderAcquisitionStep(step, i)).join("");
}

const DEFAULT_MODEL_COMPARE = {
  title: "A1 ou A3: qual escolher?",
  subtitle: "Compare os modelos e escolha o melhor para o seu caso",
  models: {
    a1: {
      name: "A1",
      tagline: "Em arquivo",
      icon: "file",
      highlights: [
        "Instalado no computador ou servidor",
        "Mais prático para uso em um único equipamento",
        "Geralmente mais acessível",
      ],
    },
    a3: {
      name: "A3",
      tagline: "Token / mídia",
      icon: "token",
      highlights: [
        "Chave privada nunca sai do dispositivo",
        "Maior segurança física contra cópia",
        "Uso em diferentes computadores",
      ],
    },
  },
  rows: [
    {
      label: "Vantagens",
      a1: "Instalação simples, ideal para quem usa sempre o mesmo PC. Renovação rápida com novo arquivo digital.",
      a3: "Proteção reforçada: a chave fica guardada no token ou cartão. Indicado para quem assina com frequência ou em vários locais.",
    },
    {
      label: "Durabilidade",
      a1: "Validade contratual de <strong>1, 2 ou 3 anos</strong>. Ao vencer, é necessário emitir um novo certificado.",
      a3: "Validade contratual de <strong>1, 2 ou 3 anos</strong>, com mídia criptográfica de longa vida útil — a chave permanece no dispositivo.",
    },
    {
      label: "Armazenamento",
      a1: "Arquivo digital no computador. Exige <strong>backup seguro</strong> da senha e do certificado.",
      a3: "Token USB, cartão inteligente ou leitora. Dispositivo <strong>físico e portátil</strong>.",
    },
    {
      label: "Uso recomendado",
      a1: "Pessoa física, MEI ou empresa com uso em <strong>um único equipamento</strong> e que prioriza praticidade.",
      a3: "Empresas, contadores e profissionais que precisam de <strong>mais segurança</strong> ou usam o certificado em vários computadores.",
    },
  ],
};

function modelCompareIcon(name) {
  return NAV_ICONS[name] || NAV_ICONS.certificate;
}

function renderModelCompareCard(model, variant) {
  const highlights = (model.highlights || [])
    .map((item) => `<li>${item}</li>`)
    .join("");

  return `
    <article class="model-compare__card model-compare__card--${variant}">
      <div class="model-compare__card-head">
        <span class="model-compare__icon" aria-hidden="true">${modelCompareIcon(model.icon)}</span>
        <div>
          <h3 class="model-compare__card-title">${model.name}</h3>
          <p class="model-compare__card-tagline">${model.tagline}</p>
        </div>
      </div>
      <ul class="model-compare__highlights">${highlights}</ul>
    </article>`;
}

function renderModelCompareTable(rows, models) {
  const body = rows
    .map(
      (row) => `
    <tr>
      <th scope="row">${row.label}</th>
      <td data-col="a1">${row.a1}</td>
      <td data-col="a3">${row.a3}</td>
    </tr>`
    )
    .join("");

  return `
    <div class="model-compare__table-wrap">
      <table class="model-compare__table">
        <thead>
          <tr>
            <th scope="col">Critério</th>
            <th scope="col">${models.a1.name} — ${models.a1.tagline}</th>
            <th scope="col">${models.a3.name} — ${models.a3.tagline}</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

async function initModelCompare() {
  const container = document.getElementById("model-compare");
  if (!container) return;

  let section = DEFAULT_MODEL_COMPARE;
  try {
    const config = await loadSiteConfig();
    if (config.modelCompare?.rows?.length) section = config.modelCompare;
  } catch {
    /* fallback */
  }

  const headerEl = document.getElementById("model-compare-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <h2 id="model-compare-title">${section.title}</h2>
      <p>${section.subtitle}</p>
      <div class="section-divider"></div>`;
  }

  container.innerHTML = `
    <div class="model-compare__intro">
      ${renderModelCompareCard(section.models.a1, "a1")}
      <span class="model-compare__vs" aria-hidden="true">VS</span>
      ${renderModelCompareCard(section.models.a3, "a3")}
    </div>
    ${renderModelCompareTable(section.rows, section.models)}`;
}

const REVIEW_SOURCE_LABELS = {
  google: "Ver no Google",
  facebook: "Ver no Facebook",
};

const REVIEW_SOURCE_ICONS = {
  google: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3h4a1 1 0 011 1v3h-3a2 2 0 00-2 2v3h5l-1 4h-4v8h-4v-8H7v-4h4V8a5 5 0 015-5z"/></svg>`,
};

const DEFAULT_REVIEWS = {
  title: "O que nossos clientes dizem",
  subtitle: "Avaliações reais de quem já emitiu certificado digital conosco",
  autoplayMs: 6000,
  items: [],
};

function reviewInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function renderReviewStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(`<svg class="review-card__star${i <= rating ? " is-filled" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`);
  }
  return `<div class="review-card__stars" aria-label="${rating} de 5 estrelas">${stars.join("")}</div>`;
}

function renderReviewAvatar(review) {
  const initials = reviewInitials(review.name);
  if (!review.photo) {
    return `<span class="review-card__avatar review-card__avatar--fallback" aria-hidden="true">${initials}</span>`;
  }
  return `<img class="review-card__avatar" src="${review.photo}" alt="" loading="lazy">`;
}

function renderReviewCard(review) {
  const source = review.source || "google";
  const sourceUrl = review.sourceUrl || "#";
  const sourceLabel = REVIEW_SOURCE_LABELS[source] || "Ver avaliação";

  return `
    <article class="review-card">
      <div class="review-card__top">
        ${renderReviewAvatar(review)}
        <div class="review-card__meta">
          <h3 class="review-card__name">${review.name}</h3>
          ${review.date ? `<p class="review-card__date">${review.date}</p>` : ""}
          ${renderReviewStars(review.rating || 5)}
        </div>
      </div>
      <p class="review-card__text">${review.text}</p>
      <footer class="review-card__footer">
        <a href="${sourceUrl}" class="review-card__source review-card__source--${source}" target="_blank" rel="noopener noreferrer">
          ${REVIEW_SOURCE_ICONS[source] || REVIEW_SOURCE_ICONS.google}
          ${sourceLabel}
        </a>
      </footer>
    </article>`;
}

function getReviewsSlidesPerView() {
  if (window.matchMedia("(min-width: 1100px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

function initReviewsCarouselControls(root, slideCount, autoplayMs) {
  const track = root.querySelector(".reviews-carousel__track");
  const dotsEl = root.querySelector(".reviews-carousel__dots");
  const prevBtn = root.querySelector(".reviews-carousel__btn--prev");
  const nextBtn = root.querySelector(".reviews-carousel__btn--next");
  if (!track || !dotsEl || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  let autoplayTimer;

  function slidesPerView() {
    return getReviewsSlidesPerView();
  }

  function pageCount() {
    return Math.max(1, slideCount - slidesPerView() + 1);
  }

  function goTo(index) {
    const pages = pageCount();
    currentIndex = ((index % pages) + pages) % pages;
    const offset = (currentIndex * 100) / slidesPerView();
    track.style.transform = `translateX(-${offset}%)`;

    dotsEl.querySelectorAll(".reviews-carousel__dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === currentIndex);
      dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
    });

    const singlePage = pages <= 1;
    prevBtn.disabled = singlePage;
    nextBtn.disabled = singlePage;
  }

  function renderDots() {
    dotsEl.innerHTML = "";
    for (let i = 0; i < pageCount(); i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `reviews-carousel__dot${i === currentIndex ? " is-active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Avaliação ${i + 1}`);
      dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
      dot.addEventListener("click", () => {
        stopAutoplay();
        goTo(i);
        startAutoplay();
      });
      dotsEl.appendChild(dot);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function startAutoplay() {
    stopAutoplay();
    if (!autoplayMs || slideCount <= slidesPerView()) return;
    autoplayTimer = setInterval(() => {
      const pages = pageCount();
      goTo(currentIndex >= pages - 1 ? 0 : currentIndex + 1);
    }, autoplayMs);
  }

  function refresh() {
    renderDots();
    goTo(Math.min(currentIndex, pageCount() - 1));
  }

  prevBtn.addEventListener("click", () => {
    stopAutoplay();
    goTo(currentIndex - 1);
    startAutoplay();
  });

  nextBtn.addEventListener("click", () => {
    stopAutoplay();
    goTo(currentIndex + 1);
    startAutoplay();
  });

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget)) startAutoplay();
  });

  window.addEventListener("resize", refresh);
  refresh();
  startAutoplay();
}

async function initReviewsCarousel() {
  const root = document.getElementById("reviews-carousel");
  if (!root || document.body.dataset.page !== "home") return;

  let section = DEFAULT_REVIEWS;
  try {
    const config = await loadSiteConfig();
    if (config.reviews?.items?.length) section = config.reviews;
  } catch {
    /* fallback */
  }

  if (!section.items.length) {
    root.closest(".section-reviews")?.remove();
    return;
  }

  const headerEl = document.getElementById("reviews-header");
  if (headerEl) {
    headerEl.innerHTML = `
      <h2 id="reviews-title">${section.title}</h2>
      <p>${section.subtitle}</p>
      <div class="section-divider"></div>`;
  }

  const track = document.getElementById("reviews-track");
  track.innerHTML = section.items
    .map(
      (review) => `
    <div class="reviews-carousel__slide">
      ${renderReviewCard(review)}
    </div>`
    )
    .join("");

  initReviewsCarouselControls(root, section.items.length, section.autoplayMs || 6000);
}

const DEFAULT_FAQ = {
  title: "Perguntas frequentes",
  subtitle: "Busque sua dúvida e encontre a resposta na hora — sem precisar falar com o atendimento",
  searchPlaceholder: "Digite sua dúvida...",
  categories: [{ id: "all", label: "Todas" }],
  items: [],
};

function normalizeFaqText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function faqMatchesQuery(item, query) {
  if (!query) return true;
  const haystack = normalizeFaqText(`${item.question} ${item.answer}`);
  const terms = normalizeFaqText(query).split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

function highlightFaqMatch(text, query) {
  if (!query) return text;
  const terms = normalizeFaqText(query).split(/\s+/).filter(Boolean);
  let result = text;
  terms.forEach((term) => {
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    result = result.replace(re, "<mark>$1</mark>");
  });
  return result;
}

function renderFaqItem(item, isOpen) {
  return `
    <article class="faq-item${isOpen ? " is-open" : ""}" id="faq-${item.id}" data-faq-id="${item.id}" data-faq-category="${item.category}">
      <button type="button" class="faq-item__trigger" aria-expanded="${isOpen ? "true" : "false"}" aria-controls="faq-panel-${item.id}">
        <span>${item.question}</span>
        <span class="faq-item__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        </span>
      </button>
      <div class="faq-item__panel" id="faq-panel-${item.id}" role="region" aria-labelledby="faq-${item.id}">
        <div class="faq-item__panel-inner">
          <p class="faq-item__answer">${item.answer}</p>
        </div>
      </div>
    </article>`;
}

function injectFaqSchema(items) {
  let el = document.getElementById("faq-schema");
  if (!el) {
    el = document.createElement("script");
    el.id = "faq-schema";
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  });
}

async function initFaqSection() {
  const listEl = document.getElementById("faq-list");
  if (!listEl || document.body.dataset.page !== "home") return;

  let section = DEFAULT_FAQ;
  try {
    const config = await loadSiteConfig();
    if (config.faq?.items?.length) section = config.faq;
  } catch {
    /* fallback */
  }

  if (!section.items.length) {
    listEl.closest(".section-faq")?.remove();
    return;
  }

  const headerEl = document.getElementById("faq-header");
  const searchEl = document.getElementById("faq-search");
  const suggestionsEl = document.getElementById("faq-suggestions");
  const categoriesEl = document.getElementById("faq-categories");
  const emptyEl = document.getElementById("faq-empty");

  if (headerEl) {
    headerEl.innerHTML = `
      <h2 id="faq-title">${section.title}</h2>
      <p>${section.subtitle}</p>
      <div class="section-divider"></div>`;
  }

  if (searchEl) searchEl.placeholder = section.searchPlaceholder || DEFAULT_FAQ.searchPlaceholder;

  injectFaqSchema(section.items);

  let activeCategory = "all";
  let activeQuery = "";
  let openId = null;

  const categories = section.categories?.length
    ? section.categories
    : [{ id: "all", label: "Todas" }];

  function filteredItems() {
    return section.items.filter((item) => {
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;
      return categoryMatch && faqMatchesQuery(item, activeQuery);
    });
  }

  function renderList() {
    const items = filteredItems();
    listEl.innerHTML = items.map((item) => renderFaqItem(item, item.id === openId)).join("");
    emptyEl.hidden = items.length > 0;

    listEl.querySelectorAll(".faq-item__trigger").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemEl = btn.closest(".faq-item");
        const id = itemEl?.dataset.faqId;
        openId = openId === id ? null : id;
        renderList();
      });
    });
  }

  function renderCategories() {
    categoriesEl.innerHTML = categories
      .map(
        (cat) => `
      <button type="button" class="faq-category${cat.id === activeCategory ? " is-active" : ""}" role="tab" aria-selected="${cat.id === activeCategory ? "true" : "false"}" data-faq-category="${cat.id}">
        ${cat.label}
      </button>`
      )
      .join("");

    categoriesEl.querySelectorAll(".faq-category").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.faqCategory;
        openId = null;
        renderCategories();
        renderList();
        hideSuggestions();
      });
    });
  }

  function hideSuggestions() {
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = "";
  }

  function showSuggestions(query) {
    if (!query.trim()) {
      hideSuggestions();
      return;
    }

    const matches = section.items
      .filter((item) => faqMatchesQuery(item, query))
      .slice(0, 5);

    if (!matches.length) {
      hideSuggestions();
      return;
    }

    suggestionsEl.innerHTML = matches
      .map(
        (item) => `
      <li role="presentation">
        <button type="button" class="faq-suggestions__item" role="option" data-faq-suggestion="${item.id}">
          ${highlightFaqMatch(item.question, query)}
        </button>
      </li>`
      )
      .join("");
    suggestionsEl.hidden = false;

    suggestionsEl.querySelectorAll("[data-faq-suggestion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.faqSuggestion;
        const item = section.items.find((i) => i.id === id);
        if (!item) return;
        activeQuery = item.question;
        searchEl.value = item.question;
        activeCategory = "all";
        openId = id;
        renderCategories();
        renderList();
        hideSuggestions();
        document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  searchEl?.addEventListener("input", () => {
    activeQuery = searchEl.value;
    openId = null;
    renderList();
    showSuggestions(activeQuery);
  });

  searchEl?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideSuggestions();
      return;
    }
    if (e.key === "Enter") {
      const first = suggestionsEl.querySelector("[data-faq-suggestion]");
      if (first && !suggestionsEl.hidden) {
        e.preventDefault();
        first.click();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".faq-search")) hideSuggestions();
  });

  renderCategories();
  renderList();
}

const QUOTE_TYPE_LABELS = { ecpf: "e-CPF", ecnpj: "e-CNPJ" };
const QUOTE_TYPE_TO_DB = { ecpf: "e-CPF", ecnpj: "e-CNPJ" };
const WHATSAPP_QUOTE_NUMBER = "554130263491";

function getQuoteSelection(root) {
  const read = (group) =>
    root.querySelector(`[data-quote-group="${group}"] .quote-option[aria-pressed="true"]`)?.dataset.value;

  const type = read("type") || "ecpf";
  const model = read("model") || "A1";
  const years = Number(read("years") || "1");

  return { type, model, years };
}

function formatQuoteSummary({ type, model, years }) {
  const tipo = QUOTE_TYPE_LABELS[type] || type;
  return `${tipo} · ${model} · ${years} ano${years > 1 ? "s" : ""}`;
}

function parseProdutoPreco(preco) {
  return typeof preco === "string" ? parseFloat(preco) : preco;
}

async function fetchProdutosSupabase() {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Configure supabase-config.js com URL e anon key.");
  }

  const res = await fetch(
    `${url}/rest/v1/produtos?ativo=eq.true&select=*&order=tipo,midia,validade_anos`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Falha ao carregar produtos do Supabase.");
  }

  const rows = await res.json();
  return rows.map((p) => ({ ...p, preco: parseProdutoPreco(p.preco) }));
}

const URL_TIPO_TO_FILTER = { ecpf: "e-CPF", ecnpj: "e-CNPJ" };

function truncateText(text, max = 80) {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function catalogValidadeLabel(anos) {
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

const CATALOG_PRODUCT_IMAGES = {
  "e-CPF": {
    A1: "assets/images/products/e-cpf-a1-em-arquivo.avif",
    A3: "assets/images/products/e-cpf-a3-token.avif",
    Nuvem: "assets/images/products/e-cpf-a1-em-arquivo.avif",
  },
  "e-CNPJ": {
    A1: "assets/images/products/e-cnpj-a1-em-arquivo.avif",
    A3: "assets/images/products/e-cnpj-a3-token.avif",
    Nuvem: "assets/images/products/e-cnpj-a1-em-arquivo.avif",
  },
};

function catalogProductImage(produto) {
  const byTipo = CATALOG_PRODUCT_IMAGES[produto.tipo];
  const fallback = "assets/images/LINKFORTE-vetor.png";
  if (!byTipo) return fallback;
  return byTipo[produto.midia] || byTipo.A1 || fallback;
}

function catalogPriceDisplayHtml(produto) {
  const price = formatBRL(produto.preco);
  const installment = formatBRL(produto.preco / 3);
  return `
    <div class="lf-qv-price">
      <p class="lf-qv-price__main"><span class="amount">R$&nbsp;${price}</span></p>
      <p class="lf-qv-price__installment">Em até 3x de <span class="amount">R$&nbsp;${installment}</span> sem juros</p>
      <p class="lf-qv-price__pix">
        <span class="discount-before-price">À vista</span>
        <span class="discounted-price">R$&nbsp;${price}</span>
        <span class="discount-after-price">no Pix</span>
      </p>
    </div>
  `;
}

let catalogQuickViewEl = null;
let catalogQuickViewPrevFocus = null;

function ensureCatalogQuickViewShell() {
  if (catalogQuickViewEl) return catalogQuickViewEl;

  catalogQuickViewEl = document.createElement("div");
  catalogQuickViewEl.className = "lf-quick-view";
  catalogQuickViewEl.setAttribute("aria-hidden", "true");
  catalogQuickViewEl.innerHTML = `
    <div class="lf-quick-view__backdrop" data-qv-close></div>
    <div class="lf-quick-view__dialog" role="dialog" aria-modal="true" aria-labelledby="lf-qv-title">
      <button type="button" class="lf-quick-view__close" aria-label="Fechar" data-qv-close>&times;</button>
      <div class="lf-quick-view__body"></div>
    </div>
  `;
  document.body.appendChild(catalogQuickViewEl);

  catalogQuickViewEl.addEventListener("click", (e) => {
    if (e.target.closest("[data-qv-close]")) closeCatalogQuickView();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && catalogQuickViewEl?.classList.contains("open")) {
      const installmentOpen = catalogQuickViewEl.querySelector(".wci-modal.open");
      if (installmentOpen) {
        installmentOpen.classList.remove("open");
      } else {
        closeCatalogQuickView();
      }
    }
  });

  return catalogQuickViewEl;
}

function closeCatalogQuickView() {
  if (!catalogQuickViewEl) return;
  catalogQuickViewEl.classList.remove("open");
  catalogQuickViewEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lf-qv-open");
  const body = catalogQuickViewEl.querySelector(".lf-quick-view__body");
  if (body) body.innerHTML = "";
  catalogQuickViewPrevFocus?.focus();
  catalogQuickViewPrevFocus = null;
}

function initCatalogQuickViewInteractions(root, produto) {
  root.querySelector(".js-qv-add-cart")?.addEventListener("click", (e) => {
    e.preventDefault();
    const qty = root.querySelector(".qty")?.value || "1";
    if (typeof adicionarAoCarrinho === "function") {
      adicionarAoCarrinho(produto, qty);
    }
  });

  const qtyInput = root.querySelector(".qty");
  root.querySelector(".minus")?.addEventListener("click", () => {
    if (qtyInput && Number(qtyInput.value) > 1) qtyInput.value = String(Number(qtyInput.value) - 1);
  });
  root.querySelector(".plus")?.addEventListener("click", () => {
    if (qtyInput && Number(qtyInput.value) < 10) qtyInput.value = String(Number(qtyInput.value) + 1);
  });

  const installmentModal = root.querySelector(".wci-modal");
  root.querySelector(".wci-open-popup")?.addEventListener("click", () => installmentModal?.classList.add("open"));
  root.querySelector(".wci-modal__close")?.addEventListener("click", () => installmentModal?.classList.remove("open"));
  installmentModal?.addEventListener("click", (e) => {
    if (e.target === installmentModal) installmentModal.classList.remove("open");
  });
}

function renderCatalogQuickViewContent(produto) {
  const img = assetPath(catalogProductImage(produto));
  const fallbackImg = assetPath("assets/images/LINKFORTE-vetor.png");
  const desc = produto.descricao || "Consulte nossa equipe para mais detalhes sobre este certificado.";
  const priceMin = formatBRL(produto.preco);
  const meta = `${produto.midia} · ${catalogValidadeLabel(produto.validade_anos)}`;

  return `
    <div class="lf-quick-view__grid">
      <div class="lf-quick-view__media">
        <img src="${img}" alt="${produto.nome}" onerror="this.src='${fallbackImg}'">
      </div>
      <div class="lf-quick-view__details">
        <h2 class="lf-quick-view__title" id="lf-qv-title">${produto.nome}</h2>
        <p class="lf-quick-view__meta">${meta}</p>
        ${catalogPriceDisplayHtml(produto)}
        <button type="button" class="wci-open-popup"><span class="open-popup-text">Detalhes do parcelamento</span></button>
        <div class="lf-quick-view__cart">
          <div class="quantity-wrap both">
            <button type="button" class="minus" aria-label="Diminuir">−</button>
            <div class="quantity">
              <input type="number" class="qty" value="1" min="1" max="10" aria-label="Quantidade">
            </div>
            <button type="button" class="plus" aria-label="Aumentar">+</button>
          </div>
          <button type="button" class="lf-quick-view__add-btn js-qv-add-cart">Adicionar ao carrinho</button>
        </div>
        <div class="lf-quick-view__tabs">
          <h3>Descrição</h3>
          <div class="lf-quick-view__desc">${desc}</div>
        </div>
      </div>
    </div>
    <div class="wci-modal" aria-hidden="true">
      <div class="wci-modal__content">
        <div class="wci-modal__header">
          <h5>Formas de pagamento</h5>
          <button type="button" class="wci-modal__close" aria-label="Fechar">&times;</button>
        </div>
        <div class="wci-modal__body">
          <h4>Parcelas:</h4>
          <table class="woo-custom-installments-table">
            <tbody>${buildInstallmentTableRows(priceMin)}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openCatalogQuickView(produto) {
  const shell = ensureCatalogQuickViewShell();
  const body = shell.querySelector(".lf-quick-view__body");
  body.innerHTML = renderCatalogQuickViewContent(produto);
  initCatalogQuickViewInteractions(body, produto);
  catalogQuickViewPrevFocus = document.activeElement;
  shell.classList.add("open");
  shell.setAttribute("aria-hidden", "false");
  document.body.classList.add("lf-qv-open");
  shell.querySelector(".lf-quick-view__close")?.focus();
}

function catalogProductCard(produto) {
  const installment = formatBRL(produto.preco / 3);
  const desc = truncateText(produto.descricao || "");
  const img = assetPath(catalogProductImage(produto));
  const fallbackImg = assetPath("assets/images/LINKFORTE-vetor.png");
  return `
    <article class="product-card product-card--catalog product-card--clickable" data-produto-id="${produto.id}">
      <div class="product-card__image">
        <img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='${fallbackImg}'">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${produto.nome}</h3>
        <p class="product-card__meta">${produto.midia} · ${catalogValidadeLabel(produto.validade_anos)}</p>
        ${desc ? `<p class="product-card__desc">${desc}</p>` : ""}
        <div class="product-card__price">R$ ${formatBRL(produto.preco)}</div>
        <div class="product-card__installment">Em até 3x de R$ ${installment} sem juros</div>
      </div>
      <button type="button" class="product-card__buy-btn js-catalog-add" data-produto-id="${produto.id}">
        Adicionar ao carrinho
      </button>
    </article>
  `;
}

async function initCatalogVitrine() {
  const grid = document.getElementById("products-shop");
  const filterRoot = document.querySelector(".catalog-filter");
  if (!grid || document.body.dataset.page !== "loja") return;

  let produtos = [];
  let filter = "all";

  try {
    produtos = await fetchProdutosSupabase();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="text-center">Não foi possível carregar os produtos.</p>';
    return;
  }

  const produtosById = new Map(produtos.map((p) => [String(p.id), p]));

  const params = new URLSearchParams(window.location.search);
  const tipoParam = params.get("tipo");
  if (tipoParam && URL_TIPO_TO_FILTER[tipoParam]) {
    filter = URL_TIPO_TO_FILTER[tipoParam];
  }

  function render() {
    const list = filter === "all" ? produtos : produtos.filter((p) => p.tipo === filter);
    if (list.length === 0) {
      grid.innerHTML = '<p class="text-center">Nenhum produto encontrado para este filtro.</p>';
      return;
    }
    grid.innerHTML = list.map(catalogProductCard).join("");
  }

  function setFilterActive(value) {
    filter = value;
    filterRoot?.querySelectorAll(".catalog-filter__btn").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.filter === value ? "true" : "false");
    });
    render();
  }

  filterRoot?.querySelectorAll(".catalog-filter__btn").forEach((btn) => {
    btn.addEventListener("click", () => setFilterActive(btn.dataset.filter));
  });

  grid.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".js-catalog-add");
    if (addBtn) {
      const produto = produtosById.get(String(addBtn.dataset.produtoId));
      if (produto && typeof adicionarAoCarrinho === "function") {
        adicionarAoCarrinho(produto);
      }
      return;
    }

    const card = e.target.closest("[data-produto-id]");
    if (!card) return;
    const produto = produtosById.get(String(card.dataset.produtoId));
    if (produto) openCatalogQuickView(produto);
  });

  setFilterActive(filter);
}

function findProdutoBySelection(produtos, selection) {
  const tipo = QUOTE_TYPE_TO_DB[selection.type];
  return produtos.find(
    (p) =>
      p.tipo === tipo &&
      p.midia === selection.model &&
      p.validade_anos === selection.years
  );
}

function setQuoteGroupValue(root, group, value) {
  root.querySelectorAll(`[data-quote-group="${group}"] .quote-option`).forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.value === value ? "true" : "false");
  });
}

function updateQuoteOptionAvailability(root, produtos, selection) {
  root.querySelectorAll('[data-quote-group="type"] .quote-option').forEach((btn) => {
    const tipo = QUOTE_TYPE_TO_DB[btn.dataset.value];
    btn.disabled = !produtos.some((p) => p.tipo === tipo);
  });

  const tipoAtual = QUOTE_TYPE_TO_DB[selection.type];
  root.querySelectorAll('[data-quote-group="model"] .quote-option').forEach((btn) => {
    btn.disabled = !produtos.some((p) => p.tipo === tipoAtual && p.midia === btn.dataset.value);
  });

  root.querySelectorAll('[data-quote-group="years"] .quote-option').forEach((btn) => {
    const years = Number(btn.dataset.value);
    btn.disabled = !findProdutoBySelection(produtos, { ...selection, years });
  });
}

function autoFixQuoteSelection(root, produtos) {
  let selection = getQuoteSelection(root);

  if (!produtos.some((p) => p.tipo === QUOTE_TYPE_TO_DB[selection.type])) {
    const first = ["ecpf", "ecnpj"].find((t) =>
      produtos.some((p) => p.tipo === QUOTE_TYPE_TO_DB[t])
    );
    if (first) {
      setQuoteGroupValue(root, "type", first);
      selection = getQuoteSelection(root);
    }
  }

  const tipo = QUOTE_TYPE_TO_DB[selection.type];
  if (!produtos.some((p) => p.tipo === tipo && p.midia === selection.model)) {
    const firstModel = ["A1", "Nuvem", "A3"].find((m) =>
      produtos.some((p) => p.tipo === tipo && p.midia === m)
    );
    if (firstModel) {
      setQuoteGroupValue(root, "model", firstModel);
      selection = getQuoteSelection(root);
    }
  }

  if (!findProdutoBySelection(produtos, selection)) {
    const firstYears = [1, 2, 3].find((y) =>
      findProdutoBySelection(produtos, { ...selection, years: y })
    );
    if (firstYears) {
      setQuoteGroupValue(root, "years", String(firstYears));
    }
  }
}

function buildQuoteWhatsappMessage(produto, selection) {
  if (produto) {
    const tipo = QUOTE_TYPE_LABELS[selection.type];
    const anosLabel = selection.years === 1 ? "ano" : "anos";
    return `Olá, quero um ${tipo} ${selection.model} de ${selection.years} ${anosLabel} (R$ ${formatBRL(produto.preco)})`;
  }
  const tipo = QUOTE_TYPE_LABELS[selection.type] || selection.type;
  return `Olá, quero informações sobre certificado digital ${tipo} ${selection.model}`;
}

async function initCertificateQuoter() {
  const root = document.getElementById("cotador-certificado");
  if (!root || document.body.dataset.page !== "loja") return;

  const priceEl = root.querySelector("[data-quote-price]");
  const installmentEl = root.querySelector("[data-quote-installment]");
  const summaryEl = root.querySelector("[data-quote-summary]");
  const addBtn = root.querySelector(".js-quote-add");
  const waBtn = root.querySelector(".js-quote-whatsapp");

  let produtos;

  try {
    produtos = await fetchProdutosSupabase();
  } catch (err) {
    console.error(err);
    if (priceEl) priceEl.innerHTML = '<span class="quote-unavailable">Indisponível</span>';
    addBtn?.classList.add("is-disabled");
    addBtn?.setAttribute("disabled", "true");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("tipo")) setQuoteGroupValue(root, "type", params.get("tipo"));
  if (params.get("modelo")) setQuoteGroupValue(root, "model", params.get("modelo"));
  if (params.get("anos")) setQuoteGroupValue(root, "years", params.get("anos"));

  let produtoAtual = null;

  function updateQuote() {
    autoFixQuoteSelection(root, produtos);
    const selection = getQuoteSelection(root);
    produtoAtual = findProdutoBySelection(produtos, selection);

    updateQuoteOptionAvailability(root, produtos, selection);

    if (summaryEl) summaryEl.textContent = formatQuoteSummary(selection);

    if (produtoAtual) {
      const installment = produtoAtual.preco / 3;
      if (priceEl) priceEl.textContent = `R$ ${formatBRL(produtoAtual.preco)}`;
      if (installmentEl) {
        installmentEl.textContent = `Em até 3x de R$ ${formatBRL(installment)} sem juros · À vista no Pix`;
      }
      addBtn?.classList.remove("is-disabled");
      addBtn?.removeAttribute("disabled");
    } else {
      if (priceEl) priceEl.innerHTML = '<span class="quote-unavailable">Consulte nosso time</span>';
      if (installmentEl) installmentEl.textContent = "";
      addBtn?.classList.add("is-disabled");
      addBtn?.setAttribute("disabled", "true");
    }

    if (waBtn) {
      const msg = appendReferralToMessage(buildQuoteWhatsappMessage(produtoAtual, selection));
      waBtn.href = `https://wa.me/${WHATSAPP_QUOTE_NUMBER}?text=${encodeURIComponent(msg)}`;
    }
  }

  root.querySelectorAll(".quote-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const group = btn.closest("[data-quote-group]")?.dataset.quoteGroup;
      if (!group) return;
      setQuoteGroupValue(root, group, btn.dataset.value);
      updateQuote();
    });
  });

  addBtn?.addEventListener("click", () => {
    if (!produtoAtual) return;
    if (typeof adicionarAoCarrinho === "function") {
      adicionarAoCarrinho(produtoAtual);
    }
  });

  updateQuote();
}

function getReferralCode() {
  try {
    return localStorage.getItem("lf_ref") || "";
  } catch {
    return "";
  }
}

function initReferralTracking() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return;

  try {
    localStorage.setItem("lf_ref", ref);
    localStorage.setItem("lf_ref_at", String(Date.now()));
  } catch {
    /* ignore */
  }
}

function appendReferralToMessage(text) {
  const ref = getReferralCode();
  if (!ref) return text;
  return `${text}\n\nIndicação: ${ref}`;
}

function renderCartItemRow(item) {
  const img = assetPath(catalogProductImage(item));
  const fallbackImg = assetPath("assets/images/LINKFORTE-vetor.png");
  const lineTotal = item.preco * item.quantidade;
  const itemId = String(item.id);
  return `
    <li class="cart-item" data-cart-item-id="${itemId}">
      <div class="cart-item__image">
        <img src="${img}" alt="" loading="lazy" onerror="this.src='${fallbackImg}'">
      </div>
      <div class="cart-item__info">
        <h3 class="cart-item__title">${item.nome}</h3>
        <p class="cart-item__meta">${item.midia} · ${catalogValidadeLabel(item.validade_anos)}</p>
        <p class="cart-item__unit">R$ ${formatBRL(item.preco)} cada</p>
      </div>
      <div class="cart-item__qty">
        <button type="button" class="cart-item__qty-btn js-cart-qty-minus" aria-label="Diminuir quantidade">−</button>
        <input type="number" class="cart-item__qty-input js-cart-qty-input" value="${item.quantidade}" min="1" max="99" aria-label="Quantidade">
        <button type="button" class="cart-item__qty-btn js-cart-qty-plus" aria-label="Aumentar quantidade">+</button>
      </div>
      <p class="cart-item__line-total">R$ ${formatBRL(lineTotal)}</p>
      <button type="button" class="cart-item__remove js-cart-remove" data-cart-item-id="${itemId}">Remover</button>
    </li>
  `;
}

function getCartItemId(el) {
  if (!el) return null;
  return el.getAttribute("data-cart-item-id");
}

function setCartSectionsVisible(emptyEl, contentEl, hasItems) {
  if (emptyEl) {
    emptyEl.hidden = hasItems;
    emptyEl.classList.toggle("is-hidden", hasItems);
  }
  if (contentEl) {
    contentEl.hidden = !hasItems;
    contentEl.classList.toggle("is-hidden", !hasItems);
  }
}

function getCouponApiBaseUrl() {
  const url = window.LF_API_BASE_URL;
  if (url) {
    const trimmed = String(url).replace(/\/$/, "");
    if (trimmed) {
      if (trimmed.includes("localhost") && !window.location.hostname.includes("localhost")) {
        return null;
      }
      return trimmed;
    }
  }

  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocal) {
    return "http://localhost:3001";
  }

  return null;
}

async function validarCupomRemoto(codigo, total) {
  const apiBase = getCouponApiBaseUrl();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/api/validar-cupom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, total }),
      });
      const data = await res.json();
      if (data && typeof data === "object" && "valido" in data) return data;
    } catch {
      /* fallback Supabase RPC */
    }
  }

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { valido: false, erro: "Serviço de cupons indisponível." };
  }

  const res = await fetch(`${String(url).replace(/\/$/, "")}/rest/v1/rpc/validar_cupom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_codigo: codigo, p_total: total }),
  });

  if (!res.ok) {
    return { valido: false, erro: "Erro ao validar cupom." };
  }

  return await res.json();
}

function getCheckoutApiBaseUrl() {
  return getCouponApiBaseUrl();
}

function isMockApiEnabled() {
  return window.LF_MOCK_API !== false;
}

const MOCK_PEDIDOS_KEY = "lf_mock_pedidos";
const MOCK_COUPON_STORAGE_KEY = "lf_applied_coupon";

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function getCartItemsForMock() {
  const items = typeof getCarrinho === "function" ? getCarrinho() : [];
  return items.map((item) => ({
    id: String(item.id),
    quantidade: item.quantidade,
    preco: item.preco,
    nome: item.nome,
  }));
}

function loadStoredCouponForMock() {
  try {
    const stored = sessionStorage.getItem(MOCK_COUPON_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.valido === true ? parsed : null;
  } catch {
    return null;
  }
}

function calcularResumoLocal(formaPagamento, cupomCodigo) {
  const items = getCartItemsForMock();
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.preco * item.quantidade, 0));

  let descontoCupom = 0;
  let baseAposCupom = subtotal;

  const storedCupom = loadStoredCouponForMock();
  if (cupomCodigo && storedCupom?.codigo?.toUpperCase() === String(cupomCodigo).toUpperCase()) {
    descontoCupom = roundMoney(storedCupom.desconto);
    baseAposCupom = roundMoney(storedCupom.total_final);
  }

  const descontoPix = formaPagamento === "pix" ? roundMoney(baseAposCupom * 0.05) : 0;
  const total =
    formaPagamento === "pix" ? roundMoney(baseAposCupom - descontoPix) : baseAposCupom;
  const parcelaCartao = roundMoney(baseAposCupom / 3);

  return {
    subtotal,
    descontoCupom,
    descontoPix,
    total,
    parcelaCartao,
    formaPagamento,
  };
}

function saveMockPedido(pedido) {
  try {
    const all = JSON.parse(sessionStorage.getItem(MOCK_PEDIDOS_KEY) || "{}");
    all[pedido.id] = pedido;
    sessionStorage.setItem(MOCK_PEDIDOS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function getMockPedido(pedidoId) {
  try {
    const all = JSON.parse(sessionStorage.getItem(MOCK_PEDIDOS_KEY) || "{}");
    return all[pedidoId] || null;
  } catch {
    return null;
  }
}

function mockQrImageUrl(text) {
  const payload = String(text || "PIX");
  if (typeof qrcode === "function") {
    try {
      const qr = qrcode(0, "M");
      qr.addData(payload, "Byte");
      qr.make();
      return qr.createDataURL(6, 2);
    } catch {
      /* fallback abaixo */
    }
  }
  return mockQrImageUrlFallback(payload);
}

function mockQrImageUrlFallback(text) {
  const safe = String(text || "PIX").slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
    <rect width="220" height="220" fill="#fff"/>
    <text x="110" y="110" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#666">QR indisponível</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateMockPixCode(pedidoId, amount) {
  const idPart = String(pedidoId).replace(/-/g, "").slice(0, 32);
  const amountStr = amount.toFixed(2);
  return `00020126580014br.gov.bcb.pix0136${idPart}52040000530398654${amountStr.length}${amountStr}5802BR5913LINK FORTE LTDA6009CURITIBA62070503***6304MOCK`;
}

async function checkoutRemotoMock(payload) {
  await Promise.resolve();

  const forma = payload.formaPagamento || "pix";
  const resumo = calcularResumoLocal(forma, payload.cupom);

  if (payload.acao === "calcular") {
    return { ok: true, resumo };
  }

  if (payload.acao === "criar") {
    const pedidoId = crypto.randomUUID();
    saveMockPedido({
      id: pedidoId,
      forma_pagamento: forma,
      total: resumo.total,
      resumo,
      cliente: payload.cliente,
      itens: getCartItemsForMock(),
      created_at: new Date().toISOString(),
    });

    return {
      ok: true,
      pedidoId,
      resumo,
      redirectUrl: `/pagamento?pedido=${pedidoId}`,
    };
  }

  return { ok: false, erro: "Ação inválida." };
}

async function pagamentoRemotoMock(payload) {
  await Promise.resolve();

  const pedidoId = typeof payload.pedidoId === "string" ? payload.pedidoId.trim() : "";
  const pedido = getMockPedido(pedidoId);

  if (!pedido) {
    return { ok: false, erro: "Pedido não encontrado (modo mock)." };
  }

  if (payload.acao === "confirmar" && pedido.forma_pagamento === "cartao") {
    return {
      ok: true,
      forma: "cartao",
      paymentId: `mock_${pedidoId}`,
      amount: pedido.total,
      status: "approved",
    };
  }

  if (pedido.forma_pagamento === "pix") {
    const qrCode = generateMockPixCode(pedidoId, pedido.total);
    return {
      ok: true,
      forma: "pix",
      paymentId: `mock_${pedidoId}`,
      amount: pedido.total,
      qrCode,
      qrCodeBase64: "",
      mockQrImageUrl: mockQrImageUrl(qrCode),
      expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      mock: true,
    };
  }

  if (pedido.forma_pagamento === "boleto") {
    const cents = String(Math.round(pedido.total * 100)).padStart(10, "0");
    return {
      ok: true,
      forma: "boleto",
      paymentId: `mock_${pedidoId}`,
      amount: pedido.total,
      ticketUrl: "#",
      barcode: `23793.38128 60000.000003 00000.000400 1 ${cents}`,
      mock: true,
    };
  }

  if (pedido.forma_pagamento === "cartao") {
    return {
      ok: true,
      forma: "cartao",
      amount: pedido.total,
      publicKey: "MOCK_PUBLIC_KEY",
      maxInstallments: 3,
      parcelaSugerida: roundMoney(pedido.total / 3),
      mock: true,
    };
  }

  return { ok: false, erro: "Forma de pagamento não reconhecida." };
}

function getPixQrImageSrc(data) {
  if (data.qrCodeBase64) {
    return `data:image/png;base64,${data.qrCodeBase64}`;
  }
  if (data.mockQrImageUrl) {
    return data.mockQrImageUrl;
  }
  if (data.qrCode) {
    return mockQrImageUrl(data.qrCode);
  }
  return "";
}

function bindPixCopyButton(copyBtn, pixCodeInput, copyFeedback) {
  if (!copyBtn || copyBtn.dataset.pixCopyBound === "true") return;
  copyBtn.dataset.pixCopyBound = "true";

  copyBtn.addEventListener("click", async () => {
    const code = pixCodeInput?.value || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      if (copyFeedback) {
        copyFeedback.hidden = false;
        setTimeout(() => {
          copyFeedback.hidden = true;
        }, 2500);
      }
    } catch {
      pixCodeInput?.select();
      document.execCommand("copy");
    }
  });
}

function fillPixPanel(root, data, formatMoney) {
  const amountEl = root.querySelector("[data-payment-amount-pix], [data-checkout-pix-amount]");
  const qrImg = root.querySelector("[data-payment-qr-img], [data-checkout-pix-qr]");
  const pixCodeInput = root.querySelector("[data-payment-pix-code], [data-checkout-pix-code]");
  const expiryEl = root.querySelector("[data-payment-expiry], [data-checkout-pix-expiry]");
  const copyBtn = root.querySelector("[data-payment-copy-pix], [data-checkout-pix-copy]");
  const copyFeedback = root.querySelector("[data-payment-copy-feedback], [data-checkout-pix-copy-feedback]");

  if (amountEl) amountEl.textContent = formatMoney(data.amount);

  const qrSrc = getPixQrImageSrc(data);
  if (qrImg && qrSrc) qrImg.src = qrSrc;
  if (pixCodeInput) pixCodeInput.value = data.qrCode || "";

  if (expiryEl && data.expirationDate) {
    const date = new Date(data.expirationDate);
    expiryEl.textContent = `Válido até ${date.toLocaleString("pt-BR")}`;
    expiryEl.hidden = false;
  } else if (expiryEl) {
    expiryEl.hidden = true;
  }

  bindPixCopyButton(copyBtn, pixCodeInput, copyFeedback);
}

async function checkoutRemoto(payload) {
  if (isMockApiEnabled()) {
    return checkoutRemotoMock(payload);
  }

  const apiBase = getCheckoutApiBaseUrl();
  if (!apiBase) {
    return checkoutRemotoMock(payload);
  }

  try {
    const res = await fetch(`${apiBase}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data && typeof data === "object" && "ok" in data) {
      if (data.ok) return data;
      return checkoutRemotoMock(payload);
    }
    return checkoutRemotoMock(payload);
  } catch {
    return checkoutRemotoMock(payload);
  }
}

async function pagamentoRemoto(payload) {
  if (isMockApiEnabled()) {
    return pagamentoRemotoMock(payload);
  }

  const apiBase = getCheckoutApiBaseUrl();
  if (!apiBase) {
    return pagamentoRemotoMock(payload);
  }

  try {
    const res = await fetch(`${apiBase}/api/pagamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data && typeof data === "object" && "ok" in data) {
      if (data.ok) return data;
      return pagamentoRemotoMock(payload);
    }
    return pagamentoRemotoMock(payload);
  } catch {
    return pagamentoRemotoMock(payload);
  }
}

function getPedidoIdFromUrl() {
  return new URLSearchParams(window.location.search).get("pedido")?.trim() || "";
}

function loadMercadoPagoSdk() {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o SDK do Mercado Pago."));
    document.head.appendChild(script);
  });
}

function initCartPage() {
  if (document.body.dataset.page !== "carrinho") return;

  const COUPON_STORAGE_KEY = "lf_applied_coupon";
  const emptyEl = document.getElementById("cart-empty");
  const contentEl = document.getElementById("cart-content");
  const listEl = document.getElementById("cart-items");
  const cartPage = document.querySelector(".cart-page");
  const cartSummary = document.querySelector(".cart-page .cart-summary");
  const subtotalEl = cartSummary?.querySelector("[data-cart-subtotal]");
  const totalEl = cartSummary?.querySelector("[data-cart-total]");
  const discountRowEl = cartSummary?.querySelector("[data-cart-discount-row]");
  const discountEl = cartSummary?.querySelector("[data-cart-discount]");
  const couponInput = cartSummary?.querySelector("[data-coupon-input]");
  const couponApplyBtn = cartSummary?.querySelector("[data-coupon-apply]");
  const couponErrorEl = cartSummary?.querySelector("[data-coupon-error]");

  let appliedCoupon = null;

  function formatMoney(value) {
    return `R$ ${formatBRL(value)}`;
  }

  function clearCouponError() {
    if (!couponErrorEl) return;
    couponErrorEl.hidden = true;
    couponErrorEl.textContent = "";
  }

  function showCouponError(message) {
    if (!couponErrorEl) return;
    couponErrorEl.textContent = message;
    couponErrorEl.hidden = false;
  }

  function clearAppliedCoupon() {
    appliedCoupon = null;
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
    if (discountRowEl) discountRowEl.hidden = true;
  }

  function updateTotals(subtotal) {
    const formattedSubtotal = formatMoney(subtotal);
    if (subtotalEl) subtotalEl.textContent = formattedSubtotal;

    if (appliedCoupon?.valido === true) {
      if (discountRowEl) discountRowEl.hidden = false;
      if (discountEl) discountEl.textContent = `− ${formatMoney(appliedCoupon.desconto)}`;
      if (totalEl) totalEl.textContent = formatMoney(appliedCoupon.total_final);
    } else {
      if (discountRowEl) discountRowEl.hidden = true;
      if (totalEl) totalEl.textContent = formattedSubtotal;
    }
  }

  function render() {
    const items = typeof getCarrinho === "function" ? getCarrinho() : [];
    const hasItems = items.length > 0;

    setCartSectionsVisible(emptyEl, contentEl, hasItems);

    if (!hasItems) {
      if (listEl) listEl.innerHTML = "";
      clearAppliedCoupon();
      return;
    }

    if (listEl) listEl.innerHTML = items.map(renderCartItemRow).join("");
    const subtotal = typeof getTotalCarrinho === "function" ? getTotalCarrinho() : 0;
    updateTotals(subtotal);
  }

  async function applyCoupon() {
    clearCouponError();
    const codigo = couponInput?.value?.trim();
    if (!codigo) {
      showCouponError("Informe um código de cupom.");
      return;
    }

    const subtotal = typeof getTotalCarrinho === "function" ? getTotalCarrinho() : 0;
    if (subtotal <= 0) {
      showCouponError("Adicione itens ao carrinho antes de aplicar um cupom.");
      return;
    }

    if (couponApplyBtn) {
      couponApplyBtn.disabled = true;
      couponApplyBtn.textContent = "Validando…";
    }

    try {
      const data = await validarCupomRemoto(codigo, subtotal);

      if (data?.valido === true) {
        appliedCoupon = data;
        sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(data));
        if (couponInput) couponInput.value = data.codigo;
        updateTotals(subtotal);
      } else {
        clearAppliedCoupon();
        updateTotals(subtotal);
        showCouponError(data?.erro || "Cupom inválido ou expirado.");
      }
    } catch {
      clearAppliedCoupon();
      updateTotals(subtotal);
      showCouponError("Não foi possível validar o cupom. Tente novamente.");
    } finally {
      if (couponApplyBtn) {
        couponApplyBtn.disabled = false;
        couponApplyBtn.textContent = "Aplicar";
      }
    }
  }

  async function revalidateCoupon() {
    if (!appliedCoupon?.codigo) return;

    const subtotal = typeof getTotalCarrinho === "function" ? getTotalCarrinho() : 0;
    if (subtotal <= 0) {
      clearAppliedCoupon();
      return;
    }

    try {
      const data = await validarCupomRemoto(appliedCoupon.codigo, subtotal);
      if (data?.valido === true) {
        appliedCoupon = data;
        sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(data));
      } else {
        clearAppliedCoupon();
      }
    } catch {
      /* mantém cupom anterior em falha de rede */
    }
  }

  try {
    const stored = sessionStorage.getItem(COUPON_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.valido === true && parsed?.codigo) {
        appliedCoupon = parsed;
        if (couponInput) couponInput.value = parsed.codigo;
      }
    }
  } catch {
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
  }

  cartPage?.addEventListener("click", (e) => {
    if (e.target.closest(".cart-summary__cta")) {
      e.preventDefault();
      const items = typeof getCarrinho === "function" ? getCarrinho() : [];
      if (items.length === 0) return;
      window.location.href = navHref("checkout.html", getBasePath());
      return;
    }
    if (e.target.closest("[data-coupon-apply]")) {
      e.preventDefault();
      applyCoupon();
      return;
    }
    handleCartAction(e);
  });

  cartSummary?.addEventListener("keydown", (e) => {
    if (e.target.matches("[data-coupon-input]") && e.key === "Enter") {
      e.preventDefault();
      applyCoupon();
    }
  });

  function handleCartAction(e) {
    if (typeof alterarQuantidade !== "function" || typeof removerItem !== "function") return;

    const removeBtn = e.target.closest(".js-cart-remove");
    if (removeBtn) {
      e.preventDefault();
      const id = getCartItemId(removeBtn) || getCartItemId(removeBtn.closest("[data-cart-item-id]"));
      if (id) removerItem(id);
      return;
    }

    const itemEl = e.target.closest("[data-cart-item-id]");
    if (!itemEl) return;
    const id = getCartItemId(itemEl);
    if (!id) return;

    if (e.target.closest(".js-cart-qty-minus")) {
      e.preventDefault();
      const input = itemEl.querySelector(".js-cart-qty-input");
      alterarQuantidade(id, Number(input?.value || 1) - 1);
      return;
    }
    if (e.target.closest(".js-cart-qty-plus")) {
      e.preventDefault();
      const input = itemEl.querySelector(".js-cart-qty-input");
      alterarQuantidade(id, Number(input?.value || 1) + 1);
    }
  }

  cartPage?.addEventListener("change", (e) => {
    if (!e.target.classList.contains("js-cart-qty-input")) return;
    const itemEl = e.target.closest("[data-cart-item-id]");
    const id = getCartItemId(itemEl);
    if (!id || typeof alterarQuantidade !== "function") return;
    alterarQuantidade(id, Number(e.target.value));
  });

  document.addEventListener("lf:cart-updated", async () => {
    await revalidateCoupon();
    render();
  });

  render();

  if (appliedCoupon) {
    revalidateCoupon().then(render);
  }
}

function initCheckoutPage() {
  if (document.body.dataset.page !== "checkout") return;

  const COUPON_STORAGE_KEY = "lf_applied_coupon";
  const emptyEl = document.getElementById("checkout-empty");
  const contentEl = document.getElementById("checkout-content");
  const listEl = document.getElementById("checkout-items");
  const formEl = document.getElementById("checkout-form");
  const subtotalEl = document.querySelector("[data-checkout-subtotal]");
  const totalEl = document.querySelector("[data-checkout-total]");
  const discountRowEl = document.querySelector("[data-checkout-discount-row]");
  const discountEl = document.querySelector("[data-checkout-discount]");
  const couponCodeEl = document.querySelector("[data-checkout-coupon-code]");
  const pixRowEl = document.querySelector("[data-checkout-pix-row]");
  const pixDiscountEl = document.querySelector("[data-checkout-pix-discount]");
  const installmentEl = document.querySelector("[data-checkout-installment]");
  const installmentValueEl = document.querySelector("[data-checkout-installment-value]");
  const cartaoDescEl = document.querySelector("[data-payment-desc-cartao]");
  const errorEl = document.querySelector("[data-checkout-error]");
  const submitBtn = document.querySelector("[data-checkout-submit]");
  const paymentOptions = document.querySelectorAll(".checkout-payment__option");
  const pixModalEl = document.getElementById("checkout-pix-modal");
  let pixModalInitialized = false;

  let appliedCouponCode = null;
  let currentResumo = null;
  let calcRequestId = 0;

  function formatMoney(value) {
    return `R$ ${formatBRL(value)}`;
  }

  function loadStoredCouponCode() {
    try {
      const stored = sessionStorage.getItem(COUPON_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.valido && parsed?.codigo ? parsed.codigo : null;
    } catch {
      sessionStorage.removeItem(COUPON_STORAGE_KEY);
      return null;
    }
  }

  function clearCheckoutError() {
    if (!errorEl) return;
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function showCheckoutError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function getCartItemsPayload() {
    const items = typeof getCarrinho === "function" ? getCarrinho() : [];
    return items.map((item) => ({ id: item.id, quantidade: item.quantidade }));
  }

  function getSelectedFormaPagamento() {
    const selected = formEl?.querySelector('input[name="formaPagamento"]:checked');
    return selected?.value || "pix";
  }

  function updatePaymentOptionStyles() {
    paymentOptions.forEach((option) => {
      const input = option.querySelector('input[name="formaPagamento"]');
      option.classList.toggle("checkout-payment__option--selected", input?.checked === true);
    });
  }

  function renderCheckoutItemRow(item) {
    const lineTotal = item.preco * item.quantidade;
    return `
      <li class="checkout-item">
        <span class="checkout-item__name">${item.nome} × ${item.quantidade}</span>
        <strong class="checkout-item__price">${formatMoney(lineTotal)}</strong>
      </li>`;
  }

  function updateResumoUI(resumo) {
    currentResumo = resumo;
    if (!resumo) return;

    if (subtotalEl) subtotalEl.textContent = formatMoney(resumo.subtotal);

    if (resumo.descontoCupom > 0) {
      if (discountRowEl) discountRowEl.hidden = false;
      if (discountEl) discountEl.textContent = `− ${formatMoney(resumo.descontoCupom)}`;
      if (couponCodeEl && appliedCouponCode) couponCodeEl.textContent = `(${appliedCouponCode})`;
    } else {
      if (discountRowEl) discountRowEl.hidden = true;
      if (couponCodeEl) couponCodeEl.textContent = "";
    }

    if (resumo.descontoPix > 0) {
      if (pixRowEl) pixRowEl.hidden = false;
      if (pixDiscountEl) pixDiscountEl.textContent = `− ${formatMoney(resumo.descontoPix)}`;
    } else {
      if (pixRowEl) pixRowEl.hidden = true;
    }

    if (totalEl) totalEl.textContent = formatMoney(resumo.total);

    if (installmentEl && installmentValueEl) {
      installmentEl.hidden = false;
      installmentValueEl.textContent = formatMoney(resumo.parcelaCartao);
    }

    if (cartaoDescEl) {
      cartaoDescEl.textContent = `Até 3x de ${formatMoney(resumo.parcelaCartao)} sem juros`;
    }
  }

  async function recalcularPrecos() {
    const itens = getCartItemsPayload();
    if (itens.length === 0) return;

    const requestId = ++calcRequestId;
    clearCheckoutError();

    if (submitBtn) submitBtn.disabled = true;

    const result = await checkoutRemoto({
      acao: "calcular",
      itens,
      formaPagamento: getSelectedFormaPagamento(),
      cupom: appliedCouponCode || undefined,
    });

    if (requestId !== calcRequestId) return;

    if (submitBtn) submitBtn.disabled = false;

    if (!result.ok) {
      showCheckoutError(result.erro || "Erro ao calcular preços.");
      return;
    }

    updateResumoUI(result.resumo);
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function clearFieldErrors() {
    formEl?.querySelectorAll("[data-field-error]").forEach((el) => {
      el.hidden = true;
      el.textContent = "";
    });
    formEl?.querySelectorAll(".checkout-input--invalid").forEach((el) => {
      el.classList.remove("checkout-input--invalid");
    });
  }

  function showFieldError(fieldName, message) {
    const input = formEl?.querySelector(`[name="${fieldName}"]`);
    const error = formEl?.querySelector(`[data-field-error="${fieldName}"]`);
    if (input) input.classList.add("checkout-input--invalid");
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    input?.focus();
  }

  function validarFormularioCheckout(formData) {
    clearFieldErrors();

    const nome = String(formData.get("nome") || "").trim();
    const cpfCnpj = String(formData.get("cpfCnpj") || "");
    const email = String(formData.get("email") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "");

    if (nome.length < 2) {
      showFieldError("nome", "Informe seu nome completo (mínimo 2 caracteres).");
      return false;
    }

    const cpfCnpjDigits = onlyDigits(cpfCnpj);
    if (cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14) {
      showFieldError("cpfCnpj", "CPF deve ter 11 dígitos ou CNPJ 14 dígitos.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError("email", "Informe um e-mail válido.");
      return false;
    }

    const whatsappDigits = onlyDigits(whatsapp);
    if (whatsappDigits.length < 10 || whatsappDigits.length > 13) {
      showFieldError("whatsapp", "Informe um WhatsApp válido com DDD (ex.: 41999999999).");
      return false;
    }

    return true;
  }

  function resetSubmitButton() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar pedido";
    }
  }

  function closeCheckoutPixModal() {
    if (!pixModalEl) return;
    pixModalEl.hidden = true;
    pixModalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("checkout-pix-modal-open");
  }

  function openCheckoutPixModal(pixData) {
    if (!pixModalEl) return;

    const panel = pixModalEl.querySelector(".checkout-pix-modal__panel");
    if (panel) {
      fillPixPanel(panel, pixData, formatMoney);
      let badge = panel.querySelector(".payment-panel__mock-badge");
      if (isMockApiEnabled()) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "payment-panel__mock-badge";
          badge.textContent = "Modo desenvolvimento";
          panel.querySelector(".payment-panel__header")?.prepend(badge);
        }
      } else if (badge) {
        badge.remove();
      }
    }

    pixModalEl.hidden = false;
    pixModalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("checkout-pix-modal-open");

    const closeBtn = pixModalEl.querySelector(".checkout-pix-modal__close");
    closeBtn?.focus();
  }

  function initCheckoutPixModal() {
    if (pixModalInitialized || !pixModalEl) return;
    pixModalInitialized = true;

    pixModalEl.querySelectorAll("[data-checkout-pix-close]").forEach((el) => {
      el.addEventListener("click", closeCheckoutPixModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pixModalEl && !pixModalEl.hidden) {
        closeCheckoutPixModal();
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearCheckoutError();
    clearFieldErrors();

    const itens = getCartItemsPayload();
    if (itens.length === 0) {
      showCheckoutError("Seu carrinho está vazio.");
      return;
    }

    const formData = new FormData(formEl);
    if (!validarFormularioCheckout(formData)) {
      showCheckoutError("Corrija os campos destacados antes de confirmar.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Processando…";
    }

    const formaPagamento = getSelectedFormaPagamento();

    const result = await checkoutRemoto({
      acao: "criar",
      itens,
      formaPagamento,
      cupom: appliedCouponCode || undefined,
      cliente: {
        nome: formData.get("nome"),
        cpfCnpj: formData.get("cpfCnpj"),
        email: formData.get("email"),
        whatsapp: formData.get("whatsapp"),
      },
    });

    if (!result.ok) {
      showCheckoutError(result.erro || "Erro ao criar pedido.");
      resetSubmitButton();
      return;
    }

    if (formaPagamento === "pix") {
      const pixResult = await pagamentoRemoto({ pedidoId: result.pedidoId, acao: "criar" });
      if (!pixResult.ok) {
        showCheckoutError(pixResult.erro || "Erro ao gerar PIX.");
        resetSubmitButton();
        return;
      }

      initCheckoutPixModal();
      openCheckoutPixModal(pixResult);
      resetSubmitButton();
      return;
    }

    let redirect = result.redirectUrl;
    if (redirect && redirect.startsWith("/pagamento")) {
      redirect = navHref(`pagamento.html${redirect.slice("/pagamento".length)}`, getBasePath());
    }
    window.location.href = redirect || navHref(`pagamento.html?pedido=${result.pedidoId}`, getBasePath());
  }

  function render() {
    const items = typeof getCarrinho === "function" ? getCarrinho() : [];
    const hasItems = items.length > 0;

    setCartSectionsVisible(emptyEl, contentEl, hasItems);

    if (!hasItems) {
      if (listEl) listEl.innerHTML = "";
      currentResumo = null;
      return;
    }

    if (listEl) listEl.innerHTML = items.map(renderCheckoutItemRow).join("");
    appliedCouponCode = loadStoredCouponCode();
    recalcularPrecos();
  }

  formEl?.addEventListener("submit", handleSubmit);

  formEl?.addEventListener("input", (e) => {
    const target = e.target;
    if (!target.name) return;
    target.classList.remove("checkout-input--invalid");
    const error = formEl?.querySelector(`[data-field-error="${target.name}"]`);
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  });

  formEl?.addEventListener("change", (e) => {
    if (e.target.matches('input[name="formaPagamento"]')) {
      updatePaymentOptionStyles();
      recalcularPrecos();
    }
  });

  document.addEventListener("lf:cart-updated", render);
  updatePaymentOptionStyles();
  render();
}

function initPagamentoPage() {
  if (document.body.dataset.page !== "pagamento") return;

  const loadingEl = document.getElementById("payment-loading");
  const errorEl = document.getElementById("payment-error");
  const errorMsgEl = document.querySelector("[data-payment-error]");
  const pixEl = document.getElementById("payment-pix");
  const boletoEl = document.getElementById("payment-boleto");
  const cartaoEl = document.getElementById("payment-cartao");
  const successEl = document.getElementById("payment-success");
  const successMsgEl = document.querySelector("[data-payment-success-message]");

  const pedidoId = getPedidoIdFromUrl();

  function formatMoney(value) {
    return `R$ ${formatBRL(value)}`;
  }

  function hideAllPanels() {
    loadingEl.hidden = true;
    errorEl.hidden = true;
    pixEl.hidden = true;
    boletoEl.hidden = true;
    cartaoEl.hidden = true;
    successEl.hidden = true;
  }

  function showError(message) {
    hideAllPanels();
    if (errorMsgEl) errorMsgEl.textContent = message;
    errorEl.hidden = false;
  }

  function showPix(data) {
    hideAllPanels();
    fillPixPanel(document, data, formatMoney);
    pixEl.hidden = false;
  }

  function showBoleto(data) {
    hideAllPanels();
    const amountEl = document.querySelector("[data-payment-amount-boleto]");
    const linkEl = document.querySelector("[data-payment-boleto-link]");
    const barcodeEl = document.querySelector("[data-payment-barcode]");

    if (amountEl) amountEl.textContent = formatMoney(data.amount);
    if (linkEl && data.ticketUrl) {
      linkEl.href = data.ticketUrl;
    }
    if (barcodeEl && data.barcode) {
      barcodeEl.textContent = data.barcode;
      barcodeEl.hidden = false;
    }

    boletoEl.hidden = false;
  }

  function showCartaoSuccess(data) {
    hideAllPanels();
    const statusLabels = {
      approved: "aprovado",
      pending: "em processamento",
      in_process: "em processamento",
      rejected: "recusado",
    };
    const statusText = statusLabels[data.status] || data.status;
    if (successMsgEl) {
      successMsgEl.textContent = `Seu pagamento foi ${statusText}. Em breve entraremos em contato para agendar a videoconferência.`;
    }
    successEl.hidden = false;
  }

  async function initCardBrick(data) {
    hideAllPanels();

    const amountEl = document.querySelector("[data-payment-amount-cartao]");
    const installmentsEl = document.querySelector("[data-payment-cartao-installments]");

    if (amountEl) amountEl.textContent = formatMoney(data.amount);
    if (installmentsEl) {
      installmentsEl.textContent = `Até ${data.maxInstallments}x de ${formatMoney(data.parcelaSugerida)} sem juros`;
    }

    cartaoEl.hidden = false;

    if (data.status && data.paymentId) {
      showCartaoSuccess(data);
      return;
    }

    if (data.mock) {
      const container = document.getElementById("cardPaymentBrick_container");
      if (container) {
        container.innerHTML = `
          <div class="payment-mock-card">
            <span class="payment-panel__mock-badge">Modo desenvolvimento</span>
            <p>Formulário de cartão real será carregado quando o Mercado Pago estiver configurado.</p>
            <button type="button" class="btn btn-primary" data-mock-card-pay>Simular pagamento aprovado</button>
          </div>`;
        container.querySelector("[data-mock-card-pay]")?.addEventListener("click", async () => {
          const result = await pagamentoRemoto({ pedidoId, acao: "confirmar" });
          if (!result.ok) {
            alert(result.erro || "Erro ao simular pagamento.");
            return;
          }
          showCartaoSuccess(result);
          if (typeof limparCarrinho === "function") limparCarrinho();
        });
      }
      return;
    }

    try {
      await loadMercadoPagoSdk();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Erro ao carregar formulário de cartão.");
      return;
    }

    const mp = new window.MercadoPago(data.publicKey, { locale: "pt-BR" });
    const bricksBuilder = mp.bricks();

    await bricksBuilder.create("cardPayment", "cardPaymentBrick_container", {
      initialization: {
        amount: data.amount,
      },
      customization: {
        paymentMethods: {
          maxInstallments: data.maxInstallments || 3,
        },
      },
      callbacks: {
        onReady: () => {},
        onError: (err) => {
          console.error("[cardPayment]", err);
        },
        onSubmit: (cardFormData) => {
          return pagamentoRemoto({
            pedidoId,
            acao: "confirmar",
            token: cardFormData.token,
            paymentMethodId: cardFormData.payment_method_id,
            installments: Number(cardFormData.installments) || 1,
          }).then((result) => {
            if (!result.ok) {
              throw new Error(result.erro || "Erro ao processar pagamento.");
            }
            if (result.status === "approved" || result.status === "pending" || result.status === "in_process") {
              showCartaoSuccess(result);
              if (typeof limparCarrinho === "function") limparCarrinho();
            } else {
              throw new Error("Pagamento não aprovado. Verifique os dados do cartão e tente novamente.");
            }
          });
        },
      },
    });
  }

  async function init() {
    if (!pedidoId) {
      showError("Pedido não informado. Volte ao checkout e tente novamente.");
      return;
    }

    const result = await pagamentoRemoto({ pedidoId, acao: "criar" });

    if (!result.ok) {
      showError(result.erro || "Erro ao preparar pagamento.");
      return;
    }

    if (result.forma === "pix") {
      showPix(result);
      return;
    }

    if (result.forma === "boleto") {
      showBoleto(result);
      return;
    }

    if (result.forma === "cartao") {
      await initCardBrick(result);
      return;
    }

    showError("Forma de pagamento não reconhecida.");
  }

  init();
}

function updateCartBadge() {
  const badge = document.querySelector("[data-cart-badge]");
  if (!badge) return;
  const qty = typeof getQuantidadeCarrinho === "function" ? getQuantidadeCarrinho() : 0;
  badge.textContent = String(qty);
  badge.hidden = qty === 0;
}

function initCartBadge() {
  const headerContainer = document.querySelector(".header .container");
  const menuToggle = headerContainer?.querySelector(".menu-toggle");
  if (!headerContainer || !menuToggle) return;

  if (!headerContainer.querySelector(".header-cart")) {
    const link = document.createElement("a");
    link.href = navHref("carrinho.html", getBasePath());
    link.className = "header-cart";
    link.setAttribute("aria-label", "Carrinho de compras");
    link.innerHTML = `${navIcon("cart")}<span class="header-cart__badge" data-cart-badge hidden>0</span>`;
    headerContainer.insertBefore(link, menuToggle);
  }

  updateCartBadge();
  document.addEventListener("lf:cart-updated", updateCartBadge);
  window.addEventListener("storage", (e) => {
    if (e.key === "lf_cart") updateCartBadge();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initReferralTracking();
  initCartBadge();
  initMegaNav().then(() => {
    initMobileMenu();
  });
  initContactForm();
  initHeroHome();
  initPersonaCards();
  await initAcquisitionSteps();
  await initModelCompare();
  await initFaqSection();
  await initReviewsCarousel();
  initScrollReveal();
  initCertificateQuoter();
  initCatalogVitrine();
  initCartPage();
  initCheckoutPage();
  initPagamentoPage();
  renderProductDetail();
});
