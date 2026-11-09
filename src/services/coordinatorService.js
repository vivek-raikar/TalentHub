const db = require('../db');
const { HttpError } = db;
const auth = require('../auth');
const v = require('../validate');
const users = require('../repositories/userRepo');
const students = require('../repositories/studentRepo');
const companies = require('../repositories/companyRepo');
const stats = require('../repositories/statsRepo');

exports.stats = () => {
  const s = stats.summary();
  return {
    ...s,
    placementPercentage: s.totalStudents ? Math.round((s.placedStudents / s.totalStudents) * 1000) / 10 : 0,
    byBranch: stats.byBranch(),
    byCompany: stats.byCompany(),
  };
};

exports.listStudents = () => students.listWithPlacement();

exports.updateStudent = (idRaw, b) => {
  const id = v.id(idRaw);
  if (!students.findById(id)) throw new HttpError(404, 'Student not found.');
  students.update(id, {
    name: v.str(b.name, 'Name', 80),
    branch: v.branch(b.branch),
    cgpa: v.num(b.cgpa, 'CGPA', 0, 10),
    active_backlogs: v.int(b.active_backlogs, 'Active backlogs', 0, 50),
  });
  return { ok: true };
};

exports.listCompanies = () => companies.list();

exports.createCompany = (b) => {
  const email = v.email(b.email);
  const password = v.password(b.password);
  const name = v.str(b.name, 'Company name', 100);
  const industry = v.str(b.industry, 'Industry', 100);
  if (users.findByEmail(email)) throw new HttpError(409, 'That email is already registered.');
  if (companies.nameExists(name)) throw new HttpError(409, 'A company with that name already exists.');
  return db.transaction(() => {
    const user_id = users.create(email, auth.hashPassword(password), 'company');
    return { id: companies.create({ user_id, name, industry }) };
  });
};
