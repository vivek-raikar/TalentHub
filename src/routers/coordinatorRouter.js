const router = require('express').Router();
const { requireRole } = require('../auth');
const svc = require('../services/coordinatorService');

router.use(requireRole('coordinator'));
router.get('/stats', (_req, res) => res.json(svc.stats()));
router.get('/students', (_req, res) => res.json(svc.listStudents()));
router.put('/students/:id', (req, res) => res.json(svc.updateStudent(req.params.id, req.body || {})));
router.get('/companies', (_req, res) => res.json(svc.listCompanies()));
router.post('/companies', (req, res) => res.status(201).json(svc.createCompany(req.body || {})));

module.exports = router;
