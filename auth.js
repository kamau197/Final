/* =========================
   Read stored Supabase JWT
========================= */
function getToken() {
  return localStorage.getItem('sb_jwt');
}

/* =========================
   Require Auth (Page Guard)
========================= */
async function requireAuth() {
  const token = getToken();

  if (!token) {
    window.location.replace('login.html');
    return;
  }

  try {
    const res = await fetch('/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem('sb_jwt');
      window.location.replace('login.html');
      return;
    }

    const data = await res.json();
    window.currentUser = data; // { user, profile }

  } catch (err) {
    console.error('Auth check failed:', err);
    localStorage.removeItem('sb_jwt');
    window.location.replace('login.html');
  }
}

/* =========================
   Get Current User (for UI)
========================= */
async function getUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch('/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) return null;

    const data = await res.json();

    return {
      id: data.user.id,
      email: data.user.email,
      role: data.profile?.role || 'user',
      tier: data.profile?.tier || 'free',
      verified: data.profile?.verified || false,
      full_name: data.profile?.full_name || ''
    };
  } catch (e) {
    return null;
  }
}

/* =========================
   Role Guard (Optional)
========================= */
async function requireRole(allowedRoles = []) {
  const user = await getUser();

  if (!user) {
    window.location.replace('login.html');
    return;
  }

  if (!allowedRoles.includes(user.role)) {
    alert('Access denied');
    window.location.replace('listing6.6.html');
  }
}

/* =========================
   Logout
========================= */
function logout() {
  localStorage.removeItem('sb_jwt');
  window.location.href = 'login.html';
}
