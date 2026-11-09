const db = require('../db');
exports.findByUserId = (uid) => db.get('SELECT * FROM students WHERE user_id = ?', [uid]);
exports.findById = (id) => db.get('SELECT * FROM students WHERE id = ?', [id]);
exports.rollExists = (roll) => !!db.get('SELECT 1 x FROM students WHERE roll_no = ?', [roll]);
exports.create = (s) => db.run(
  'INSERT INTO students (user_id,name,roll_no,branch,cgpa,active_backlogs) VALUES (?,?,?,?,?,?)',
  [s.user_id, s.name, s.roll_no, s.branch, s.cgpa, s.active_backlogs]).lastId;
exports.update = (id, s) => db.run(
  'UPDATE students SET name=?, branch=?, cgpa=?, active_backlogs=? WHERE id=?',
  [s.name, s.branch, s.cgpa, s.active_backlogs, id]);
exports.listWithPlacement = () => db.all(
  `SELECT s.*, u.email,
     EXISTS (SELECT 1 FROM applications a JOIN offers o ON o.application_id = a.id
             WHERE a.student_id = s.id AND o.status = 'accepted') AS placed
   FROM students s JOIN users u ON u.id = s.user_id ORDER BY s.name`);
exports.isPlaced = (id) => !!db.get(
  `SELECT 1 x FROM applications a JOIN offers o ON o.application_id = a.id
   WHERE a.student_id = ? AND o.status = 'accepted'`, [id]);
