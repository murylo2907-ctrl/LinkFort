document.addEventListener("DOMContentLoaded", async () => {
  const auth = await requireAuth();
  if (!auth) return;

  renderPortalNav("index.html", auth.role);
  if (auth.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  const alertEl = document.getElementById("dashboard-alert");
  const supabase = getSupabase();

  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("*")
    .eq("id", auth.session.user.id)
    .maybeSingle();

  if (partnerError) {
    showAlert(alertEl, partnerError.message);
    return;
  }

  if (!partner) {
    showAlert(alertEl, "Perfil de parceiro não encontrado. Contate a Link Forte.");
    return;
  }

  document.getElementById("user-name").textContent = partner.full_name;
  document.getElementById("partner-type").textContent = statusLabel(partner.partner_type);
  document.getElementById("partner-code").textContent = partner.partner_code;
  document.getElementById("partner-email").textContent = partner.email;
  document.getElementById("partner-phone").textContent = partner.phone || "—";
  document.getElementById("partner-company").textContent = partner.company || "—";

  const link = referralLink(partner.partner_code);
  const linkInput = document.getElementById("referral-link");
  linkInput.value = link;

  document.getElementById("copy-link-btn")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(link);
    const btn = document.getElementById("copy-link-btn");
    const original = btn.textContent;
    btn.textContent = "Copiado!";
    setTimeout(() => {
      btn.textContent = original;
    }, 2000);
  });

  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select("*")
    .eq("partner_id", partner.id)
    .order("sale_date", { ascending: false });

  if (referralsError) {
    showAlert(alertEl, referralsError.message);
    return;
  }

  const rows = referrals || [];
  const total = rows.length;
  const pending = rows
    .filter((r) => r.status === "pendente" || r.status === "aprovada")
    .reduce((sum, r) => sum + Number(r.commission_amount), 0);
  const paid = rows
    .filter((r) => r.status === "paga")
    .reduce((sum, r) => sum + Number(r.commission_amount), 0);

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = formatMoney(pending);
  document.getElementById("stat-paid").textContent = formatMoney(paid);

  const tbody = document.getElementById("referrals-body");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="portal-empty">Nenhuma indicação registrada ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${formatDate(row.sale_date)}</td>
        <td>${row.customer_name}</td>
        <td>${row.product_name}</td>
        <td>${formatMoney(row.sale_amount)}</td>
        <td>${formatMoney(row.commission_amount)}</td>
        <td><span class="portal-badge portal-badge--${row.status}">${statusLabel(row.status)}</span></td>
      </tr>`
    )
    .join("");
});
