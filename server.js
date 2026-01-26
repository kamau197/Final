import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

/* -------------------------
   ESM __dirname FIX
-------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------
   APP INIT
-------------------------- */
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* -------------------------
   ENV SANITY CHECK
-------------------------- */
console.log("🔍 ENV CHECK");
console.log("SUPABASE_URL PRESENT:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY PRESENT:", !!process.env.SUPABASE_ANON_KEY);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY PRESENT:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------------
   SUPABASE CLIENTS
-------------------------- */
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =====================================================
   AUTH
===================================================== */

/* -------------------------
   SIGNUP
-------------------------- */
app.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });

    if (error) {
      if (error.code === "auth/user-already-exists") {
        return res.status(409).json({ error: "User already exists" });
      }
      return res.status(500).json({ error: error.message });
    }

    const user = data.user;

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email,
        full_name,
        role: "user",
        tier: "free",
        verified: false
      });

    if (profileErr) {
      return res.status(500).json({ error: "Profile insert failed" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 SIGNUP ERROR:", err);
    res.status(500).json({ error: "Internal signup error" });
  }
});

/* -------------------------
   LOGIN
-------------------------- */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } =
      await supabaseAnon.auth.signInWithPassword({
        email,
        password
      });

    if (error || !data?.session) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({
      access_token: data.session.access_token,
      user: data.user
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal login error" });
  }
});

/* -------------------------
   JWT AUTH GUARD
-------------------------- */
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    const { data, error } =
      await supabaseAnon.auth.getUser(token);

    if (error || !data?.user) {
      return res.sendStatus(401);
    }

    req.user = data.user;
    next();
  } catch {
    return res.sendStatus(401);
  }
}

/* -------------------------
   CURRENT USER
-------------------------- */
app.get("/me", requireAuth, async (req, res) => {
  const { data: profile } =
    await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

  res.json({
    user: req.user,
    profile
  });
});

/* =====================================================
   CHAT SYSTEM
===================================================== */

/* -------------------------
   GET USER CHATS
-------------------------- */
app.get("/api/chats", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabaseAdmin
    .from("chat_members")
    .select(`
      chat_id,
      chats ( id, created_at )
    `)
    .eq("user_id", userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(
    data.map(row => ({
      id: row.chat_id,
      title: "Chat",
      last_body: "",
      last_timestamp: null,
      unread: false
    }))
  );
});

/* -------------------------
   CREATE / GET 1-ON-1 CHAT
-------------------------- */
app.post("/api/chat", requireAuth, async (req, res) => {
  const userA = req.user.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const { data: existing } = await supabaseAdmin
    .from("chat_members")
    .select("chat_id")
    .in("user_id", [userA, userId]);

  if (existing?.length >= 2) {
    return res.json({ chat_id: existing[0].chat_id });
  }

  const { data: chat } = await supabaseAdmin
    .from("chats")
    .insert({})
    .select()
    .single();

  await supabaseAdmin.from("chat_members").insert([
    { chat_id: chat.id, user_id: userA },
    { chat_id: chat.id, user_id: userId }
  ]);

  res.json({ chat_id: chat.id });
});

/* -------------------------
   GET MESSAGES
-------------------------- */
app.get("/api/messages", requireAuth, async (req, res) => {
  const { chat_id } = req.query;

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("chat_id", chat_id)
    .order("created_at");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/* -------------------------
   SEND MESSAGE
-------------------------- */
app.post("/api/messages", requireAuth, async (req, res) => {
  const { chat_id, content } = req.body;

  if (!chat_id || !content) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      chat_id,
      sender_id: req.user.id,
      content
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/* =====================================================
   STATIC ROUTES
===================================================== */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

app.get("/listing6.6.html", (req, res) =>
  res.sendFile(path.join(__dirname, "listing6.6.html"))
);

app.get("/signup.html", (req, res) =>
  res.sendFile(path.join(__dirname, "signup.html"))
);

app.get("/login.html", (req, res) =>
  res.sendFile(path.join(__dirname, "login.html"))
);

/* -------------------------
   START SERVER
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
