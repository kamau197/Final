/* =========================
   AUTH STATE (GLOBAL)
========================= */

const AUTH_KEY = "sb_jwt";
let authResolve;
let authReject;

/**
 * Global promise that resolves ONLY when auth is ready
 */
window.authReady = new Promise((resolve, reject) => {
  authResolve = resolve;
  authReject = reject;
});

/* =========================
   INTERNAL: LOAD USER
========================= */
async function loadAuthUser() {
  const token = localStorage.getItem(AUTH_KEY);

  if (!token) {
    authResolve(null);
    window.location.replace("login.html");
    return;
  }

  try {
    const res = await fetch("/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Invalid session");
    }

    const data = await res.json();

    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.profile?.role || "user",
      tier: data.profile?.tier || "free",
      verified: !!data.profile?.verified,
      full_name: data.profile?.full_name || ""
    };

    window.currentUser = user;
    authResolve(user);

  } catch (err) {
    localStorage.removeItem(AUTH_KEY);
    authResolve(null);
    window.location.replace("login.html");
  }
}

/* =========================
   INIT AUTH (ON LOAD)
========================= */
document.addEventListener("DOMContentLoaded", loadAuthUser);

/* =========================
   PUBLIC API
========================= */

/**
 * Returns authenticated user or null
 */
async function getUser() {
  return await window.authReady;
}

/**
 * Page guard
 */
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.replace("login.html");
  }
}

/**
 * Role guard
 */
async function requireRole(allowed = []) {
  const user = await getUser();
  if (!user || !allowed.includes(user.role)) {
    alert("Access denied");
    window.location.replace("listing6.6.html");
  }
}

/**
 * Logout everywhere
 */
function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.replace("login.html");
}
