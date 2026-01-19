/* =========================
   Get logged-in user
========================= */
async function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const res = await fetch('/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) return null;

  const data = await res.json();

  return {
    id: data.user.id,
    role: data.profile?.role || 'user',
    email: data.user.email,
    full_name: data.profile?.full_name
  };
}

/* =========================
   Page Guard
========================= */
async function guardPage(allowedRoles) {
  const user = await getUser();

  if (!user) {
    window.location.replace('index.html');
    return;
  }

  if (!allowedRoles.includes(user.role)) {
    alert('Access denied');
    window.location.replace('index.html');
  }
}

/* =========================
   Logout
========================= */
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
    }
