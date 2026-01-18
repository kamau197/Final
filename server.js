import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

/* -------------------------
   ESM PATH FIX
-------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------
   APP INIT
-------------------------- */
const app = express();

/* -------------------------
   MIDDLEWARE
-------------------------- */
app.use(cors());
app.use(express.json({ limit: '2mb' })); // 🔒 force JSON
app.use(express.static(__dirname));

/* -------------------------
   SUPABASE (PUBLIC AUTH)
-------------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* -------------------------
   SIGNUP
-------------------------- */
app.post('/signup', async (req, res) => {
  console.log('🔍 SIGNUP BODY:', req.body);

  const { email, password, full_name } = req.body;

  // HARD VALIDATION (NO SILENT FAILS)
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters'
    });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name }
    }
  });

  if (error) {
    console.error('❌ SIGNUP ERROR:', error.message);
    return res.status(400).json({ error: error.message });
  }

  res.json({
    success: true,
    message: 'Account created successfully',
    user_id: data.user?.id
  });
});

/* -------------------------
   LOGIN
-------------------------- */
app.post('/login', async (req, res) => {
  console.log('🔍 LOGIN BODY:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    return res.status(401).json({
      error: 'Invalid email or password'
    });
  }

  // REAL SUPABASE JWT
  res.json({
    access_token: data.session.access_token,
    user: data.user
  });
});

/* -------------------------
   ROOT
-------------------------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* -------------------------
   START SERVER
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
