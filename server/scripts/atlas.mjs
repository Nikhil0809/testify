// MongoDB Atlas Admin API helper (Digest auth) — dev utility.
// Usage:
//   node scripts/atlas.mjs discover
//   node scripts/atlas.mjs setup
//   node scripts/atlas.mjs uri <dbName>
import 'dotenv/config';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';

const HOST = 'cloud.mongodb.com';
const API = '/api/atlas/v2';
const USER = process.env.ATLAS_PUBLIC_KEY;
const PASS = process.env.ATLAS_PRIVATE_KEY;

if (!USER || !PASS) {
  console.error('ATLAS_PUBLIC_KEY / ATLAS_PRIVATE_KEY missing from server/.env');
  process.exit(1);
}

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashFor = (algo, s) => (String(algo).toUpperCase().includes('256') ? sha256(s) : md5(s));

const parseChallenge = (header) => {
  const out = {};
  const re = /(\w+)=("([^"]*)"|([^\s,]+))/g;
  let m;
  while ((m = re.exec(header))) out[m[1]] = m[3] ?? m[4];
  return out;
};

const buildAuth = (method, uri, challenge, nc, cnonce) => {
  const algo = challenge.algorithm || 'MD5';
  const realm = challenge.realm;
  const nonce = challenge.nonce;
  const qop = (challenge.qop || '').split(',')[0].trim();

  const HA1 = hashFor(algo, `${USER}:${realm}:${PASS}`);
  const HA2 = hashFor(algo, `${method}:${uri}`);
  let response;
  if (qop) {
    response = hashFor(algo, `${HA1}:${nonce}:${nc}:${cnonce}:${qop}:${HA2}`);
  } else {
    response = hashFor(algo, `${HA1}:${nonce}:${HA2}`);
  }

  const parts = [
    `username="${USER}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];
  if (algo) parts.push(`algorithm=${algo}`);
  if (qop) parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  return `Digest ${parts.join(', ')}`;
};

const request = (method, path, body) =>
  new Promise((resolve, reject) => {
    const uri = `${API}${path}`;
    const payload = body ? JSON.stringify(body) : null;
    const attempt = (authHeader) => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: process.env.ATLAS_API_VERSION
          ? `application/vnd.atlas.${process.env.ATLAS_API_VERSION}+json`
          : 'application/vnd.atlas.2025-03-12+json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
      };
      const req = https.request(
        { host: HOST, path: uri, method, headers },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            let data = null;
            try {
              data = JSON.parse(raw);
            } catch {
              data = raw;
            }
            if (res.statusCode === 401 && res.headers['www-authenticate'] && !authHeader) {
              const challenge = parseChallenge(res.headers['www-authenticate']);
              const nc = '00000001';
              const cnonce = crypto.randomBytes(8).toString('hex');
              return attempt(buildAuth(method, uri, challenge, nc, cnonce));
            }
            resolve({ status: res.statusCode, data });
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    };
    attempt(null);
  });

const j = (v) => JSON.stringify(v, null, 2);

const discover = async () => {
  const groups = await request('GET', '/groups');
  if (groups.status !== 200) {
    console.error('Auth/project list failed:', groups.status, j(groups.data));
    console.error('→ Check the keys, and that they are Atlas Admin API keys with Project Read access.');
    process.exit(1);
  }
  const projects = groups.data.results || [];
  console.log(`Projects accessible: ${projects.length}`);
  projects.forEach((p) => console.log(` - ${p.name} (${p.id}) org=${p.orgId}`));
  if (!projects.length) return null;

  const gid = projects[0].id;
  const clusters = await request('GET', `/groups/${gid}/clusters`);
  const list = clusters.data?.results || [];
  console.log(`\nClusters in ${projects[0].name}: ${list.length}`);
  list.forEach((c) =>
    console.log(
      ` - ${c.name} | tier=${c.replicationSpecs?.[0]?.regionConfigs?.[0]?.electableSpecs?.instanceSize || c.mongoDB?.majorityWriteMode || 'n/a'} | state=${c.stateName}`
    )
  );

  const users = await request('GET', `/groups/${gid}/databaseUsers`);
  console.log(`\nDatabase users: ${users.data?.results?.length ?? '?'}`);
  (users.data?.results || []).forEach((u) => console.log(` - ${u.username} (${u.roles?.length} roles)`));

  const acl = await request('GET', `/groups/${gid}/accessList`);
  console.log(`\nIP access list: ${acl.data?.results?.length ?? 0}`);
  (acl.data?.results || []).forEach((e) => console.log(` - ${e.cidrBlock || e.ipAddress} (${e.comment || 'no comment'})`));

  return { gid, projects, list };
};

const setup = async () => {
  const info = await discover();
  if (!info) {
    console.error('No project found.');
    process.exit(1);
  }
  const { gid, list } = info;

  // 1. Ensure a cluster exists (free tier M0)
  if (!list.length) {
    console.log('\nNo cluster found — creating free-tier cluster "cluster0" (this takes a few minutes)…');
    const create = await request('POST', `/groups/${gid}/clusters`, {
      clusterType: 'REPLICASET',
      name: 'cluster0',
      replicationSpecs: [
        {
          regionConfigs: [
            { electableSpecs: { instanceSize: 'M0', nodeCount: 3 }, priority: 7, regionName: 'US_EAST_1', providerName: 'AWS' },
          ],
          numShards: 1,
        },
      ],
      providerSettings: { providerName: 'AWS', regionName: 'US_EAST_1', instanceSize: 'M0' },
      diskSizeGB: 2,
      mongoDBVersion: '7.0',
    });
    console.log(`create cluster → ${create.status}`);
    if (create.status >= 300) console.log(j(create.data));
  }

  // 2. Whitelist the app (open for local development)
  const acl = await request('GET', `/groups/${gid}/accessList`);
  const entries = acl.data?.results || [];
  if (!entries.some((e) => e.cidrBlock === '0.0.0.0/0')) {
    const add = await request('POST', `/groups/${gid}/accessList`, [
      { cidrBlock: '0.0.0.0/0', comment: 'local development (temporary)' },
    ]);
    console.log(`\nIP allowlist 0.0.0.0/0 → ${add.status}`);
    if (add.status >= 300) console.log(j(add.data));
  } else {
    console.log('\nIP allowlist already open.');
  }

  // 3. Ensure a database user
  const users = await request('GET', `/groups/${gid}/databaseUsers`);
  const existing = (users.data?.results || []).find((u) => u.username === 'iasmign_app');
  let dbUser = existing;
  if (!existing) {
    const password = crypto.randomBytes(18).toString('base64url');
    const create = await request('POST', `/groups/${gid}/databaseUsers`, {
      username: 'iasmign_app',
      password,
      databaseName: 'admin',
      roles: [
        { roleName: 'readWriteAnyDatabase', databaseName: 'admin' },
      ],
    });
    console.log(`\ncreate db user → ${create.status}`);
    if (create.status >= 300) {
      console.log(j(create.data));
      process.exit(1);
    }
    dbUser = { username: 'iasmign_app', password };
    console.log(`Created db user iasmign_app with generated password`);
  } else {
    console.log('\nDatabase user iasmign_app already exists (password unknown — will rotate).');
    const rotated = crypto.randomBytes(18).toString('base64url');
    const upd = await request('PATCH', `/groups/${gid}/databaseUsers/admin/iasmign_app`, {
      password: rotated,
    });
    console.log(`rotate password → ${upd.status}`);
    if (upd.status >= 300) {
      console.log(j(upd.data));
      throw new Error('Failed to rotate DB user password');
    }
    dbUser = { username: 'iasmign_app', password: rotated };
  }

  return { gid, dbUser };
};

const uri = async (dbName = 'mini_test') => {
  const { gid, dbUser } = await setup();
  const clusters = await request('GET', `/groups/${gid}/clusters`);
  const cluster = (clusters.data?.results || [])[0];
  if (!cluster) {
    console.error('No cluster available yet.');
    process.exit(1);
  }
  const conn =
    cluster.connectionStrings?.standardSrv ||
    cluster.connectionStrings?.standard ||
    cluster.connectionString ||
    cluster.srvConnectionString;
  if (!conn) {
    console.error('Cluster has no connection string yet (still provisioning).');
    console.log(j({ name: cluster.name, state: cluster.stateName }));
    process.exit(1);
  }
  const hostPart = conn.replace(/^mongodb(\+srv)?:\/\//, '').replace(/\/.*/, '');
  const scheme = conn.startsWith('mongodb+srv') ? 'mongodb+srv' : 'mongodb';
  const suffix = scheme === 'mongodb+srv' ? '?retryWrites=true&w=majority&appName=mini-test' : '?ssl=true&authSource=admin&retryWrites=true&w=majority';
  const final =
    `${scheme}://${encodeURIComponent(dbUser.username)}:${encodeURIComponent(dbUser.password)}@${hostPart}/${dbName}${suffix}`;
  console.log('\n================ MONGO_URI ================');
  console.log(final);
  console.log('===========================================');
  return final;
};

const cmd = process.argv[2] || 'discover';
if (cmd === 'discover') await discover();
else if (cmd === 'setup') await setup();
else if (cmd === 'uri') await uri(process.argv[3] || 'mini_test');
else if (cmd === 'probe') {
  const groups = await request('GET', '/groups');
  const gid = groups.data?.results?.[0]?.id;
  console.log('project:', gid);
  const candidates = [
    '/ipAccessList',
    '/accessList',
    '/ipAccessLists',
    '/networkAccess',
    '/atlas/ipAccessList',
    '/ipAccess',
    '/whitelist',
  ];
  for (const c of candidates) {
    const r = await request('GET', `/groups/${gid}${c}`);
    console.log(`${r.status}  /groups/{id}${c}`);
  }
  const v1 = await new Promise((resolve) => {
    const req = https.request(
      {
        host: HOST,
        path: `/api/atlas/v1/groups/${gid}/ipAccessList`,
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, raw: raw.slice(0, 300) }));
      }
    );
    req.on('error', (e) => resolve({ status: 'ERR', raw: e.message }));
    req.end();
  });
  console.log('v1 endpoint:', v1.status, v1.raw);
}
else console.error('unknown command');
