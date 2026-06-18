async function loadPartnersSelect(selectEl) {
  const { data, error } = await getSupabase()
    .from("partners")
    .select("id, full_name, partner_code")
    .eq("status", "active")
    .order("full_name");

  if (error) throw error;

  selectEl.innerHTML =
    `<option value="">Selecione o parceiro</option>` +
    (data || [])
      .map((p) => `<option value="${p.id}">${p.full_name} (${p.partner_code})</option>`)
      .join("");
}

function partnerRpcErrorMessage(error) {
  const msg = error?.message || "Erro ao cadastrar parceiro.";
  if (msg.includes("admin_create_partner_invite") || msg.includes("schema cache")) {
    return `${msg} — Rode a migration 002_partner_invites.sql no SQL Editor do Supabase.`;
  }
  return msg;
}

function showPartnerSuccess(successEl, data) {
  const activateUrl = new URL("ativar.html", window.location.href);
  activateUrl.searchParams.set("token", data.token);

  successEl.innerHTML = `
    <p><strong>Parceiro cadastrado com sucesso!</strong></p>
    <p>O link <strong>não é enviado por e-mail</strong>. Copie abaixo e envie ao parceiro (WhatsApp, e-mail, etc.).</p>
    <p>Código de indicação: <code>${data.partner_code}</code></p>
    <label class="portal-invite-label" for="partner-invite-link">Link de ativação</label>
    <div class="portal-invite-row">
      <input id="partner-invite-link" class="portal-invite-input" type="text" readonly value="${activateUrl.href}">
      <button type="button" class="btn btn-outline" id="copy-invite-link">Copiar link</button>
    </div>
  `;
  successEl.hidden = false;
  successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  document.getElementById("copy-invite-link")?.addEventListener("click", async () => {
    const input = document.getElementById("partner-invite-link");
    const copyBtn = document.getElementById("copy-invite-link");
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      input.select();
      document.execCommand("copy");
    }
    if (copyBtn) {
      const original = copyBtn.textContent;
      copyBtn.textContent = "Copiado!";
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 2000);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const auth = await requireAuth({ adminOnly: true });
  if (!auth) return;

  renderPortalNav("admin.html", auth.role);
  document.getElementById("user-name").textContent = auth.session.user.email;

  const partnerAlert = document.getElementById("partner-alert");
  const referralAlert = document.getElementById("referral-alert");
  const partnerSelect = document.getElementById("referral-partner");
  const partnerForm = document.getElementById("partner-form");
  const partnerSubmitBtn = partnerForm?.querySelector('button[type="submit"]');

  try {
    await loadPartnersSelect(partnerSelect);
  } catch (err) {
    showAlert(partnerAlert, err.message);
  }

  partnerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAlert(partnerAlert, "");

    const successEl = document.getElementById("partner-success");
    if (successEl) {
      successEl.hidden = true;
      successEl.innerHTML = "";
    }

    const form = e.target;
    const defaultLabel = partnerSubmitBtn?.textContent || "Cadastrar parceiro";

    if (partnerSubmitBtn) {
      partnerSubmitBtn.disabled = true;
      partnerSubmitBtn.textContent = "Cadastrando…";
    }

    try {
      const { data, error } = await getSupabase().rpc("admin_create_partner_invite", {
        p_full_name: form.full_name.value.trim(),
        p_email: form.email.value.trim(),
        p_phone: form.phone.value.trim() || null,
        p_company: form.company.value.trim() || null,
        p_partner_type: form.partner_type.value,
      });

      if (error) {
        showAlert(partnerAlert, partnerRpcErrorMessage(error));
        return;
      }

      if (!data?.token || !data?.partner_code) {
        showAlert(partnerAlert, "Resposta inválida do servidor. Confira se a migration 002 foi aplicada.");
        return;
      }

      showPartnerSuccess(successEl, data);
      form.reset();
    } catch (err) {
      showAlert(partnerAlert, err.message || "Erro inesperado ao cadastrar parceiro.");
    } finally {
      if (partnerSubmitBtn) {
        partnerSubmitBtn.disabled = false;
        partnerSubmitBtn.textContent = defaultLabel;
      }
    }
  });

  document.getElementById("referral-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAlert(referralAlert, "");

    const form = e.target;
    const { error } = await getSupabase().from("referrals").insert({
      partner_id: form.partner_id.value,
      customer_name: form.customer_name.value.trim(),
      product_name: form.product_name.value.trim(),
      sale_amount: Number(form.sale_amount.value),
      commission_amount: Number(form.commission_amount.value),
      status: form.status.value,
      sale_date: form.sale_date.value,
      notes: form.notes.value.trim() || null,
    });

    if (error) {
      showAlert(referralAlert, error.message);
      return;
    }

    showAlert(referralAlert, "Indicação registrada com sucesso!", "success");
    form.reset();
    form.sale_date.value = new Date().toISOString().slice(0, 10);
  });

  const saleDateInput = document.querySelector("#referral-form [name='sale_date']");
  if (saleDateInput && !saleDateInput.value) {
    saleDateInput.value = new Date().toISOString().slice(0, 10);
  }
});
