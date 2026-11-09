const db = require('../db');
const one = (sql) => db.get(sql);
exports.summary = () => ({
  totalStudents: one('SELECT COUNT(*) n FROM students').n,
  placedStudents: one(`SELECT COUNT(DISTINCT a.student_id) n FROM offers o
                       JOIN applications a ON a.id = o.application_id WHERE o.status='accepted'`).n,
  totalCompanies: one('SELECT COUNT(*) n FROM companies').n,
  openJobs: one("SELECT COUNT(*) n FROM job_listings WHERE status='open'").n,
  totalApplications: one('SELECT COUNT(*) n FROM applications').n,
  offersIssued: one('SELECT COUNT(*) n FROM offers').n,
  offersAccepted: one("SELECT COUNT(*) n FROM offers WHERE status='accepted'").n,
  offersPending: one("SELECT COUNT(*) n FROM offers WHERE status='issued'").n,
  avgCtc: one("SELECT ROUND(AVG(ctc_lpa),2) v FROM offers WHERE status='accepted'").v,
  highestCtc: one("SELECT MAX(ctc_lpa) v FROM offers WHERE status='accepted'").v,
});
exports.byBranch = () => db.all(
  `SELECT s.branch, COUNT(*) AS total,
     SUM(EXISTS (SELECT 1 FROM applications a JOIN offers o ON o.application_id = a.id
                 WHERE a.student_id = s.id AND o.status='accepted')) AS placed
   FROM students s GROUP BY s.branch ORDER BY s.branch`);
exports.byCompany = () => db.all(
  `SELECT c.name,
     COUNT(o.id) AS offers,
     COALESCE(SUM(o.status='accepted'),0) AS accepted
   FROM companies c
   LEFT JOIN job_listings j ON j.company_id = c.id
   LEFT JOIN applications a ON a.job_id = j.id
   LEFT JOIN offers o ON o.application_id = a.id
   GROUP BY c.id ORDER BY c.name`);
