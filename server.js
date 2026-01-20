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
if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("❌ MISSING SUPABASE ENV VARS");
}

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

/* -------------------------
   SIGNUP (HARDENED)
-------------------------- */
app.post("/signup", async (req, res) => {
  try {
    console.log("➡️ SIGNUP BODY:", req.body);
    console.log(
      "🔑 SERVICE KEY PRESENT:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    /* 🔎 DUPLICATE EMAIL CHECK */
    const { data: existingUser, error: existErr } =
      await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existErr) {
      console.error("❌ EMAIL CHECK ERROR:", existErr);
      return res.status(500).json({ error: "Email lookup failed" });
    }

    if (existingUser?.user) {
      return res.status(409).json({ error: "User already exists" });
    }

    /* ✅ CREATE AUTH USER (ADMIN) */
    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });

    if (error || !data?.user) {
      console.error("❌ CREATE USER ERROR:", error);
      return res
        .status(500)
        .json({ error: error?.message || "Create user failed" });
    }

    const user = data.user;

    /* 🧾 CREATE PROFILE ROW */
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: user.id,
          email,
          full_name,
          role: "user",
          tier: "free",
          verified: false
        }
      ]);

    if (profileErr) {
      console.error("❌ PROFILE INSERT ERROR:", profileErr);
      return res.status(500).json({ error: "Profile insert failed" });
    }

    console.log("✅ USER CREATED:", email);
    return res.json({ success: true });

  } catch (err) {
    console.error("🔥 SIGNUP FATAL:", err);
    return res.status(500).json({ error: "Internal signup error" });
  }
});

/* -------------------------
   LOGIN (CORRECT)
-------------------------- */
app.post("/login", async (req, res) => {
  try {
    console.log("➡️ LOGIN BODY:", req.body);

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
      console.error("❌ SUPABASE LOGIN ERROR:", error);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ LOGIN OK:", email);

    return res.json({
      access_token: data.session.access_token,
      user: data.user
    });

  } catch (err) {
    console.error("🔥 LOGIN FATAL:", err);
    return res.status(500).json({ error: "Internal login error" });
  }
});

/* -------------------------
   SUPABASE JWT AUTH GUARD
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

  } catch (err) {
    console.error("🔥 AUTH GUARD ERROR:", err);
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

  return res.json({
    user: req.user,
    profile
  });
});

/* -------------------------
   STATIC ROUTES
-------------------------- */
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
