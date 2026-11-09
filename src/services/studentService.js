const db = require('../db');
const { HttpError } = db;
const v = require('../validate');
const students = require('../repositories/studentRepo');
const jobs = require('../repositories/jobRepo');
const apps = require('../repositories/applicationRepo');
const { checkEligibility } = require('./eligibility');

const today = () => new Date().toISOString().slice(0, 10);

function studentOf(userId) {
  const s = students.findByUserId(userId);
  if (!s) throw new HttpError(404, 'Student profile not found.');
  return s;
}

exports.profile = (userId) => {
  const s = studentOf(userId);
  return { ...s, placed: students.isPlaced(s.id) };
};

exports.listJobs = (userId) => {
  const s = studentOf(userId);
  return jobs.listAll().filter(j => j.status === 'open').map(j => {
    const branches = jobs.branchesOf(j.id);
    const elig = checkEligibility(s, j, branches);
    return {
      ...j, branches, ...elig,
      expired: j.deadline < today(),
      applied: apps.exists(j.id, s.id),
    };
  });
};

exports.apply = (userId, jobIdRaw) => {
  const s = studentOf(userId);
  const job = jobs.findById(v.id(jobIdRaw));
  if (!job) throw new HttpError(404, 'Job not found.');
  if (job.status !== 'open' || job.deadline < today()) throw new HttpError(400, 'This job is closed for applications.');
  if (students.isPlaced(s.id)) throw new HttpError(400, 'You have already accepted an offer, so you cannot apply to more jobs.');
  if (apps.exists(job.id, s.id)) throw new HttpError(409, 'You have already applied to this job.');
  const elig = checkEligibility(s, job, jobs.branchesOf(job.id));
  if (!elig.eligible) throw new HttpError(400, 'Not eligible: ' + elig.reasons.join('; ') + '.');
  return { id: apps.create(job.id, s.id) };
};

exports.applications = (userId) => apps.listForStudent(studentOf(userId).id);

exports.respondOffer = (userId, offerIdRaw, accept) => {
  const s = studentOf(userId);
  const offer = apps.findOffer(v.id(offerIdRaw));
  // Same message whether the offer is missing or belongs to someone else.
  if (!offer || offer.student_id !== s.id) throw new HttpError(404, 'Offer not found.');
  if (offer.status !== 'issued') throw new HttpError(400, 'You have already responded to this offer.');
  if (accept && students.isPlaced(s.id)) throw new HttpError(400, 'You have already accepted another offer.');
  apps.respondOffer(offer.id, accept ? 'accepted' : 'declined');
  return { status: accept ? 'accepted' : 'declined' };
};
