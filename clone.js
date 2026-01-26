<script>
/* ==============================
   AUTH + CURRENT USER
============================== */
let me = null;

async function loadMe() {
  const token = localStorage.getItem("sb_jwt");
  if (!token) {
    location.href = "/login.html";
    return;
  }

  const res = await fetch("/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    localStorage.removeItem("sb_jwt");
    location.href = "/login.html";
    return;
  }

  const data = await res.json();

  me = {
    id: data.user.id,
    name: data.profile?.full_name || data.user.email,
    avatar: data.profile?.avatar || null
  };

  document.getElementById("myName").textContent = me.name;
  document.getElementById("myAvatar").textContent =
    me.name[0].toUpperCase();
}

/* ==============================
   API ENDPOINTS (NODE)
============================== */
const API = {
  chats: "/api/chats",
  createChat: "/api/chat",
  messages: "/api/messages"
};

/* ==============================
   ELEMENTS
============================== */
const chatsList = document.getElementById("chatsList");
const messagesEl = document.getElementById("messages");
const chatTitle = document.getElementById("chatTitle");
const chatSub = document.getElementById("chatSub");
const composer = document.getElementById("composer");
const composerInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const blankState = document.getElementById("blankState");

let chats = [];
let activeChat = null;
let messages = [];
let pollInterval = null;

/* ==============================
   HELPERS
============================== */
function fetchJSON(url, opts = {}) {
  const token = localStorage.getItem("sb_jwt");
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  }).then(r => {
    if (!r.ok) throw new Error("Network error");
    return r.json();
  });
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, m =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])
  );
}

/* ==============================
   LOAD CHATS
============================== */
async function loadChats() {
  try {
    const data = await fetchJSON(API.chats);
    chats = data;
    renderChats();
  } catch {
    chatsList.innerHTML = "<div class='muted'>Failed to load chats</div>";
  }
}

function renderChats() {
  chatsList.innerHTML = "";
  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item";
    div.textContent = chat.title || "Chat";
    div.onclick = () => openChat(chat);
    chatsList.appendChild(div);
  });
}

/* ==============================
   OPEN CHAT
============================== */
function openChat(chat) {
  activeChat = chat;
  chatTitle.textContent = chat.title || "Chat";
  chatSub.textContent = `Chat ID: ${chat.id}`;
  blankState.style.display = "none";
  composer.style.display = "flex";

  loadMessages(chat.id);

  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => loadMessages(chat.id), 3000);
}

/* ==============================
   LOAD MESSAGES
============================== */
async function loadMessages(chatId) {
  try {
    messages = await fetchJSON(`${API.messages}?chat_id=${chatId}`);
    renderMessages();
  } catch {
    messagesEl.innerHTML = "<div class='muted'>Failed to load messages</div>";
  }
}

function renderMessages() {
  messagesEl.innerHTML = "";
  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg " + (m.sender_id === me.id ? "me" : "other");
    div.innerHTML = `
      <div>${escapeHtml(m.content)}</div>
      <div class="msg-meta">
        ${m.sender_id === me.id ? "You" : "User"} • 
        ${new Date(m.created_at).toLocaleTimeString()}
      </div>`;
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* ==============================
   SEND MESSAGE
============================== */
async function sendMessage() {
  if (!activeChat) return;
  const content = composerInput.value.trim();
  if (!content) return;

  sendBtn.disabled = true;

  try {
    const msg = await fetchJSON(API.messages, {
      method: "POST",
      body: JSON.stringify({
        chat_id: activeChat.id,
        content
      })
    });

    messages.push(msg);
    renderMessages();
    composerInput.value = "";
  } catch {
    alert("Message failed");
  } finally {
    sendBtn.disabled = false;
  }
}

/* ==============================
   INIT
============================== */
(async function init() {
  await loadMe();
  await loadChats();
  sendBtn.addEventListener("click", sendMessage);
  composerInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
</script>