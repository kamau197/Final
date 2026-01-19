import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
   SIGNUP
-------------------------- */
app.post("/signup", async (req, res) => {
  try {
    console.log("➡️ SIGNUP BODY:", req.body);

    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // 🔎 block duplicate email
    const { data: existing } =
      await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existing?.user) {
      return res.status(409).json({ error: "User already exists" });
    }

    // ✅ Supabase Auth signup
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (error || !data.user) {
      console.error("❌ SUPABASE SIGNUP ERROR:", error);
      return res
        .status(400)
        .json({ error: error?.message || "Signup failed" });
    }

    // 🧾 create profile row
    await supabaseAdmin.from("profiles").insert({
      id: data.user.id,
      email,
      full_name,
      role: "user",
      tier: "free",
      verified: false
    });

    console.log("✅ USER CREATED:", email);

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 SIGNUP CRASH:", err);
    res.status(500).json({ error: "Internal signup error" });
  }
});

/* -------------------------
   LOGIN
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

    if (error || !data.session) {
      console.error("❌ SUPABASE LOGIN ERROR:", error);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ LOGIN OK:", email);

    res.json({
      access_token: data.session.access_token,
      user: data.user
    });

  } catch (err) {
    console.error("🔥 LOGIN CRASH:", err);
    res.status(500).json({ error: "Internal login error" });
  }
});

/* -------------------------
   SUPABASE JWT AUTH GUARD
-------------------------- */
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  const { data, error } =
    await supabaseAnon.auth.getUser(token);

  if (error || !data.user) {
    return res.sendStatus(401);
  }

  req.user = data.user;
  next();
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

/* -------------------------
   STATIC ROUTES
-------------------------- */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "index.html"))
);

app.get("/listing6.6.html", (req, res) =>
  res.sendFile(path.join(__dirname, "listing6.6.html"))
);

/* -------------------------
   START SERVER
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
