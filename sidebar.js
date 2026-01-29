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

  menu.innerHTML = "";

  const roleMenus = {
    admin: [
      { label: ` Admin`, link: "admin.html" },
      { label: ` Listings`, link: "listing6.6.html" },
      { label: ` Settings`, link: "s6.html" },
      { label: ` Finance`, link: "finance2.html" },
      { label: ` Messages`, link: "clone.html" },
      { label: `<svg ...></svg> Help`, link: "help.html" },
      { label: `<svg ...></svg> Notifications`, link: "notif.html" },
      { label: `<svg ...></svg> Contracts`, link: "contract.html" },
      { label: `<svg ...></svg> Dashboard`, link: "upwork4.html" }
    ],
    user: [
      { label: ` Listings`, link: "listing6.6.html" },
      { label: ` Messages`, link: "clone.html" },
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

 
