const db = require('../db');
exports.create = (jobId, studentId) =>
  db.run('INSERT INTO applications (job_id, student_id) VALUES (?,?)', [jobId, studentId]).lastId;
exports.exists = (jobId, studentId) =>
  !!db.get('SELECT 1 x FROM applications WHERE job_id = ? AND student_id = ?', [jobId, studentId]);
exports.setStatus = (id, status) => db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

// Application plus the company that owns the job (used for ownership checks).
exports.findWithOwner = (id) => db.get(
  `SELECT a.*, j.company_id, j.ctc_lpa AS job_ctc, j.title AS job_title
   FROM applications a JOIN job_listings j ON j.id = a.job_id WHERE a.id = ?`, [id]);

exports.listForStudent = (studentId) => db.all(
  `SELECT a.id, a.status, a.applied_at, j.title, j.ctc_lpa AS job_ctc, c.name AS company_name,
          i.scheduled_at, i.venue, i.result AS interview_result, i.remarks,
          o.id AS offer_id, o.ctc_lpa AS offer_ctc, o.status AS offer_status
   FROM applications a
   JOIN job_listings j ON j.id = a.job_id
   JOIN companies c ON c.id = j.company_id
   LEFT JOIN interview_slots i ON i.application_id = a.id
   LEFT JOIN offers o ON o.application_id = a.id
   WHERE a.student_id = ? ORDER BY a.id DESC`, [studentId]);

exports.listForJob = (jobId) => db.all(
  `SELECT a.id, a.status, a.applied_at, s.name, s.roll_no, s.branch, s.cgpa, s.active_backlogs,
          i.scheduled_at, i.venue, i.result AS interview_result,
          o.ctc_lpa AS offer_ctc, o.status AS offer_status
   FROM applications a
   JOIN students s ON s.id = a.student_id
   LEFT JOIN interview_slots i ON i.application_id = a.id
   LEFT JOIN offers o ON o.application_id = a.id
   WHERE a.job_id = ? ORDER BY s.cgpa DESC, s.name`, [jobId]);

exports.createInterview = (appId, when, venue) =>
  db.run('INSERT INTO interview_slots (application_id, scheduled_at, venue) VALUES (?,?,?)', [appId, when, venue]);
exports.setInterviewResult = (appId, result, remarks) =>
  db.run('UPDATE interview_slots SET result = ?, remarks = ? WHERE application_id = ?', [result, remarks, appId]);
exports.createOffer = (appId, ctc) =>
  db.run('INSERT INTO offers (application_id, ctc_lpa) VALUES (?,?)', [appId, ctc]);
exports.findOffer = (offerId) => db.get(
  `SELECT o.*, a.student_id FROM offers o JOIN applications a ON a.id = o.application_id WHERE o.id = ?`, [offerId]);
exports.respondOffer = (offerId, status) =>
  db.run("UPDATE offers SET status = ?, responded_at = datetime('now') WHERE id = ?", [status, offerId]);
