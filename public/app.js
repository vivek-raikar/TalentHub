'use strict';
// TalentHub frontend: plain JavaScript, no build step.
// All text is inserted with textContent / text nodes, never innerHTML, so user data cannot inject HTML.

const app = document.getElementById('app');
const state = { token: sessionStorage.getItem('th_token'), user: null, branches: [], tab: null };

// ---------- helpers ----------
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

async function api(method, url, body) {
  const res = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && state.token) { logout(true); throw new Error('Session expired. Please log in again.'); }
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

let toastTimer;
function toast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}

// Run an async action; show an error toast on failure; refresh the current view on success.
async function act(fn, okMsg, refresh) {
  try { await fn(); if (okMsg) toast(okMsg); if (refresh) await refresh(); }
  catch (e) { toast(e.message, true); }
}

const STATUS_LABEL = {
  applied: ['Applied', 'info'], shortlisted: ['Shortlisted', 'info'], rejected: ['Rejected', 'bad'],
  interview_scheduled: ['Interview scheduled', 'warn'], interview_passed: ['Interview passed', 'ok'],
  interview_failed: ['Interview failed', 'bad'], offered: ['Offer issued', 'ok'],
};
const statusBadge = (s) => { const [t, c] = STATUS_LABEL[s] || [s, '']; return h('span', { class: 'badge ' + c }, t); };
const fmtWhen = (s) => (s ? new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
const field = (label, input) => h('div', {}, h('label', {}, label), input);

function tabs(items, current, onPick) {
  return h('div', { class: 'tabs' }, items.map(([key, label]) =>
    h('button', { class: 'tab' + (key === current ? ' active' : ''), onclick: () => onPick(key) }, label)));
}

// ---------- session ----------
function logout(silent) {
  if (!silent && state.token) api('POST', '/auth/logout').catch(() => {});
  state.token = null; state.user = null; state.tab = null;
  sessionStorage.removeItem('th_token');
  render();
}

function setSession(data) {
  state.token = data.token; state.user = data.user; state.tab = null;
  sessionStorage.setItem('th_token', data.token);
  render();
}

// ---------- login / register ----------
function renderLogin(mode = 'login') {
  const err = h('div', { class: 'badge bad hidden' });
  const showErr = (m) => { err.textContent = m; err.classList.remove('hidden'); };
  const email = h('input', { type: 'email', autocomplete: 'username', required: 'required' });
  const pass = h('input', { type: 'password', autocomplete: mode === 'login' ? 'current-password' : 'new-password' });

  let extra = null, getExtra = () => ({});
  if (mode === 'register') {
    const name = h('input', { maxlength: 80 });
    const roll = h('input', { maxlength: 30, placeholder: 'e.g. 01FE26AAA111' });
    const branch = h('select', {}, state.branches.map(b => h('option', { value: b }, b)));
    const cgpa = h('input', { type: 'number', step: '0.01', min: 0, max: 10 });
    const back = h('input', { type: 'number', min: 0, max: 50, value: '0' });
    extra = h('div', {},
      field('Full name', name), field('Roll number / SRN', roll),
      h('div', { class: 'grid3' }, field('Branch', branch), field('CGPA', cgpa), field('Active backlogs', back)));
    getExtra = () => ({ name: name.value, roll_no: roll.value, branch: branch.value, cgpa: cgpa.value, active_backlogs: back.value });
  }

  const form = h('div', { class: 'card narrow' },
    h('h2', {}, mode === 'login' ? 'Log in' : 'Student registration'),
    extra, field('Email', email), field('Password' + (mode === 'register' ? ' (min 8 characters)' : ''), pass),
    h('div', { class: 'row between' },
      h('button', { class: 'btn', onclick: async () => {
        err.classList.add('hidden');
        try {
          const body = { email: email.value, password: pass.value, ...getExtra() };
          setSession(await api('POST', mode === 'login' ? '/auth/login' : '/auth/register', body));
        } catch (e) { showErr(e.message); }
      } }, mode === 'login' ? 'Log in' : 'Create account'),
      h('button', { class: 'btn ghost', onclick: () => renderLogin(mode === 'login' ? 'register' : 'login') },
        mode === 'login' ? 'New student? Register' : 'Back to login')),
    h('div', {}, err),
    mode === 'login' ? h('p', { class: 'muted' }, 'Demo accounts (password: password123): coordinator@talenthub.test, rahul@talenthub.test, abc@talenthub.test') : null);
  [email, pass].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') form.querySelector('.btn').click(); }));
  app.replaceChildren(form);
}

// ---------- student ----------
async function renderStudent() {
  const tab = state.tab || 'jobs';
  const [profile, jobs, applications] = await Promise.all([
    api('GET', '/student/profile'), api('GET', '/student/jobs'), api('GET', '/student/applications')]);
  const refresh = renderStudent;

  const header = h('div', { class: 'card' },
    h('div', { class: 'row between' },
      h('div', {}, h('h2', {}, profile.name),
        h('div', { class: 'muted' }, `${profile.roll_no} - ${profile.branch} - CGPA ${profile.cgpa} - ${profile.active_backlogs} active backlog(s)`)),
      profile.placed ? h('span', { class: 'badge ok' }, 'Placed') : h('span', { class: 'badge info' }, 'Seeking placement')));

  let body;
  if (tab === 'jobs') {
    body = jobs.length ? jobs.map(j => h('div', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', {}, h('h3', {}, `${j.title} - ${j.company_name}`),
          h('div', { class: 'muted' }, `${j.ctc_lpa} LPA - Min CGPA ${j.min_cgpa} - Max backlogs ${j.max_backlogs} - Apply by ${j.deadline}`),
          h('div', { class: 'muted' }, 'Branches: ' + j.branches.join(', '))),
        j.applied ? h('span', { class: 'badge info' }, 'Applied')
          : j.eligible && !j.expired && !profile.placed
            ? h('button', { class: 'btn', onclick: () => act(() => api('POST', `/student/jobs/${j.id}/apply`), 'Application submitted.', refresh) }, 'Apply')
            : h('span', { class: 'badge bad' }, j.expired ? 'Deadline passed' : profile.placed ? 'Already placed' : 'Not eligible')),
      j.description ? h('p', {}, j.description) : null,
      !j.eligible && !j.applied ? h('div', { class: 'muted' }, 'Why: ' + j.reasons.join('; ')) : null))
      : h('div', { class: 'card muted' }, 'No open jobs right now.');
  } else {
    body = applications.length ? applications.map(a => h('div', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', {}, h('h3', {}, `${a.title} - ${a.company_name}`), h('div', { class: 'muted' }, 'Applied ' + fmtWhen(a.applied_at))),
        statusBadge(a.status)),
      a.scheduled_at ? h('p', {}, `Interview: ${fmtWhen(a.scheduled_at)} at ${a.venue}` +
        (a.interview_result !== 'pending' ? ` (result: ${a.interview_result}${a.remarks ? ' - ' + a.remarks : ''})` : '')) : null,
      a.offer_id ? h('div', { class: 'inline-form' },
        h('b', {}, `Offer: ${a.offer_ctc} LPA `),
        a.offer_status === 'issued' ? h('span', { class: 'row' },
          h('button', { class: 'btn small good', onclick: () => act(() => api('POST', `/student/offers/${a.offer_id}/respond`, { accept: true }), 'Offer accepted. Congratulations!', refresh) }, 'Accept'),
          h('button', { class: 'btn small danger', onclick: () => confirm('Decline this offer?') && act(() => api('POST', `/student/offers/${a.offer_id}/respond`, { accept: false }), 'Offer declined.', refresh) }, 'Decline'))
          : h('span', { class: 'badge ' + (a.offer_status === 'accepted' ? 'ok' : 'bad') }, a.offer_status)) : null))
      : h('div', { class: 'card muted' }, 'You have not applied to any jobs yet.');
  }
  app.replaceChildren(header,
    tabs([['jobs', 'Open jobs'], ['apps', `My applications (${applications.length})`]], tab, k => { state.tab = k; renderStudent(); }), ...[].concat(body));
}

// ---------- company ----------
async function renderCompany() {
  const tab = state.tab || 'jobs';
  const [profile, jobs] = await Promise.all([api('GET', '/company/profile'), api('GET', '/company/jobs')]);
  const header = h('div', { class: 'card' }, h('h2', {}, profile.name), h('div', { class: 'muted' }, profile.industry));
  const nav = tabs([['jobs', 'My jobs'], ['new', 'Post a job']], tab === 'applicants' ? 'jobs' : tab, k => { state.tab = k; renderCompany(); });

  if (tab === 'new') return app.replaceChildren(header, nav, jobForm());
  if (tab === 'applicants') return renderApplicants(header, nav);

  app.replaceChildren(header, nav, ...(jobs.length ? jobs.map(j => h('div', { class: 'card' },
    h('div', { class: 'row between' },
      h('div', {}, h('h3', {}, j.title),
        h('div', { class: 'muted' }, `${j.ctc_lpa} LPA - Min CGPA ${j.min_cgpa} - Max backlogs ${j.max_backlogs} - Deadline ${j.deadline}`),
        h('div', { class: 'muted' }, 'Branches: ' + j.branches.join(', '))),
      h('span', { class: 'badge ' + (j.status === 'open' ? 'ok' : '') }, j.status)),
    h('div', { class: 'row' },
      h('button', { class: 'btn small', onclick: () => { state.tab = 'applicants'; state.jobId = j.id; state.jobTitle = j.title; renderCompany(); } }, `View applicants (${j.applicants})`),
      j.status === 'open' ? h('button', { class: 'btn small ghost', onclick: () => confirm('Close this job to new applications?') && act(() => api('POST', `/company/jobs/${j.id}/close`), 'Job closed.', renderCompany) }, 'Close job') : null)))
    : [h('div', { class: 'card muted' }, 'No jobs posted yet. Use "Post a job".')]));
}

function jobForm() {
  const title = h('input', { maxlength: 100 });
  const desc = h('textarea', { maxlength: 1000 });
  const ctc = h('input', { type: 'number', step: '0.1', min: 0 });
  const minc = h('input', { type: 'number', step: '0.1', min: 0, max: 10, value: '7.0' });
  const maxb = h('input', { type: 'number', min: 0, value: '0' });
  const dl = h('input', { type: 'date' });
  const boxes = state.branches.map(b => h('input', { type: 'checkbox', value: b }));
  return h('div', { class: 'card' }, h('h3', {}, 'Post a new job'),
    field('Job title', title), field('Description', desc),
    h('div', { class: 'grid2' }, field('CTC (LPA)', ctc), field('Application deadline', dl)),
    h('div', { class: 'grid2' }, field('Minimum CGPA', minc), field('Maximum active backlogs', maxb)),
    h('label', {}, 'Allowed branches'),
    h('div', { class: 'checks' }, state.branches.map((b, i) => h('label', {}, boxes[i], b))),
    h('p', {}, h('button', { class: 'btn', onclick: () => act(
      () => api('POST', '/company/jobs', { title: title.value, description: desc.value, ctc_lpa: ctc.value, min_cgpa: minc.value,
        max_backlogs: maxb.value, deadline: dl.value, branches: boxes.filter(b => b.checked).map(b => b.value) }),
      'Job posted.', async () => { state.tab = 'jobs'; await renderCompany(); }) }, 'Post job')));
}

async function renderApplicants(header, nav) {
  const list = await api('GET', `/company/jobs/${state.jobId}/applications`);
  const refresh = () => renderCompany();
  const post = (id, action, body, msg) => act(() => api('POST', `/company/applications/${id}/${action}`, body), msg, refresh);

  const rows = list.map(a => {
    let actions = [];
    if (a.status === 'applied') actions = [
      h('button', { class: 'btn small', onclick: () => post(a.id, 'shortlist', null, 'Shortlisted.') }, 'Shortlist'),
      h('button', { class: 'btn small danger', onclick: () => post(a.id, 'reject', null, 'Rejected.') }, 'Reject')];
    else if (a.status === 'shortlisted') {
      const when = h('input', { type: 'datetime-local' });
      const venue = h('input', { placeholder: 'Venue or meeting link', maxlength: 150 });
      actions = [h('div', { class: 'inline-form' }, when, venue,
        h('div', { class: 'row' },
          h('button', { class: 'btn small', onclick: () => post(a.id, 'interview', { scheduled_at: when.value, venue: venue.value }, 'Interview scheduled.') }, 'Schedule interview'),
          h('button', { class: 'btn small danger', onclick: () => post(a.id, 'reject', null, 'Rejected.') }, 'Reject')))];
    } else if (a.status === 'interview_scheduled') {
      const remarks = h('input', { placeholder: 'Remarks (optional)', maxlength: 300 });
      actions = [h('div', { class: 'inline-form' }, remarks, h('div', { class: 'row' },
        h('button', { class: 'btn small good', onclick: () => post(a.id, 'result', { passed: true, remarks: remarks.value }, 'Result saved: passed.') }, 'Passed'),
        h('button', { class: 'btn small danger', onclick: () => post(a.id, 'result', { passed: false, remarks: remarks.value }, 'Result saved: failed.') }, 'Failed')))];
    } else if (a.status === 'interview_passed') {
      const ctc = h('input', { type: 'number', step: '0.1', min: 0, placeholder: 'CTC LPA (blank = job CTC)' });
      actions = [h('div', { class: 'inline-form' }, ctc,
        h('button', { class: 'btn small good', onclick: () => post(a.id, 'offer', { ctc_lpa: ctc.value }, 'Offer issued.') }, 'Issue offer'))];
    } else if (a.status === 'offered') actions = [h('span', { class: 'badge ' + (a.offer_status === 'accepted' ? 'ok' : a.offer_status === 'declined' ? 'bad' : 'warn') },
      `${a.offer_ctc} LPA - ${a.offer_status}`)];
    return h('tr', {},
      h('td', {}, h('b', {}, a.name), h('div', { class: 'muted' }, a.roll_no)),
      h('td', {}, `${a.branch}, CGPA ${a.cgpa}, ${a.active_backlogs} backlog(s)`),
      h('td', {}, statusBadge(a.status), a.scheduled_at ? h('div', { class: 'muted' }, `${fmtWhen(a.scheduled_at)} @ ${a.venue}`) : null),
      h('td', {}, actions));
  });
  app.replaceChildren(header, nav, h('div', { class: 'card' },
    h('div', { class: 'row between' }, h('h3', {}, 'Applicants - ' + state.jobTitle),
      h('button', { class: 'btn small ghost', onclick: () => { state.tab = 'jobs'; renderCompany(); } }, 'Back to jobs')),
    list.length ? h('div', { class: 'scroll' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Student', 'Details', 'Status', 'Action'].map(t => h('th', {}, t)))), h('tbody', {}, rows)))
      : h('p', { class: 'muted' }, 'No applications yet.')));
}

// ---------- coordinator ----------
async function renderCoordinator() {
  const tab = state.tab || 'stats';
  const nav = tabs([['stats', 'Placement statistics'], ['students', 'Students'], ['companies', 'Companies']], tab, k => { state.tab = k; renderCoordinator(); });

  if (tab === 'stats') {
    const s = await api('GET', '/coordinator/stats');
    const stat = (label, value) => h('div', { class: 'stat' }, h('b', {}, value ?? '-'), h('span', { class: 'muted' }, label));
    const bar = h('div', { class: 'bar' }, h('i', {}));
    bar.firstChild.style.width = s.placementPercentage + '%';
    return app.replaceChildren(nav,
      h('div', { class: 'card' }, h('h3', {}, `Placement rate: ${s.placementPercentage}% (${s.placedStudents} of ${s.totalStudents} students)`), bar),
      h('div', { class: 'stats' }, stat('Students placed', s.placedStudents), stat('Companies', s.totalCompanies), stat('Open jobs', s.openJobs),
        stat('Applications', s.totalApplications), stat('Offers issued', s.offersIssued), stat('Offers accepted', s.offersAccepted),
        stat('Offers pending', s.offersPending), stat('Average CTC (LPA)', s.avgCtc), stat('Highest CTC (LPA)', s.highestCtc)),
      h('div', { class: 'grid2' },
        h('div', { class: 'card' }, h('h3', {}, 'By branch'), h('table', {}, h('thead', {}, h('tr', {}, ['Branch', 'Students', 'Placed'].map(t => h('th', {}, t)))),
          h('tbody', {}, s.byBranch.map(b => h('tr', {}, h('td', {}, b.branch), h('td', {}, b.total), h('td', {}, b.placed)))))),
        h('div', { class: 'card' }, h('h3', {}, 'By company'), h('table', {}, h('thead', {}, h('tr', {}, ['Company', 'Offers', 'Accepted'].map(t => h('th', {}, t)))),
          h('tbody', {}, s.byCompany.map(c => h('tr', {}, h('td', {}, c.name), h('td', {}, c.offers), h('td', {}, c.accepted))))))));
  }

  if (tab === 'students') {
    const list = await api('GET', '/coordinator/students');
    const rows = list.map(s => {
      const name = h('input', { value: s.name }), branch = h('select', {}, state.branches.map(b => h('option', { value: b, selected: b === s.branch }, b)));
      const cgpa = h('input', { type: 'number', step: '0.01', min: 0, max: 10, value: s.cgpa }), back = h('input', { type: 'number', min: 0, value: s.active_backlogs });
      return h('tr', {}, h('td', {}, name, h('div', { class: 'muted' }, `${s.roll_no} - ${s.email}`)), h('td', {}, branch), h('td', {}, cgpa), h('td', {}, back),
        h('td', {}, s.placed ? h('span', { class: 'badge ok' }, 'Placed') : h('span', { class: 'badge' }, 'Not placed')),
        h('td', {}, h('button', { class: 'btn small', onclick: () => act(() => api('PUT', `/coordinator/students/${s.id}`,
          { name: name.value, branch: branch.value, cgpa: cgpa.value, active_backlogs: back.value }), 'Student updated.') }, 'Save')));
    });
    return app.replaceChildren(nav, h('div', { class: 'card' }, h('h3', {}, 'Students'),
      h('p', { class: 'muted' }, 'Coordinators verify and maintain CGPA and backlog data used for eligibility checks.'),
      h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, ['Student', 'Branch', 'CGPA', 'Backlogs', 'Status', ''].map(t => h('th', {}, t)))), h('tbody', {}, rows)))));
  }

  const list = await api('GET', '/coordinator/companies');
  const name = h('input', { maxlength: 100 }), industry = h('input', { maxlength: 100 });
  const email = h('input', { type: 'email' }), pass = h('input', { type: 'password', autocomplete: 'new-password' });
  app.replaceChildren(nav,
    h('div', { class: 'card' }, h('h3', {}, 'Add a company account'),
      h('div', { class: 'grid2' }, field('Company name', name), field('Industry', industry), field('Login email', email), field('Temporary password (min 8)', pass)),
      h('button', { class: 'btn', onclick: () => act(() => api('POST', '/coordinator/companies', { name: name.value, industry: industry.value, email: email.value, password: pass.value }),
        'Company added.', renderCoordinator) }, 'Add company')),
    h('div', { class: 'card' }, h('h3', {}, 'Registered companies'),
      h('table', {}, h('thead', {}, h('tr', {}, ['Company', 'Industry', 'Login', 'Jobs'].map(t => h('th', {}, t)))),
        h('tbody', {}, list.map(c => h('tr', {}, h('td', {}, c.name), h('td', {}, c.industry), h('td', {}, c.email), h('td', {}, c.jobs)))))));
}

// ---------- boot ----------
async function render() {
  const userbox = document.getElementById('userbox');
  if (!state.user) { userbox.classList.add('hidden'); return renderLogin(); }
  userbox.classList.remove('hidden');
  document.getElementById('whoami').textContent = `${state.user.email} (${state.user.role})`;
  try {
    if (state.user.role === 'student') await renderStudent();
    else if (state.user.role === 'company') await renderCompany();
    else await renderCoordinator();
  } catch (e) { toast(e.message, true); }
}

document.getElementById('logoutBtn').addEventListener('click', () => logout(false));

(async function boot() {
  try { state.branches = (await api('GET', '/meta')).branches; } catch { /* server not reachable */ }
  if (state.token) { try { state.user = await api('GET', '/auth/me'); } catch { state.token = null; } }
  render();
})();
