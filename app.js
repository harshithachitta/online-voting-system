// ============================================================
//  SECUREVOTE — Complete Frontend Application
//  Full simulation of: Face Recognition, Biometric Auth,
//  2-Step OTP, Duplicate Vote Prevention, Admin Dashboard
// ============================================================
/*
'use strict';

// ===== STATE =====
const APP = {
  currentUser: null,
  pendingLogin: null,  // { email, password } during multi-step
  regData: {},
  otpCode: null,
  otpInterval: null,
  selectedElectionId: null,
  selectedCandidateId: null,
  cameraStream: null,
  biometricCredential: null,
  regStep: 1,
  loginStep: 1,
};

// ===== LOCAL STORAGE DB =====
// const DB = {
//   get(key) { try { return JSON.parse(localStorage.getItem('sv_' + key)) || null; } catch { return null; } },
//   set(key, val) { localStorage.setItem('sv_' + key, JSON.stringify(val)); },
//   getUsers() { return this.get('users') || this._seedUsers(); },
//   getElections() { return this.get('elections') || this._seedElections(); },
//   getVotes() { return this.get('votes') || []; },
//   getSecurityLog() { return this.get('seclog') || []; },

//   _seedUsers() {
//     const users = [
//       {
//         id: 'u001', email: 'admin@vote.com', password: hashPassword('Admin@123'),
//         name: 'Admin User', role: 'admin', voterId: 'ADMIN-001',
//         phone: '+91 9999999999', constituency: 'Vijayawada East',
//         dob: '1985-01-01', faceData: null, biometricId: 'bio_admin',
//         registered: new Date().toISOString(), verified: true
//       },
//       {
//         id: 'u002', email: 'voter@vote.com', password: hashPassword('Voter@123'),
//         name: 'Demo Voter', role: 'voter', voterId: 'VTR-20250001',
//         phone: '+91 9876543210', constituency: 'Vijayawada East',
//         dob: '1995-05-15', faceData: 'demo_face_data', biometricId: 'bio_voter',
//         registered: new Date().toISOString(), verified: true
//       }
//     ];
//     this.set('users', users);
//     return users;
//   },

//   _seedElections() {
//     const now = new Date();
//     const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
//     const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
//     const elections = [
//       {
//         id: 'el001', title: 'Vijayawada East Assembly Election 2025',
//         description: 'Vote for your Member of Legislative Assembly for Vijayawada East constituency.',
//         start: now.toISOString(), end: future.toISOString(),
//         status: 'active', constituency: 'Vijayawada East',
//         candidates: [
//           { id: 'c1', name: 'Ravi Kumar Reddy', party: 'Bharatiya Janata Party', symbol: '🪷', number: 1 },
//           { id: 'c2', name: 'Sita Devi Rao', party: 'Indian National Congress', symbol: '✋', number: 2 },
//           { id: 'c3', name: 'Mohan Rao Naidu', party: 'Telugu Desam Party', symbol: '🚲', number: 3 },
//           { id: 'c4', name: 'Priya Sharma', party: 'Yuvajana Sramika Rythu Congress', symbol: '🏺', number: 4 },
//         ],
//         createdBy: 'u001'
//       },
//       {
//         id: 'el002', title: 'Vijayawada Municipal Corporation Mayor Election',
//         description: 'Vote for the Mayor of Vijayawada Municipal Corporation.',
//         start: future.toISOString(), end: new Date(future.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
//         status: 'upcoming', constituency: 'all',
//         candidates: [
//           { id: 'c5', name: 'Dr. Anil Kumar', party: 'BJP Alliance', symbol: '⭐', number: 1 },
//           { id: 'c6', name: 'Mrs. Lakshmi Prasad', party: 'Congress Alliance', symbol: '🌟', number: 2 },
//           { id: 'c7', name: 'Mr. Suresh Babu', party: 'Independent', symbol: '🔆', number: 3 },
//         ],
//         createdBy: 'u001'
//       }
//     ];
//     this.set('elections', elections);
//     return elections;
//   },

//   addUser(user) {
//     const users = this.getUsers();
//     users.push(user);
//     this.set('users', users);
//   },

//   findUser(email) {
//     return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
//   },

//   updateUser(id, updates) {
//     const users = this.getUsers();
//     const idx = users.findIndex(u => u.id === id);
//     if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; this.set('users', users); }
//   },

//   addVote(vote) {
//     const votes = this.getVotes();
//     votes.push(vote);
//     this.set('votes', votes);
//   },

//   hasVoted(userId, electionId) {
//     return this.getVotes().some(v => v.userId === userId && v.electionId === electionId);
//   },

//   addSecurityLog(entry) {
//     const log = this.getSecurityLog();
//     log.unshift({ ...entry, id: genId(), timestamp: new Date().toISOString() });
//     this.set('seclog', log.slice(0, 200)); // keep last 200
//   },

//   addElection(election) {
//     const elections = this.getElections();
//     elections.push(election);
//     this.set('elections', elections);
//   },

//   updateElection(id, updates) {
//     const elections = this.getElections();
//     const idx = elections.findIndex(e => e.id === id);
//     if (idx !== -1) { elections[idx] = { ...elections[idx], ...updates }; this.set('elections', elections); }
//   }
// };

// ===== UTILITIES =====
function hashPassword(p) {
  // Simple deterministic hash simulation (in real app: bcrypt on server)
  let hash = 0;
  for (let i = 0; i < p.length; i++) { hash = ((hash << 5) - hash) + p.charCodeAt(i); hash |= 0; }
  return 'h_' + Math.abs(hash).toString(36) + '_' + p.length;
}

function genId() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function genReceiptId() { return 'RCV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }

function genBlockchainHash() {
  const chars = '0123456789abcdef';
  return '0x' + Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join('');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function showToast(msg, type = 'info', duration = 4000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const isLoggedIn = !!APP.currentUser;
  const navbar = document.getElementById('navbar');
  if (id === 'screenWelcome' || id === 'screenLogin' || id === 'screenRegister') {
    navbar.classList.add('hidden');
  } else {
    navbar.classList.remove('hidden');
    document.getElementById('navUserInfo').textContent =
      `${APP.currentUser?.name} (${APP.currentUser?.role})`;
    document.getElementById('navLogout').classList.remove('hidden');
  }
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}

function logout() {
  if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); APP.cameraStream = null; }
  APP.currentUser = null;
  APP.pendingLogin = null;
  APP.otpCode = null;
  clearInterval(APP.otpInterval);
  showScreen('screenWelcome');
  showToast('Logged out successfully', 'info');
}

// ===== REGISTRATION =====
function regNextStep() {
  const name = document.getElementById('regName').value.trim();
  const voterId = document.getElementById('regVoterId').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const dob = document.getElementById('regDob').value;
  const constituency = document.getElementById('regConstituency').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;

  if (!name || !voterId || !email || !phone || !dob || !constituency || !password) {
    return showToast('Please fill in all fields', 'error');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Invalid email address', 'error');
  if (password.length < 8) return showToast('Password must be at least 8 characters', 'error');
  if (!/[A-Z]/.test(password)) return showToast('Password must contain at least one uppercase letter', 'error');
  if (!/[0-9]/.test(password)) return showToast('Password must contain at least one number', 'error');
  if (password !== confirm) return showToast('Passwords do not match', 'error');
  // if (DB.findUser(email)) return showToast('Email already registered. Please login.', 'error');

  // Check voter ID uniqueness
  // if (DB.getUsers().some(u => u.voterId === voterId)) return showToast('Voter ID already registered', 'error');

  // Age check
  const birthDate = new Date(dob);
  const age = (new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) return showToast('You must be at least 18 years old to register', 'error');

  APP.regData = { name, voterId, email, phone, dob, constituency, password };
  goRegStep(2);
}

function goRegStep(n) {
  document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
  const stepMap = { 1: 'regStep1', 2: 'regStep2', 3: 'regStep3', 4: 'regSuccess' };
  document.getElementById(stepMap[n]).classList.add('active');
  APP.regStep = n;
  if (n === 2) startRegCamera();
}

let regCameraStarted = false;
async function startRegCamera() {
  try {
    if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
    APP.cameraStream = stream;
    const video = document.getElementById('regVideo');
    video.srcObject = stream;
    document.getElementById('captureRegBtn').disabled = false;
    document.getElementById('regFaceStatus').textContent = '✅ Camera active — position your face in the oval';
    regCameraStarted = true;
  } catch (e) {
    // Camera not available — simulate for demo
    document.getElementById('regFaceStatus').textContent = '⚠️ Camera unavailable — using demo simulation';
    document.getElementById('captureRegBtn').disabled = false;
    regCameraStarted = false;
    showToast('Camera not available — running in demo/simulation mode', 'warn', 5000);
  }
}

function captureRegFace() {
  const canvas = document.getElementById('regCanvas');
  const video = document.getElementById('regVideo');

  let faceData;
  if (regCameraStarted && video.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    faceData = canvas.toDataURL('image/jpeg', 0.5);
  } else {
    faceData = 'simulated_face_' + Date.now();
  }

  APP.regData.faceData = faceData;
  document.getElementById('regFaceStatus').textContent = '✅ Face captured!';

  // Show preview
  const preview = document.getElementById('regFacePreview');
  const img = document.getElementById('regFaceImg');
  if (faceData.startsWith('data:')) img.src = faceData;
  else img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%2300e5ff" opacity="0.3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40">👤</text></svg>';
  preview.classList.remove('hidden');

  // Stop camera
  if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); APP.cameraStream = null; }
  showToast('Face captured successfully!', 'success');

  // DB.addSecurityLog({ type: 'info', message: `Face registration captured for ${APP.regData.email}`, user: APP.regData.email });
}

function regNextStep2() {
  if (!APP.regData.faceData) return showToast('Please capture your face first', 'error');
  goRegStep(3);
}

async function registerBiometric() {
  const btn = document.getElementById('biometricBtn');
  const status = document.getElementById('biometricStatus');
  const icon = document.getElementById('fingerprintAnim');
  btn.disabled = true;
  icon.textContent = '⏳';
  document.getElementById('biometricMsg').textContent = 'Registering biometric...';

  try {
    if (window.PublicKeyCredential) {
      // Real WebAuthn
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(APP.regData.email);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'SecureVote', id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname },
          user: { id: userId, name: APP.regData.email, displayName: APP.regData.name },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
          timeout: 60000
        }
      });
      APP.regData.biometricId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    } else {
      throw new Error('WebAuthn not supported');
    }
  } catch (e) {
    // Simulate biometric for demo
    APP.regData.biometricId = 'bio_' + Date.now().toString(36);
    showToast('Biometric simulated (device not supported — demo mode)', 'warn', 5000);
  }

  await delay(1500);
  icon.textContent = '✅';
  document.getElementById('biometricMsg').textContent = 'Biometric registered!';
  status.textContent = '✅ Biometric registered successfully';
  status.className = 'biometric-status success';
  btn.textContent = '✓ Registered';
  // DB.addSecurityLog({ type: 'success', message: `Biometric registered for ${APP.regData.email}`, user: APP.regData.email });
}

async function completeRegistration() {
  if (!APP.regData.biometricId) {
    return showToast('Please complete biometric registration', 'error');
  }

  const newUser = {
    name: APP.regData.name,
    email: APP.regData.email,
    password: APP.regData.password,
    voterId: APP.regData.voterId,
    phone: APP.regData.phone,
    dob: APP.regData.dob,
    constituency: APP.regData.constituency,
    faceData: APP.regData.faceData,
    biometricId: APP.regData.biometricId
  };

  const res = await fetch("http://localhost:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser)
  });

  const data = await res.json();

  if (!res.ok) {
    return showToast(data.error || "Registration failed", "error");
  }

  goRegStep(4);
showToast('Registration complete! Welcome to SecureVote.', 'success');

// 🔥 ADD THESE 3 LINES
APP.regData = {};
setTimeout(() => {
  goRegStep(1);
  clearRegisterForm();
}, 1000);
goRegStep(1);
APP.regData = {};

setTimeout(() => {
  goRegStep(1);
  clearRegisterForm();

  // 🔥 reset OTP + biometric
  document.getElementById('otpInput').value = '';
  document.getElementById('otpStatus').textContent = '';
  document.getElementById('biometricStatus').textContent = '';
}, 1000);

}
function clearRegisterForm() {
  document.querySelectorAll("#screenRegister input").forEach(i => i.value = "");
}
// ===== LOGIN =====
async function loginStep1() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showToast('Please enter email and password', 'error');

  const res = await fetch("http://localhost:3001/api/auth/login/credentials", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});

const data = await res.json();
  if (!res.ok) {
  return showToast(data.error || "Login failed", "error");
}

// store login session
APP.pendingLogin = {
  email,
  sessionToken: data.sessionToken
};

showToast("Credentials verified ✓", "success");
goLoginStep(2);
setTimeout(() => startLoginCamera(), 400);
}

function goLoginStep(n) {
  document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
  const map = { 1: 'loginStep1', 2: 'loginStep2', 3: 'loginStep3', 4: 'loginStep4' };
  document.getElementById(map[n]).classList.add('active');
  APP.loginStep = n;
}

let loginCameraStarted = false;
async function startLoginCamera() {
  try {
    if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
    APP.cameraStream = stream;
    const video = document.getElementById('loginVideo');
    video.srcObject = stream;
    document.getElementById('verifyFaceBtn').disabled = false;
    document.getElementById('loginFaceStatus').textContent = '✅ Camera active — position your face in the oval';
    loginCameraStarted = true;
  } catch (e) {
    loginCameraStarted = false;
    document.getElementById('loginFaceStatus').textContent = '⚠️ Camera unavailable — demo mode active';
    document.getElementById('verifyFaceBtn').disabled = false;
    showToast('Camera unavailable — running face verification in demo mode', 'warn', 5000);
  }
}

async function verifyLoginFace() {
  const btn = document.getElementById('verifyFaceBtn');
  btn.textContent = '🔍 Analyzing...';
  btn.disabled = true;

  const canvas = document.getElementById('loginCanvas');
  const video = document.getElementById('loginVideo');

  if (loginCameraStarted && video.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
  }

  if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); APP.cameraStream = null; }

  // Simulate face matching (in real app: send to face recognition API)
  await delay(2000);
  const faceData = canvas.toDataURL();

const buffer = await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(faceData)
);

const hashArray = Array.from(new Uint8Array(buffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

const res = await fetch("http://localhost:3001/api/auth/login/face", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: APP.pendingLogin.email,
    sessionToken: APP.pendingLogin.sessionToken,
    faceDataHash: hashHex
  })
  // const res = await fetch("http://localhost:3001/api/auth/login/face", {
  // method: "POST",
  // headers: { "Content-Type": "application/json" },
  // body: JSON.stringify({
  //   email: APP.pendingLogin.email,
  //   sessionToken: APP.pendingLogin.sessionToken,
  //   faceDataHash: "demo_hash"
  // })
});

const data = await res.json();

if (!res.ok) {
  document.getElementById('loginFaceStatus').textContent = '❌ Face verification failed!';
  showToast(data.error || "Face verification failed", "error");
  btn.disabled = false;
  btn.textContent = '🔍 Verify Face';
  return;
}
document.getElementById('loginFaceStatus').textContent = '✅ Face verified successfully!';
showToast('Face verified ✓ — OTP verification next', 'success');
await delay(800);
sendOTP();
goLoginStep(3);
  // const user = APP.pendingLogin?.user;
  // if (!user) return showToast('Session expired, please restart', 'error');

  // // For demo voters without registered face, allow pass-through
  // const faceMatch = user.faceData !== null; // simulate: any registered user passes

  // if (faceMatch) {
  //   document.getElementById('loginFaceStatus').textContent = '✅ Face verified successfully!';
  //   // DB.addSecurityLog({ type: 'success', message: `Face verification passed for: ${user.email}`, user: user.email });
  //   showToast('Face verified ✓ — OTP verification next', 'success');
  //   await delay(800);
  //   sendOTP();
  //   goLoginStep(3);
  // } else {
  //   document.getElementById('loginFaceStatus').textContent = '❌ Face verification failed!';
  //   // DB.addSecurityLog({ type: 'danger', message: `Face verification FAILED for: ${user.email}`, user: user.email });
  //   showToast('Face verification failed. Please try again.', 'error');
  //   btn.disabled = false;
  //   btn.textContent = '🔍 Verify Face';
  // }
}

async function sendOTP() {
  const res = await fetch("http://localhost:3001/api/auth/login/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: APP.pendingLogin.email
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return showToast(data.error || "OTP failed", "error");
  }

  showToast("OTP sent ✓", "success");

  if (data.devOtp) {
    document.getElementById('otpDemo').textContent = "OTP: " + data.devOtp;
  }
}

function startOTPTimer(seconds) {
  clearInterval(APP.otpInterval);
  let remaining = seconds;
  const el = document.getElementById('otpCountdown');
  APP.otpInterval = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    if (remaining <= 0) { clearInterval(APP.otpInterval); el.textContent = 'EXPIRED'; APP.otpCode = null; }
  }, 1000);
}

function resendOTP() {
  clearInterval(APP.otpInterval);
  sendOTP();
  showToast('New OTP sent!', 'info');
}

function otpNext(idx) {
  const input = document.getElementById(`otp${idx}`);
  const val = input.value.replace(/\D/g, '');
  input.value = val;
  if (val && idx < 5) document.getElementById(`otp${idx + 1}`).focus();
}

async function verifyOTP() {
  const code = [0,1,2,3,4,5].map(i => document.getElementById(`otp${i}`).value).join('');

  const res = await fetch("http://localhost:3001/api/auth/login/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: APP.pendingLogin.email,
      otp: code
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return showToast(data.error || "OTP failed", "error");
  }

  showToast("OTP verified ✓", "success");
  goLoginStep(4);
}

async function verifyBiometric() {
  const btn = document.getElementById('loginBiometricBtn');
  const status = document.getElementById('loginBiometricStatus');
  const icon = document.getElementById('loginFingerprintAnim');
  btn.disabled = true;
  icon.textContent = '⏳';
  document.getElementById('loginBiometricMsg').textContent = 'Verifying biometric...';

  try {
    if (window.PublicKeyCredential && APP.pendingLogin?.user?.biometricId?.length > 10) {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: { challenge, timeout: 60000, userVerification: 'required' }
      });
    } else {
      throw new Error('simulate');
    }
  } catch (e) {
    // Demo: simulate biometric success
    await delay(2000);
  }

  icon.textContent = '✅';
  status.textContent = '✅ Biometric verified successfully';
  status.className = 'biometric-status success';
  document.getElementById('loginBiometricMsg').textContent = 'Authentication complete!';
  // DB.addSecurityLog({ type: 'success', message: `Full authentication complete for: ${APP.pendingLogin?.user?.email}`, user: APP.pendingLogin?.user?.email });

  await delay(1000);
  finalizeLogin();
}

async function finalizeLogin() {
  const res = await fetch("http://localhost:3001/api/auth/login/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: APP.pendingLogin.email,
      biometricVerified: true
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return showToast(data.error || "Login failed", "error");
  }

APP.currentUser = data.user;
APP.token = data.token;

// 🔥 ADD THIS
APP.pendingLogin = {};

showToast("Login successful 🔥", "success");

// 🔥 ADD THIS
setTimeout(() => {
  goLoginStep(1);
}, 500);

if (APP.currentUser.role === "admin") {
  showScreen('screenAdmin');
} else {
  showScreen('screenVoter');
  initVoterDashboard();
}
}

// ===== VOTER DASHBOARD =====
function initVoterDashboard() {
  const u = APP.currentUser;
  document.getElementById('voterName').textContent = u.name;
  document.getElementById('voterIdDisplay').textContent = u.voterId;
  document.getElementById('voterConstDisplay').textContent = u.constituency;
  renderElections();
}

async function renderElections() {
  const u = APP.currentUser;

  const res = await fetch("http://localhost:3001/api/elections", {
    headers: {
      Authorization: "Bearer " + APP.token
    }
  });

  if (!res.ok) {
    return showToast("Failed to load elections", "error");
  }

  const elections = await res.json();
  console.log("ELECTIONS FROM BACKEND 👉", elections);

  const container = document.getElementById('electionsList');
  const now = new Date();

  let relevant = elections;

  if (relevant.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>🗳️ No Elections Available</p><small>No elections for your constituency.</small></div>`;
    return;
  }

  container.innerHTML = relevant.map(el => {
    const start = new Date(el.start), end = new Date(el.end);

    let statusText, statusClass;
    if (now < start) { statusText = '🕐 Upcoming'; statusClass = 'upcoming'; }
    else if (now > end) { statusText = '🔒 Closed'; statusClass = 'closed'; }
    else { statusText = '🟢 Active'; statusClass = 'active'; }

    return `
    <div class="election-card" onclick="selectElection('${el.id}')">
      <div class="election-card-header">
        <div>
          <div class="election-card-title">${el.title}</div>
          <div class="election-card-desc">${el.description}</div>
          <div style="font-size:0.8rem;color:var(--text2);margin-top:0.5rem">
            📅 ${formatDate(el.start)} — ${formatDate(el.end)}
          </div>
        </div>
        <div class="election-status ${statusClass}">${statusText}</div>
      </div>
    </div>`;
  }).join('');
}

async function selectElection(id) {
  const u = APP.currentUser;

  const res = await fetch("http://localhost:3001/api/elections", {
    headers: {
      Authorization: "Bearer " + APP.token
    }
  });

  const elections = await res.json();
  const election = elections.find(e => e.id === id);

  if (!election) return;

  const now = new Date();

  APP.selectedElectionId = id;
  APP.selectedCandidateId = null;
  renderElections();

  const panel = document.getElementById('votingPanel');
  panel.classList.remove('hidden');

  document.getElementById('electionTitle').textContent = election.title;
  document.getElementById('electionDesc').textContent = election.description;
  document.getElementById('electionDeadline').textContent = formatDate(election.end);

  document.getElementById('voteConfirmBox').classList.add('hidden');
  document.getElementById('voteReceipt').classList.add('hidden');

  if (now < new Date(election.start)) {
    document.getElementById('candidatesList').innerHTML =
      `<div class="empty-state"><p>🕐 Not Started</p></div>`;
    return;
  }

  if (now > new Date(election.end)) {
    document.getElementById('candidatesList').innerHTML =
      `<div class="empty-state"><p>🔒 Closed</p></div>`;
    return;
  }

  document.getElementById('candidatesList').innerHTML =
    election.candidates.map(c => `
      <div class="candidate-card" onclick="selectCandidate('${c.id}', '${c.name}', '${c.party}')">
        <span>${c.symbol || ''}</span>
        <div>${c.name}</div>
        <div>${c.party}</div>
      </div>
    `).join('');
}

function selectCandidate(id, name, party) {
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('cand_' + id)?.classList.add('selected');
  APP.selectedCandidateId = id;
  document.getElementById('confirmCandidate').textContent = `${name} (${party})`;
  document.getElementById('voteConfirmBox').classList.remove('hidden');
}

function cancelVote() {
  APP.selectedCandidateId = null;
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('voteConfirmBox').classList.add('hidden');
}

async function submitVote() {
  const electionId = APP.selectedElectionId;
  const candidateId = APP.selectedCandidateId;

  if (!candidateId) {
    return showToast('Please select a candidate', 'error');
  }

  const res = await fetch("http://localhost:3001/api/vote/cast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + APP.token
    },
    body: JSON.stringify({ electionId, candidateId })
  });

  const data = await res.json();

  if (!res.ok) {
    return showToast(data.error || "Vote failed", "error");
  }

  // ✅ Use backend response
  const receipt = data.receipt;

  document.getElementById('voteConfirmBox').classList.add('hidden');
  document.getElementById('voteReceipt').classList.remove('hidden');

  document.getElementById('receiptId').textContent = receipt.receiptId;
  document.getElementById('receiptCandidate').textContent = receipt.candidateName;
  document.getElementById('receiptElection').textContent = receipt.electionTitle;
  document.getElementById('receiptTime').textContent = formatDate(receipt.timestamp);
  document.getElementById('receiptHash').textContent = receipt.blockchainHash;

  document.getElementById('voteStatusBadge').innerHTML =
    `<span>✅</span> Status: <strong style="color:var(--accent3)">Voted</strong>`;

  renderElections();

  showToast('🗳️ Vote submitted successfully! Your vote is secured.', 'success', 6000);
}

function downloadReceipt() {
  const u = APP.currentUser;
  const receiptId = document.getElementById('receiptId').textContent;
  const candidate = document.getElementById('receiptCandidate').textContent;
  const election = document.getElementById('receiptElection').textContent;
  const time = document.getElementById('receiptTime').textContent;
  const hash = document.getElementById('receiptHash').textContent;
  const content = `
SECUREVOTE — OFFICIAL VOTE RECEIPT
====================================
Voter: ${u.name}
Voter ID: ${u.voterId}
Receipt ID: ${receiptId}
Election: ${election}
Voted For: ${candidate}
Timestamp: ${time}
Blockchain Hash: ${hash}
====================================
This receipt confirms your vote was recorded securely.
Keep this for your records.
SecureVote System — www.securevote.in
  `.trim();
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `VoteReceipt_${receiptId}.txt`;
  a.click();
}

// ===== ADMIN DASHBOARD =====
function initAdminDashboard() {
  renderAdminStats();
  adminTab('elections');
}

function renderAdminStats() {
  const users = DB.getUsers().filter(u => u.role === 'voter');
  const elections = DB.getElections();
  const votes = DB.getVotes();
  const activeEl = elections.filter(e => {
    const now = new Date();
    return new Date(e.start) <= now && new Date(e.end) >= now;
  }).length;
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Voters</div><div class="stat-value accent">${users.length}</div></div>
    <div class="stat-card"><div class="stat-label">Total Elections</div><div class="stat-value purple">${elections.length}</div></div>
    <div class="stat-card"><div class="stat-label">Active Elections</div><div class="stat-value green">${activeEl}</div></div>
    <div class="stat-card"><div class="stat-label">Total Votes Cast</div><div class="stat-value warn">${votes.length}</div></div>
  `;
}

function adminTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['elections','voters','results','security'][i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
  if (name === 'elections') renderAdminElections();
  if (name === 'voters') renderVoterTable();
  if (name === 'results') renderResults();
  if (name === 'security') renderSecurityLog();
}

async function renderAdminElections() {
  const res = await fetch("http://localhost:3001/api/elections/all", {
    headers: {
      Authorization: "Bearer " + APP.token
    }
  });

  if (!res.ok) {
    return showToast("Failed to load elections", "error");
  }

  const elections = await res.json();

  const container = document.getElementById('adminElectionsList');

  if (elections.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No elections created yet.</p></div>`;
    return;
  }

  container.innerHTML = elections.map(el => {
    const now = new Date();
    let statusText;

    if (now < new Date(el.start)) statusText = 'Upcoming';
    else if (now > new Date(el.end)) statusText = 'Closed';
    else statusText = 'Active';

    return `
    <div class="admin-election-card">
      <div class="admin-el-header">
        <div>
          <div class="election-card-title">${el.title}</div>
          <div style="font-size:0.8rem;color:var(--text2);margin-top:0.25rem">
            📅 ${formatDate(el.start)} — ${formatDate(el.end)} &nbsp;|&nbsp; 
            ${el.candidates.length} Candidates &nbsp;|&nbsp; 
            🗳️ ${el.totalVotes || 0} votes &nbsp;|&nbsp;
            Status: <strong>${statusText}</strong>
          </div>
        </div>
        <div class="admin-el-actions">
          <button class="btn-sm success" onclick="adminViewResults('${el.id}')">📊 Results</button>
          <button class="btn-sm" onclick="adminEditDeadline('${el.id}')">⏱ Extend</button>
          <button class="btn-sm danger" onclick="adminDeleteElection('${el.id}')">🗑 Delete</button>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${el.candidates.map(c => `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;font-size:0.8rem">
            ${c.symbol || ''} ${c.name}
          </div>
        `).join('')}
      </div>
    </div>`;
  }).join('');
}

function adminViewResults(id) {
  adminTab('results');
  setTimeout(() => {
    const el = document.getElementById('result_' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

function adminEditDeadline(id) {
  const el = DB.getElections().find(e => e.id === id);
  openModal(`
    <h4 style="font-family:var(--font-display);margin-bottom:1rem">Extend Election Deadline</h4>
    <p style="color:var(--text2);margin-bottom:1rem">${el.title}</p>
    <div class="form-group">
      <label>New End Date & Time</label>
      <input type="datetime-local" id="newDeadline" style="width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text);font-family:var(--font-body)" />
    </div>
    <button class="btn-primary" style="margin-top:1rem;width:100%" onclick="saveDeadline('${id}')">Save</button>
  `);
}

function saveDeadline(id) {
  const val = document.getElementById('newDeadline').value;
  if (!val) return showToast('Select a date', 'error');
  DB.updateElection(id, { end: new Date(val).toISOString() });
  // DB.addSecurityLog({ type: 'warn', message: `Election deadline extended by admin: ${id}`, user: APP.currentUser.email });
  closeModal(); renderAdminElections();
  showToast('Deadline updated', 'success');
}

function adminDeleteElection(id) {
  if (!confirm('Delete this election? All votes for it will remain in audit logs.')) return;
  const elections = DB.getElections().filter(e => e.id !== id);
  DB.set('elections', elections);
  // DB.addSecurityLog({ type: 'danger', message: `Election deleted by admin: ${id}`, user: APP.currentUser.email });
  renderAdminElections(); renderAdminStats();
  showToast('Election deleted', 'warn');
}

function showCreateElection() {
  document.getElementById('createElectionForm').classList.remove('hidden');
}
function hideCreateElection() {
  document.getElementById('createElectionForm').classList.add('hidden');
}

// function createElection() {
//   const title = document.getElementById('elTitle').value.trim();
//   const desc = document.getElementById('elDesc').value.trim();
//   const start = document.getElementById('elStart').value;
//   const end = document.getElementById('elEnd').value;
//   const candidatesRaw = document.getElementById('elCandidates').value.trim();

//   if (!title || !desc || !start || !end || !candidatesRaw) return showToast('Fill in all fields', 'error');
//   if (new Date(start) >= new Date(end)) return showToast('End date must be after start date', 'error');

//   const candidates = candidatesRaw.split('\n').filter(l => l.trim()).map((line, i) => {
//     const parts = line.split(',').map(p => p.trim());
//     return { id: genId(), name: parts[0] || 'Candidate', party: parts[1] || 'Independent', symbol: parts[2] || '⭐', number: i + 1 };
//   });

//   if (candidates.length < 2) return showToast('At least 2 candidates required', 'error');

//   const election = {
//     id: genId(), title, description: desc,
//     start: new Date(start).toISOString(), end: new Date(end).toISOString(),
//     status: 'upcoming', constituency: 'all', candidates, createdBy: APP.currentUser.id
//   };

//   //DB.addElection(election);
//   // DB.addSecurityLog({ type: 'info', message: `New election created by admin: ${title}`, user: APP.currentUser.email });
//   hideCreateElection(); renderAdminElections(); renderAdminStats();
//   showToast('Election created successfully!', 'success');
// }
async function createElection() {
  const title = document.getElementById("elTitle").value;
  const description = document.getElementById("elDesc").value;
  const start = document.getElementById("elStart").value;
  const end = document.getElementById("elEnd").value;

  const raw = document.getElementById("elCandidates").value;

  const candidates = raw.split("\n").map(line => {
    const parts = line.split(",");
    return {
      name: parts[0]?.trim(),
      party: parts[1]?.trim(),
      symbol: parts[2]?.trim()
    };
  });

  const data = {
    title,
    description,
    start,
    end,
    constituency: "all",
    candidates
  };

  const res = await fetch("http://localhost:3001/api/elections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + APP.token
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    return showToast(result.error || "Failed to create election", "error");
  }

  showToast("Election created successfully 🔥", "success");

  location.reload();
}

async function renderVoterTable() {
  const res = await fetch("http://localhost:3001/api/admin/voters", {
    headers: {
      Authorization: "Bearer " + APP.token
    }
  });

  if (!res.ok) {
    return showToast("Failed to load voters", "error");
  }

  const users = await res.json();

  const container = document.getElementById('voterTable');

  if (users.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No voters registered yet.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Voter ID</th><th>Name</th><th>Email</th><th>Constituency</th>
            <th>Registered</th><th>Face</th><th>Biometric</th><th>Votes Cast</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td><code style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent)">${u.voterId}</code></td>
            <td>${u.name}</td>
            <td style="font-size:0.8rem">${u.email}</td>
            <td>${u.constituency}</td>
            <td style="font-size:0.8rem">${new Date(u.registered).toLocaleDateString()}</td>
            <td>${u.hasFace ? '✅' : '—'}</td>
            <td>${u.hasBiometric ? '✅' : '—'}</td>
            <td><strong style="color:var(--accent)">${u.voteCount}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function renderResults() {
  const res = await fetch("http://localhost:3001/api/elections", {
    headers: {
      Authorization: "Bearer " + APP.token
    }
  });

  if (!res.ok) {
    return showToast("Failed to load elections", "error");
  }

  const elections = await res.json();
  const container = document.getElementById('resultsPanel');

  if (!elections.length) {
    container.innerHTML = `<div class="empty-state"><p>No elections available.</p></div>`;
    return;
  }

  container.innerHTML = elections.map(el => {
    return `
    <div class="result-item">
      <h4>${el.title} — Total Votes: ${el.totalVotes || 0}</h4>
      ${el.candidates.map(c => `
        <div class="result-candidate">
          <div class="result-candidate-header">
            <span>${c.symbol || ''} ${c.name} (${c.party})</span>
            <span><strong>Votes hidden</strong></span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }).join('');
}

function renderSecurityLog() {
  const log = DB.getSecurityLog();
  const container = document.getElementById('securityLog');
  if (log.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No security events logged yet.</p></div>`;
    return;
  }
  container.innerHTML = `<div class="log-container">${log.map(entry => `
    <div class="security-log-entry">
      <span class="log-type ${entry.type}">${entry.type.toUpperCase()}</span>
      <span class="log-msg">${entry.message}</span>
      <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
    </div>`).join('')}</div>`;
}

// ===== HELPERS =====
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== INIT =====
window.addEventListener('load', async () => {
  // Initialize DB seeds
  //DB.getUsers();
//   const res = await fetch("http://localhost:3001/api/elections", {
//   headers: {
//     Authorization: "Bearer " + token
//   }
// });
// const elections = await res.json();

  // Loading animation
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('fade-out');
    setTimeout(() => document.getElementById('loadingScreen').remove(), 600);
    document.getElementById('screenWelcome').classList.add('active');
  }, 2500);

  // Seed initial security log
  // if (DB.getSecurityLog().length === 0) {
  //   DB.addSecurityLog({ type: 'info', message: 'SecureVote system initialized successfully', user: 'system' });
  //   DB.addSecurityLog({ type: 'info', message: 'Encryption layer active — AES-256 mode', user: 'system' });
  //   DB.addSecurityLog({ type: 'info', message: 'Face recognition module loaded', user: 'system' });
  //   DB.addSecurityLog({ type: 'info', message: 'Biometric authentication module ready', user: 'system' });
  //   DB.addSecurityLog({ type: 'info', message: 'Duplicate vote detection active', user: 'system' });
  // }
});

// Global error handler
window.onerror = (msg, src, line) => {
  console.error('App error:', msg, src, line);
};
*/










// ============================================================
// ============================================================
//  SECUREVOTE — Fixed Frontend Application
//  Bugs Fixed:
//  1. OTP inputs cleared on every new login attempt
//  2. Biometric UI (icon, message, button) fully reset on new login
//  3. sessionToken passed through all steps (face, OTP, complete)
//  4. loginCameraStarted flag reset on logout / new login
//  5. Admin functions (editDeadline, deleteElection, securityLog) use API
//  6. renderAdminStats uses API not old local DB
//  7. logout() properly resets ALL login step UI
//  8. goLoginStep resets step-specific UI when revisiting step
// ============================================================
faceModelsLoaded: false,

'use strict';
function base64URLToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + pad);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function bufferToBase64URL(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
// ===== STATE =====
const APP = {
  currentUser:        null,
  pendingLogin:       null,  // { email, sessionToken }
  regData:            {},
  otpInterval:        null,
  selectedElectionId: null,
  selectedCandidateId:null,
  cameraStream:       null,
  faceModelsLoaded: false,
  regStep:            1,
  loginStep:          1,
  token:              null,
};


async function loadFaceModels() {
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

  APP.faceModelsLoaded = true;

  console.log("✅ Face models loaded");
}
// ===== UTILITIES =====
function genId()      { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// ✅ Add near the top of app.js with other utilities
async function clearStaleCredential(credentialId) {
  // Browsers don't expose a delete API for platform credentials,
  // but we can signal to Windows Hello to create a new one by
  // ensuring excludeCredentials is empty (handled server-side now).
  // This function is a placeholder for future credential management.
  console.log('ℹ️ To manually clear stale Windows Hello passkeys:');
  console.log('   Settings → Accounts → Sign-in options → Security Key → Manage');
}


function showToast(msg, type = 'info', duration = 4000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const navbar = document.getElementById('navbar');
  if (id === 'screenWelcome' || id === 'screenLogin' || id === 'screenRegister') {
    navbar.classList.add('hidden');
  } else {
    navbar.classList.remove('hidden');
    document.getElementById('navUserInfo').textContent =
      `${APP.currentUser?.name} (${APP.currentUser?.role})`;
    document.getElementById('navLogout').classList.remove('hidden');
  }
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function openModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}

// BUG FIX: logout resets ALL login state including UI
function logout() {
  if (APP.cameraStream) {
    APP.cameraStream.getTracks().forEach(t => t.stop());
    APP.cameraStream = null;
  }
  APP.currentUser  = null;
  APP.pendingLogin = null;
  APP.token        = null;
  clearInterval(APP.otpInterval);

  // BUG FIX: fully reset login UI so next login starts fresh
  resetLoginUI();

  showScreen('screenWelcome');
  showToast('Logged out successfully', 'info');
}

// BUG FIX: centralised login UI reset
function resetLoginUI() {
  // Reset to step 1
  goLoginStep(1);

  // Clear credential fields
  const emailField = document.getElementById('loginEmail');
  const passField  = document.getElementById('loginPassword');
  if (emailField) emailField.value = '';
  if (passField)  passField.value  = '';

  // BUG FIX: clear ALL 6 OTP digit inputs
  [0,1,2,3,4,5].forEach(i => {
    const el = document.getElementById(`otp${i}`);
    if (el) el.value = '';
  });
  const otpDemo = document.getElementById('otpDemo');
  if (otpDemo) otpDemo.textContent = '';
  const otpCountdown = document.getElementById('otpCountdown');
  if (otpCountdown) otpCountdown.textContent = '05:00';

  // BUG FIX: reset biometric UI fully
  const bioIcon = document.getElementById('loginFingerprintAnim');
  const bioMsg  = document.getElementById('loginBiometricMsg');
  const bioBtn  = document.getElementById('loginBiometricBtn');
  const bioStat = document.getElementById('loginBiometricStatus');
  if (bioIcon) bioIcon.textContent = '🫆';
  if (bioMsg)  bioMsg.textContent  = 'Click to authenticate with biometrics';
  if (bioBtn)  { bioBtn.disabled = false; bioBtn.textContent = 'Authenticate Biometric'; }
  if (bioStat) { bioStat.textContent = ''; bioStat.className = 'biometric-status hidden'; }

  // Reset face step
  const faceStatus = document.getElementById('loginFaceStatus');
  const verifyBtn  = document.getElementById('verifyFaceBtn');
  if (faceStatus) faceStatus.textContent = '📷 Position your face in the oval';
  if (verifyBtn)  { verifyBtn.disabled = true; verifyBtn.textContent = '🔍 Verify Face'; }

  loginCameraStarted = false;
}

// ===== REGISTRATION =====
function regNextStep() {
  const name         = document.getElementById('regName').value.trim();
  const voterId      = document.getElementById('regVoterId').value.trim();
  const email        = document.getElementById('regEmail').value.trim();
  const phone        = document.getElementById('regPhone').value.trim();
  const dob          = document.getElementById('regDob').value;
  const constituency = document.getElementById('regConstituency').value;
  const password     = document.getElementById('regPassword').value;
  const confirm      = document.getElementById('regConfirmPassword').value;

  if (!name || !voterId || !email || !phone || !dob || !constituency || !password) {
    return showToast('Please fill in all fields', 'error');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Invalid email address', 'error');
  if (password.length < 8)          return showToast('Password must be at least 8 characters', 'error');
  if (!/[A-Z]/.test(password))      return showToast('Password must contain at least one uppercase letter', 'error');
  if (!/[0-9]/.test(password))      return showToast('Password must contain at least one number', 'error');
  if (password !== confirm)         return showToast('Passwords do not match', 'error');

  const birthDate = new Date(dob);
  const age = (new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) return showToast('You must be at least 18 years old to register', 'error');

  APP.regData = { name, voterId, email, phone, dob, constituency, password };
  goRegStep(2);
}

function goRegStep(n) {
  document.querySelectorAll('.reg-step').forEach(s => s.classList.remove('active'));
  const stepMap = { 1: 'regStep1', 2: 'regStep2', 3: 'regStep3', 4: 'regSuccess' };
  document.getElementById(stepMap[n]).classList.add('active');
  APP.regStep = n;
  if (n === 2) startRegCamera();
}

let regCameraStarted = false;
async function startRegCamera() {
  try {
    if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
    APP.cameraStream = stream;
    const video = document.getElementById('regVideo');
    video.srcObject = stream;
    document.getElementById('captureRegBtn').disabled = false;
    document.getElementById('regFaceStatus').textContent = '✅ Camera active — position your face in the oval';
    regCameraStarted = true;
  } catch (e) {
    document.getElementById('regFaceStatus').textContent = '⚠️ Camera unavailable — using demo simulation';
    document.getElementById('captureRegBtn').disabled = false;
    regCameraStarted = false;
    showToast('Camera not available — running in demo/simulation mode', 'warn', 5000);
  }
}

async function captureRegFace() {
  if (!APP.faceModelsLoaded) {
    return showToast("Face system still loading...", "error");
  }

  const video = document.getElementById('regVideo');

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return showToast("No face detected. Try again.", "error");
  }

  // ✅ THIS WAS MISSING
  const faceDescriptor = Array.from(detection.descriptor);

  // store it for registration
  APP.regData.faceDescriptor = faceDescriptor;

  showToast("Face captured successfully ✅", "success");
}
function regNextStep2() {
  if (!APP.regData.faceDescriptor) {
  return showToast('Please capture your face first', 'error');
}
  goRegStep(3);
}
async function registerBiometric() {
  try {
    const btn  = document.getElementById('biometricBtn');
    const msg  = document.getElementById('biometricMsg');
    const icon = document.getElementById('fingerprintAnim');

    btn.disabled    = true;
    btn.textContent = '🔍 Waiting for Windows Hello...';
    msg.textContent = 'Scan your fingerprint or use Windows Hello PIN when prompted...';

    const email = APP.regData.email.toLowerCase().trim();

    // Step 1: get options from server
    const optRes = await fetch('/api/auth/biometric/register-options', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Failed to get options');
    }

    const options = await optRes.json();

    // Step 2: convert base64url fields to ArrayBuffer
    options.challenge = base64URLToBuffer(options.challenge);
    options.user.id   = base64URLToBuffer(options.user.id);
    if (options.excludeCredentials?.length) {
      options.excludeCredentials = options.excludeCredentials.map(c => ({
        ...c, id: base64URLToBuffer(c.id)
      }));
    }

    console.log('🔐 Requesting credential from Windows Hello...');

    // Step 3: trigger Windows Hello
    let credential;
    try {
      credential = await navigator.credentials.create({ publicKey: options });
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        throw new Error('Windows Hello was cancelled. Please try again.');
      }
      throw e;
    }

    if (!credential) throw new Error('No credential returned from Windows Hello');
    console.log('✅ Credential created, ID:', credential.id);

    // Step 4: serialize for sending to server
    const credentialJSON = {
      id:    credential.id,
      rawId: bufferToBase64URL(credential.rawId),
      type:  credential.type,
      response: {
        attestationObject: bufferToBase64URL(credential.response.attestationObject),
        clientDataJSON:    bufferToBase64URL(credential.response.clientDataJSON),
        transports:        credential.response.getTransports
          ? credential.response.getTransports() : [],
      }
    };

    // Step 5: verify on server — server returns credential fields
    const verifyRes = await fetch('/api/auth/biometric/register-verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, credential: credentialJSON })
    });

    const data = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(data.error || 'Server verification failed');

    // ✅ Store ALL credential fields in APP.regData
    // completeRegistration() will send these directly to /api/auth/register
    APP.regData.biometricId           = credential.id;
    APP.regData.biometricCredentialID = data.biometricCredentialID;
    APP.regData.biometricPublicKey    = data.biometricPublicKey;
    APP.regData.biometricCounter      = data.biometricCounter;

    console.log('✅ Biometric data stored in APP.regData');
    console.log('   biometricCredentialID:', APP.regData.biometricCredentialID);

    icon.textContent = '✅';
    msg.textContent  = 'Biometric registered successfully!';
    btn.textContent  = '✅ Registered';
    showToast('Biometric registered ✅', 'success');

  } catch (err) {
    const btn = document.getElementById('biometricBtn');
    const msg = document.getElementById('biometricMsg');
    btn.disabled    = false;
    btn.textContent = 'Register Biometric';
    msg.textContent = 'Click below to register your biometric';
    showToast('Biometric error: ' + err.message, 'error');
    console.error('🔥 Biometric register error:', err);
  }
}

async function completeRegistration() {
  if (!APP.regData.biometricId) {
    return showToast('Please complete biometric registration first', 'error');
  }
  if (!APP.regData.biometricCredentialID || !APP.regData.biometricPublicKey) {
    return showToast('Biometric data incomplete — please register biometric again', 'error');
  }

  console.log('📤 Completing registration for:', APP.regData.email);
  console.log('   biometricCredentialID:', APP.regData.biometricCredentialID);

  try {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:                  APP.regData.name,
        email:                 APP.regData.email.toLowerCase().trim(),
        password:              APP.regData.password,
        voterId:               APP.regData.voterId,
        phone:                 APP.regData.phone,
        dob:                   APP.regData.dob,
        constituency:          APP.regData.constituency,
        faceDescriptor:        APP.regData.faceDescriptor  || [],
        biometricId:           APP.regData.biometricId,
        // ✅ Send credential fields directly — no server-side memory needed
        biometricCredentialID: APP.regData.biometricCredentialID,
        biometricPublicKey:    APP.regData.biometricPublicKey,
        biometricCounter:      APP.regData.biometricCounter || 0,
      }),
    });

    const data = await res.json();
    if (!res.ok) return showToast(data.error || 'Registration failed', 'error');

    goRegStep(4);
    showToast('Registration complete! Welcome to SecureVote.', 'success');

  } catch (err) {
    showToast('Registration error: ' + err.message, 'error');
    console.error('🔥 completeRegistration error:', err);
  }
}

function clearRegisterForm() {
  document.querySelectorAll('#screenRegister input').forEach(i => i.value = '');
  // Reset biometric + face UI for next use
  const bioBtn  = document.getElementById('biometricBtn');
  const bioIcon = document.getElementById('fingerprintAnim');
  const bioMsg  = document.getElementById('biometricMsg');
  const bioStat = document.getElementById('biometricStatus');
  if (bioBtn)  { bioBtn.disabled = false; bioBtn.textContent = 'Register Biometric'; }
  if (bioIcon) bioIcon.textContent = '🫆';
  if (bioMsg)  bioMsg.textContent  = 'Click below to register your biometric';
  if (bioStat) { bioStat.textContent = ''; bioStat.className = 'biometric-status hidden'; }
  document.getElementById('regFacePreview')?.classList.add('hidden');
  document.getElementById('regFaceStatus').textContent = '📷 Position your face in the oval';
  document.getElementById('captureRegBtn').disabled    = true;
  APP.regData = {};
}

// ===== LOGIN =====

// Step 1: Credentials
async function loginStep1() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showToast('Please enter email and password', 'error');

  const res = await fetch('http://localhost:3001/api/auth/login/credentials', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'Login failed', 'error');

  // Store both email and sessionToken for subsequent steps
  APP.pendingLogin = { email, sessionToken: data.sessionToken };

  showToast('Credentials verified ✓', 'success');
  goLoginStep(2);
  setTimeout(() => startLoginCamera(), 400);
}

function goLoginStep(n) {
  document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
  const map = { 1: 'loginStep1', 2: 'loginStep2', 3: 'loginStep3', 4: 'loginStep4' };
  document.getElementById(map[n])?.classList.add('active');
  APP.loginStep = n;
}

let loginCameraStarted = false;
async function startLoginCamera() {
  try {
    if (APP.cameraStream) { APP.cameraStream.getTracks().forEach(t => t.stop()); }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
    APP.cameraStream = stream;
    const video  = document.getElementById('loginVideo');
    video.srcObject = stream;
    document.getElementById('verifyFaceBtn').disabled = false;
    document.getElementById('loginFaceStatus').textContent = '✅ Camera active — position your face in the oval';
    loginCameraStarted = true;
  } catch (e) {
    loginCameraStarted = false;
    document.getElementById('loginFaceStatus').textContent = '⚠️ Camera unavailable — demo mode active';
    document.getElementById('verifyFaceBtn').disabled = false;
    showToast('Camera unavailable — running face verification in demo mode', 'warn', 5000);
  }
}

async function verifyLoginFace() {
  if (!APP.faceModelsLoaded) {
    return showToast("Face system still loading, wait a sec...", "error");
  }

  const btn = document.getElementById('verifyFaceBtn');
  btn.textContent = '🔍 Analyzing...';
  btn.disabled = true;

  const video = document.getElementById('loginVideo');

  // 🟢 Ensure camera is ready
  if (video.videoWidth === 0) {
    btn.disabled = false;
    btn.textContent = '🔍 Verify Face';
    return showToast("Camera not ready, wait a second...", "error");
  }

  // 🟢 small delay for stability
  await new Promise(r => setTimeout(r, 500));

  // 🟢 STRONGER detection
  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.3
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    document.getElementById('loginFaceStatus').textContent = '❌ No face detected!';
    showToast('No face detected, adjust lighting & position', 'error');
    btn.disabled = false;
    btn.textContent = '🔍 Verify Face';
    return;
  }

  const descriptor = Array.from(detection.descriptor);

  // 🟢 NOW stop camera (after detection)
  if (APP.cameraStream) {
    APP.cameraStream.getTracks().forEach(t => t.stop());
    APP.cameraStream = null;
  }

  const res = await fetch('http://localhost:3001/api/auth/login/face', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: APP.pendingLogin.email,
      sessionToken: APP.pendingLogin.sessionToken,
      faceDescriptor: descriptor
    }),
  });

  const data = await res.json(); // 🔥 restore this

  if (!res.ok) {
    document.getElementById('loginFaceStatus').textContent = '❌ Face verification failed!';
    showToast(data.error || 'Face verification failed', 'error');
    btn.disabled = false;
    btn.textContent = '🔍 Verify Face';
    return;
  }

  document.getElementById('loginFaceStatus').textContent = '✅ Face verified successfully!';
  showToast('Face verified ✓ — OTP verification next', 'success');

  await delay(800);
  sendOTP();
  goLoginStep(3);
}

// BUG FIX: always pass sessionToken when sending OTP
async function sendOTP() {
  // BUG FIX: clear OTP inputs before populating new OTP
  [0,1,2,3,4,5].forEach(i => {
    const el = document.getElementById(`otp${i}`);
    if (el) el.value = '';
  });
  const otpDemo = document.getElementById('otpDemo');
  if (otpDemo) otpDemo.textContent = '';

  const res = await fetch('http://localhost:3001/api/auth/login/send-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email:        APP.pendingLogin.email,
      sessionToken: APP.pendingLogin.sessionToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'OTP failed', 'error');

  showToast('OTP sent ✓', 'success');

  // BUG FIX: always show new OTP (server always sends it in dev mode)
  if (data.devOtp) {
    document.getElementById('otpDemo').textContent = 'OTP: ' + data.devOtp;
  }

  startOTPTimer(300); // 5 minutes
}

function startOTPTimer(seconds) {
  clearInterval(APP.otpInterval);
  let remaining = seconds;
  const el = document.getElementById('otpCountdown');
  APP.otpInterval = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    if (el) el.textContent = `${m}:${s}`;
    if (remaining <= 0) { clearInterval(APP.otpInterval); if (el) el.textContent = 'EXPIRED'; }
  }, 1000);
}

function resendOTP() {
  clearInterval(APP.otpInterval);
  sendOTP();
  showToast('New OTP sent!', 'info');
}

function otpNext(idx) {
  const input = document.getElementById(`otp${idx}`);
  const val   = input.value.replace(/\D/g, '');
  input.value = val;
  if (val && idx < 5) document.getElementById(`otp${idx + 1}`).focus();
}

// BUG FIX: pass sessionToken when verifying OTP
async function verifyOTP() {
  const code = [0,1,2,3,4,5].map(i => document.getElementById(`otp${i}`).value).join('');
  if (code.length < 6) return showToast('Please enter the complete 6-digit OTP', 'error');

  const res = await fetch('http://localhost:3001/api/auth/login/verify-otp', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email:        APP.pendingLogin.email,
      otp:          code,
      sessionToken: APP.pendingLogin.sessionToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'OTP failed', 'error');

  clearInterval(APP.otpInterval);
  showToast('OTP verified ✓', 'success');

  // ✅ Admin skips biometric step entirely
  if (data.role === 'admin') {
    await finalizeLogin();
  } else {
    goLoginStep(4);
  }
}

// BUG FIX: reset biometric UI before performing verification
// ✅ FIXED: biometric called BEFORE finalizeLogin, result gates the login
async function verifyBiometric() {
  // ✅ Guard: if called after pendingLogin is cleared, bail immediately
  if (!APP.pendingLogin?.email) {
    console.warn('verifyBiometric called with no pendingLogin — ignoring');
    return false;
  }

  const email = APP.pendingLogin.email;   // ✅ capture before any async work

  try {
    const btn  = document.getElementById('loginBiometricBtn');
    const msg  = document.getElementById('loginBiometricMsg');

    btn.disabled    = true;
    btn.textContent = '🔍 Scanning...';
    msg.textContent = 'Use your fingerprint or Windows Hello PIN...';

    const res = await fetch('/api/auth/biometric/login-options', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get options');
    }

    const options = await res.json();

    options.challenge = base64URLToBuffer(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map(c => ({
        ...c,
        id: base64URLToBuffer(c.id)
      }));
    }

    const credential = await navigator.credentials.get({ publicKey: options });
    if (!credential) throw new Error('No credential returned');

    const credentialJSON = {
      id:    credential.id,
      rawId: bufferToBase64URL(credential.rawId),
      type:  credential.type,
      response: {
        authenticatorData: bufferToBase64URL(credential.response.authenticatorData),
        clientDataJSON:    bufferToBase64URL(credential.response.clientDataJSON),
        signature:         bufferToBase64URL(credential.response.signature),
        userHandle:        credential.response.userHandle
          ? bufferToBase64URL(credential.response.userHandle) : null,
      }
    };

    const verify = await fetch('/api/auth/biometric/login-verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, credential: credentialJSON })
    });

    const data = await verify.json();
    if (!data.success) throw new Error(data.error || 'Biometric failed');

    document.getElementById('loginBiometricMsg').textContent = '✅ Verified!';
    document.getElementById('loginBiometricBtn').textContent = '✅ Verified';
    showToast('Biometric verified ✓', 'success');

    await delay(600);
    await finalizeLogin();   // ✅ only called once, here, after success

    return true;

  } catch (err) {
    const btn = document.getElementById('loginBiometricBtn');
    const msg = document.getElementById('loginBiometricMsg');
    if (btn) { btn.disabled = false; btn.textContent = 'Authenticate Biometric'; }
    if (msg) { msg.textContent = 'Click to authenticate with biometrics'; }
    showToast('Biometric error: ' + err.message, 'error');
    console.error('Biometric verify error:', err);
    return false;
  }
}

// ✅ FIXED: finalizeLogin no longer calls verifyBiometric — that's done before this
async function finalizeLogin() {
  const res = await fetch('http://localhost:3001/api/auth/login/complete', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email:             APP.pendingLogin.email,
      sessionToken:      APP.pendingLogin.sessionToken,
      biometricVerified: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'Login failed', 'error');

  APP.currentUser  = data.user;
  APP.token        = data.token;
  APP.pendingLogin = null;

  showToast('Login successful 🎉', 'success');
  resetLoginUI();

  if (APP.currentUser.role === 'admin') {
    showScreen('screenAdmin');
    initAdminDashboard();
  } else {
    showScreen('screenVoter');
    initVoterDashboard();
  }
}

// BUG FIX: pass sessionToken when completing login
async function finalizeLogin() {
  // ✅ Save email before clearing pendingLogin
  const email        = APP.pendingLogin.email;
  const sessionToken = APP.pendingLogin.sessionToken;

  const res = await fetch('http://localhost:3001/api/auth/login/complete', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      email,
      sessionToken,
      biometricVerified: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'Login failed', 'error');

  APP.currentUser  = data.user;
  APP.token        = data.token;
  APP.pendingLogin = null;   // ✅ cleared AFTER we're done using it

  showToast('Login successful 🎉', 'success');
  resetLoginUI();

  if (APP.currentUser.role === 'admin') {
    showScreen('screenAdmin');
    initAdminDashboard();
  } else {
    showScreen('screenVoter');
    initVoterDashboard();
  }
  // ✅ NO verifyBiometric() call here — ever
}

// ===== VOTER DASHBOARD =====
function initVoterDashboard() {
  const u = APP.currentUser;
  document.getElementById('voterName').textContent       = u.name;
  document.getElementById('voterIdDisplay').textContent  = u.voterId;
  document.getElementById('voterConstDisplay').textContent = u.constituency;
  // Reset vote receipt / confirm panel
  document.getElementById('voteConfirmBox')?.classList.add('hidden');
  document.getElementById('voteReceipt')?.classList.add('hidden');
  document.getElementById('votingPanel')?.classList.add('hidden');
  document.getElementById('voteStatusBadge').innerHTML =
    `<span>📊</span> Status: <strong>Not Yet Voted</strong>`;
  renderElections();
}

async function renderElections() {
  const res = await fetch('http://localhost:3001/api/elections', {
    headers: { Authorization: 'Bearer ' + APP.token },
  });

  if (!res.ok) return showToast('Failed to load elections', 'error');

  const elections = await res.json();
  const container = document.getElementById('electionsList');
  const now       = new Date();

  if (elections.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>🗳️ No Elections Available</p><small>No elections for your constituency.</small></div>`;
    return;
  }

  container.innerHTML = elections.map(el => {
    const start = new Date(el.start), end = new Date(el.end);
    let statusText, statusClass;
    if (now < start)      { statusText = '🕐 Upcoming'; statusClass = 'upcoming'; }
    else if (now > end)   { statusText = '🔒 Closed';   statusClass = 'closed'; }
    else                  { statusText = '🟢 Active';   statusClass = 'active'; }

    return `
    <div class="election-card" onclick="selectElection('${el.id}')">
      <div class="election-card-header">
        <div>
          <div class="election-card-title">${el.title}</div>
          <div class="election-card-desc">${el.description}</div>
          <div style="font-size:0.8rem;color:var(--text2);margin-top:0.5rem">
            📅 ${formatDate(el.start)} — ${formatDate(el.end)}
          </div>
        </div>
        <div class="election-status ${statusClass}">${statusText}</div>
      </div>
    </div>`;
  }).join('');
}

async function selectElection(id) {
  const res = await fetch('http://localhost:3001/api/elections', {
    headers: { Authorization: 'Bearer ' + APP.token },
  });

  const elections = await res.json();
  const election  = elections.find(e => e.id === id);
  if (!election) return;

  const now = new Date();
  APP.selectedElectionId  = id;
  APP.selectedCandidateId = null;
  renderElections();

  const panel = document.getElementById('votingPanel');
  panel.classList.remove('hidden');

  document.getElementById('electionTitle').textContent    = election.title;
  document.getElementById('electionDesc').textContent     = election.description;
  document.getElementById('electionDeadline').textContent = formatDate(election.end);
  document.getElementById('voteConfirmBox').classList.add('hidden');
  document.getElementById('voteReceipt').classList.add('hidden');

  if (now < new Date(election.start)) {
    document.getElementById('candidatesList').innerHTML = `<div class="empty-state"><p>🕐 Not Started</p></div>`;
    return;
  }
  if (now > new Date(election.end)) {
    document.getElementById('candidatesList').innerHTML = `<div class="empty-state"><p>🔒 Closed</p></div>`;
    return;
  }
  if (election.hasVoted) {
    document.getElementById('candidatesList').innerHTML =
      `<div class="empty-state"><p>✅ You have already voted in this election.</p></div>`;
    return;
  }

  document.getElementById('candidatesList').innerHTML = election.candidates.map(c => `
    <div class="candidate-card" onclick="selectCandidate('${c.id}', '${c.name}', '${c.party}')">
      <span>${c.symbol || ''}</span>
      <div>${c.name}</div>
      <div>${c.party}</div>
    </div>
  `).join('');
}

function selectCandidate(id, name, party) {
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
  APP.selectedCandidateId = id;
  document.getElementById('confirmCandidate').textContent = `${name} (${party})`;
  document.getElementById('voteConfirmBox').classList.remove('hidden');
}

function cancelVote() {
  APP.selectedCandidateId = null;
  document.querySelectorAll('.candidate-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('voteConfirmBox').classList.add('hidden');
}

async function submitVote() {
  const electionId  = APP.selectedElectionId;
  const candidateId = APP.selectedCandidateId;
  if (!candidateId) return showToast('Please select a candidate', 'error');

  const res = await fetch('http://localhost:3001/api/vote/cast', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + APP.token,
    },
    body: JSON.stringify({ electionId, candidateId }),
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error || 'Vote failed', 'error');

  const receipt = data.receipt;
  document.getElementById('voteConfirmBox').classList.add('hidden');
  document.getElementById('voteReceipt').classList.remove('hidden');
  document.getElementById('receiptId').textContent        = receipt.receiptId;
  document.getElementById('receiptCandidate').textContent = receipt.candidateName;
  document.getElementById('receiptElection').textContent  = receipt.electionTitle;
  document.getElementById('receiptTime').textContent      = formatDate(receipt.timestamp);
  document.getElementById('receiptHash').textContent      = receipt.blockchainHash;

  document.getElementById('voteStatusBadge').innerHTML =
    `<span>✅</span> Status: <strong style="color:var(--accent3)">Voted</strong>`;

  renderElections();
  showToast('🗳️ Vote submitted successfully! Your vote is secured.', 'success', 6000);
}

function downloadReceipt() {
  const u         = APP.currentUser;
  const receiptId = document.getElementById('receiptId').textContent;
  const candidate = document.getElementById('receiptCandidate').textContent;
  const election  = document.getElementById('receiptElection').textContent;
  const time      = document.getElementById('receiptTime').textContent;
  const hash      = document.getElementById('receiptHash').textContent;
  const content   = `
SECUREVOTE — OFFICIAL VOTE RECEIPT
====================================
Voter: ${u.name}
Voter ID: ${u.voterId}
Receipt ID: ${receiptId}
Election: ${election}
Voted For: ${candidate}
Timestamp: ${time}
Blockchain Hash: ${hash}
====================================
This receipt confirms your vote was recorded securely.
Keep this for your records.
SecureVote System — www.securevote.in
  `.trim();
  const blob = new Blob([content], { type: 'text/plain' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `VoteReceipt_${receiptId}.txt`;
  a.click();
}

// ===== ADMIN DASHBOARD =====
function initAdminDashboard() {
  renderAdminStats();
  adminTab('elections');
}

// BUG FIX: use API for stats, not old local DB
async function renderAdminStats() {
  try {
    const res  = await fetch('http://localhost:3001/api/admin/stats', {
      headers: { Authorization: 'Bearer ' + APP.token },
    });
    const data = await res.json();
    document.getElementById('adminStats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Voters</div><div class="stat-value accent">${data.totalVoters}</div></div>
      <div class="stat-card"><div class="stat-label">Total Elections</div><div class="stat-value purple">${data.totalElections}</div></div>
      <div class="stat-card"><div class="stat-label">Active Elections</div><div class="stat-value green">${data.activeElections}</div></div>
      <div class="stat-card"><div class="stat-label">Total Votes Cast</div><div class="stat-value warn">${data.totalVotes}</div></div>
    `;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

function adminTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['elections','voters','results','security'][i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.add('active');
  if (name === 'elections') renderAdminElections();
  if (name === 'voters')    renderVoterTable();
  if (name === 'results')   renderResults();
  if (name === 'security')  renderSecurityLog();
}

async function renderAdminElections() {
  const res = await fetch('http://localhost:3001/api/elections/all', {
    headers: { Authorization: 'Bearer ' + APP.token },
  });
  if (!res.ok) return showToast('Failed to load elections', 'error');

  const elections = await res.json();
  const container = document.getElementById('adminElectionsList');

  if (elections.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No elections created yet.</p></div>`;
    return;
  }

  container.innerHTML = elections.map(el => {
    const now = new Date();
    let statusText;
    if (now < new Date(el.start))      statusText = 'Upcoming';
    else if (now > new Date(el.end))   statusText = 'Closed';
    else                               statusText = 'Active';

    return `
    <div class="admin-election-card">
      <div class="admin-el-header">
        <div>
          <div class="election-card-title">${el.title}</div>
          <div style="font-size:0.8rem;color:var(--text2);margin-top:0.25rem">
            📅 ${formatDate(el.start)} — ${formatDate(el.end)} &nbsp;|&nbsp;
            ${el.candidates.length} Candidates &nbsp;|&nbsp;
            🗳️ ${el.totalVotes || 0} votes &nbsp;|&nbsp;
            Status: <strong>${statusText}</strong>
          </div>
        </div>
        <div class="admin-el-actions">
          <button class="btn-sm success" onclick="adminViewResults('${el.id}')">📊 Results</button>
          <button class="btn-sm" onclick="adminEditDeadline('${el.id}', '${el.end}')">⏱ Extend</button>
          <button class="btn-sm danger" onclick="adminDeleteElection('${el.id}')">🗑 Delete</button>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${el.candidates.map(c => `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;font-size:0.8rem">
            ${c.symbol || ''} ${c.name}
          </div>
        `).join('')}
      </div>
    </div>`;
  }).join('');
}

async function renderVoterTable() {
  const res = await fetch('http://localhost:3001/api/admin/voters', {
    headers: { Authorization: 'Bearer ' + APP.token },
  });
  if (!res.ok) return showToast('Failed to load voters', 'error');

  const users     = await res.json();
  const container = document.getElementById('voterTable');

  if (users.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No voters registered yet.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Voter ID</th><th>Name</th><th>Email</th><th>Constituency</th>
            <th>Registered</th><th>Face</th><th>Biometric</th><th>Votes Cast</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td><code style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent)">${u.voterId}</code></td>
            <td>${u.name}</td>
            <td style="font-size:0.8rem">${u.email}</td>
            <td>${u.constituency}</td>
            <td style="font-size:0.8rem">${new Date(u.registered).toLocaleDateString()}</td>
            <td>${u.hasFace ? '✅' : '—'}</td>
            <td>${u.hasBiometric ? '✅' : '—'}</td>
            <td><strong style="color:var(--accent)">${u.voteCount}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function renderResults() {
  const res = await fetch('http://localhost:3001/api/elections/all', {
    headers: { Authorization: 'Bearer ' + APP.token },
  });
  if (!res.ok) return showToast('Failed to load elections', 'error');

  const elections = await res.json();
  const container = document.getElementById('resultsPanel');

  if (!elections.length) {
    container.innerHTML = `<div class="empty-state"><p>No elections available.</p></div>`;
    return;
  }

  // Fetch detailed results for each election
  const resultsHTML = await Promise.all(elections.map(async el => {
    const r    = await fetch(`http://localhost:3001/api/admin/results/${el.id}`, {
      headers: { Authorization: 'Bearer ' + APP.token },
    });
    const data = await r.json();
    return `
    <div class="result-item" id="result_${el.id}">
      <h4>${el.title} — Total Votes: ${data.totalVotes || 0}</h4>
      ${data.results.map(rc => `
        <div class="result-candidate">
          <div class="result-candidate-header">
            <span>${rc.candidate.symbol || ''} ${rc.candidate.name} (${rc.candidate.party})</span>
            <span><strong>${rc.votes} vote${rc.votes !== 1 ? 's' : ''}</strong></span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }));

  container.innerHTML = resultsHTML.join('');
}

// BUG FIX: security log fetched from API, not old local DB
async function renderSecurityLog() {
  const container = document.getElementById('securityLog');
  try {
    const res  = await fetch('http://localhost:3001/api/admin/security-log', {
      headers: { Authorization: 'Bearer ' + APP.token },
    });
    const log  = await res.json();
    if (log.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No security events logged yet.</p></div>`;
      return;
    }
    container.innerHTML = `<div class="log-container">${log.map(entry => `
      <div class="security-log-entry">
        <span class="log-type ${entry.type}">${entry.type.toUpperCase()}</span>
        <span class="log-msg">${entry.message}</span>
        <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
      </div>`).join('')}</div>`;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>Failed to load security log.</p></div>`;
  }
}

function adminViewResults(id) {
  adminTab('results');
  setTimeout(() => {
    const el = document.getElementById('result_' + id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

// BUG FIX: adminEditDeadline uses API, not old local DB
function adminEditDeadline(id, currentEnd) {
  openModal(`
    <h4 style="font-family:var(--font-display);margin-bottom:1rem">Extend Election Deadline</h4>
    <div class="form-group">
      <label>New End Date & Time</label>
      <input type="datetime-local" id="newDeadline"
        value="${currentEnd ? new Date(currentEnd).toISOString().slice(0,16) : ''}"
        style="width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:0.75rem;color:var(--text);font-family:var(--font-body)" />
    </div>
    <button class="btn-primary" style="margin-top:1rem;width:100%" onclick="saveDeadline('${id}')">Save</button>
  `);
}

// BUG FIX: saveDeadline calls API
async function saveDeadline(id) {
  const val = document.getElementById('newDeadline').value;
  if (!val) return showToast('Select a date', 'error');

  const res = await fetch(`http://localhost:3001/api/elections/${id}`, {
    method:  'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + APP.token,
    },
    body: JSON.stringify({ end: new Date(val).toISOString() }),
  });
  if (!res.ok) return showToast('Failed to update deadline', 'error');
  closeModal();
  renderAdminElections();
  showToast('Deadline updated', 'success');
}

// BUG FIX: adminDeleteElection calls API
async function adminDeleteElection(id) {
  if (!confirm('Delete this election? All votes for it will remain in audit logs.')) return;

  const res = await fetch(`http://localhost:3001/api/elections/${id}`, {
    method:  'DELETE',
    headers: { Authorization: 'Bearer ' + APP.token },
  });
  if (!res.ok) return showToast('Failed to delete election', 'error');
  renderAdminElections();
  renderAdminStats();
  showToast('Election deleted', 'warn');
}

function showCreateElection() {
  document.getElementById('createElectionForm').classList.remove('hidden');
}
function hideCreateElection() {
  document.getElementById('createElectionForm').classList.add('hidden');
}

async function createElection() {
  const title       = document.getElementById('elTitle').value.trim();
  const description = document.getElementById('elDesc').value.trim();
  const start       = document.getElementById('elStart').value;
  const end         = document.getElementById('elEnd').value;
  const raw         = document.getElementById('elCandidates').value.trim();

  if (!title || !description || !start || !end || !raw) {
    return showToast('Fill in all fields', 'error');
  }

  const candidates = raw.split('\n').filter(l => l.trim()).map((line, i) => {
    const parts = line.split(',').map(p => p.trim());
    return { name: parts[0] || 'Candidate', party: parts[1] || 'Independent', symbol: parts[2] || '⭐' };
  });

  if (candidates.length < 2) return showToast('At least 2 candidates required', 'error');

  const res = await fetch('http://localhost:3001/api/elections', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + APP.token,
    },
    body: JSON.stringify({ title, description, start, end, constituency: 'all', candidates }),
  });

  const result = await res.json();
  if (!res.ok) return showToast(result.error || 'Failed to create election', 'error');

  showToast('Election created successfully 🔥', 'success');
  hideCreateElection();
  renderAdminElections();
  renderAdminStats();
}

// ===== HELPERS =====
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== INIT =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('fade-out');
    setTimeout(() => document.getElementById('loadingScreen').remove(), 600);
    document.getElementById('screenWelcome').classList.add('active');
  }, 2500);
});

window.onerror = (msg, src, line) => {
  console.error('App error:', msg, src, line);
};
window.onload = () => {
  loadFaceModels();
};