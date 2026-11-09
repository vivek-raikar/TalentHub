const router = require('express').Router();
const { requireRole } = require('../auth');
const svc = require('../services/studentService');

router.use(requireRole('student'));
router.get('/profile', (req, res) => res.json(svc.profile(req.auth.userId)));
router.get('/jobs', (req, res) => res.json(svc.listJobs(req.auth.userId)));
router.post('/jobs/:id/apply', (req, res) => res.status(201).json(svc.apply(req.auth.userId, req.params.id)));
router.get('/applications', (req, res) => res.json(svc.applications(req.auth.userId)));
router.post('/offers/:id/respond', (req, res) =>
  res.json(svc.respondOffer(req.auth.userId, req.params.id, req.body && req.body.accept === true)));

module.exports = router;
