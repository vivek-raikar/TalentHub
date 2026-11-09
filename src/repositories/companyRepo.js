const db = require('../db');
exports.findByUserId = (uid) => db.get('SELECT * FROM companies WHERE user_id = ?', [uid]);
exports.nameExists = (name) => !!db.get('SELECT 1 x FROM companies WHERE name = ? COLLATE NOCASE', [name]);
exports.create = (c) => db.run('INSERT INTO companies (user_id,name,industry) VALUES (?,?,?)',
  [c.user_id, c.name, c.industry]).lastId;
exports.list = () => db.all(
  `SELECT c.id, c.name, c.industry, u.email,
     (SELECT COUNT(*) FROM job_listings j WHERE j.company_id = c.id) AS jobs
   FROM companies c JOIN users u ON u.id = c.user_id ORDER BY c.name`);
