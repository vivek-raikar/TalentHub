const db = require('../db');
const { HttpError } = db;
const v = require('../validate');
const companies = require('../repositories/companyRepo');
const jobs = require('../repositories/jobRepo');
const apps = require('../repositories/applicationRepo');

function companyOf(userId) {
  const c = companies.findByUserId(userId);
  if (!c) throw new HttpError(404, 'Company profile not found.');
  return c;
}

function ownJob(userId, jobIdRaw) {
  const c = companyOf(userId);
  const job = jobs.findById(v.id(jobIdRaw));
  if (!job || job.company_id !== c.id) throw new HttpError(404, 'Job not found.');
  return job;
}

function ownApplication(userId, appIdRaw) {
  const c = companyOf(userId);
  const a = apps.findWithOwner(v.id(appIdRaw));
  if (!a || a.company_id !== c.id) throw new HttpError(404, 'Application not found.');
  return a;
}

function requireStatus(app, allowed, action) {
  if (!allowed.includes(app.status))
    throw new HttpError(400, `Cannot ${action} an application that is "${app.status.replace(/_/g, ' ')}".`);
}

exports.profile = (userId) => companyOf(userId);

exports.listJobs = (userId) => {
  const c = companyOf(userId);
  return jobs.listByCompany(c.id).map(j => ({ ...j, branches: jobs.branchesOf(j.id) }));
};

exports.createJob = (userId, b) => {
  const c = companyOf(userId);
  const deadline = v.str(b.deadline, 'Deadline', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(Date.parse(deadline)))
    throw new HttpError(400, 'Deadline must be a valid date.');
  if (deadline < new Date().toISOString().slice(0, 10)) throw new HttpError(400, 'Deadline cannot be in the past.');
  const branches = Array.isArray(b.branches) ? b.branches.map(v.branch) : [];
  if (!branches.length) throw new HttpError(400, 'Select at least one allowed branch.');
  const job = {
    company_id: c.id,
    title: v.str(b.title, 'Title', 100),
    description: v.optStr(b.description, 1000),
    ctc_lpa: v.num(b.ctc_lpa, 'CTC', 0.1, 1000),
    min_cgpa: v.num(b.min_cgpa, 'Minimum CGPA', 0, 10),
    max_backlogs: v.int(b.max_backlogs, 'Maximum backlogs', 0, 50),
    deadline,
  };
  return db.transaction(() => {
    const id = jobs.create(job);
    branches.forEach(br => jobs.addBranch(id, br));
    return { id };
  });
};

exports.closeJob = (userId, jobId) => { jobs.close(ownJob(userId, jobId).id); return { ok: true }; };

exports.applicants = (userId, jobId) => apps.listForJob(ownJob(userId, jobId).id);

exports.shortlist = (userId, appId) => {
  const a = ownApplication(userId, appId);
  requireStatus(a, ['applied'], 'shortlist');
  apps.setStatus(a.id, 'shortlisted');
  return { status: 'shortlisted' };
};

exports.reject = (userId, appId) => {
  const a = ownApplication(userId, appId);
  requireStatus(a, ['applied', 'shortlisted'], 'reject');
  apps.setStatus(a.id, 'rejected');
  return { status: 'rejected' };
};

exports.scheduleInterview = (userId, appId, b) => {
  const a = ownApplication(userId, appId);
  requireStatus(a, ['shortlisted'], 'schedule an interview for');
  const when = v.str(b.scheduled_at, 'Interview date and time', 25);
  if (Number.isNaN(Date.parse(when))) throw new HttpError(400, 'Interview date and time is not valid.');
  const venue = v.str(b.venue, 'Venue / link', 150);
  return db.transaction(() => {
    apps.createInterview(a.id, when, venue);
    apps.setStatus(a.id, 'interview_scheduled');
    return { status: 'interview_scheduled' };
  });
};

exports.recordResult = (userId, appId, b) => {
  const a = ownApplication(userId, appId);
  requireStatus(a, ['interview_scheduled'], 'record a result for');
  if (typeof b.passed !== 'boolean') throw new HttpError(400, 'Result must be pass or fail.');
  return db.transaction(() => {
    apps.setInterviewResult(a.id, b.passed ? 'passed' : 'failed', v.optStr(b.remarks, 300));
    apps.setStatus(a.id, b.passed ? 'interview_passed' : 'interview_failed');
    return { status: b.passed ? 'interview_passed' : 'interview_failed' };
  });
};

exports.issueOffer = (userId, appId, b) => {
  const a = ownApplication(userId, appId);
  requireStatus(a, ['interview_passed'], 'issue an offer for');
  const ctc = b.ctc_lpa === undefined || b.ctc_lpa === '' ? a.job_ctc : v.num(b.ctc_lpa, 'CTC', 0.1, 1000);
  return db.transaction(() => {
    apps.createOffer(a.id, ctc);
    apps.setStatus(a.id, 'offered');
    return { status: 'offered' };
  });
};
