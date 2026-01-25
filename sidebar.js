document.addEventListener("DOMContentLoaded", async () => {
  if (typeof getUser !== "function") return;

  const user = await getUser();
  if (!user) return;

  const menu = document.getElementById("menu");
  if (!menu) return;

  menu.innerHTML = "";

  const roleMenus = {
    admin: [
      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
<polyline points="16 17 21 12 16 7"/>
<line x1="21" y1="12" x2="9" y2="12"/>
</svg>
Admin`,
        link: "admin.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect width="7" height="7" x="3" y="3" rx="1"/>
<rect width="7" height="7" x="3" y="14" rx="1"/>
<path d="M14 4h7"/>
<path d="M14 9h7"/>
<path d="M14 15h7"/>
<path d="M14 20h7"/>
</svg>
Listings`,
        link: "listing6.6.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="2"/>
<circle cx="12" cy="12" r="8"/>
</svg>
Settings`,
        link: "s6.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M11 15h2a2 2 0 1 0 0-4h-3"/>
<circle cx="16" cy="9" r="2.9"/>
</svg>
Finance`,
        link: "finance2.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M2.992 16.342a2 2 0 0 1 .094 1.167"/>
</svg>
Messages`,
        link: "clone.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M9.09 9a3 3 0 0 1 5.83 1"/>
</svg>
Help`,
        link: "s6.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M10.268 21a2 2 0 0 0 3.464 0"/>
</svg>
Notifications`,
        link: "notif.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect width="7" height="9" x="3" y="3" rx="1"/>
</svg>
Contracts`,
        link: "comtract.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect width="7" height="9" x="3" y="3" rx="1"/>
</svg>
Dashboard`,
        link: "upwork4.html"
      }
    ],

    user: [
      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect width="7" height="7" x="3" y="3" rx="1"/>
<rect width="7" height="7" x="3" y="14" rx="1"/>
</svg>
Listings`,
        link: "listing6.6.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="16" cy="9" r="2.9"/>
</svg>
Finance`,
        link: "finance2.html"
      },

      {
        label: `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M2.992 16.342a2 2 0 0 1 .094"/>
</svg>
Messages`,
        link: "clone.html"
      }
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
