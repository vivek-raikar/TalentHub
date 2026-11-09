const db = require('../db');
exports.findByEmail = (email) => db.get('SELECT * FROM users WHERE email = ?', [email]);
exports.findById = (id) => db.get('SELECT id, email, role FROM users WHERE id = ?', [id]);
exports.create = (email, hash, role) =>
  db.run('INSERT INTO users (email, password_hash, role) VALUES (?,?,?)', [email, hash, role]).lastId;
