document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Ensure user is authenticated
  if (typeof requireAuth === "function") {
    await requireAuth();
  }

  // 2️⃣ Fetch current user
  if (typeof getUser !== "function") return;
  const user = await getUser();
  if (!user) return;

  const menu = document.getElementById("menu");
  if (!menu) return;

  // Clear existing menu
  menu.innerHTML = "";

  /* =========================
     ROLE BASED MENUS
  ========================= */
  const roleMenus = {
    admin: [
      { label: "Admin", link: "admin.html" },
      { label: "Listings", link: "listing6.6.html" },
      { label: "Settings", link: "s6.html" },
      { label: "Finance", link: "finance2.html" },
      { label: "Messages", link: "clone.html" },
      { label: "Help", link: "help.html" },
      { label: "Notifications", link: "notif.html" },
      { label: "Contracts", link: "contract.html" },
      { label: "Dashboard", link: "upwork4.html" }
    ],
    user: [
      { label: "Listings", link: "listing6.6.html" },
      { label: "Messages", link: "clone.html" },
      { label: "Contracts", link: "Contract.html" }
    ]
  };

  /* =========================
     BUILD ROLE MENU
  ========================= */
  (roleMenus[user.role] || []).forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="nav-btn" onclick="location.href='${item.link}'">
        ${item.label}
      </button>
    `;
    menu.appendChild(li);
  });

  /* =========================
     MANDATORY ITEMS (ALL USERS)
  ========================= */

  // Divider
  menu.appendChild(document.createElement("hr"));

  // Appeal
  const appeal = document.createElement("li");
  appeal.innerHTML = `
    <button class="nav-btn" onclick="location.href='appeal.html'">
      ⚖️ Appeal
    </button>
  `;
  menu.appendChild(appeal);

  // Vault
  const vault = document.createElement("li");
  vault.innerHTML = `
    <button class="nav-btn" onclick="location.href='vault.html'">
      🗂 Vault
    </button>
  `;
  menu.appendChild(vault);

  /* =========================
     LOGOUT (ALWAYS BOTTOM)
  ========================= */
  const logoutLi = document.createElement("li");
  logoutLi.style.marginTop = "auto"; // pushes to bottom if flex
  logoutLi.innerHTML = `
    <button class="nav-btn logout-btn" onclick="logout()">
      ⎋ Logout
    </button>
  `;
  menu.appendChild(logoutLi);
});
