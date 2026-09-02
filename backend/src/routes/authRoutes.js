import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { JWT_SECRET, requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Helper to ensure owners collection exists
const getOwners = () => {
  return db.get('owners') || [];
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

  // Ensure owner defaults are initialized if missing
  db.initializeOwnerDefaults(owner.id, owner.name, owner.email, owner.phone);

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
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const owners = getOwners();
  const existing = owners.find(o => o.email.toLowerCase() === email.trim().toLowerCase());

  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newOwner = {
    id: `owner-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: hashedPassword,
    phone: phone ? phone.trim() : '',
    role: 'OWNER',
    created_at: new Date().toISOString()
  };

  db.insert('owners', newOwner);

  // Initialize fresh personalized settings and automation rules for this new owner
  db.initializeOwnerDefaults(newOwner.id, newOwner.name, newOwner.email, newOwner.phone);

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
    message: 'Account created successfully',
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
    return res.status(404).json({ error: 'Owner profile not found. Please log in again.' });
  }

  const propertiesCount = db.getByOwner('properties', owner.id).length;
  const tenantsCount = db.getByOwner('tenants', owner.id).length;
  const numbersCount = db.filterByOwner('phone_numbers', owner.id, n => n.is_active).length;

  res.json({
    success: true,
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: owner.role
    },
    account_stats: {
      propertiesCount,
      tenantsCount,
      numbersCount
    }
  });
});

// ================= LOGOUT ================= //
router.post('/logout', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export default router;
