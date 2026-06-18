document.addEventListener("DOMContentLoaded", async () => {
  const auth = await requireAuth();
  if (!auth) return;

  renderPortalNav("materiais.html", auth.role);
  if (auth.role === "admin") {
    window.location.href = "admin.html";
    return;
  }

  const alertEl = document.getElementById("materials-alert");
  const grid = document.getElementById("materials-grid");

  const { data, error } = await getSupabase()
    .from("materials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    showAlert(alertEl, error.message);
    return;
  }

  if (!data?.length) {
    grid.innerHTML = `<p class="portal-empty">Nenhum material disponível no momento.</p>`;
    return;
  }

  grid.innerHTML = data
    .map((item) => {
      const url = item.file_url || item.download_path;
      const isText = item.type === "texto";
      const actions = isText
        ? `<button type="button" class="btn btn-primary btn-sm" data-copy="${encodeURIComponent(item.description || "")}">Copiar texto</button>`
        : `<a href="${url}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Abrir / baixar</a>`;

      return `
        <article class="portal-card portal-material">
          <div>
            <span class="portal-badge">${item.type}</span>
            <h3 style="margin-top:0.5rem">${item.title}</h3>
          </div>
          <p>${item.description || ""}</p>
          <div class="portal-material__actions">${actions}</div>
        </article>`;
    })
    .join("");

  grid.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = decodeURIComponent(btn.dataset.copy);
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Copiado!";
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    });
  });
});
