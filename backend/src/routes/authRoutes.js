import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { JWT_SECRET, requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ================= OWNER LOGIN ================= //
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let owner = null;
    if (db.isPostgres) {
      const dbRes = await db.query('SELECT * FROM owners WHERE LOWER(email) = LOWER($1) LIMIT 1', [email.trim()]);
      owner = dbRes.rows[0];
    } else {
      const owners = await db.get('owners');
      owner = owners.find(o => o.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!owner) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, owner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Ensure owner defaults are initialized if missing
    await db.initializeOwnerDefaults(owner.id, owner.name, owner.email, owner.phone);

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
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]:', err);
    res.status(500).json({ error: 'Login service encountered an internal error' });
  }
});

// ================= OWNER REGISTRATION / SIGNUP ================= //
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    if (db.isPostgres) {
      const existing = await db.query('SELECT id FROM owners WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }
    } else {
      const owners = await db.get('owners');
      if (owners.some(o => o.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newOwnerId = `owner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOwner = {
      id: newOwnerId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : '',
      role: 'OWNER',
      created_at: new Date().toISOString()
    };

    if (db.isPostgres) {
      await db.query(
        `INSERT INTO owners (id, name, email, password, phone, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newOwner.id, newOwner.name, newOwner.email, newOwner.password, newOwner.phone, newOwner.role, newOwner.created_at]
      );
    } else {
      await db.insertForOwner('owners', newOwner.id, newOwner);
    }

    // Initialize fresh personalized settings and automation rules for this new owner
    await db.initializeOwnerDefaults(newOwner.id, newOwner.name, newOwner.email, newOwner.phone);

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
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]:', err);
    res.status(500).json({ error: 'Registration failed due to server error' });
  }
});

// ================= GET CURRENT OWNER PROFILE (Protected via Bearer Token) ================= //
router.get('/me', requireAuth, async (req, res) => {
  try {
    let owner = null;
    if (db.isPostgres) {
      const dbRes = await db.query('SELECT id, name, email, phone, role FROM owners WHERE id = $1', [req.owner.id]);
      owner = dbRes.rows[0];
    } else {
      const owners = await db.get('owners');
      owner = owners.find(o => o.id === req.owner.id);
    }

    if (!owner) {
      return res.status(404).json({ error: 'Owner profile not found. Please log in again.' });
    }

    const properties = await db.getByOwner('properties', owner.id);
    const tenants = await db.getByOwner('tenants', owner.id);
    const numbers = await db.getByOwner('phone_numbers', owner.id);

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
        propertiesCount: properties.length,
        tenantsCount: tenants.length,
        numbersCount: numbers.filter(n => n.is_active).length
      }
    });
  } catch (err) {
    console.error('[AUTH /me ERROR]:', err);
    res.status(500).json({ error: 'Failed to retrieve owner session' });
  }
});

// ================= LOGOUT ================= //
router.post('/logout', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

export default router;
