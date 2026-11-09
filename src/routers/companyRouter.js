const router = require('express').Router();
const { requireRole } = require('../auth');
const svc = require('../services/companyService');

router.use(requireRole('company'));
const u = (req) => req.auth.userId;

router.get('/profile', (req, res) => res.json(svc.profile(u(req))));
router.get('/jobs', (req, res) => res.json(svc.listJobs(u(req))));
router.post('/jobs', (req, res) => res.status(201).json(svc.createJob(u(req), req.body || {})));
router.post('/jobs/:id/close', (req, res) => res.json(svc.closeJob(u(req), req.params.id)));
router.get('/jobs/:id/applications', (req, res) => res.json(svc.applicants(u(req), req.params.id)));
router.post('/applications/:id/shortlist', (req, res) => res.json(svc.shortlist(u(req), req.params.id)));
router.post('/applications/:id/reject', (req, res) => res.json(svc.reject(u(req), req.params.id)));
router.post('/applications/:id/interview', (req, res) => res.json(svc.scheduleInterview(u(req), req.params.id, req.body || {})));
router.post('/applications/:id/result', (req, res) => res.json(svc.recordResult(u(req), req.params.id, req.body || {})));
router.post('/applications/:id/offer', (req, res) => res.json(svc.issueOffer(u(req), req.params.id, req.body || {})));

module.exports = router;
