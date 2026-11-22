// Server-side expiry enforcement test.
// Run with a short test duration, e.g. TEST_DURATION_SECONDS=15:
//   $env:TEST_DURATION_SECONDS=15; npm run dev:memory
//   npm run test:expiry
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const stamp = Date.now().toString(36);

let passed = 0;
let failed = 0;
const check = (name, cond, detail = '') => {
  cond ? passed++ : failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
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
    /* no body */
  }
  return { status: res.status, data };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  const reg = await req('/auth/register', {
    method: 'POST',
    body: { name: 'Expiry Tester', email: `expiry_${stamp}@test.com`, password: 'secret123' },
  });
  const token = reg.data?.token;
  check('register', reg.status === 201 && !!token);

  const start = await req('/tests/start', { method: 'POST', token });
  const attempt = start.data?.attempt;
  check('start test', start.status === 201 && attempt?.questions?.length === 10);

  const msLeft = new Date(attempt.expiryTime).getTime() - Date.now();
  check(
    'short duration applied',
    msLeft < 60_000 && msLeft > 0,
    `${Math.round(msLeft / 1000)}s remaining (set TEST_DURATION_SECONDS)`
  );

  // Answer a few questions, then let the timer run out WITHOUT submitting
  const answers = attempt.questions.slice(0, 5).map((q) => ({
    questionId: q.id,
    selectedOption: q.options[0],
    status: 'answered',
  }));
  const save = await req(`/tests/${attempt.id}/answers`, { method: 'PUT', token, body: { answers } });
  check('answers saved before expiry', save.status === 200);

  console.log('… waiting for the timer to expire …');
  await sleep(msLeft + 2500);

  // Server must now treat the attempt as finished even though nobody submitted
  const active = await req('/tests/active', { token });
  check(
    'expired attempt no longer active',
    active.status === 200 && active.data?.attempt === null,
    `expiredNow=${active.data?.expiredNow}`
  );

  const lateSave = await req(`/tests/${attempt.id}/answers`, {
    method: 'PUT',
    token,
    body: { answers },
  });
  check('saving after expiry rejected', lateSave.status === 410, `status ${lateSave.status}`);

  const result = await req(`/tests/${attempt.id}/result`, { token });
  const r = result.data?.result;
  check('result available after expiry', result.status === 200 && r?.status === 'expired', `status=${r?.status}`);
  check(
    'expired attempt graded',
    r && r.correctCount + r.incorrectCount + r.unansweredCount === 10 && typeof r.submissionTime === 'string',
    `score=${r?.score} correct=${r?.correctCount} wrong=${r?.incorrectCount} skipped=${r?.unansweredCount}`
  );
  check('review contains correct answers after submission', r?.review.every((x) => typeof x.correctAnswer === 'string'));

  const lateSubmit = await req(`/tests/${attempt.id}/submit`, { method: 'POST', token, body: { answers: [] } });
  check('late manual submit rejected', lateSubmit.status === 409, `status ${lateSubmit.status}`);

  // Starting again after expiry must create a brand-new attempt
  const restart = await req('/tests/start', { method: 'POST', token });
  check(
    'new attempt after expiry',
    restart.status === 201 && restart.data?.attempt?.id !== attempt.id
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed ? 1 : 0);
};

run().catch((err) => {
  console.error('Expiry test crashed:', err.message);
  process.exit(1);
});
