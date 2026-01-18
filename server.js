import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* -------------------------
   SUPABASE (PUBLIC ONLY)
-------------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* -------------------------
   SIGNUP (REAL SUPABASE AUTH)
-------------------------- */
app.post('/signup', async (req, res) => {
  const { email, password, full_name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({
    success: true,
    message: 'Account created. Check email if confirmation is enabled.'
  });
});

/* -------------------------
   LOGIN (PASSWORD ENFORCED)
-------------------------- */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // 🔐 Supabase-issued JWT (REAL)
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
   START
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
