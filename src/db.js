// Database layer: SQLite (via sql.js, pure JavaScript/WASM - no native build needed).
// The database is kept in memory and saved to data/talenthub.db after every change.
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = path.join(__dirname, '..', 'data', 'talenthub.db');
let db;
let txDepth = 0;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function init() {
  const SQL = await initSqlJs();
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const fresh = !fs.existsSync(DB_FILE);
  db = fresh ? new SQL.Database() : new SQL.Database(fs.readFileSync(DB_FILE));
  db.run('PRAGMA foreign_keys = ON');
  return fresh;
}

function persist() {
  const data = Buffer.from(db.export());
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, DB_FILE);
  db.run('PRAGMA foreign_keys = ON'); // export() resets this pragma
}

function exec(sql) { db.run(sql); if (!txDepth) persist(); }

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally { stmt.free(); }
}

function get(sql, params = []) { return all(sql, params)[0]; }

function run(sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const lastId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  if (!txDepth) persist();
  return { changes, lastId };
}

function transaction(fn) {
  db.run('BEGIN');
  txDepth++;
  try {
    const result = fn();
    txDepth--;
    db.run('COMMIT');
    persist();
    return result;
  } catch (err) {
    txDepth--;
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = { init, exec, all, get, run, transaction, HttpError };
