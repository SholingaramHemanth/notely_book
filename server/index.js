const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');

// Load environment variables from .env if present
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

// Ensure defaults
process.env.PORT = process.env.PORT || '3000';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/notely';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'notely_ultra_secure_jwt_secret_token_key_2026_super_fast';

const User = require('./models/User');
const Note = require('./models/Note');
const { requireAuth } = require('./middleware/auth');

const PORT = Number(process.env.PORT);
const isPreview = Boolean(process.env.PREVIEW_ORIGIN);
let dbReady = false;
let dbError = null;

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(ROOT, 'public')));

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isPreview,
    sameSite: isPreview ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 14,
    path: '/',
  };
}

function sendError(res, status, error, details) {
  return res.status(status).json({ ok: false, error, ...(details ? { details } : {}) });
}

function dbGuard(req, res, next) {
  if (!dbReady) return sendError(res, 503, 'Database is not connected. Configure MONGO_URI and restart the server.', dbError);
  next();
}

function normalizeTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(list.map((tag) => String(tag).trim().replace(/^#/, '').toLowerCase()).filter(Boolean))].slice(0, 10);
}

function validateNoteInput(body, partial = false) {
  const errors = {};
  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (!title) errors.title = 'Give this note a title.';
    if (title.length > 140) errors.title = 'Titles must be 140 characters or fewer.';
  }
  if (body.content !== undefined && String(body.content).length > 20000) errors.content = 'Content must be 20,000 characters or fewer.';
  if (body.tags !== undefined && !Array.isArray(body.tags) && typeof body.tags !== 'string') errors.tags = 'Tags must be a list of labels.';
  return errors;
}

function safeNote(note) {
  const item = note.toObject ? note.toObject() : note;
  return {
    id: item._id?.toString?.() || item.id,
    title: item.title,
    content: item.content || '',
    tags: item.tags || [],
    isPinned: Boolean(item.isPinned),
    isArchived: Boolean(item.isArchived),
    isTrashed: Boolean(item.isTrashed),
    coverTheme: item.coverTheme || 'violet',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function signUser(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '14d' });
}

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, createdAt: user.createdAt };
}

function notesQuery(req) {
  const query = { user: req.user._id };
  const view = String(req.query.view || 'all');
  if (view === 'trash') query.isTrashed = true;
  else if (view === 'archive') Object.assign(query, { isArchived: true, isTrashed: false });
  else if (view === 'pinned') Object.assign(query, { isPinned: true, isArchived: false, isTrashed: false });
  else Object.assign(query, { isTrashed: false, isArchived: false });

  const search = String(req.query.search || '').trim();
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: regex }, { content: regex }, { tags: regex }];
  }
  if (req.query.tag) query.tags = String(req.query.tag).toLowerCase();
  return query;
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'notely', database: dbReady, error: dbReady ? null : dbError }));

// Registration
app.post('/api/auth/register', dbGuard, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const errors = {};
    if (name.length < 2) errors.name = 'Use at least 2 characters for your name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Use at least 8 characters for your password.';
    if (Object.keys(errors).length) return sendError(res, 422, 'Please check the highlighted fields.', errors);
    if (await User.exists({ email })) return sendError(res, 409, 'An account with this email already exists.');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    const token = signUser(user);
    res.cookie('notely_token', token, cookieOptions());
    return res.status(201).json({ ok: true, user: publicUser(user), token });
  } catch (error) { next(error); }
});

// Login
app.post('/api/auth/login', dbGuard, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return sendError(res, 422, 'Email and password are required.');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return sendError(res, 401, 'That email and password combination was not found.');
    const token = signUser(user);
    res.cookie('notely_token', token, cookieOptions());
    return res.json({ ok: true, user: publicUser(user), token });
  } catch (error) { next(error); }
});

// One-click Demo Workspace access
app.post('/api/auth/demo', dbGuard, async (req, res, next) => {
  try {
    const demoEmail = 'demo@notely.app';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      const passwordHash = await bcrypt.hash('NotelyDemo2026!', 10);
      demoUser = await User.create({ name: 'Alex Morgan', email: demoEmail, passwordHash });
      
      // Seed beautiful default notes for demo user
      const sampleNotes = [
        {
          user: demoUser._id,
          title: 'Welcome to Notely — Your Thoughts, Your World',
          content: 'Notely is designed to give you a tranquil, distraction-free sanctuary for capturing ideas, structuring workflows, and reflecting on progress.\n\n✨ Features to try:\n• Use ⌘K to instantly search across all notes and tags\n• Organize notes using cover moods (Violet, Cyan, Amber, Rose, Emerald)\n• Pin your priority notes to keep them front and center\n• Switch between Dark & Light mode using the sun/moon toggle\n• Export any note to Markdown with one click',
          tags: ['welcome', 'guide', 'ideas'],
          isPinned: true,
          coverTheme: 'violet',
        },
        {
          user: demoUser._id,
          title: 'Product Launch Roadmap & Milestone Goals',
          content: '1. Complete core application redesign with glassmorphism UI\n2. Integrate real-time instant search and keyboard shortcuts\n3. Implement color mood covers with fluid CSS micro-animations\n4. Add export note to markdown and word count tracking\n5. Test multi-device responsive layout across desktop and mobile',
          tags: ['product', 'goals', 'planning'],
          isPinned: true,
          coverTheme: 'cyan',
        },
        {
          user: demoUser._id,
          title: 'Quiet Reflections: Designing for Focus',
          content: '“A small note today can create a big opportunity tomorrow.”\n\nThe secret to effortless productivity is not doing more; it is creating mental clarity. When every stray thought has a welcoming home, the mind is free to innovate and explore without clutter.',
          tags: ['ritual', 'creativity', 'thoughts'],
          isPinned: false,
          coverTheme: 'amber',
        },
        {
          user: demoUser._id,
          title: 'Weekend Reading List & Architecture Notes',
          content: '• Designing Data-Intensive Applications — Martin Kleppmann\n• Clean Code Principles & Modern Reactive Patterns\n• Micro-interactions: Designing with Details — Dan Saffer\n• The Architecture of Community Software Systems',
          tags: ['books', 'reading', 'learning'],
          isPinned: false,
          coverTheme: 'emerald',
        },
      ];
      await Note.insertMany(sampleNotes);
    }
    const token = signUser(demoUser);
    res.cookie('notely_token', token, cookieOptions());
    return res.json({ ok: true, user: publicUser(demoUser), token });
  } catch (error) { next(error); }
});

// Logout
app.post('/api/auth/logout', (req, res) => res.clearCookie('notely_token', cookieOptions()).json({ ok: true }));

// Current user
app.get('/api/auth/me', dbGuard, requireAuth, (req, res) => res.json({ ok: true, user: publicUser(req.user) }));

// List notes
app.get('/api/notes', dbGuard, requireAuth, async (req, res, next) => {
  try {
    const sortMap = {
      newest: { updatedAt: -1 },
      oldest: { updatedAt: 1 },
      title: { title: 1 },
      'title-desc': { title: -1 }
    };
    const sort = sortMap[String(req.query.sort || 'newest')] || sortMap.newest;
    const notes = await Note.find(notesQuery(req)).sort(sort).limit(300).lean();
    res.json({ ok: true, notes: notes.map(safeNote) });
  } catch (error) { next(error); }
});

// Create note
app.post('/api/notes', dbGuard, requireAuth, async (req, res, next) => {
  try {
    const errors = validateNoteInput(req.body);
    if (Object.keys(errors).length) return sendError(res, 422, 'Please check the note fields.', errors);
    const note = await Note.create({
      user: req.user._id,
      title: String(req.body.title).trim(),
      content: String(req.body.content || '').trim(),
      tags: normalizeTags(req.body.tags),
      isPinned: Boolean(req.body.isPinned),
      coverTheme: ['violet', 'cyan', 'amber', 'rose', 'emerald'].includes(req.body.coverTheme) ? req.body.coverTheme : 'violet',
    });
    res.status(201).json({ ok: true, note: safeNote(note) });
  } catch (error) { next(error); }
});

// Update note
app.put('/api/notes/:id', dbGuard, requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, 'That note id is not valid.');
    const errors = validateNoteInput(req.body, true);
    if (Object.keys(errors).length) return sendError(res, 422, 'Please check the note fields.', errors);
    const updates = {};
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.content !== undefined) updates.content = String(req.body.content).trim();
    if (req.body.tags !== undefined) updates.tags = normalizeTags(req.body.tags);
    for (const key of ['isPinned', 'isArchived', 'isTrashed']) {
      if (req.body[key] !== undefined) updates[key] = Boolean(req.body[key]);
    }
    if (req.body.coverTheme && ['violet', 'cyan', 'amber', 'rose', 'emerald'].includes(req.body.coverTheme)) {
      updates.coverTheme = req.body.coverTheme;
    }
    const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updates, { new: true, runValidators: true });
    if (!note) return sendError(res, 404, 'Note not found in your workspace.');
    res.json({ ok: true, note: safeNote(note) });
  } catch (error) { next(error); }
});

// Empty trash
app.delete('/api/notes/trash/empty', dbGuard, requireAuth, async (req, res, next) => {
  try {
    const result = await Note.deleteMany({ user: req.user._id, isTrashed: true });
    res.json({ ok: true, count: result.deletedCount });
  } catch (error) { next(error); }
});

// Delete or move note to trash
app.delete('/api/notes/:id', dbGuard, requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 400, 'That note id is not valid.');
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return sendError(res, 404, 'Note not found in your workspace.');
    if (String(req.query.permanent) === 'true') {
      if (!note.isTrashed) return sendError(res, 400, 'Only notes already in Trash can be permanently deleted.');
      await note.deleteOne();
      return res.json({ ok: true, permanentlyDeleted: true });
    }
    note.isTrashed = true;
    note.isArchived = false;
    await note.save();
    res.json({ ok: true, note: safeNote(note) });
  } catch (error) { next(error); }
});

// Live Stats
app.get('/api/stats', dbGuard, requireAuth, async (req, res, next) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    const active = { user: req.user._id, isTrashed: false, isArchived: false };
    const [totalNotes, pinnedNotes, archivedNotes, trashNotes, tags, createdThisWeek] = await Promise.all([
      Note.countDocuments({ user: req.user._id, isTrashed: false }),
      Note.countDocuments({ ...active, isPinned: true }),
      Note.countDocuments({ user: req.user._id, isArchived: true, isTrashed: false }),
      Note.countDocuments({ user: req.user._id, isTrashed: true }),
      Note.distinct('tags', { user: req.user._id, isTrashed: false }),
      Note.countDocuments({ user: req.user._id, isTrashed: false, createdAt: { $gte: startOfWeek } }),
    ]);
    res.json({ ok: true, stats: { totalNotes, pinnedNotes, archivedNotes, trashNotes, totalTags: tags.length, createdThisWeek } });
  } catch (error) { next(error); }
});

// Live Activity trail
app.get('/api/activity', dbGuard, requireAuth, async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(8).lean();
    res.json({
      ok: true,
      activity: notes.map((note) => ({
        id: note._id,
        title: note.title,
        updatedAt: note.updatedAt,
        type: note.isTrashed ? 'trash' : note.isArchived ? 'archive' : note.isPinned ? 'pin' : 'edit'
      }))
    });
  } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
  console.error('[notely error]', error.message);
  if (res.headersSent) return next(error);
  return sendError(res, 500, 'Something went wrong on the server.');
});

async function start() {
  const mongoUri = process.env.MONGO_URI;
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    dbReady = true;
    console.log('[notely] MongoDB connected successfully at', mongoUri);
  } catch (error) {
    dbError = 'MongoDB connection failed: ' + error.message;
    console.error('[notely] MongoDB error:', error.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: path.join(ROOT, 'client'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(ROOT, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(ROOT, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[notely] Server running at http://localhost:${PORT}`);
  });
}

start();
