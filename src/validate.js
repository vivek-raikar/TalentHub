const { HttpError } = require('./db');
exports.BRANCHES = ['CSE', 'ISE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL'];

exports.str = (v, name, max = 200) => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${name} is required.`);
  if (v.trim().length > max) throw new HttpError(400, `${name} is too long.`);
  return v.trim();
};
exports.optStr = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
exports.num = (v, name, min, max) => {
  const n = Number(v);
  if (v === '' || v === null || v === undefined || !Number.isFinite(n) || n < min || n > max)
    throw new HttpError(400, `${name} must be a number between ${min} and ${max}.`);
  return n;
};
exports.int = (v, name, min, max) => {
  const n = exports.num(v, name, min, max);
  if (!Number.isInteger(n)) throw new HttpError(400, `${name} must be a whole number.`);
  return n;
};
exports.email = (v) => {
  const e = exports.str(v, 'Email', 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new HttpError(400, 'Email is not valid.');
  return e;
};
exports.password = (v) => {
  if (typeof v !== 'string' || v.length < 8 || v.length > 100)
    throw new HttpError(400, 'Password must be 8-100 characters.');
  return v;
};
exports.branch = (v) => {
  if (!exports.BRANCHES.includes(v)) throw new HttpError(400, 'Unknown branch.');
  return v;
};
exports.id = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Invalid id.');
  return n;
};
