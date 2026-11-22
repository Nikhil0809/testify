// End-to-end API smoke test. Run with the server already listening:
//   npm run test:smoke
import crypto from 'node:crypto';

const BASE = process.env.API_URL || 'http://localhost:5000/api';
const stamp = crypto.randomBytes(4).toString('hex');
const results = [];

const check = (name, condition, detail = '') => {
  results.push({ name, pass: !!condition, detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const req = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
};

const run = async () => {
  // 1. health
  const health = await req('/health');
  check('server health', health.status === 200 && health.data?.success, `status ${health.status}`);

  // 2. register + login
  const email = `smoke_${stamp}@test.com`;
  const reg = await req('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Tester', email, password: 'secret123' },
  });
  check('register student', reg.status === 201 && !!reg.data?.token, `status ${reg.status}`);

  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: { email, password: 'wrong-password' },
  });
  check('wrong password rejected', badLogin.status === 401, `status ${badLogin.status}`);

  const login = await req('/auth/login', {
    method: 'POST',
    body: { email, password: 'secret123' },
  });
  const token = login.data?.token;
  check('login returns JWT', login.status === 200 && !!token, `status ${login.status}`);

  const me = await req('/auth/me', { token });
  check('current user', me.status === 200 && me.data?.user?.email === email);

  const noAuth = await req('/tests/dashboard');
  check('protected route blocks anonymous', noAuth.status === 401, `status ${noAuth.status}`);

  // 3. dashboard
  const dash = await req('/tests/dashboard', { token });
  check(
    'dashboard stats',
    dash.status === 200 && dash.data?.stats?.totalAttempts === 0,
    `attempts=${dash.data?.stats?.totalAttempts}`
  );

  // 4. start test
  const start = await req('/tests/start', { method: 'POST', token });
  const attempt = start.data?.attempt;
  check('start test', start.status === 201 && attempt?.questions?.length === 10, `status ${start.status}`);

  const leaked = JSON.stringify(attempt).includes('correctAnswer');
  check('correct answers never exposed pre-submission', !leaked);

  const expiry = new Date(attempt.expiryTime).getTime();
  const remaining = expiry - Date.now();
  check('timer driven by backend timestamps', remaining > 9.5 * 60 * 1000 && remaining <= 10 * 60 * 1000, `${Math.round(remaining / 1000)}s`);

  // 5. resume (no duplicate attempt)
  const resume = await req('/tests/start', { method: 'POST', token });
  check(
    'start resumes existing attempt',
    resume.data?.resumed === true && resume.data?.attempt?.id === attempt.id
  );

  // 6. save answers
  const answers = attempt.questions.map((q, i) => ({
    questionId: q.id,
    selectedOption: i % 3 === 0 ? q.options[0] : null,
    status: i % 3 === 0 ? 'answered' : 'unanswered',
  }));
  const save = await req(`/tests/${attempt.id}/answers`, { method: 'PUT', token, body: { answers } });
  check('save answers', save.status === 200 && save.data?.success, `status ${save.status}`);

  const saveBadOwner = await req(`/tests/${attempt.id}/answers`, {
    method: 'PUT',
    token: (await req('/auth/register', {
      method: 'POST',
      body: { name: 'Other User', email: `other_${stamp}@test.com`, password: 'secret123' },
    })).data?.token,
    body: { answers },
  });
  check('ownership verified on save', saveBadOwner.status === 404, `status ${saveBadOwner.status}`);

  // 7. submit
  const submit = await req(`/tests/${attempt.id}/submit`, { method: 'POST', token, body: { answers } });
  check('submit test', submit.status === 200 && typeof submit.data?.score === 'number', `score=${submit.data?.score}`);

  const again = await req(`/tests/${attempt.id}/submit`, { method: 'POST', token, body: { answers } });
  check('duplicate submission prevented', again.status === 409, `status ${again.status}`);

  // 8. result
  const result = await req(`/tests/${attempt.id}/result`, { token });
  const r = result.data?.result;
  const graded =
    r &&
    r.correctCount + r.incorrectCount + r.unansweredCount === 10 &&
    r.review.every((x) => typeof x.correctAnswer === 'string');
  check('result graded server-side', result.status === 200 && graded);
  check('result has review explanations', r?.review.some((x) => x.explanation?.length > 0));
  check('result has subject performance', Array.isArray(r?.subjectPerformance) && r.subjectPerformance.length > 0);

  // 9. history
  const history = await req('/tests/history', { token });
  check(
    'history lists own attempts only',
    history.status === 200 && history.data?.attempts?.length === 1
  );
  const sorted = await req('/tests/history?sort=best', { token });
  check('history sorting works', sorted.status === 200 && sorted.data.attempts.length === 1);

  // 10. admin
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@test.com', password: 'admin123' },
  });
  const adminToken = adminLogin.data?.token;
  check('admin login', adminLogin.status === 200 && adminLogin.data?.user?.role === 'admin');

  const studentBlocked = await req('/admin/questions', { token });
  check('admin route blocks students', studentBlocked.status === 403, `status ${studentBlocked.status}`);

  const created = await req('/admin/questions', {
    method: 'POST',
    token: adminToken,
    body: {
      questionText: `Smoke test question ${stamp}?`,
      options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      correctAnswer: 'Beta',
      explanation: 'Because.',
      subject: 'Programming',
      difficulty: 'Easy',
    },
  });
  const qid = created.data?.question?._id;
  check('admin creates question', created.status === 201 && !!qid, `status ${created.status}`);

  const updated = await req(`/admin/questions/${qid}`, {
    method: 'PUT',
    token: adminToken,
    body: { difficulty: 'Hard', correctAnswer: 'Gamma' },
  });
  check(
    'admin updates question',
    updated.status === 200 && updated.data?.question?.difficulty === 'Hard'
  );

  const invalidUpdate = await req(`/admin/questions/${qid}`, {
    method: 'PUT',
    token: adminToken,
    body: { correctAnswer: 'NotAnOption' },
  });
  check('invalid correct answer rejected', invalidUpdate.status === 400, `status ${invalidUpdate.status}`);

  const questions = await req('/admin/questions?limit=5', { token: adminToken });
  check('admin lists questions', questions.status === 200 && questions.data?.pagination?.total > 10);

  const students = await req('/admin/students', { token: adminToken });
  check('admin lists students', students.status === 200 && students.data?.students?.length >= 1);

  const stats = await req('/admin/stats', { token: adminToken });
  check('admin stats', stats.status === 200 && stats.data?.stats?.totalStudents >= 1);

  const deleted = await req(`/admin/questions/${qid}`, { method: 'DELETE', token: adminToken });
  check('admin deletes question', deleted.status === 200);

  const deleteAgain = await req(`/admin/questions/${qid}`, { method: 'DELETE', token: adminToken });
  check('deleting missing question → 404', deleteAgain.status === 404);

  // 11. error handling
  const notFound = await req('/nope');
  check('unknown route → 404', notFound.status === 404);
  const badResult = await req('/tests/64b000000000000000000000/result', { token });
  check('missing attempt → 404', badResult.status === 404, `status ${badResult.status}`);

  // summary
  const failed = results.filter((x) => !x.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
  process.exit(0);
};

run().catch((err) => {
  console.error('Smoke test crashed:', err.message);
  process.exit(1);
});
