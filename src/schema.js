// Model layer: table definitions for TalentHub.
module.exports = `
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','company','coordinator')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE students (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name            TEXT NOT NULL,
  roll_no         TEXT NOT NULL UNIQUE,
  branch          TEXT NOT NULL,
  cgpa            REAL NOT NULL CHECK (cgpa >= 0 AND cgpa <= 10),
  active_backlogs INTEGER NOT NULL DEFAULT 0 CHECK (active_backlogs >= 0)
);

CREATE TABLE companies (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name     TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL
);

CREATE TABLE job_listings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id   INTEGER NOT NULL REFERENCES companies(id),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  ctc_lpa      REAL NOT NULL CHECK (ctc_lpa > 0),
  min_cgpa     REAL NOT NULL CHECK (min_cgpa >= 0 AND min_cgpa <= 10),
  max_backlogs INTEGER NOT NULL CHECK (max_backlogs >= 0),
  deadline     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE job_allowed_branches (
  job_id INTEGER NOT NULL REFERENCES job_listings(id),
  branch TEXT NOT NULL,
  PRIMARY KEY (job_id, branch)
);

CREATE TABLE applications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id     INTEGER NOT NULL REFERENCES job_listings(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  status     TEXT NOT NULL DEFAULT 'applied' CHECK (status IN
             ('applied','shortlisted','rejected','interview_scheduled',
              'interview_passed','interview_failed','offered')),
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (job_id, student_id)
);

CREATE TABLE interview_slots (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id),
  scheduled_at   TEXT NOT NULL,
  venue          TEXT NOT NULL,
  result         TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending','passed','failed')),
  remarks        TEXT NOT NULL DEFAULT ''
);

CREATE TABLE offers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id),
  ctc_lpa        REAL NOT NULL CHECK (ctc_lpa > 0),
  status         TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','accepted','declined')),
  issued_at      TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at   TEXT
);
`;
