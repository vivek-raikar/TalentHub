// Authentication: scrypt password hashing + random session tokens kept in memory.
const crypto = require('crypto');
const { HttpError } = require('./db');

const SESSION_HOURS = 8;
const sessions = new Map(); // token -> { userId, role, expires }

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  return crypto.timingSafeEqual(expected, actual);
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, role: user.role, expires: Date.now() + SESSION_HOURS * 3600e3 });
  return token;
}

function destroySession(token) { sessions.delete(token); }

function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const s = sessions.get(token);
  if (s && s.expires > Date.now()) { req.auth = { ...s, token }; }
  else if (s) sessions.delete(token);
  next();
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.auth) return next(new HttpError(401, 'Please log in first.'));
    if (req.auth.role !== role) return next(new HttpError(403, 'You do not have permission to do this.'));
    next();
  };
}

// Very small login throttle: 10 attempts per 5 minutes per IP.
const attempts = new Map();
function loginThrottle(req, _res, next) {
  const ip = req.socket.remoteAddress || 'local';
  const now = Date.now();
  let a = attempts.get(ip);
  if (!a || a.reset < now) a = { count: 0, reset: now + 5 * 60e3 };
  a.count++;
  attempts.set(ip, a);
  if (a.count > 10) return next(new HttpError(429, 'Too many attempts. Try again in a few minutes.'));
  next();
}

module.exports = { hashPassword, verifyPassword, createSession, destroySession, authenticate, requireRole, loginThrottle };
