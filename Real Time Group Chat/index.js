


const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Optional libs
let Redis;
let mongoose;
let cron;
let redisClient;
let MessageModel;

const USE_REDIS = process.env.USE_REDIS === 'true' || process.env.USE_REDIS === '1';
const USE_MONGO = process.env.USE_MONGO === 'true' || process.env.USE_MONGO === '1';

if (USE_REDIS) {
  try {
    Redis = require('ioredis');
  } catch (e) {
    console.warn('ioredis not installed. Install with `npm i ioredis` to enable Redis support.');
  }
}

if (USE_MONGO) {
  try {
    mongoose = require('mongoose');
    cron = require('node-cron');
  } catch (e) {
    console.warn('mongoose or node-cron not installed. Install with `npm i mongoose node-cron` to enable Mongo + cron backup.');
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// In-memory stores (fallback if Redis not used)
const onlineUsers = new Map(); // socketId -> {name, isAdmin, room}
const messages = []; // {id, user, text, time, room, isAdmin}
let idCounter = 1;

// Redis keys
const REDIS_MESSAGES_LIST_KEY = 'chat:messages';
const REDIS_MAX_MESSAGES = 200; // keep latest N

// Setup Redis if requested
if (USE_REDIS && Redis) {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new Redis(redisUrl);
  redisClient.on('error', (err) => console.error('Redis error:', err));
}

// Setup Mongo if requested
if (USE_MONGO && mongoose) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_backup';
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
    console.log('Connected to MongoDB for backups');
  }).catch(err=> console.error('Mongo connect error:', err));

  const messageSchema = new mongoose.Schema({
    user: String,
    text: String,
    time: Date,
    room: String,
    isAdmin: Boolean
  }, { timestamps: true });

  MessageModel = mongoose.model('Message', messageSchema);
}

// Cron job: periodically backup from Redis to Mongo
if (USE_REDIS && USE_MONGO && redisClient && MessageModel && cron) {
  const schedule = process.env.BACKUP_CRON || '*/1 * * * *'; // every minute default
  cron.schedule(schedule, async () => {
    try {
      // fetch entire list
      const raw = await redisClient.lrange(REDIS_MESSAGES_LIST_KEY, 0, -1);
      if (!raw || raw.length === 0) return;
      const docs = raw.map(r => JSON.parse(r));
      // Save to Mongo (insertMany is fine; in real app consider dedupe)
      await MessageModel.insertMany(docs.map(d=>({user:d.user,text:d.text,time:new Date(d.time),room:d.room,isAdmin:!!d.isAdmin}))); 
      console.log(`[cron] Backed up ${docs.length} messages from Redis -> Mongo`);
      // Optional: trim Redis list after backup
      // await redisClient.del(REDIS_MESSAGES_LIST_KEY);
    } catch (err) {
      console.error('[cron] Backup error:', err);
    }
  });
}

// Serve static (none) but send single-page HTML
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(frontendHTML());
});

// Minimal API to fetch recent history (from Redis -> Mongo -> memory)
app.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    if (redisClient) {
      const raw = await redisClient.lrange(REDIS_MESSAGES_LIST_KEY, -limit, -1);
      const parsed = raw.map(r => JSON.parse(r));
      return res.json({ source: 'redis', messages: parsed });
    }
    if (MessageModel) {
      const docs = await MessageModel.find().sort({ time: -1 }).limit(limit).lean();
      return res.json({ source: 'mongo', messages: docs.reverse() });
    }
    // fallback memory
    return res.json({ source: 'memory', messages: messages.slice(-limit) });
  } catch (err) {
    console.error('/history error', err);
    res.status(500).json({ error: 'history fetch failed' });
  }
});

// Helper to push message to stores
async function storeMessage(msg) {
  msg.id = idCounter++;
  msg.time = msg.time || new Date().toISOString();
  messages.push(msg);
  // cap memory
  if (messages.length > 1000) messages.shift();

  if (redisClient) {
    try {
      await redisClient.rpush(REDIS_MESSAGES_LIST_KEY, JSON.stringify(msg));
      await redisClient.ltrim(REDIS_MESSAGES_LIST_KEY, -REDIS_MAX_MESSAGES, -1);
    } catch (e) { console.warn('Redis push failed', e); }
  }
}

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // Expect client to register immediately
  socket.on('register', async (payload, ack) => {
    try {
      const { name, isAdmin, room } = payload || {};
      if (!name || typeof name !== 'string') {
        return ack && ack({ ok: false, error: 'Name required' });
      }
      // Save online user
      onlineUsers.set(socket.id, { name, isAdmin: !!isAdmin, room: room || 'general' });
      socket.join(room || 'general');

      // Notify all about updated online users list
      broadcastOnlineUsers();

      // Send recent history (prefer Redis)
      let recent = [];
      if (redisClient) {
        const raw = await redisClient.lrange(REDIS_MESSAGES_LIST_KEY, -50, -1);
        recent = raw.map(r => JSON.parse(r));
      } else if (MessageModel) {
        const docs = await MessageModel.find().sort({ time: -1 }).limit(50).lean();
        recent = docs.reverse();
      } else {
        recent = messages.slice(-50);
      }

      socket.emit('history', recent);

      // broadcast a system message
      const sysMsg = { user: 'System', text: `${name} joined the chat`, time: new Date().toISOString(), room: room || 'general', isAdmin: false };
      await storeMessage(sysMsg);
      io.to(room || 'general').emit('message', sysMsg);

      ack && ack({ ok: true });
    } catch (err) {
      console.error('register error', err);
      ack && ack({ ok: false, error: 'Server error' });
    }
  });

  socket.on('sendMessage', async (payload, ack) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return ack && ack({ ok: false, error: 'Register first' });
      const { text, room } = payload || {};
      if (!text || typeof text !== 'string') return ack && ack({ ok: false, error: 'Empty message' });

      const targetRoom = room || user.room || 'general';
      const msg = { user: user.name, text, time: new Date().toISOString(), room: targetRoom, isAdmin: !!user.isAdmin };
      await storeMessage(msg);

      io.to(targetRoom).emit('message', msg);
      ack && ack({ ok: true });
    } catch (err) {
      console.error('sendMessage error', err);
      ack && ack({ ok: false, error: 'Server error' });
    }
  });

  socket.on('adminBroadcast', async (payload, ack) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user || !user.isAdmin) return ack && ack({ ok: false, error: 'Not authorized' });
      const { text } = payload || {};
      if (!text) return ack && ack({ ok: false, error: 'Empty' });

      const msg = { user: user.name, text, time: new Date().toISOString(), room: 'ALL', isAdmin: true };
      await storeMessage(msg);

      // broadcast to everyone
      io.emit('adminMessage', msg);
      ack && ack({ ok: true });
    } catch (err) {
      console.error('adminBroadcast error', err);
      ack && ack({ ok: false, error: 'Server error' });
    }
  });

  socket.on('createOrJoinRoom', (payload, ack) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return ack && ack({ ok:false, error:'Register first' });
    const { room } = payload || {};
    if (!room) return ack && ack({ ok:false, error:'Room name required' });
    // leave previous
    const prev = user.room || 'general';
    socket.leave(prev);
    user.room = room;
    socket.join(room);
    broadcastOnlineUsers();
    ack && ack({ ok:true, room });
  });

  socket.on('disconnect', async (reason) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      broadcastOnlineUsers();
      const sysMsg = { user: 'System', text: `${user.name} left the chat`, time: new Date().toISOString(), room: user.room || 'general', isAdmin:false };
      await storeMessage(sysMsg);
      io.to(user.room || 'general').emit('message', sysMsg);
    }
    console.log('socket disconnected', socket.id, reason);
  });
});

function broadcastOnlineUsers() {
  // aggregate by name and room to present friendly list
  const list = [];
  for (const [sid, info] of onlineUsers.entries()) {
    list.push({ id: sid, name: info.name, isAdmin: info.isAdmin, room: info.room });
  }
  io.emit('onlineUsers', list);
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// ---------------- FRONTEND ----------------
function frontendHTML(){
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Real-Time Group Chat (Single File)</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;display:flex;align-items:flex-start;gap:20px;padding:20px}
  .panel{border:1px solid #ddd;padding:12px;border-radius:8px;width:350px}
  .chat{flex:1;min-width:300px}
  .messages{height:400px;overflow:auto;border:1px solid #eee;padding:8px;border-radius:6px;background:#fafafa}
  .msg{padding:6px;border-bottom:1px dashed #eee}
  .meta{font-size:12px;color:#666}
  .online{list-style:none;padding:0}
  input,button,select{padding:8px;margin-top:6px;width:100%;box-sizing:border-box}
  .small{width:48%;display:inline-block}
  .admin{background:#fffbdd;border-left:4px solid #f7c948}
</style>
</head>
<body>
  <div class="panel">
    <h3>Register / Join</h3>
    <input id="name" placeholder="Your name" />
    <label style="display:block;margin-top:6px"><input type="checkbox" id="isAdmin" /> Admin?</label>
    <input id="room" placeholder="Room (default: general)" />
    <button id="joinBtn">Register & Join</button>
    <button id="disconnectBtn" style="margin-top:8px">Disconnect</button>
    <h4 style="margin-top:10px">Online Users</h4>
    <ul id="online" class="online"></ul>
  </div>

  <div class="panel chat">
    <h3>Group Chat</h3>
    <div class="messages" id="messages"></div>
    <input id="messageInput" placeholder="Type a message" />
    <div style="display:flex;gap:6px;margin-top:6px">
      <button id="sendBtn" style="flex:1">Send</button>
      <button id="createRoomBtn" style="flex:1">Create/Join Room</button>
    </div>
    <h4 style="margin-top:10px">Admin Broadcast</h4>
    <input id="adminMsg" placeholder="Admin announcement" />
    <button id="adminSend">Broadcast as Admin</button>
  </div>

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  const socket = io();
  let registered = false;
  let myName = null;
  let myRoom = null;
  let amAdmin = false;

  const $ = (id) => document.getElementById(id);
  const messagesEl = $('messages');
  const onlineEl = $('online');

  function addMessage(m){
    const d = document.createElement('div');
    d.className = 'msg' + (m.isAdmin? ' admin':'');
    d.innerHTML = `<div><strong>${escapeHtml(m.user)}</strong> <span class="meta">${new Date(m.time).toLocaleString()} ${m.room?('<em>('+escapeHtml(m.room)+')</em>'):''}</span></div><div>${escapeHtml(m.text)}</div>`;
    messagesEl.appendChild(d);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(s){
    if(!s) return '';
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  // handle history
  socket.on('history', (arr) => {
    messagesEl.innerHTML = '';
    arr.forEach(addMessage);
  });

  socket.on('message', (m) => addMessage(m));
  socket.on('adminMessage', (m) => addMessage(m));

  socket.on('onlineUsers', (list) => {
    onlineEl.innerHTML = '';
    list.forEach(u => {
      const li = document.createElement('li');
      li.textContent = `${u.name} ${u.isAdmin? '(admin)':''} ${u.room? '['+u.room+']' : ''}`;
      onlineEl.appendChild(li);
    });
  });

  $('joinBtn').addEventListener('click', () => {
    const name = $('name').value.trim();
    const isAdmin = $('isAdmin').checked;
    const room = $('room').value.trim() || 'general';
    if (!name) return alert('Enter name');
    socket.emit('register', { name, isAdmin, room }, (res) => {
      if (res && res.ok) {
        registered = true; myName = name; myRoom = room; amAdmin = isAdmin;
        console.log('Registered');
      } else {
        alert('Register failed: ' + (res && res.error));
      }
    });
  });

  $('disconnectBtn').addEventListener('click', () => {
    socket.disconnect();
    registered = false;
    onlineEl.innerHTML = '';
    messagesEl.innerHTML = '';
  });

  $('sendBtn').addEventListener('click', () => {
    if (!registered) return alert('Register first');
    const text = $('messageInput').value.trim();
    if (!text) return;
    socket.emit('sendMessage', { text, room: myRoom }, (res) => {
      if (!res || !res.ok) alert('send failed: '+(res && res.error));
      else $('messageInput').value = '';
    });
  });

  $('createRoomBtn').addEventListener('click', () => {
    if (!registered) return alert('Register first');
    const room = prompt('Room name?', myRoom || 'general');
    if (!room) return;
    socket.emit('createOrJoinRoom', { room }, (res) => {
      if (res && res.ok) { myRoom = room; alert('Joined '+room); }
      else alert('Room error: '+(res && res.error));
    });
  });

  $('adminSend').addEventListener('click', () => {
    if (!registered) return alert('Register first');
    const text = $('adminMsg').value.trim();
    if (!text) return;
    socket.emit('adminBroadcast', { text }, (res) => {
      if (!res || !res.ok) alert('Admin send failed: '+(res && res.error));
      else $('adminMsg').value = '';
    });
  });

  // reconnect handling: when reconnect, client must re-register
  socket.on('connect', () => {
    console.log('socket connected');
    if (myName) {
      socket.emit('register', { name: myName, isAdmin: amAdmin, room: myRoom }, (res)=>{
        // noop
      });
    }
  });

  socket.on('disconnect', () => console.log('socket disconnected'));
</script>
</body>
</html>`;
}
