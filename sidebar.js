document.addEventListener("DOMContentLoaded", async () => {
  if (typeof getUser !== "function") return;

  const user = await getUser();
  if (!user) return;

  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.innerHTML = "";

  const roleMenus = {
    admin: [
      { label: "Admin Dashboard", link: "admin.html" },
      { label: "Listings", link: "listing6.6.html" },
      { label: "Users", link: "users.html" }
    ],

    user: [
      { label: "Browse Listings", link: "listing6.6.html" },
      { label: "My Requests", link: "requests.html" }
    ],

    legal: [
      { label: "Legal Desk", link: "legal.html" },
      { label: "Appeals", link: "appeals.html" },
      { label: "Listings Review", link: "listing6.6.html" }
    ]
  };

  (roleMenus[user.role] || []).forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="nav-btn" onclick="location.href='${item.link}'">
        ${item.label}
      </button>
    `;
    menu.appendChild(li);
  });
});
