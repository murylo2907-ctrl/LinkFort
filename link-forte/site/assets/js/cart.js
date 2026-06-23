const CART_KEY = "lf_cart";

function getCarrinho() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCarrinho(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  dispatchCartUpdate();
}

function adicionarAoCarrinho(produto) {
  const items = getCarrinho();
  const produtoId = String(produto.id);
  const existing = items.find((i) => String(i.id) === produtoId);
  if (existing) {
    existing.quantidade += 1;
  } else {
    items.push({
      id: produtoId,
      nome: produto.nome,
      tipo: produto.tipo,
      midia: produto.midia,
      validade_anos: produto.validade_anos,
      preco: produto.preco,
      quantidade: 1,
    });
  }
  saveCarrinho(items);
  showCartToast(produto.nome);
}

function getQuantidadeCarrinho() {
  return getCarrinho().reduce((sum, i) => sum + i.quantidade, 0);
}

function removerItem(id) {
  const items = getCarrinho().filter((i) => String(i.id) !== String(id));
  saveCarrinho(items);
}

function alterarQuantidade(id, qty) {
  const n = Math.floor(Number(qty));
  if (!n || n <= 0) {
    removerItem(id);
    return;
  }
  const items = getCarrinho();
  const item = items.find((i) => String(i.id) === String(id));
  if (!item) return;
  item.quantidade = Math.min(99, n);
  saveCarrinho(items);
}

function limparCarrinho() {
  saveCarrinho([]);
}

function getSubtotal() {
  return getCarrinho().reduce((sum, i) => sum + i.preco * i.quantidade, 0);
}

function getTotalCarrinho() {
  return getSubtotal();
}

function dispatchCartUpdate() {
  document.dispatchEvent(
    new CustomEvent("lf:cart-updated", {
      detail: { quantidade: getQuantidadeCarrinho() },
    })
  );
}

function showCartToast(nome) {
  let el = document.getElementById("lf-cart-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "lf-cart-toast";
    el.className = "lf-cart-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = `${nome} adicionado ao carrinho`;
  el.classList.add("is-visible");
  clearTimeout(showCartToast._timer);
  showCartToast._timer = setTimeout(() => el.classList.remove("is-visible"), 2500);
}
