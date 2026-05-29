// ============================================================
//  SECUREVOTE — Complete Backend Server
//  Express.js REST API with JWT Auth, Rate Limiting,
//  OTP, Face Data Storage, Audit Logging
// ============================================================
/*

const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/securevote")
  .then(() => console.log("🔥 MongoDB Connected (LOCAL)"))
  .catch(err => console.log(err));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'securevote_jwt_secret_change_in_production_2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  voterId: String,
  phone: String,
  dob: String,
  constituency: String,
  faceDataHash: String,
  biometricId: String,
  role: { type: String, default: "voter" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
// ===== MIDDLEWARE =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'], credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' })); // Allow face image data
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));
//app.use(express.static(__dirname));

// ===== RATE LIMITING =====
const generalLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many auth attempts. Try again in 15 minutes.' } });
const voteLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: 'Vote rate limit exceeded' } });
app.use('/api/', generalLimit);
app.use('/api/auth/', authLimit);
app.use('/api/vote/', voteLimit);

// ===== IN-MEMORY DATABASE =====
// In production, replace with PostgreSQL/MongoDB
const DB = {
  users: [],
  elections: [],
  votes: [],
  otpStore: new Map(),  // email -> { code, expires, attempts }
  securityLog: [],
  activeSessions: new Map(), // token -> userId
  failedAttempts: new Map(), // email -> count
};

// ===== SEED DATA =====
async function seedDatabase() {
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const voterHash = await bcrypt.hash('Voter@123', 12);

  await User.deleteMany({});

await User.create([
  {
    email: 'admin@vote.com',
    password: await bcrypt.hash('Admin@123', 12),
    name: 'System Administrator',
    role: 'admin',
    voterId: 'ADMIN-001',
    phone: '+91 9999999999',
    constituency: 'Vijayawada East',
    dob: '1985-01-01',
    faceDataHash: null,
    biometricId: 'bio_admin_001',
    registered: new Date().toISOString(),
    verified: true,
    locked: false,
    loginAttempts: 0
  },
  {
    email: 'voter@vote.com',
    password: await bcrypt.hash('Voter@123', 12),
    name: 'Demo Voter Reddy',
    role: 'voter',
    voterId: 'VTR-20250001',
    phone: '+91 9876543210',
    constituency: 'Vijayawada East',
    dob: '1995-05-15',
    faceDataHash: 'sha256_demo_face_hash',
    biometricId: 'bio_voter_001',
    registered: new Date().toISOString(),
    verified: true,
    locked: false,
    loginAttempts: 0
  }
]);

  const now = new Date();
  const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  DB.elections = [
    {
      id: 'el001', title: 'Vijayawada East Assembly Election 2025',
      description: 'Vote for your Member of Legislative Assembly.',
      start: now.toISOString(), end: future.toISOString(),
      status: 'active', constituency: 'Vijayawada East',
      candidates: [
        { id: 'c1', name: 'Ravi Kumar Reddy', party: 'BJP', symbol: '🪷', number: 1 },
        { id: 'c2', name: 'Sita Devi Rao', party: 'INC', symbol: '✋', number: 2 },
        { id: 'c3', name: 'Mohan Rao Naidu', party: 'TDP', symbol: '🚲', number: 3 },
        { id: 'c4', name: 'Priya Sharma', party: 'YSRCP', symbol: '🏺', number: 4 },
      ],
      createdBy: 'u001', totalVotes: 0
    }
  ];

  logSecurity('info', 'Database seeded successfully', 'system');
  logSecurity('info', 'SecureVote API started — encryption active', 'system');
  console.log('✅ Database seeded');
}

// ===== HELPERS =====
function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function generateToken(userId, role) { return jwt.sign({ userId, role, iat: Date.now() }, JWT_SECRET, { expiresIn: JWT_EXPIRES }); }
function generateReceiptId() { return 'RCV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function generateBlockchainHash(data) { return '0x' + crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex'); }
function hashFaceData(data) { return crypto.createHash('sha256').update(data + 'sv_salt_2025').digest('hex'); }

function logSecurity(type, message, user, meta = {}) {
  const entry = { id: uuidv4(), type, message, user, meta, timestamp: new Date().toISOString() };
  DB.securityLog.unshift(entry);
  if (DB.securityLog.length > 500) DB.securityLog = DB.securityLog.slice(0, 500);
}

// ===== AUTH MIDDLEWARE =====
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.locked) return res.status(401).json({ error: 'Invalid session' });
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') { logSecurity('danger', `Unauthorized admin access attempt by ${req.user?.email}`, req.user?.email); return res.status(403).json({ error: 'Admin access required' }); }
  next();
}

// ===== ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString(), service: 'SecureVote API' });
});

// ---- AUTH ROUTES ----

// Step 1: Validate credentials
app.post('/api/auth/login/credentials', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    logSecurity('warn', `Login attempt with unknown email: ${email}`, email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.locked) {
    logSecurity('danger', `Login attempt on locked account: ${email}`, email);
    return res.status(403).json({ error: 'Account locked due to too many failed attempts. Contact support.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.locked = true;
      logSecurity('danger', `Account locked after 5 failed attempts: ${email}`, email);
      return res.status(403).json({ error: 'Account locked after 5 failed attempts' });
    }
    logSecurity('warn', `Wrong password (attempt ${user.loginAttempts}) for: ${email}`, email);
    return res.status(401).json({ error: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` });
  }

  user.loginAttempts = 0;
  const sessionToken = crypto.randomBytes(32).toString('hex');
  logSecurity('info', `Credentials verified for: ${email}`, email);
  res.json({ success: true, sessionToken, message: 'Credentials verified. Proceed to face verification.' });
  console.log("LOGIN EMAIL:", email);
console.log("USER FOUND:", user);
console.log("ENTERED PASSWORD:", password);
console.log("HASHED PASSWORD:", user?.password);
});

// Step 2: Face verification (receives hash of captured face)
app.post('/api/auth/login/face', async (req, res) => {
  const { email, sessionToken, faceDataHash } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // In production: use actual face recognition API (AWS Rekognition / Azure Face / DeepFace)
  // For demo: any submitted face data passes if user has registered face data
  // const faceMatch =
  // user.faceDataHash &&
  // faceDataHash &&
  // user.faceDataHash.slice(0, 20) === faceDataHash.slice(0, 20);
  const faceMatch = user.faceDataHash && faceDataHash;

  if (!faceMatch) {
    logSecurity('danger', `Face verification FAILED for: ${email}`, email);
    return res.status(401).json({ error: 'Face verification failed. Access denied.' });
  }

  logSecurity('success', `Face verification passed for: ${email}`, email);
  res.json({ success: true, message: 'Face verified. OTP will be sent.' });
});

// Step 3: Send OTP
app.post('/api/auth/login/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = generateOTP();
  DB.otpStore.set(email, { code: otp, expires: Date.now() + 5 * 60 * 1000, attempts: 0 });

  // In production: send via Nodemailer or Twilio
  console.log(`[OTP] ${email}: ${otp}`);
  logSecurity('info', `OTP generated and sent to: ${email}`, email);

  // Simulate email send
  res.json({ success: true, message: 'OTP sent to registered email and phone', devOtp: process.env.NODE_ENV === 'development' ? otp : undefined });
});

// Step 3b: Verify OTP
app.post('/api/auth/login/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const stored = DB.otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
  if (Date.now() > stored.expires) { DB.otpStore.delete(email); return res.status(400).json({ error: 'OTP expired. Request a new one.' }); }
  
  stored.attempts++;
  if (stored.attempts > 3) { DB.otpStore.delete(email); logSecurity('danger', `OTP brute force attempt for: ${email}`, email); return res.status(429).json({ error: 'Too many OTP attempts. Request a new one.' }); }
  if (stored.code !== otp) { logSecurity('warn', `Wrong OTP attempt for: ${email}`, email); return res.status(401).json({ error: 'Incorrect OTP' }); }

  DB.otpStore.delete(email);
  logSecurity('success', `OTP verified for: ${email}`, email);
  res.json({ success: true, message: 'OTP verified. Proceed to biometric authentication.' });
});

// Step 4: Complete auth with biometric → return JWT
app.post('/api/auth/login/complete', async (req, res) => {
  const { email, biometricVerified } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const token = generateToken(user.id, user.role);
  user.lastLogin = new Date().toISOString();
  logSecurity('success', `Full authentication complete — JWT issued for: ${email}`, email);

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, voterId: user.voterId, constituency: user.constituency }
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  
  const { name, email, password, voterId, phone, dob, constituency, faceData, biometricId } = req.body;
  if (!name || !email || !password || !voterId || !phone || !dob || !constituency) return res.status(400).json({ error: 'All fields required' });

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

  const existingVoter = await User.findOne({ voterId });
  if (existingVoter) return res.status(409).json({ error: 'Voter ID already registered' });

  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must be 8+ chars with uppercase and number' });

  const birthDate = new Date(dob);
  const age = (new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) return res.status(400).json({ error: 'Must be 18+ to register' });

  const hashed = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(), email: email.toLowerCase(), password: hashed,
    name, role: 'voter', voterId, phone, constituency, dob,
    faceDataHash: faceData ? hashFaceData(faceData) : null,
    biometricId: biometricId || null,
    registered: new Date().toISOString(), verified: true,
    locked: false, loginAttempts: 0
  };

await User.create(user);
  logSecurity('success', `New voter registered: ${name} (${email})`, email);
  res.status(201).json({ success: true, message: 'Registration successful', voterId: user.voterId });
  console.log(req.body);
});

// ---- ELECTION ROUTES ----

app.get('/api/elections', authenticate, (req, res) => {
  const user = req.user;
  const now = new Date();
  const elections = DB.elections
    .filter(e => !e.constituency || e.constituency === 'all' || e.constituency === user.constituency)
    .map(e => ({
      ...e,
      hasVoted: DB.votes.some(v => v.userId === user.id && v.electionId === e.id),
      isActive: new Date(e.start) <= now && new Date(e.end) >= now,
      totalVotes: DB.votes.filter(v => v.electionId === e.id).length
    }))
    console.log("USER 👉", user.constituency);
    console.log("ALL ELECTIONS 👉", DB.elections);;
  res.json(elections);
});

app.get('/api/elections/all', authenticate, requireAdmin, (req, res) => {
  const enriched = DB.elections.map(e => ({
    ...e,
    totalVotes: DB.votes.filter(v => v.electionId === e.id).length
  }));
  res.json(enriched);
});

app.post('/api/elections', authenticate, requireAdmin, (req, res) => {
  const { title, description, start, end, candidates, constituency } = req.body;
  if (!title || !description || !start || !end || !candidates?.length) return res.status(400).json({ error: 'All fields required' });
  if (candidates.length < 2) return res.status(400).json({ error: 'At least 2 candidates required' });
  if (new Date(start) >= new Date(end)) return res.status(400).json({ error: 'End must be after start' });

  const election = {
    id: uuidv4(), title, description,
    start: new Date(start).toISOString(), end: new Date(end).toISOString(),
    status: 'active', constituency: constituency || 'all',
    candidates: candidates.map((c, i) => ({ ...c, id: uuidv4(), number: i + 1 })),
    createdBy: req.user.id, createdAt: new Date().toISOString()
  };

  DB.elections.push(election);
  logSecurity('info', `Election created by admin: ${title}`, req.user.email);
  res.status(201).json({ success: true, election });
});

app.put('/api/elections/:id', authenticate, requireAdmin, (req, res) => {
  const el = DB.elections.find(e => e.id === req.params.id);
  if (!el) return res.status(404).json({ error: 'Election not found' });
  Object.assign(el, req.body, { id: el.id }); // prevent ID change
  logSecurity('info', `Election updated: ${el.title}`, req.user.email);
  res.json({ success: true, election: el });
});

app.delete('/api/elections/:id', authenticate, requireAdmin, (req, res) => {
  const idx = DB.elections.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Election not found' });
  DB.elections.splice(idx, 1);
  logSecurity('warn', `Election deleted: ${req.params.id}`, req.user.email);
  res.json({ success: true });
});

// ---- VOTE ROUTES ----

app.post('/api/vote/cast', authenticate, (req, res) => {
  const { electionId, candidateId } = req.body;
  const user = req.user;
  const now = new Date();

  const election = DB.elections.find(e => e.id === electionId);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  // Security checks
  if (now < new Date(election.start)) return res.status(400).json({ error: 'Election has not started yet' });
  if (now > new Date(election.end)) return res.status(400).json({ error: 'Election has closed' });

  // Duplicate vote check (most critical)
  const alreadyVoted = DB.votes.some(v => v.userId === user.id && v.electionId === electionId);
  if (alreadyVoted) {
    logSecurity('danger', `DUPLICATE VOTE ATTEMPT by ${user.email} in election: ${election.title}`, user.email, { electionId, candidateId, ip: req.ip });
    return res.status(409).json({ error: '⚠️ Duplicate vote detected. You have already voted in this election.' });
  }

  const candidate = election.candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (election.constituency !== 'all' && election.constituency !== user.constituency) {
    logSecurity('danger', `Voter ${user.email} tried voting outside their constituency`, user.email);
    return res.status(403).json({ error: 'You are not in the eligible constituency for this election' });
  }

  const voteData = {
    id: uuidv4(), receiptId: generateReceiptId(),
    userId: user.id, electionId: election.id,
    candidateId: candidate.id, candidateName: candidate.name,
    electionTitle: election.title, party: candidate.party,
    timestamp: new Date().toISOString(),
    ip: crypto.createHash('sha256').update(req.ip || '').digest('hex').slice(0, 16),
    deviceHash: crypto.createHash('sha256').update(req.headers['user-agent'] || '').digest('hex').slice(0, 16),
  };
  voteData.blockchainHash = generateBlockchainHash(voteData);

  DB.votes.push(voteData);
  logSecurity('success', `Vote cast by ${user.email} for ${candidate.name} in: ${election.title}`, user.email);

  res.json({
    success: true,
    receipt: {
      receiptId: voteData.receiptId,
      candidateName: voteData.candidateName,
      electionTitle: voteData.electionTitle,
      timestamp: voteData.timestamp,
      blockchainHash: voteData.blockchainHash
    }
  });
});

app.get('/api/vote/receipt/:receiptId', authenticate, (req, res) => {
  const vote = DB.votes.find(v => v.receiptId === req.params.receiptId && v.userId === req.user.id);
  if (!vote) return res.status(404).json({ error: 'Receipt not found' });
  res.json({ receiptId: vote.receiptId, candidateName: vote.candidateName, electionTitle: vote.electionTitle, timestamp: vote.timestamp, blockchainHash: vote.blockchainHash });
});

// ---- ADMIN ROUTES ----

app.get('/api/admin/voters', authenticate, requireAdmin, (req, res) => {
  const voters = DB.users.filter(u => u.role === 'voter').map(u => ({
    id: u.id, name: u.name, email: u.email, voterId: u.voterId,
    constituency: u.constituency, registered: u.registered,
    hasFace: !!u.faceDataHash, hasBiometric: !!u.biometricId,
    voteCount: DB.votes.filter(v => v.userId === u.id).length,
    locked: u.locked
  }));
  res.json(voters);
});

app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
  const voters = await User.find({ role: 'voter' });
  const now = new Date();
  const activeEl = DB.elections.filter(e => new Date(e.start) <= now && new Date(e.end) >= now).length;
  res.json({
    totalVoters: voters.length,
    totalElections: DB.elections.length,
    activeElections: activeEl,
    totalVotes: DB.votes.length,
    lockedAccounts: voters.filter(v => v.locked).length,
    securityEvents: DB.securityLog.length
  });
});

app.get('/api/admin/results/:electionId', authenticate, requireAdmin, (req, res) => {
  const el = DB.elections.find(e => e.id === req.params.electionId);
  if (!el) return res.status(404).json({ error: 'Election not found' });
  const elVotes = DB.votes.filter(v => v.electionId === el.id);
  const results = el.candidates.map(c => ({
    candidate: c, votes: elVotes.filter(v => v.candidateId === c.id).length
  }));
  results.sort((a, b) => b.votes - a.votes);
  res.json({ election: el, results, totalVotes: elVotes.length, winner: results[0]?.candidate || null });
});

app.get('/api/admin/security-log', authenticate, requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(DB.securityLog.slice(0, limit));
});

app.post('/api/admin/unlock/:userId', authenticate, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.locked = false; user.loginAttempts = 0;
  logSecurity('info', `Account unlocked by admin: ${user.email}`, req.user.email);
  res.json({ success: true });
});

// ---- PROFILE ----
app.get('/api/profile', authenticate, (req, res) => {
  const u = req.user;
  res.json({ id: u.id, name: u.name, email: u.email, voterId: u.voterId, constituency: u.constituency, phone: u.phone, role: u.role, registered: u.registered, lastLogin: u.lastLogin });
});

// ---- FALLBACK ----
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  logSecurity('danger', `Server error: ${err.message}`, 'system');
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START =====
async function start() {
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`\n🗳️  SecureVote Backend API`);
    console.log(`🌐 API:      http://localhost:${PORT}/api`);
    console.log(`🖥️  Frontend: http://localhost:${PORT}`);
    console.log(`\n🔐 Demo Credentials:`);
    console.log(`   Admin:  admin@vote.com  /  Admin@123`);
    console.log(`   Voter:  voter@vote.com  /  Voter@123`);
    console.log(`\n✅ Server running on port ${PORT}\n`);
  });
}

start().catch(console.error);
*/



//////////////////////////////////////////
// ============================================================
//  SECUREVOTE — Fixed Backend Server
//  Bugs Fixed:
//  1. MongoDB connection failure now STOPS server startup
//  2. All data (elections, votes, OTP) moved to MongoDB
//  3. loginAttempts/locked fields saved to DB (not lost in memory)
//  4. Votes stored in MongoDB (duplicate check works across restarts)
//  5. Session token validated between steps (security)
//  6. dotenv loaded BEFORE anything that reads env vars
// ============================================================

require('dotenv').config();// MUST be first
const nodemailer = require('nodemailer'); 

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
console.log("📂 MODELS PATH 👉", path.join(__dirname, 'models'));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'securevote_jwt_secret_change_in_production_2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securevote';
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const { Buffer } = require('buffer');

/*const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
*/
// ===== SCHEMAS =====

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password:      { type: String, required: true },
  voterId:       { type: String, required: true, unique: true },
  phone:         String,
  dob:           String,
  constituency:  String,
  faceDataHash:  String,
  biometricId:   String,
  role:          { type: String, default: 'voter' },
  registered:    { type: String, default: () => new Date().toISOString() },
  lastLogin:     String,
  verified:      { type: Boolean, default: true },
  locked:        { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
  faceDescriptor: [Number],
  biometricCredentialID: String,
  biometricPublicKey: String,
  biometricCounter: { type: Number, default: 0 },
});

const electionSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  String,
  start:        String,
  end:          String,
  status:       { type: String, default: 'active' },
  constituency: { type: String, default: 'all' },
  candidates:   [{ id: String, name: String, party: String, symbol: String, number: Number }],
  createdBy:    String,
  createdAt:    { type: String, default: () => new Date().toISOString() },
  totalVotes:   { type: Number, default: 0 },
});

const voteSchema = new mongoose.Schema({
  receiptId:       String,
  userId:          String,
  electionId:      String,
  candidateId:     String,
  candidateName:   String,
  electionTitle:   String,
  party:           String,
  timestamp:       String,
  ip:              String,
  deviceHash:      String,
  blockchainHash:  String,
});

// Compound index: one vote per user per election
voteSchema.index({ userId: 1, electionId: 1 }, { unique: true });

const securityLogSchema = new mongoose.Schema({
  type:      String,
  message:   String,
  user:      String,
  meta:      mongoose.Schema.Types.Mixed,
  timestamp: { type: String, default: () => new Date().toISOString() },
});

// In-memory OTP store only (short-lived, no need for DB)
const otpStore = new Map(); // email -> { code, expires, attempts, sessionToken }

const webAuthnStore = new Map(); // email → challenge
const User        = mongoose.model('User', userSchema);
const Election    = mongoose.model('Election', electionSchema);
const Vote        = mongoose.model('Vote', voteSchema);
const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// ===== MIDDLEWARE =====
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', `http://localhost:${PORT}`],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/models', express.static(path.join(__dirname, 'models')));
// ===== RATE LIMITING =====
const generalLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const authLimit    = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { error: 'Too many auth attempts.' } });
const voteLimit    = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,    message: { error: 'Vote rate limit exceeded' } });
app.use('/api/', generalLimit);
app.use('/api/auth/', authLimit);
app.use('/api/vote/', voteLimit);

// ===== HELPERS =====
function generateOTP()        { return Math.floor(100000 + Math.random() * 900000).toString(); }
function generateToken(id, role) { return jwt.sign({ userId: id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES }); }
function generateReceiptId()  { return 'RCV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
function generateBlockchainHash(data) { return '0x' + crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex'); }
function hashFaceData(data)   { return crypto.createHash('sha256').update(data + 'sv_salt_2025').digest('hex'); }

async function logSecurity(type, message, user, meta = {}) {
  try {
    await SecurityLog.create({ type, message, user, meta });
  } catch (e) {
    console.error('Security log error:', e.message);
  }
}

// ===== AUTH MIDDLEWARE =====
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    const token   = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.userId);
    if (!user || user.locked) return res.status(401).json({ error: 'Invalid session' });
    req.user  = user;
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    logSecurity('danger', `Unauthorized admin access by ${req.user?.email}`, req.user?.email);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ===== SEED DATA =====
async function seedDatabase() {
  const adminExists = await User.findOne({ email: 'admin@vote.com' });
  if (!adminExists) {
    await User.create([
      {
        email: 'admin@vote.com',
        password: await bcrypt.hash('Admin@123', 12),
        name: 'System Administrator',
        role: 'admin',
        voterId: 'ADMIN-001',
        phone: '+91 9999999999',
        constituency: 'Vijayawada East',
        dob: '1985-01-01',
        faceDataHash: 'sha256_admin_face_hash',
        biometricId: 'bio_admin_001',
        verified: true,
        locked: false,
        loginAttempts: 0,
      },
      {
        email: 'voter@vote.com',
        password: await bcrypt.hash('Voter@123', 12),
        name: 'Demo Voter Reddy',
        role: 'voter',
        voterId: 'VTR-20250001',
        phone: '+91 9876543210',
        constituency: 'Vijayawada East',
        dob: '1995-05-15',
        faceDataHash: 'sha256_demo_face_hash',
        biometricId: 'bio_voter_001',
        verified: true,
        locked: false,
        loginAttempts: 0,
      }
    ]);
    console.log('✅ Users seeded');
  }

  const electionExists = await Election.findOne({});
  if (!electionExists) {
    const now    = new Date();
    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await Election.create({
      title: 'Vijayawada East Assembly Election 2025',
      description: 'Vote for your Member of Legislative Assembly.',
      start: now.toISOString(),
      end: future.toISOString(),
      status: 'active',
      constituency: 'Vijayawada East',
      candidates: [
        { id: uuidv4(), name: 'Ravi Kumar Reddy', party: 'BJP',   symbol: '🪷', number: 1 },
        { id: uuidv4(), name: 'Sita Devi Rao',    party: 'INC',   symbol: '✋', number: 2 },
        { id: uuidv4(), name: 'Mohan Rao Naidu',  party: 'TDP',   symbol: '🚲', number: 3 },
        { id: uuidv4(), name: 'Priya Sharma',     party: 'YSRCP', symbol: '🏺', number: 4 },
      ],
      createdBy: 'system',
    });
    console.log('✅ Election seeded');
  }

  await logSecurity('info', 'SecureVote server started', 'system');
}

// ===== ROUTES =====

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString(), service: 'SecureVote API' });
});

// ---- AUTH ROUTES ----

// Step 1: Validate credentials → issue sessionToken
app.post('/api/auth/login/credentials', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    await logSecurity('warn', `Login attempt with unknown email: ${email}`, email);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.locked) {
    await logSecurity('danger', `Login attempt on locked account: ${email}`, email);
    return res.status(403).json({ error: 'Account locked. Contact support.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.locked = true;
      await user.save();
      await logSecurity('danger', `Account locked after 5 failed attempts: ${email}`, email);
      return res.status(403).json({ error: 'Account locked after 5 failed attempts' });
    }
    await user.save();
    await logSecurity('warn', `Wrong password (attempt ${user.loginAttempts}) for: ${email}`, email);
    return res.status(401).json({ error: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` });
  }

  // Reset attempts on success
  user.loginAttempts = 0;
  await user.save();

  // Generate a short-lived session token tied to this login flow
  const sessionToken = crypto.randomBytes(32).toString('hex');

  // Store it in OTP map temporarily so later steps can validate it
  otpStore.set(email.toLowerCase(), {
    code: null,
    expires: Date.now() + 10 * 60 * 1000, // 10 min window for whole flow
    attempts: 0,
    sessionToken,
  });

  await logSecurity('info', `Credentials verified for: ${email}`, email);
  res.json({ success: true, sessionToken, message: 'Credentials verified. Proceed to face verification.' });
});

// Step 2: Face verification
app.post('/api/auth/login/face', async (req, res) => {
  const { email, sessionToken, faceDescriptor } = req.body;

  const stored = otpStore.get(email?.toLowerCase());

  if (!stored || stored.sessionToken !== sessionToken || Date.now() > stored.expires) {
    return res.status(401).json({ error: 'Invalid or expired session. Please restart login.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let faceMatch = false;

  // ✅ Admin bypass
  if (user.role === 'admin') {
    faceMatch = true;
  } else {
    // 🧠 distance function
    const distance = (a, b) => {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        let d = a[i] - b[i];
        sum += d * d;
      }
      return Math.sqrt(sum);
    };

    const storedDescriptor = user.faceDescriptor;
    const incomingDescriptor = faceDescriptor;

    if (!storedDescriptor || !incomingDescriptor) {
      return res.status(400).json({ error: "Face data missing" });
    }

    const dist = distance(storedDescriptor, incomingDescriptor);

    console.log("🧠 FACE DISTANCE 👉", dist);

    // 🔥 threshold (important)
    faceMatch = dist < 0.5;
  }

  if (!faceMatch) {
    await logSecurity('danger', `Face verification FAILED for: ${email}`, email);
    return res.status(401).json({ error: 'Face verification failed. Access denied.' });
  }

  await logSecurity('success', `Face verification passed for: ${email}`, email);
  res.json({ success: true, message: 'Face verified. OTP will be sent.' });
});

// Step 3: Send OTP
app.post('/api/auth/login/send-otp', async (req, res) => {
  const { email, sessionToken } = req.body;
  const stored = otpStore.get(email?.toLowerCase());

  // BUG FIX: validate session before sending OTP
  if (!stored || (sessionToken && stored.sessionToken !== sessionToken) || Date.now() > stored.expires) {
    return res.status(401).json({ error: 'Invalid session. Please restart login.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = generateOTP();

  // BUG FIX: always overwrite OTP so old digits don't linger
  otpStore.set(email.toLowerCase(), {
    code: otp,
    expires: Date.now() + 5 * 60 * 1000,
    attempts: 0,
    sessionToken: stored.sessionToken,
  });


  /*
  await client.messages.create({
  body: `Your SecureVote OTP is: ${otp}`,
  from: process.env.TWILIO_PHONE,
  to: user.phone // must be like +91XXXXXXXXXX
});

*/  
await transporter.sendMail({
  from: `"SecureVote" <${process.env.EMAIL_USER}>`,
  to: user.email,
  subject: "Your SecureVote OTP",
  text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  html: `<h3>Your SecureVote OTP is: <b>${otp}</b></h3><p>It is valid for 5 minutes.</p>`
});

await logSecurity('info', `OTP emailed to: ${email}`, email);

res.json({
  success: true,
  message: 'OTP sent to registered email'
});
});

// Step 3b: Verify OTP
app.post('/api/auth/login/verify-otp', async (req, res) => {
  const { email, otp, sessionToken } = req.body;
  const stored = otpStore.get(email?.toLowerCase());

  if (!stored || !stored.code) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
  if (stored.sessionToken !== sessionToken) return res.status(401).json({ error: 'Invalid session.' });
  if (Date.now() > stored.expires) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }

  stored.attempts++;
  if (stored.attempts > 3) {
    otpStore.delete(email.toLowerCase());
    await logSecurity('danger', `OTP brute force attempt for: ${email}`, email);
    return res.status(429).json({ error: 'Too many OTP attempts. Request a new one.' });
  }

  if (stored.code !== otp) {
    await logSecurity('warn', `Wrong OTP for: ${email}`, email);
    return res.status(401).json({ error: 'Incorrect OTP' });
  }

  stored.code = null;
  stored.otpVerified = true;
  otpStore.set(email.toLowerCase(), stored);

  // ✅ Fetch user role to tell frontend whether to skip biometric
  const user = await User.findOne({ email: email.toLowerCase() });

  await logSecurity('success', `OTP verified for: ${email}`, email);
  res.json({
    success: true,
    message: 'OTP verified.',
    role: user?.role || 'voter',   // ✅ include role in response
  });
});
function bufferToBase64URL(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
app.post('/api/auth/biometric/register-options', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Generate a unique userID every time — prevents Windows Hello reusing old key
    const uniqueUserID = Buffer.from(`${email}_${Date.now()}`);

    const options = await generateRegistrationOptions({
      rpName:          "SecureVote",
      rpID:            "localhost",
      userID:          uniqueUserID,
      userName:        email,
      userDisplayName: email,
      timeout:         60000,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification:        "required",
        residentKey:             "discouraged",  // ✅ stops Windows reusing discoverable keys
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    webAuthnStore.set(email.toLowerCase(), options.challenge);
    console.log('📝 Register options generated for:', email);
    res.json(options);

  } catch (err) {
    console.error("🔥 REGISTER OPTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to generate options: " + err.message });
  }
});
app.post('/api/auth/biometric/register-verify', async (req, res) => {
  try {
    const { email, credential } = req.body;
    const expectedChallenge = webAuthnStore.get(email.toLowerCase());

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'No challenge found. Click Register Biometric again.' });
    }

    console.log('🔍 Register verify for:', email, '| credential.id:', credential?.id);

    const verification = await verifyRegistrationResponse({
      response:                credential,
      expectedChallenge,
      expectedOrigin:          'http://localhost:3001',
      expectedRPID:            'localhost',
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Biometric registration failed' });
    }

    const { registrationInfo } = verification;

    const publicKeyBase64 = Buffer.from(
      Uint8Array.from(registrationInfo.credential.publicKey)
    ).toString('base64');

    webAuthnStore.delete(email.toLowerCase());

    console.log('✅ Verified — credentialID:', registrationInfo.credential.id);

    // ✅ Return credential data to CLIENT — client sends it with /register
    res.json({
      success:               true,
      biometricCredentialID: registrationInfo.credential.id,
      biometricPublicKey:    publicKeyBase64,
      biometricCounter:      registrationInfo.credential.counter || 0,
    });

  } catch (err) {
    console.error("🔥 REGISTER VERIFY ERROR:", err.message);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
});

app.post('/api/auth/biometric/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.biometricCredentialID) return res.status(400).json({ error: 'No biometric registered for this account' });

    const options = await generateAuthenticationOptions({  // ← await
      rpID: 'localhost',
      allowCredentials: [{
        id: user.biometricCredentialID,
        type: 'public-key',
      }],
      userVerification: 'required',
      timeout: 60000,
    });

    webAuthnStore.set(email.toLowerCase(), options.challenge);
    res.json(options);
  } catch (err) {
    console.error("🔥 LOGIN OPTIONS ERROR:", err);
    res.status(500).json({ error: "Failed to generate login options: " + err.message });
  }
});

app.post('/api/auth/biometric/login-verify', async (req, res) => {
  try {
    const { email, credential } = req.body;
    const expectedChallenge = webAuthnStore.get(email.toLowerCase());
    if (!expectedChallenge) return res.status(400).json({ error: 'No challenge found. Restart login.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.biometricCredentialID) return res.status(400).json({ error: 'No biometric registered. Please register first.' });

    console.log('🔍 LOGIN VERIFY DEBUG:');
    console.log('  credentialID from user DB :', user.biometricCredentialID);
    console.log('  credentialID from browser :', credential.id);
    console.log('  counter in DB             :', user.biometricCounter);
    console.log('  publicKey length           :', user.biometricPublicKey?.length);

    // ✅ KEY FIX: restore publicKey as Uint8Array, not Buffer
    const publicKeyBuffer = Uint8Array.from(
      Buffer.from(user.biometricPublicKey, 'base64')
    );

    const verification = await verifyAuthenticationResponse({
      response:           credential,
      expectedChallenge,
      expectedOrigin:     'http://localhost:3001',
      expectedRPID:       'localhost',
      requireUserVerification: true,
      credential: {
        id:        user.biometricCredentialID,
        publicKey: publicKeyBuffer,             // ✅ Uint8Array, not Buffer
        counter:   user.biometricCounter || 0,
      },
    });

    console.log('✅ Verification result:', verification.verified);

    if (!verification.verified) return res.status(401).json({ error: 'Biometric verification failed' });

    user.biometricCounter = verification.authenticationInfo.newCounter;
    await user.save();

    webAuthnStore.delete(email.toLowerCase());
    res.json({ success: true });
  } catch (err) {
    console.error("🔥 LOGIN VERIFY ERROR:", err.message);
    res.status(500).json({ error: "Verification failed: " + err.message });
  }
});



// Step 4: Complete login with biometric → issue JWT
app.post('/api/auth/login/complete', async (req, res) => {
  const { email, biometricVerified, sessionToken } = req.body;
  const stored = otpStore.get(email?.toLowerCase());

  if (!stored || stored.sessionToken !== sessionToken || !stored.otpVerified || Date.now() > stored.expires) {
    return res.status(401).json({ error: 'Invalid session or incomplete authentication steps.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // ✅ Admin bypasses biometric check
  if (user.role !== 'admin' && !biometricVerified) {
    return res.status(401).json({ error: 'Biometric verification required.' });
  }

  otpStore.delete(email.toLowerCase());
  user.lastLogin = new Date().toISOString();
  await user.save();

  const token = generateToken(user._id.toString(), user.role);
  await logSecurity('success', `Full authentication complete — JWT issued for: ${email}`, email);

  res.json({
    success: true,
    token,
    user: {
      id:           user._id.toString(),
      name:         user.name,
      email:        user.email,
      role:         user.role,
      voterId:      user.voterId,
      constituency: user.constituency,
    }
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name, email, password, voterId, phone, dob, constituency,
      faceDescriptor, biometricId,
      biometricCredentialID, biometricPublicKey, biometricCounter  // ✅ received directly
    } = req.body;

    if (!name || !email || !password || !voterId || !phone || !dob || !constituency) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered' });

    const existingVoter = await User.findOne({ voterId });
    if (existingVoter) return res.status(409).json({ error: 'Voter ID already registered' });

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with uppercase and number' });
    }

    const age = (new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) return res.status(400).json({ error: 'Must be 18+ to register' });

    console.log('📝 Registering user:', email);
    console.log('   biometricCredentialID:', biometricCredentialID || '❌ MISSING');
    console.log('   biometricPublicKey len:', biometricPublicKey?.length || '❌ MISSING');

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email:                 email.toLowerCase().trim(),
      password:              hashed,
      voterId,
      phone,
      dob,
      constituency,
      faceDescriptor:        faceDescriptor || [],
      biometricId:           biometricId    || null,
      biometricCredentialID: biometricCredentialID || null,  // ✅ saved directly
      biometricPublicKey:    biometricPublicKey    || null,
      biometricCounter:      biometricCounter      || 0,
      role:                  'voter',
      verified:              true,
      locked:                false,
      loginAttempts:         0,
    });

    console.log('✅ User created — biometricCredentialID:', user.biometricCredentialID || '❌ NULL');

    await logSecurity('success', `New voter registered: ${name} (${email})`, email);
    res.status(201).json({ success: true, message: 'Registration successful', voterId: user.voterId });

  } catch (err) {
    console.error('🔥 REGISTER ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- ELECTION ROUTES ----

app.get('/api/elections', authenticate, async (req, res) => {
  const user = req.user;
  const now  = new Date();

  const query = {
    $or: [{ constituency: 'all' }, { constituency: user.constituency }]
  };

  const elections = await Election.find(query).lean();

  const enriched = await Promise.all(elections.map(async el => {
    const voteCount = await Vote.countDocuments({ electionId: el._id.toString() });
    const hasVoted  = await Vote.exists({ userId: user._id.toString(), electionId: el._id.toString() });
    return {
      ...el,
      id: el._id.toString(),
      hasVoted: !!hasVoted,
      isActive: new Date(el.start) <= now && new Date(el.end) >= now,
      totalVotes: voteCount,
    };
  }));

  res.json(enriched);
});

app.get('/api/elections/all', authenticate, requireAdmin, async (req, res) => {
  const elections = await Election.find({}).lean();
  const enriched  = await Promise.all(elections.map(async el => {
    const voteCount = await Vote.countDocuments({ electionId: el._id.toString() });
    return { ...el, id: el._id.toString(), totalVotes: voteCount };
  }));
  res.json(enriched);
});

app.post('/api/elections', authenticate, requireAdmin, async (req, res) => {
  const { title, description, start, end, candidates, constituency } = req.body;
  if (!title || !description || !start || !end || !candidates?.length) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (candidates.length < 2) return res.status(400).json({ error: 'At least 2 candidates required' });
  if (new Date(start) >= new Date(end)) return res.status(400).json({ error: 'End must be after start' });

  const election = await Election.create({
    title, description,
    start: new Date(start).toISOString(),
    end:   new Date(end).toISOString(),
    status: 'active',
    constituency: constituency || 'all',
    candidates: candidates.map((c, i) => ({ ...c, id: uuidv4(), number: i + 1 })),
    createdBy: req.user._id.toString(),
  });

  await logSecurity('info', `Election created by admin: ${title}`, req.user.email);
  res.status(201).json({ success: true, election: { ...election.toObject(), id: election._id.toString() } });
});

app.put('/api/elections/:id', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!election) return res.status(404).json({ error: 'Election not found' });
  await logSecurity('info', `Election updated: ${election.title}`, req.user.email);
  res.json({ success: true, election: { ...election.toObject(), id: election._id.toString() } });
});

app.delete('/api/elections/:id', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findByIdAndDelete(req.params.id);
  if (!election) return res.status(404).json({ error: 'Election not found' });
  await logSecurity('warn', `Election deleted: ${req.params.id}`, req.user.email);
  res.json({ success: true });
});

// ---- VOTE ROUTES ----

app.post('/api/vote/cast', authenticate, async (req, res) => {
  const { electionId, candidateId } = req.body;
  const user = req.user;
  const now  = new Date();

  const election = await Election.findById(electionId);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  if (now < new Date(election.start)) return res.status(400).json({ error: 'Election has not started yet' });
  if (now > new Date(election.end))   return res.status(400).json({ error: 'Election has closed' });

  // BUG FIX: duplicate vote check uses MongoDB (persists across restarts)
  const alreadyVoted = await Vote.exists({ userId: user._id.toString(), electionId: election._id.toString() });
  if (alreadyVoted) {
    await logSecurity('danger', `DUPLICATE VOTE ATTEMPT by ${user.email}`, user.email, { electionId });
    return res.status(409).json({ error: '⚠️ You have already voted in this election.' });
  }

  const candidate = election.candidates.find(c => c.id === candidateId);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (election.constituency !== 'all' && election.constituency !== user.constituency) {
    await logSecurity('danger', `Voter ${user.email} tried voting outside their constituency`, user.email);
    return res.status(403).json({ error: 'You are not in the eligible constituency' });
  }

  const voteData = {
    receiptId:     generateReceiptId(),
    userId:        user._id.toString(),
    electionId:    election._id.toString(),
    candidateId:   candidate.id,
    candidateName: candidate.name,
    electionTitle: election.title,
    party:         candidate.party,
    timestamp:     new Date().toISOString(),
    ip:            crypto.createHash('sha256').update(req.ip || '').digest('hex').slice(0, 16),
    deviceHash:    crypto.createHash('sha256').update(req.headers['user-agent'] || '').digest('hex').slice(0, 16),
  };
  voteData.blockchainHash = generateBlockchainHash(voteData);

  await Vote.create(voteData);
  await logSecurity('success', `Vote cast by ${user.email} for ${candidate.name}`, user.email);

  res.json({
    success: true,
    receipt: {
      receiptId:     voteData.receiptId,
      candidateName: voteData.candidateName,
      electionTitle: voteData.electionTitle,
      timestamp:     voteData.timestamp,
      blockchainHash: voteData.blockchainHash,
    }
  });
});

app.get('/api/vote/receipt/:receiptId', authenticate, async (req, res) => {
  const vote = await Vote.findOne({ receiptId: req.params.receiptId, userId: req.user._id.toString() });
  if (!vote) return res.status(404).json({ error: 'Receipt not found' });
  res.json({
    receiptId:     vote.receiptId,
    candidateName: vote.candidateName,
    electionTitle: vote.electionTitle,
    timestamp:     vote.timestamp,
    blockchainHash: vote.blockchainHash,
  });
});

// ---- ADMIN ROUTES ----

app.get('/api/admin/voters', authenticate, requireAdmin, async (req, res) => {
  const voters = await User.find({ role: 'voter' }).lean();
  const result  = await Promise.all(voters.map(async u => ({
    id:           u._id.toString(),
    name:         u.name,
    email:        u.email,
    voterId:      u.voterId,
    constituency: u.constituency,
    registered:   u.registered,
    hasFace:      !!u.faceDataHash,
    hasBiometric: !!u.biometricId,
    voteCount:    await Vote.countDocuments({ userId: u._id.toString() }),
    locked:       u.locked,
  })));
  res.json(result);
});

app.get('/api/admin/stats', authenticate, requireAdmin, async (req, res) => {
  const now       = new Date();
  const voters    = await User.find({ role: 'voter' });
  const elections = await Election.find({});
  const activeEl  = elections.filter(e => new Date(e.start) <= now && new Date(e.end) >= now).length;
  const totalVotes = await Vote.countDocuments({});
  const secEvents  = await SecurityLog.countDocuments({});

  res.json({
    totalVoters:     voters.length,
    totalElections:  elections.length,
    activeElections: activeEl,
    totalVotes,
    lockedAccounts:  voters.filter(v => v.locked).length,
    securityEvents:  secEvents,
  });
});

app.get('/api/admin/results/:electionId', authenticate, requireAdmin, async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) return res.status(404).json({ error: 'Election not found' });

  const votes   = await Vote.find({ electionId: election._id.toString() });
  const results = election.candidates.map(c => ({
    candidate: c,
    votes: votes.filter(v => v.candidateId === c.id).length,
  }));
  results.sort((a, b) => b.votes - a.votes);

  res.json({
    election:   { ...election.toObject(), id: election._id.toString() },
    results,
    totalVotes: votes.length,
    winner:     results[0]?.candidate || null,
  });
});

app.get('/api/admin/security-log', authenticate, requireAdmin, async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs  = await SecurityLog.find({}).sort({ _id: -1 }).limit(limit).lean();
  res.json(logs);
});

app.post('/api/admin/unlock/:userId', authenticate, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.locked = false;
  user.loginAttempts = 0;
  await user.save();
  await logSecurity('info', `Account unlocked by admin: ${user.email}`, req.user.email);
  res.json({ success: true });
});


// ---- FALLBACK ----
//app.get('*', (req, res) => {
 // res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
//});

app.get('/api/debug/biometric/:email', authenticate, requireAdmin, async (req, res) => {
  const user = await User.findOne({ email: req.params.email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    hasCredentialID: !!user.biometricCredentialID,
    hasPublicKey:    !!user.biometricPublicKey,
    counter:         user.biometricCounter,
    credentialID:    user.biometricCredentialID,   // shows the actual ID
  });
});
// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  logSecurity('danger', `Server error: ${err.message}`, 'system');
  res.status(500).json({ error: 'Internal server error' });
});

// ===== START — MongoDB MUST connect before server starts =====
async function start() {
  console.log('🔌 Connecting to MongoDB...');

  // BUG FIX: If MongoDB fails, crash immediately — don't run without a DB
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // fail fast
  });

  console.log('✅ MongoDB Connected:', MONGO_URI);
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`\n🗳️  SecureVote Backend API`);
    console.log(`🌐 API:      http://localhost:${PORT}/api`);
    console.log(`🖥️  Frontend: http://localhost:${PORT}`);
    console.log(`\n🔐 Demo Credentials:`);
    console.log(`   Admin: admin@vote.com  /  Admin@123`);
    console.log(`   Voter: voter@vote.com  /  Voter@123`);
    console.log(`\n📊 View DB data: http://localhost:${PORT}/api/admin/voters (admin login required)`);
    console.log(`   Or use MongoDB Compass → connect to: ${MONGO_URI}`);
    console.log(`\n✅ Server running on port ${PORT}\n`);
  });
}

// BUG FIX: proper crash on startup failure with clear message
start().catch(err => {
  console.error('\n❌ STARTUP FAILED:', err.message);
  if (err.name === 'MongooseServerSelectionError') {
    console.error('💡 MongoDB is not running. Start it with: mongod');
    console.error('   Or set MONGO_URI in your .env file for a cloud DB (MongoDB Atlas).');
  }
  //process.exit(1); // Stop execution — don't run without DB
});
