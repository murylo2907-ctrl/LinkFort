function getInviteToken() {
  return new URLSearchParams(window.location.search).get("token");
}

document.addEventListener("DOMContentLoaded", async () => {
  const alertEl = document.getElementById("ativar-alert");
  const form = document.getElementById("ativar-form");
  const subtitle = document.getElementById("invite-subtitle");
  const emailInput = document.getElementById("email");
  const token = getInviteToken();

  if (!token) {
    showAlert(alertEl, "Link inválido. Peça um novo convite à Link Forte.");
    subtitle.textContent = "Convite não encontrado";
    return;
  }

  try {
    const { data, error } = await getSupabase().rpc("get_partner_invite", { p_token: token });
    if (error) throw error;

    subtitle.textContent = `Olá, ${data.full_name}! Defina sua senha para acessar o portal.`;
    emailInput.value = data.email;
    form.hidden = false;
  } catch (err) {
    showAlert(alertEl, err.message);
    subtitle.textContent = "Não foi possível carregar o convite";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAlert(alertEl, "");

    const password = form.password.value;
    const confirm = form.password_confirm.value;
    const email = emailInput.value;

    if (password !== confirm) {
      showAlert(alertEl, "As senhas não conferem.");
      return;
    }

    if (password.length < 6) {
      showAlert(alertEl, "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const session = await getSession();

    if (!session) {
      const { data: signUpData, error: signUpError } = await getSupabase().auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          const { error: signInError } = await getSupabase().auth.signInWithPassword({ email, password });
          if (signInError) {
            showAlert(alertEl, "Este e-mail já tem conta. Entre com sua senha em «Já tem conta?».");
            return;
          }
        } else {
          showAlert(alertEl, signUpError.message);
          return;
        }
      } else if (signUpData?.user && !signUpData?.session) {
        showAlert(
          alertEl,
          "Enviamos um e-mail de confirmação. Confirme o e-mail e abra este link novamente para concluir a ativação.",
          "success"
        );
        return;
      }
    }

    const { data: claimData, error: claimError } = await getSupabase().rpc("claim_partner_invite", {
      p_token: token,
    });

    if (claimError) {
      showAlert(alertEl, claimError.message);
      return;
    }

    showAlert(alertEl, `Conta ativada! Seu código: ${claimData.partner_code}`, "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  });
});
