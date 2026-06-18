let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error("Configure supabase-config.js com URL e anon key.");
  }

  if (
    window.SUPABASE_ANON_KEY === "cole_sua_anon_key_aqui" ||
    window.SUPABASE_ANON_KEY.startsWith("sb_secret_")
  ) {
    throw new Error("Cole a anon public key em supabase-config.js (não use a secret key).");
  }

  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  return supabaseClient;
}

function portalAsset(path) {
  return `${window.PORTAL_BASE || "../"}${path}`;
}

async function getSession() {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

async function getUserRole() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await getSupabase()
    .from("partner_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  return data?.role || null;
}

async function requireAuth({ adminOnly = false } = {}) {
  const session = await getSession();
  if (!session) {
    window.location.href = portalAsset("parceiro/login.html");
    return null;
  }

  const role = await getUserRole();
  if (!role) {
    await getSupabase().auth.signOut();
    alert("Sua conta não tem acesso ao portal. Entre em contato com a Link Forte.");
    window.location.href = portalAsset("parceiro/login.html");
    return null;
  }

  if (adminOnly && role !== "admin") {
    window.location.href = portalAsset("parceiro/index.html");
    return null;
  }

  return { session, role };
}

async function logout() {
  await getSupabase().auth.signOut();
  window.location.href = portalAsset("parceiro/login.html");
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function statusLabel(status) {
  const map = {
    pendente: "Pendente",
    aprovada: "Aprovada",
    paga: "Paga",
    active: "Ativo",
    inactive: "Inativo",
    indicacao: "Indicação",
    revenda: "Revenda",
    ar: "Autoridade de Registro",
  };
  return map[status] || status;
}

function referralLink(partnerCode) {
  const url = new URL("../loja.html", window.location.href);
  url.searchParams.set("ref", partnerCode);
  return url.href;
}

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
  el.className = `portal-alert portal-alert--${type}`;
}

function renderPortalNav(active, role) {
  const nav = document.getElementById("portal-nav");
  if (!nav) return;

  const items = [
    { href: "index.html", label: "Dashboard", show: role !== "admin" },
    { href: "materiais.html", label: "Materiais", show: role !== "admin" },
    { href: "admin.html", label: "Administração", show: role === "admin" },
  ];

  nav.innerHTML = items
    .filter((item) => item.show)
    .map(
      (item) =>
        `<a href="${item.href}" class="${active === item.href ? "active" : ""}">${item.label}</a>`
    )
    .join("");

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}
