import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  Archive, ArrowLeft, Check, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, FileText, Feather, Grid2X2, LayoutDashboard, List, LogOut, Menu, MoreVertical,
  Moon, Pencil, Pin, Plus, Search, Settings, Sparkles, Tag, Trash2, X, Sun, RotateCcw,
  BookOpen, BriefcaseBusiness, Lightbulb, FolderHeart, SlidersHorizontal, Copy, Download
} from 'lucide-react';
import './styles.css';

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Request failed.');
    error.details = payload.details;
    error.status = response.status;
    throw error;
  }
  return payload;
};

const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Intl.DateTimeFormat('en', options).format(new Date(value));

const relativeDate = (value) => {
  const diff = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 2) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  if (diff < 10080) return `${Math.round(diff / 1440)}d ago`;
  return formatDate(value, { month: 'short', day: 'numeric' });
};

const initials = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'N';
const coverThemes = ['violet', 'cyan', 'amber', 'rose', 'emerald'];
const themeIcons = { violet: Sparkles, cyan: Lightbulb, amber: BookOpen, rose: FolderHeart, emerald: BriefcaseBusiness };

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setState({ loading: false, user: data.user }))
      .catch(() => setState({ loading: false, user: null }));
  }, []);

  if (state.loading) {
    return (
      <div className="page-loader">
        <div className="loader-orbit" />
        <span>Opening your workspace…</span>
      </div>
    );
  }
  if (!state.user) return <Navigate to="/login" replace />;
  return React.cloneElement(children, { user: state.user });
}

function AuthScreen({ mode }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      await api(`/api/auth/${isRegister ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(payload) });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const tryDemo = async () => {
    setStatus({ loading: true, error: '' });
    try {
      await api('/api/auth/demo', { method: 'POST' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-skyline" />
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />
      <section className="auth-pitch">
        <Link to="/login" className="brand brand-large">
          <span className="brand-mark"><Feather size={27} /></span>
          <span>notely</span>
        </Link>
        <div className="pitch-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> your thoughts, your world</p>
          <h1>Make space for<br /><em>good ideas.</em></h1>
          <p>Notely is a calm, cinematic home for the notes, plans, and little sparks that move your world forward.</p>
        </div>
        <div className="pitch-quote">
          <span>“</span>
          <p>A small note today can create a big opportunity tomorrow.</p>
          <span>”</span>
        </div>
      </section>

      <section className="auth-card glass-panel">
        <div className="auth-card-top">
          <span className="mini-kicker">{isRegister ? 'Start your ritual' : 'Welcome back'}</span>
          <div className="auth-card-icon"><Sparkles size={18} /></div>
        </div>
        <h2>{isRegister ? 'Create your workspace' : 'Good to see you again.'}</h2>
        <p className="auth-subtitle">
          {isRegister ? 'A quieter place for louder ideas.' : 'Your next great idea might already be here.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {isRegister && (
            <label>
              Full name
              <input
                required
                minLength="2"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                required
                minLength="8"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {status.error && <div className="form-error"><CircleHelp size={16} />{status.error}</div>}
          <button className="button button-primary button-wide" disabled={status.loading}>
            {status.loading ? <span className="button-spinner" /> : isRegister ? 'Create my Notely' : 'Open my workspace'}
            <ArrowLeft size={16} className="arrow-right" />
          </button>
          <button
            type="button"
            className="button button-soft button-wide demo-button"
            onClick={tryDemo}
            disabled={status.loading}
            title="Instant one-click access with demo data"
          >
            <Sparkles size={15} /> Try Demo Workspace
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to Notely?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create one'}</Link>
        </p>
        <div className="auth-footnote"><LockIcon /> Your notes stay yours. Always.</div>
      </section>
    </main>
  );
}

function LockIcon() { return <span className="lock-icon">✦</span>; }

function Dashboard({ user }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [view, setView] = useState('all');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('newest');
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({ totalNotes: 0, pinnedNotes: 0, archivedNotes: 0, trashNotes: 0, totalTags: 0, createdThisWeek: 0 });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [listView, setListView] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('notely-theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ view, sort });
      if (search.trim()) query.set('search', search.trim());
      if (tag) query.set('tag', tag);
      const [noteData, statData, activityData] = await Promise.all([
        api(`/api/notes?${query}`),
        api('/api/stats'),
        api('/api/activity')
      ]);
      setNotes(noteData.notes);
      setStats(statData.stats);
      setActivity(activityData.activity);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 200 : 0);
    return () => clearTimeout(timer);
  }, [view, search, tag, sort]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('notely-theme', dark ? 'dark' : 'light');
    return () => delete document.body.dataset.theme;
  }, [dark]);

  const allTags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))].slice(0, 12), [notes]);
  const tagCounts = useMemo(() => {
    const counts = {};
    notes.flatMap((note) => note.tags).forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [notes]);

  const showToast = (message, kind = 'success') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3200);
  };

  const saveNote = async (draft) => {
    try {
      const data = draft.id
        ? await api(`/api/notes/${draft.id}`, { method: 'PUT', body: JSON.stringify(draft) })
        : await api('/api/notes', { method: 'POST', body: JSON.stringify(draft) });
      setEditor(null);
      showToast(draft.id ? 'Note saved.' : 'Note created.');
      await loadData();
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const updateNote = async (note, patch, message) => {
    try {
      await api(`/api/notes/${note.id}`, { method: 'PUT', body: JSON.stringify(patch) });
      showToast(message);
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteNote = async (note, permanent = false) => {
    try {
      await api(`/api/notes/${note.id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' });
      showToast(permanent ? 'Note permanently deleted.' : 'Note moved to Trash.');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const duplicateNote = async (note) => {
    try {
      await api('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: `${note.title} (Copy)`,
          content: note.content,
          tags: note.tags,
          coverTheme: note.coverTheme,
          isPinned: false
        })
      });
      showToast('Note duplicated.');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const exportNote = (note) => {
    const markdown = `# ${note.title}\n\nTags: ${note.tags.map(t => '#' + t).join(' ')}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n\n---\n\n${note.content || ''}\n`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9_-]/gi, '_') || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Note exported as Markdown.');
  };

  const emptyTrash = async () => {
    if (!window.confirm('Empty trash permanently? All trashed notes will be deleted forever.')) return;
    try {
      await api('/api/notes/trash/empty', { method: 'DELETE' });
      showToast('Trash emptied.');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    navigate('/login', { replace: true });
  };

  const nav = (nextView) => {
    setView(nextView);
    setTag('');
    setSelectedDay(null);
    setMobileNav(false);
  };

  // Filter notes by calendar day if clicked
  const displayedNotes = useMemo(() => {
    if (!selectedDay) return notes;
    return notes.filter((n) => {
      const d = new Date(n.updatedAt || n.createdAt);
      return d.getDate() === selectedDay.day && d.getMonth() === selectedDay.month && d.getFullYear() === selectedDay.year;
    });
  }, [notes, selectedDay]);

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        view={view}
        onNavigate={nav}
        onNew={() => setEditor({})}
        mobileOpen={mobileNav}
        onClose={() => setMobileNav(false)}
        onLogout={logout}
        stats={stats}
      />
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main className="main-column">
        <Topbar
          user={user}
          search={search}
          setSearch={setSearch}
          searchRef={searchRef}
          dark={dark}
          setDark={setDark}
          onMenu={() => setMobileNav(true)}
          onLogout={logout}
        />

        <div className="content-wrap">
          <Hero user={user} onNew={() => setEditor({})} />

          <div className="stats-grid">
            <StatCard icon={FileText} label="Total notes" value={stats.totalNotes} tone="violet" delta="Your thinking, in one place" />
            <StatCard icon={Pin} label="Pinned notes" value={stats.pinnedNotes} tone="emerald" delta="Ideas worth keeping close" />
            <StatCard icon={Tag} label="Tags in use" value={stats.totalTags} tone="cyan" delta="A little order, a lot of clarity" />
            <StatCard icon={Clock3} label="This week" value={stats.createdThisWeek} tone="amber" delta="New sparks since Monday" />
          </div>

          <div className="workspace-layout">
            <section className="notes-area">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Your collection</p>
                  <h2>
                    {view === 'trash' ? 'Trash' : view === 'archive' ? 'Archive' : view === 'pinned' ? 'Pinned notes' : 'Recent notes'}
                    {selectedDay && <span className="active-day-filter"> — Day {selectedDay.day} <button onClick={() => setSelectedDay(null)} aria-label="Clear day filter">×</button></span>}
                  </h2>
                </div>
                <div className="heading-actions">
                  {view === 'trash' && notes.length > 0 && (
                    <button className="button button-ghost danger-btn" onClick={emptyTrash} title="Empty all trashed notes">
                      <Trash2 size={15} /> Empty trash
                    </button>
                  )}
                  <button
                    className="icon-button desktop-only"
                    title="Grid view"
                    aria-label="Grid view"
                    onClick={() => setListView(false)}
                    data-active={!listView}
                  >
                    <Grid2X2 size={17} />
                  </button>
                  <button
                    className="icon-button desktop-only"
                    title="List view"
                    aria-label="List view"
                    onClick={() => setListView(true)}
                    data-active={listView}
                  >
                    <List size={17} />
                  </button>
                  <button className="button button-soft" onClick={() => setEditor({})}>
                    <Plus size={16} /> New note
                  </button>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-scroll">
                  <button
                    className={`filter-chip ${!tag ? 'active' : ''}`}
                    onClick={() => setTag('')}
                  >
                    All notes <span>{view === 'all' ? stats.totalNotes : ''}</span>
                  </button>
                  {allTags.map((item) => (
                    <button
                      className={`filter-chip ${tag === item ? 'active' : ''}`}
                      key={item}
                      onClick={() => setTag(tag === item ? '' : item)}
                    >
                      #{item}
                    </button>
                  ))}
                </div>

                <label className="sort-select">
                  <SlidersHorizontal size={14} />
                  <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort notes">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                    <option value="title-desc">Title Z–A</option>
                  </select>
                </label>
              </div>

              {error && (
                <div className="state-card error-state">
                  <CircleHelp size={22} />
                  <div>
                    <strong>We couldn’t load this view</strong>
                    <p>{error}</p>
                  </div>
                  <button className="button button-soft" onClick={loadData}>Try again</button>
                </div>
              )}

              {loading && !error ? (
                <LoadingGrid listView={listView} />
              ) : !error && displayedNotes.length === 0 ? (
                <EmptyState view={view} onNew={() => setEditor({})} selectedDay={selectedDay} onClearDay={() => setSelectedDay(null)} />
              ) : !error && (
                <div className={listView ? 'note-list' : 'note-grid'}>
                  {displayedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      listView={listView}
                      onOpen={() => setEditor(note)}
                      onPin={() => updateNote(note, { isPinned: !note.isPinned }, note.isPinned ? 'Unpinned.' : 'Pinned to north stars.')}
                      onArchive={() => updateNote(note, { isArchived: !note.isArchived }, note.isArchived ? 'Restored from Archive.' : 'Archived.')}
                      onRestore={() => updateNote(note, { isTrashed: false }, 'Restored from Trash.')}
                      onDelete={() => deleteNote(note, Boolean(note.isTrashed))}
                      onDuplicate={() => duplicateNote(note)}
                      onExport={() => exportNote(note)}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="context-rail">
              <CalendarWidget onSelectDay={(dayObj) => setSelectedDay(selectedDay?.day === dayObj.day ? null : dayObj)} selectedDay={selectedDay} />
              <TagsWidget tagCounts={tagCounts} activeTag={tag} onTag={setTag} />
              <ActivityTimeline activity={activity} />
              <button className="rail-create-button" onClick={() => setEditor({})}>
                <Plus size={18} /> Create new note
              </button>
            </aside>
          </div>
        </div>
      </main>

      {editor && <NoteEditor note={editor} onClose={() => setEditor(null)} onSave={saveNote} onExport={exportNote} />}

      {toast && (
        <div className={`toast toast-${toast.kind}`}>
          <span className="toast-mark">{toast.kind === 'success' ? <Check size={15} /> : <CircleHelp size={15} />}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Sidebar({ user, view, onNavigate, onNew, mobileOpen, onClose, onLogout, stats }) {
  const items = [
    { id: 'all', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all-notes', label: 'All notes', icon: FileText, count: stats.totalNotes },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: stats.pinnedNotes },
    { id: 'archive', label: 'Archive', icon: Archive, count: stats.archivedNotes },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trashNotes },
  ];

  const go = (id) => {
    onNavigate(id === 'all-notes' ? 'all' : id);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-inner">
        <div className="sidebar-brand">
          <Link to="/" className="brand">
            <span className="brand-mark"><Feather size={21} /></span>
            <span>notely</span>
          </Link>
          <button className="icon-button mobile-only" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <p className="brand-tagline">Capture <i>•</i> Organize <i>•</i> Grow</p>

        <nav className="side-nav" aria-label="Primary navigation">
          {items.map(({ id, label, icon: Icon, count }) => (
            <button
              key={label}
              className={`side-nav-item ${(view === id || (id === 'all' && view === 'all')) ? 'active' : ''}`}
              onClick={() => go(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {count !== undefined && count > 0 ? <b>{count}</b> : null}
            </button>
          ))}
        </nav>

        <div className="side-divider" />
        <div className="side-section-label">
          Spaces
        </div>
        <button className="space-item" onClick={() => onNavigate('all')}>
          <span className="space-dot space-purple" />Personal <span className="space-count">{stats.totalNotes}</span>
        </button>
        <button className="space-item" onClick={() => onNavigate('all')}>
          <span className="space-dot space-cyan" />Ideas & Sparks <span className="space-count">{stats.totalTags}</span>
        </button>
        <button className="space-item" onClick={() => onNavigate('all')}>
          <span className="space-dot space-amber" />This week <span className="space-count">{stats.createdThisWeek}</span>
        </button>

        <div className="upgrade-card">
          <div className="upgrade-stars"><Sparkles size={15} /> daily ritual</div>
          <strong>“A small note today<br /><em>creates a big opportunity tomorrow.”</em></strong>
          <p>Keep your best thoughts organized and within reach.</p>
          <button onClick={onNew}>
            Write a note <ArrowLeft size={15} className="arrow-right" />
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-row">
            <span className="avatar avatar-small">{initials(user.name)}</span>
            <span className="profile-copy">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <button className="logout-link" onClick={onLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ user, search, setSearch, searchRef, dark, setDark, onMenu, onLogout }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="top-search">
        <Search size={18} />
        <input
          ref={searchRef}
          placeholder="Search by title, content or tags… (⌘K)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search ? (
          <button className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">×</button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </div>

      <div className="top-actions">
        <button
          className="icon-button"
          aria-label="Toggle theme"
          onClick={() => setDark(!dark)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="top-avatar avatar" onClick={onLogout} title="Click to sign out">
          {initials(user.name)}
        </button>
      </div>
    </header>
  );
}

function Hero({ user, onNew }) {
  const hour = new Date().getHours();
  const timeWord = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const firstName = user.name ? user.name.split(' ')[0] : 'friend';

  return (
    <section className="hero">
      <div className="hero-art" />
      <div className="hero-content">
        <p className="eyebrow"><span className="eyebrow-dot" /> a calm room to think</p>
        <h1>Good {timeWord},<br /><span>{firstName}</span> <span className="wave">✦</span></h1>
        <p>Capture your thoughts, organize your ideas,<br className="desktop-only" /> and turn small sparks into something real.</p>
        <button className="hero-cta" onClick={onNew}>
          <Plus size={16} /> Capture an idea
        </button>
      </div>
      <div className="hero-note">
        <span>Good ideas</span>
        <strong>start with a note.</strong>
        <i />
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, tone, delta }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>
      <div className="stat-spark"><i /><i /><i /><i /><i /></div>
    </article>
  );
}

function NoteCard({ note, listView, onOpen, onPin, onArchive, onRestore, onDelete, onDuplicate, onExport }) {
  const ThemeIcon = themeIcons[note.coverTheme] || Sparkles;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <article className={`note-card note-${note.coverTheme} ${listView ? 'note-card-list' : ''}`}>
      <button className="note-cover" onClick={onOpen} aria-label={`Open ${note.title}`}>
        <span className="cover-glow" />
        <ThemeIcon size={listView ? 20 : 26} />
      </button>

      <div className="note-body">
        <div className="note-head">
          <button className="note-title" onClick={onOpen}>{note.title}</button>
          <div className="note-menu" ref={menuRef}>
            <button
              className="icon-button tiny"
              aria-label="Note actions"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="note-menu-popover show-menu">
                <button onClick={() => { setMenuOpen(false); onOpen(); }}>
                  <Pencil size={13} /> Edit note
                </button>
                <button onClick={() => { setMenuOpen(false); onPin(); }}>
                  <Pin size={13} /> {note.isPinned ? 'Unpin' : 'Pin to top'}
                </button>
                <button onClick={() => { setMenuOpen(false); onDuplicate(); }}>
                  <Copy size={13} /> Duplicate note
                </button>
                <button onClick={() => { setMenuOpen(false); onExport(); }}>
                  <Download size={13} /> Export (.md)
                </button>
                {note.isTrashed ? (
                  <button onClick={() => { setMenuOpen(false); onRestore(); }}>
                    <RotateCcw size={13} /> Restore note
                  </button>
                ) : (
                  <button onClick={() => { setMenuOpen(false); onArchive(); }}>
                    <Archive size={13} /> {note.isArchived ? 'Restore' : 'Archive'}
                  </button>
                )}
                <button
                  className="danger-action"
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                >
                  <Trash2 size={13} /> {note.isTrashed ? 'Delete forever' : 'Move to trash'}
                </button>
              </div>
            )}
          </div>
        </div>

        {note.isPinned && (
          <span className="pin-badge" title="Pinned note">
            <Pin size={11} fill="currentColor" />
          </span>
        )}

        <p className="note-preview" onClick={onOpen}>
          {note.content || 'A blank page is still a beginning.'}
        </p>

        <div className="note-footer">
          <div className="tag-list">
            {note.tags.slice(0, 3).map((item, index) => (
              <span className={`tag tag-${index % 4}`} key={item}>#{item}</span>
            ))}
          </div>
          <span className="note-date">
            <Clock3 size={11} /> {relativeDate(note.updatedAt || note.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function LoadingGrid({ listView }) {
  return (
    <div className={listView ? 'note-list' : 'note-grid'}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div className="skeleton-note" key={item}>
          <div className="skeleton-cover shimmer" />
          <div className="skeleton-lines">
            <span className="shimmer" />
            <span className="shimmer" />
            <span className="shimmer short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ view, onNew, selectedDay, onClearDay }) {
  if (selectedDay) {
    return (
      <div className="state-card empty-state">
        <div className="empty-orbit"><Clock3 size={24} /></div>
        <h3>No notes on Day {selectedDay.day}</h3>
        <p>No notes were updated on this date. Click below to view all notes or write a fresh one.</p>
        <button className="button button-soft" onClick={onClearDay}>Show all notes</button>
      </div>
    );
  }

  const labels = {
    trash: ['Trash is clear.', 'Deleted notes will rest here until you decide to restore or erase them.'],
    archive: ['Nothing archived yet.', 'Archive notes you want to keep preserved without cluttering your main board.'],
    pinned: ['Pin your north stars.', 'Click the pin icon on any note to place it in your priority constellation.'],
    all: ['Your space is ready.', 'Capture an idea, outline a plan, or jot down whatever is on your mind.']
  };
  const [title, copy] = labels[view] || labels.all;

  return (
    <div className="state-card empty-state">
      <div className="empty-orbit"><Feather size={24} /></div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {view === 'all' && (
        <button className="button button-primary" onClick={onNew}>
          <Plus size={16} /> Create your first note
        </button>
      )}
    </div>
  );
}

function NoteEditor({ note, onClose, onSave, onExport }) {
  const [draft, setDraft] = useState({
    title: note.title || '',
    content: note.content || '',
    tags: note.tags || [],
    isPinned: Boolean(note.isPinned),
    coverTheme: note.coverTheme || coverThemes[Math.floor(Math.random() * coverThemes.length)],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dirty]);

  const close = () => {
    if (!dirty || window.confirm('Discard unsaved changes?')) onClose();
  };

  const addTag = () => {
    const next = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (next && !draft.tags.includes(next)) {
      setDraft({ ...draft, tags: [...draft.tags, next].slice(0, 8) });
      setDirty(true);
    }
    setTagInput('');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...draft, id: note.id, title: draft.title.trim(), content: draft.content.trim() });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = (draft.content.trim().match(/\S+/g) || []).length;
  const charCount = draft.content.length;

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" onClick={close} aria-label="Close editor" />
      <section className="editor-modal glass-panel">
        <div className="editor-top">
          <div>
            <p className="eyebrow">{note.id ? 'Refine the thought' : 'A fresh page'}</p>
            <h2>{note.id ? 'Edit note' : 'Create a note'}</h2>
          </div>
          <div className="editor-top-actions">
            {note.id && (
              <button
                type="button"
                className="icon-button"
                onClick={() => onExport({ ...draft, title: draft.title || 'Untitled' })}
                title="Export as Markdown"
                aria-label="Export note"
              >
                <Download size={17} />
              </button>
            )}
            <button className="icon-button" onClick={close} aria-label="Close editor">
              <X size={19} />
            </button>
          </div>
        </div>

        <form onSubmit={save}>
          <label className="editor-label">
            Title
            <input
              className="title-input"
              autoFocus
              required
              maxLength="140"
              value={draft.title}
              onChange={(e) => {
                setDirty(true);
                setDraft({ ...draft, title: e.target.value });
              }}
              placeholder="Give your note a title…"
            />
          </label>

          <label className="editor-label">
            <div className="editor-label-row">
              <span>Content</span>
              <small className="editor-word-count">{wordCount} words • {charCount} characters</small>
            </div>
            <textarea
              value={draft.content}
              onChange={(e) => {
                setDirty(true);
                setDraft({ ...draft, content: e.target.value });
              }}
              placeholder="Let the thought unfold… Markdown supported."
              rows="9"
              maxLength="20000"
            />
          </label>

          <div className="editor-options">
            <div>
              <span className="editor-label">Tags</span>
              <div className="tag-input">
                <div className="tag-list">
                  {draft.tags.map((item) => (
                    <span className="tag tag-purple" key={item}>
                      #{item}
                      <button
                        type="button"
                        onClick={() => {
                          setDirty(true);
                          setDraft({ ...draft, tags: draft.tags.filter((tag) => tag !== item) });
                        }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="Type tag & Enter…"
                />
              </div>
            </div>

            <label className="pin-toggle">
              <input
                type="checkbox"
                checked={draft.isPinned}
                onChange={(e) => {
                  setDirty(true);
                  setDraft({ ...draft, isPinned: e.target.checked });
                }}
              />
              <span><Pin size={15} /> Pin this note</span>
            </label>
          </div>

          <div className="cover-picker">
            <span className="editor-label">Cover mood</span>
            <div className="mood-dots">
              {coverThemes.map((theme) => (
                <button
                  type="button"
                  key={theme}
                  className={`mood-dot mood-${theme} ${draft.coverTheme === theme ? 'selected' : ''}`}
                  onClick={() => {
                    setDirty(true);
                    setDraft({ ...draft, coverTheme: theme });
                  }}
                  aria-label={`Use ${theme} cover`}
                  title={`${theme.toUpperCase()} mood`}
                />
              ))}
            </div>
          </div>

          <div className="editor-actions">
            <button type="button" className="button button-ghost" onClick={close}>Cancel</button>
            <button className="button button-primary" disabled={saving || !draft.title.trim()}>
              {saving ? <span className="button-spinner" /> : <><Check size={16} /> Save note</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CalendarWidget({ onSelectDay, selectedDay }) {
  const [viewDate, setViewDate] = useState(new Date());
  const now = new Date();

  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(viewDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <section className="rail-card calendar-card">
      <div className="rail-card-heading">
        <div>
          <span className="rail-kicker">Calendar</span>
          <h3>{monthName} <span>{year}</span></h3>
        </div>
        <div className="calendar-arrows">
          <button className="icon-button tiny" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
          <button className="icon-button tiny" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="calendar-grid calendar-week">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div className="calendar-grid calendar-days">
        {Array.from({ length: first }).map((_, i) => (
          <span className="calendar-muted" key={`blank-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const isSelected = selectedDay && selectedDay.day === day && selectedDay.month === month && selectedDay.year === year;
          return (
            <span
              key={day}
              className={`calendar-day-btn ${isToday ? 'calendar-today' : ''} ${isSelected ? 'calendar-selected' : ''}`}
              onClick={() => onSelectDay && onSelectDay({ day, month, year })}
              title={`Filter by ${monthName} ${day}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function TagsWidget({ tagCounts, activeTag, onTag }) {
  return (
    <section className="rail-card">
      <div className="rail-card-heading">
        <div>
          <span className="rail-kicker">Organize softly</span>
          <h3>Popular tags</h3>
        </div>
        <Tag size={17} className="rail-icon" />
      </div>
      {tagCounts.length ? (
        <div className="popular-tags">
          {tagCounts.map(([item, count], index) => (
            <button
              className={`popular-tag popular-${index % 4} ${activeTag === item ? 'selected' : ''}`}
              key={item}
              onClick={() => onTag(activeTag === item ? '' : item)}
            >
              #{item}<b>{count}</b>
            </button>
          ))}
        </div>
      ) : (
        <p className="rail-empty">Tags will appear as your collection grows.</p>
      )}
    </section>
  );
}

function ActivityTimeline({ activity }) {
  return (
    <section className="rail-card activity-card">
      <div className="rail-card-heading">
        <div>
          <span className="rail-kicker">Activity Trail</span>
          <h3>Recent updates</h3>
        </div>
        <Clock3 size={17} className="rail-icon" />
      </div>
      {activity.length ? (
        <div className="timeline">
          {activity.slice(0, 5).map((item) => (
            <div className="timeline-item" key={item.id}>
              <span className={`timeline-dot dot-${item.type}`}>
                {item.type === 'pin' ? <Pin size={11} /> : item.type === 'trash' ? <Trash2 size={11} /> : <Pencil size={11} />}
              </span>
              <div>
                <strong>
                  {item.type === 'pin' ? 'Pinned note' : item.type === 'trash' ? 'Moved to Trash' : item.type === 'archive' ? 'Archived note' : 'Edited note'}
                </strong>
                <p>{item.title}</p>
                <small>{relativeDate(item.updatedAt)}</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rail-empty">Your recent note moments will land here.</p>
      )}
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
