document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("login-form");
  const alertEl = document.getElementById("login-alert");
  if (!form) return;

  const session = await getSession();
  if (session) {
    const role = await getUserRole();
    window.location.href = role === "admin" ? "admin.html" : "index.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAlert(alertEl, "");

    const email = form.email.value.trim();
    const password = form.password.value;

    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) {
      showAlert(alertEl, "E-mail ou senha incorretos.");
      return;
    }

    const role = await getUserRole();
    if (!role) {
      await getSupabase().auth.signOut();
      showAlert(alertEl, "Sua conta não tem acesso ao portal.");
      return;
    }

    window.location.href = role === "admin" ? "admin.html" : "index.html";
  });
});
