import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SIGNUP
app.post('/signup', async (req, res) => {
  const { email, password, full_name } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) return res.status(400).json(error);

  await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    full_name
  });

  res.json({ success: true });
});

// LOGIN
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

// AUTH MIDDLEWARE
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

// PROTECTED
app.get('/protected', authGuard, (req, res) => {
  res.json({ access: true });
});

app.listen(3000, () => console.log('Server running'));