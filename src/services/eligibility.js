// Business rule: is this student eligible for this job?
function checkEligibility(student, job, allowedBranches) {
  const reasons = [];
  if (student.cgpa < job.min_cgpa)
    reasons.push(`CGPA ${student.cgpa} is below the minimum ${job.min_cgpa}`);
  if (student.active_backlogs > job.max_backlogs)
    reasons.push(`${student.active_backlogs} active backlogs exceeds the maximum ${job.max_backlogs}`);
  if (allowedBranches.length && !allowedBranches.includes(student.branch))
    reasons.push(`Branch ${student.branch} is not allowed for this job`);
  return { eligible: reasons.length === 0, reasons };
}
module.exports = { checkEligibility };
