/* =========================
   Token helpers
========================= */
function getToken() {
  return localStorage.getItem("sb_jwt");
}

function clearToken() {
  localStorage.removeItem("sb_jwt");
}

/* =========================
   Page Guard
========================= */
async function guardPage(allowedRoles = []) {
  const token = getToken();

  if (!token) {
    window.location.replace("login.html");
    return;
  }

  try {
    const res = await fetch("/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Invalid token");

    const data = await res.json();
    window.currentUser = data;

    // Role check (optional)
    if (
      allowedRoles.length &&
      !allowedRoles.includes(data.profile?.role)
    ) {
      alert("Access denied");
      window.location.replace("listing6.6.html");
    }

    // Populate UI if elements exist
    hydrateUserUI(data);

  } catch (err) {
    console.error("Auth failed:", err);
    clearToken();
    window.location.replace("login.html");
  }
}

/* =========================
   Populate User Info (Safe)
========================= */
function hydrateUserUI(data) {
  const nameEl = document.querySelector(".profile .name");
  const emailEl = document.querySelector(".profile .email");
  const avatarEls = document.querySelectorAll(".avatar");

  const name =
    data.profile?.full_name ||
    data.user?.email?.split("@")[0] ||
    "User";

  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = data.user.email;

  avatarEls.forEach(el => {
    if (el && name) {
      el.textContent =
        name
          .split(" ")
          .map(n => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
    }
  });
}

/* =========================
   Logout (GLOBAL)
========================= */
function logout() {
  clearToken();
  window.location.replace("login.html");
}

/* =========================
   Auto-bind logout buttons
========================= */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-logout]").forEach(btn => {
    btn.addEventListener("click", logout);
  });
});
