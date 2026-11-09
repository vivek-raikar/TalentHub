const router = require('express').Router();
const auth = require('../auth');
const users = require('../repositories/userRepo');
const svc = require('../services/authService');
const { BRANCHES } = require('../validate');
const { HttpError } = require('../db');

router.get('/meta', (_req, res) => res.json({ branches: BRANCHES }));

router.post('/auth/login', auth.loginThrottle, (req, res) => res.json(svc.login(req.body || {})));
router.post('/auth/register', auth.loginThrottle, (req, res) => res.status(201).json(svc.registerStudent(req.body || {})));

router.post('/auth/logout', (req, res) => {
  if (req.auth) auth.destroySession(req.auth.token);
  res.json({ ok: true });
});

router.get('/auth/me', (req, res) => {
  if (!req.auth) throw new HttpError(401, 'Please log in first.');
  const user = users.findById(req.auth.userId);
  if (!user) throw new HttpError(401, 'Please log in again.');
  res.json(svc.describe(user));
});

module.exports = router;
