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
   APP INIT (IMPORTANT)
-------------------------- */
const app = express();

/* -------------------------
   MIDDLEWARE
-------------------------- */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* -------------------------
   SUPABASE
-------------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------------
   ROUTES
-------------------------- */
app.post('/signup', async (req, res) => {
  const { email, password, full_name } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) return res.status(400).json(error);

  await supabase.from('profiles').update({
    full_name
  }).eq('id', data.user.id);

  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json(error);

  const token = jwt.sign(
    { user_id: data.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

/* -------------------------
   AUTH GUARD
-------------------------- */
function authGuard(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

app.get('/protected', authGuard, (req, res) => {
  res.json({ ok: true });
});

/* -------------------------
   SERVER START (RENDER)
-------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
