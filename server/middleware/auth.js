const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.notely_token;
}

async function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email createdAt');
    if (!user) return res.status(401).json({ ok: false, error: 'Session is no longer valid.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { requireAuth };
