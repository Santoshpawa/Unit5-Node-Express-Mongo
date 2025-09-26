
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

if (!MONGO_URI) {
  console.warn('Warning: MONGO_URI not set. App will attempt to connect and fail. Set MONGO_URI env var to a MongoDB Atlas URI.');
}

app.use(cors());
app.use(bodyParser.json());

// -------------------- Mongoose Models --------------------
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
  console.log('Connected to MongoDB');
}).catch(err=>{
  console.error('MongoDB connect error:', err.message);
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','moderator','user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const ResourceSchema = new mongoose.Schema({
  title: String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
const Resource = mongoose.model('Resource', ResourceSchema);

// -------------------- Helpers --------------------
function signToken(user){
  return jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

async function hashPassword(pw){
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

async function comparePassword(pw, hash){
  return bcrypt.compare(pw, hash);
}

// -------------------- Middlewares --------------------
async function authMiddleware(req, res, next){
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains id, role, email, name
    next();
  } catch(err){
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function roleMiddleware(allowedRoles){
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (!userRole) return res.status(403).json({ error: 'Role missing' });
    if (!allowedRoles.includes(userRole)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// -------------------- API Routes --------------------
app.get('/health', (req,res)=>res.json({ ok: true, time: new Date() }));

// Register
app.post('/register', async (req,res)=>{
  try{
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name,email,password required' });
    // prevent user from creating admin via payload unless in dev
    let assignedRole = 'user';
    if (role && role === 'admin') assignedRole = 'user';
    if (role && ['moderator'].includes(role)) assignedRole = role; // allow moderator only

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const user = new User({ name, email, passwordHash, role: assignedRole });
    await user.save();
    const token = signToken(user);
    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch(err){
    console.error('/register err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/login', async (req,res)=>{
  try{
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email,password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch(err){
    console.error('/login err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin route: list users
app.get('/users', authMiddleware, roleMiddleware(['admin']), async (req,res)=>{
  const all = await User.find().select('-passwordHash').lean();
  res.json({ ok: true, users: all });
});

// Profile routes
app.get('/profile', authMiddleware, async (req,res)=>{
  const user = await User.findById(req.user.id).select('-passwordHash').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true, user });
});

app.put('/profile', authMiddleware, async (req,res)=>{
  try{
    const { name, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name) user.name = name;
    if (password) user.passwordHash = await hashPassword(password);
    await user.save();
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch(err){
    console.error('/profile put err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resources CRUD
// Create (any authenticated user)
app.post('/resources', authMiddleware, async (req,res)=>{
  try{
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const resource = new Resource({ title, description, owner: req.user.id });
    await resource.save();
    res.json({ ok: true, resource });
  } catch(err){
    console.error('create resource err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Read all (admin & moderator see all; user sees own and public - here all resources are visible to all authenticated users)
app.get('/resources', authMiddleware, async (req,res)=>{
  const list = await Resource.find().populate('owner','name email role').lean();
  res.json({ ok:true, resources: list });
});

// Read single
app.get('/resources/:id', authMiddleware, async (req,res)=>{
  const r = await Resource.findById(req.params.id).populate('owner','name email role').lean();
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ok:true, resource: r });
});

// Update (owner or moderator or admin)
app.put('/resources/:id', authMiddleware, async (req,res)=>{
  try{
    const r = await Resource.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    // check permission
    if (r.owner.toString() !== req.user.id && !['admin','moderator'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    const { title, description } = req.body;
    if (title) r.title = title;
    if (description) r.description = description;
    await r.save();
    res.json({ ok:true, resource: r });
  } catch(err){
    console.error('update resource err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete (owner or admin)
app.delete('/resources/:id', authMiddleware, async (req,res)=>{
  try{
    const r = await Resource.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    if (r.owner.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    await r.remove();
    res.json({ ok:true });
  } catch(err){
    console.error('delete resource err', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------- Serve Frontend --------------------
app.get('/', (req,res)=>{
  res.setHeader('Content-Type','text/html');
  res.send(frontendHTML());
});

// Simple static SPA served by this server
function frontendHTML(){
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Fullstack RBAC Single File</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;padding:20px;background:#f7f7f8}
  .container{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:320px 1fr;gap:20px}
  .card{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
  input,select,textarea,button{width:100%;padding:8px;margin-top:8px;border:1px solid #ddd;border-radius:6px}
  .small{display:flex;gap:8px}
  .list{margin-top:12px}
  .res{border-bottom:1px dashed #eee;padding:8px}
  .error{color:#b00020}
</style>
</head>
<body>
  <h2>Fullstack User Management (Single File)</h2>
  <div class="container">
    <div>
      <div class="card" id="authCard">
        <h3>Auth</h3>
        <div id="authForms">
          <input id="name" placeholder="Name (for register)" />
          <input id="email" placeholder="Email" />
          <input id="password" type="password" placeholder="Password" />
          <select id="roleSelect"><option value="user">User</option><option value="moderator">Moderator</option><option value="admin">Admin (dev only)</option></select>
          <button id="registerBtn">Register</button>
          <button id="loginBtn">Login</button>
          <button id="logoutBtn">Logout</button>
          <div id="authMsg"></div>
        </div>
        <hr />
        <h4>Profile</h4>
        <div id="profileBox"></div>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>Admin Panel</h3>
        <button id="fetchUsers">Fetch All Users (admin)</button>
        <div id="usersList"></div>
      </div>
    </div>

    <div>
      <div class="card">
        <h3>Resources</h3>
        <div id="resourceForm">
          <input id="resTitle" placeholder="Title" />
          <textarea id="resDesc" placeholder="Description"></textarea>
          <button id="createRes">Create Resource</button>
        </div>
        <div class="list" id="resources"></div>
      </div>
    </div>
  </div>
<script>
  const API_ROOT = '';
  function $(id){return document.getElementById(id)}
  let token = localStorage.getItem('token') || null;
  let currentUser = JSON.parse(localStorage.getItem('user')||'null');

  function setToken(t, user){
    token = t; if (t) localStorage.setItem('token', t); else localStorage.removeItem('token');
    currentUser = user; if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
    renderProfile();
  }

  function authFetch(url, opts={}){
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = 'Bearer '+token;
    return fetch(url, opts).then(async r=>{
      const txt = await r.text();
      try{ return JSON.parse(txt); } catch(e){ return { ok:false, text:txt, status:r.status }; }
    });
  }

  $('registerBtn').addEventListener('click', async ()=>{
    const name = $('name').value.trim(); const email = $('email').value.trim(); const password = $('password').value; const role = $('roleSelect').value;
    if (!name||!email||!password) return alert('name,email,password required');
    const res = await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password,role})});
    const data = await res.json();
    if (data.ok){ setToken(data.token, data.user); $('authMsg').textContent = 'Registered & logged in'; fetchResources(); } else { $('authMsg').textContent = data.error || 'Register failed'; }
  });

  $('loginBtn').addEventListener('click', async ()=>{
    const email = $('email').value.trim(); const password = $('password').value;
    if (!email||!password) return alert('email & password required');
    const res = await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data = await res.json();
    if (data.ok){ setToken(data.token, data.user); $('authMsg').textContent = 'Logged in'; fetchResources(); } else { $('authMsg').textContent = data.error || 'Login failed'; }
  });

  $('logoutBtn').addEventListener('click', ()=>{ setToken(null, null); $('authMsg').textContent = 'Logged out'; $('resources').innerHTML=''; });

  async function renderProfile(){
    const box = $('profileBox');
    if (!token){ box.innerHTML = '<div>Please login</div>'; return; }
    const data = await authFetch('/profile');
    if (data.ok){ box.innerHTML = `<div><strong>${escapeHtml(data.user.name)}</strong> (${escapeHtml(data.user.email)}) - <em>${data.user.role}</em></div>`; } else { box.innerHTML = '<div>Error fetching profile</div>'; }
  }

  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  $('fetchUsers').addEventListener('click', async ()=>{
    if (!token) return alert('login as admin');
    const data = await authFetch('/users');
    const el = $('usersList');
    if (data.ok){ el.innerHTML = data.users.map(u=>`<div>${escapeHtml(u.name)} - ${escapeHtml(u.email)} - ${u.role}</div>`).join(''); }
    else el.innerHTML = `<div class='error'>${data.error || 'Failed'}</div>`;
  });

  $('createRes').addEventListener('click', async ()=>{
    if (!token) return alert('login to create');
    const title = $('resTitle').value.trim(); const description = $('resDesc').value.trim();
    const data = await authFetch('/resources',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,description})});
    if (data.ok){ $('resTitle').value=''; $('resDesc').value=''; fetchResources(); } else alert(data.error||'Failed');
  });

  async function fetchResources(){
    const data = await authFetch('/resources');
    const el = $('resources');
    if (data.ok){ el.innerHTML = data.resources.map(r=>`<div class='res'><strong>${escapeHtml(r.title)}</strong> by ${escapeHtml(r.owner?.name||'Unknown')} <div>${escapeHtml(r.description||'')}</div><div style='margin-top:6px'><button onclick='editRes("${r._id}")'>Edit</button> <button onclick='deleteRes("${r._id}")'>Delete</button></div></div>`).join(''); }
    else el.innerHTML = `<div class='error'>${data.error||'Failed'}</div>`;
  }

  window.editRes = async function(id){
    const newTitle = prompt('New title'); if (!newTitle) return; const newDesc = prompt('New desc')||'';
    const data = await authFetch('/resources/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:newTitle,description:newDesc})});
    if (data.ok) fetchResources(); else alert(data.error||'Failed');
  }

  window.deleteRes = async function(id){ if (!confirm('Delete?')) return; const data = await authFetch('/resources/'+id,{method:'DELETE'}); if (data.ok) fetchResources(); else alert(data.error||'Failed'); }

  // init
  renderProfile(); fetchResources();
</script>
</body>
</html>`;
}

// Start server
server.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));

