import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

/* -------------------------
   MIDDLEWARE
-------------------------- */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* -------------------------
   SUPABASE CLIENTS
-------------------------- */
// PUBLIC client — real signup/login
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ADMIN client — profiles, verification, tiers
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------------
   ROUTES
-------------------------- */

// SIGN UP
app.post('/signup', async (req, res) => {
  const { email, password, full_name } = req.body;

  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Update profile with name (profile auto-created by trigger)
  await supabaseAdmin
    .from('profiles')
    .update({ full_name })
    .eq('id', data.user.id);

  res.json({ success: true });
});

// LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { user_id: data.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

/* -------------------------
   AUTH MIDDLEWARE
-------------------------- */
function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

// Example protected endpoint
app.get('/protected', authGuard, (req, res) => {
  res.json({ access: true });
});

/* -------------------------
   SERVER START (RENDER)
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
