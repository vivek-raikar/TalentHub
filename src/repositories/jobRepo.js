const db = require('../db');
exports.create = (j) => db.run(
  `INSERT INTO job_listings (company_id,title,description,ctc_lpa,min_cgpa,max_backlogs,deadline)
   VALUES (?,?,?,?,?,?,?)`,
  [j.company_id, j.title, j.description, j.ctc_lpa, j.min_cgpa, j.max_backlogs, j.deadline]).lastId;
exports.addBranch = (jobId, branch) =>
  db.run('INSERT OR IGNORE INTO job_allowed_branches (job_id, branch) VALUES (?,?)', [jobId, branch]);
exports.branchesOf = (jobId) =>
  db.all('SELECT branch FROM job_allowed_branches WHERE job_id = ? ORDER BY branch', [jobId]).map(r => r.branch);
exports.findById = (id) => db.get(
  `SELECT j.*, c.name AS company_name FROM job_listings j JOIN companies c ON c.id = j.company_id WHERE j.id = ?`, [id]);
exports.listAll = () => db.all(
  `SELECT j.*, c.name AS company_name FROM job_listings j JOIN companies c ON c.id = j.company_id
   ORDER BY j.status, j.deadline`);
exports.listByCompany = (companyId) => db.all(
  `SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicants
   FROM job_listings j WHERE j.company_id = ? ORDER BY j.id DESC`, [companyId]);
exports.close = (id) => db.run("UPDATE job_listings SET status='closed' WHERE id = ?", [id]);
