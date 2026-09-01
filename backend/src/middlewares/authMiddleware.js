import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'property_rent_super_secure_jwt_secret_2026';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Bearer token. Please log in.',
      code: 'AUTH_REQUIRED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.owner = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized: Bearer token has expired or is invalid. Please log in again.',
      code: 'TOKEN_INVALID'
    });
  }
};
