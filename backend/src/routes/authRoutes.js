import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { JWT_SECRET, requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Helper to ensure owners collection exists
const getOwners = () => {
  let owners = db.get('owners');
  if (!owners || owners.length === 0) {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const defaultOwner = {
      id: 'owner-1',
      name: 'Vikram (Property Owner)',
      email: 'owner@apexproperties.com',
      password: defaultPasswordHash,
      phone: '+91 98000 11223',
      role: 'SUPER_OWNER',
      created_at: new Date().toISOString()
    };
    db.insert('owners', defaultOwner);
    owners = [defaultOwner];
  }
  return owners;
};

// ================= OWNER LOGIN ================= //
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const owners = getOwners();
  const owner = owners.find(o => o.email.toLowerCase() === email.trim().toLowerCase());

  if (!owner) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isPasswordValid = bcrypt.compareSync(password, owner.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate JWT Bearer Token (Valid for 30 Days)
  const token = jwt.sign(
    {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role || 'OWNER'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    message: 'Owner login successful',
    token_type: 'Bearer',
    token: token,
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role
    }
  });
});

// ================= OWNER REGISTRATION / SIGNUP ================= //
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const owners = getOwners();
  const existing = owners.find(o => o.email.toLowerCase() === email.trim().toLowerCase());

  if (existing) {
    return res.status(400).json({ error: 'An owner account with this email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newOwner = {
    id: `owner-${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    phone: phone || '',
    role: 'OWNER',
    created_at: new Date().toISOString()
  };

  db.insert('owners', newOwner);

  // Generate JWT Bearer Token
  const token = jwt.sign(
    {
      id: newOwner.id,
      email: newOwner.email,
      name: newOwner.name,
      role: newOwner.role
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    success: true,
    message: 'Owner account created successfully',
    token_type: 'Bearer',
    token: token,
    owner: {
      id: newOwner.id,
      name: newOwner.name,
      email: newOwner.email,
      phone: newOwner.phone,
      role: newOwner.role
    }
  });
});

// ================= GET CURRENT OWNER PROFILE (Protected via Bearer Token) ================= //
router.get('/me', requireAuth, (req, res) => {
  const owners = getOwners();
  const owner = owners.find(o => o.id === req.owner.id);

  if (!owner) {
    return res.status(404).json({ error: 'Owner profile not found' });
  }

  res.json({
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role
    }
  });
});

// ================= LOGOUT ================= //
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please discard the client bearer token.'
  });
});

export default router;
