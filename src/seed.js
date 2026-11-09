// Demo data, created only when the database file does not exist yet.
const db = require('./db');
const auth = require('./auth');
const users = require('./repositories/userRepo');
const students = require('./repositories/studentRepo');
const companies = require('./repositories/companyRepo');
const jobs = require('./repositories/jobRepo');
const apps = require('./repositories/applicationRepo');

const DEMO_PASSWORD = 'password123';

function daysFromNow(n) {
  return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
}

module.exports = function seed() {
  const hash = auth.hashPassword(DEMO_PASSWORD);
  db.transaction(() => {
    users.create('coordinator@talenthub.test', hash, 'coordinator');

    const mkStudent = (email, name, roll, branch, cgpa, backlogs) =>
      students.create({ user_id: users.create(email, hash, 'student'), name, roll_no: roll, branch, cgpa, active_backlogs: backlogs });
    const rahul = mkStudent('rahul@talenthub.test', 'Rahul Sharma', 'CSE001', 'CSE', 8.2, 1);
    const priya = mkStudent('priya@talenthub.test', 'Priya Nair', 'ISE002', 'ISE', 9.1, 0);
    const arjun = mkStudent('arjun@talenthub.test', 'Arjun Rao', 'CSE003', 'CSE', 6.5, 0);
    mkStudent('sneha@talenthub.test', 'Sneha Kulkarni', 'ECE004', 'ECE', 7.5, 3);
    mkStudent('kiran@talenthub.test', 'Kiran Patil', 'MECH005', 'MECH', 7.8, 0);

    const mkCompany = (email, name, industry) =>
      companies.create({ user_id: users.create(email, hash, 'company'), name, industry });
    const abc = mkCompany('abc@talenthub.test', 'ABC Technologies', 'Software');
    const xyz = mkCompany('xyz@talenthub.test', 'XYZ Systems', 'Embedded & Electronics');

    const mkJob = (company_id, title, description, ctc_lpa, min_cgpa, max_backlogs, branches) => {
      const id = jobs.create({ company_id, title, description, ctc_lpa, min_cgpa, max_backlogs, deadline: daysFromNow(45) });
      branches.forEach(b => jobs.addBranch(id, b));
      return id;
    };
    const dev = mkJob(abc, 'Software Developer', 'Build and maintain backend services.', 8, 7.0, 2, ['CSE', 'ISE', 'AIML', 'ECE']);
    mkJob(xyz, 'Embedded Engineer', 'Firmware for IoT devices.', 6.5, 7.0, 0, ['ECE', 'EEE']);
    mkJob(xyz, 'Graduate Engineer Trainee', 'Rotational training programme.', 5, 6.0, 1, ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL']);

    // Sample pipeline for the first job: Rahul accepted-ready, Priya shortlisted.
    const a1 = apps.create(dev, rahul);
    apps.setStatus(a1, 'shortlisted');
    apps.createInterview(a1, daysFromNow(7) + 'T10:00', 'Seminar Hall 2');
    apps.setStatus(a1, 'interview_scheduled');
    const a2 = apps.create(dev, priya);
    apps.setStatus(a2, 'shortlisted');
    void arjun;
  });
};
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;
