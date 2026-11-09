const db = require('../db');
const { HttpError } = db;
const auth = require('../auth');
const v = require('../validate');
const users = require('../repositories/userRepo');
const students = require('../repositories/studentRepo');
const companies = require('../repositories/companyRepo');

exports.login = (body) => {
  const email = v.email(body.email);
  const user = users.findByEmail(email);
  // Same error for unknown email and wrong password.
  if (!user || typeof body.password !== 'string' || !auth.verifyPassword(body.password, user.password_hash))
    throw new HttpError(401, 'Invalid email or password.');
  return { token: auth.createSession(user), user: exports.describe(user) };
};

exports.describe = (user) => {
  const out = { id: user.id, email: user.email, role: user.role };
  if (user.role === 'student') out.profile = students.findByUserId(user.id);
  if (user.role === 'company') out.profile = companies.findByUserId(user.id);
  return out;
};

exports.registerStudent = (body) => {
  const email = v.email(body.email);
  const password = v.password(body.password);
  const s = {
    name: v.str(body.name, 'Name', 80),
    roll_no: v.str(body.roll_no, 'Roll number / SRN', 30).toUpperCase(),
    branch: v.branch(body.branch),
    cgpa: v.num(body.cgpa, 'CGPA', 0, 10),
    active_backlogs: v.int(body.active_backlogs, 'Active backlogs', 0, 50),
  };
  if (users.findByEmail(email)) throw new HttpError(409, 'That email is already registered.');
  if (students.rollExists(s.roll_no)) throw new HttpError(409, 'That roll number is already registered.');
  return db.transaction(() => {
    s.user_id = users.create(email, auth.hashPassword(password), 'student');
    students.create(s);
    return exports.login({ email, password });
  });
};
