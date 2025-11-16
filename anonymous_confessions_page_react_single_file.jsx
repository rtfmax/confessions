import React, { useEffect, useRef, useState } from "react";

// Anonymous Confessions — Light Pink Background + Black & Gold UI
// Final corrected single-file React component
// - Internal admin credentials remain for demo (Rocky / Rocky123) but are NOT shown in UI
// - Confessions are private and visible ONLY while admin is logged in
// - UI shows explicit "Admin Logged In" indicator after login

export default function ConfessionsApp() {
  const [confessionText, setConfessionText] = useState("");
  const [confessions, setConfessions] = useState([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hashedAdminPassword, setHashedAdminPassword] = useState(null);
  const submitRef = useRef(null);

  // Internal demo credentials (do not display in UI). Replace with real backend in production.
  const INTERNAL_USERNAME = "Rocky";
  const INTERNAL_PASSWORD = "Rocky123";

  const unreadCount = confessions.filter(c => !c.read).length;

  // load confessions & prepare hashed admin password
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("confessions_black_gold") || "[]");
      setConfessions(stored);
    } catch (e) {
      setConfessions([]);
    }

    (async () => {
      try {
        const h = await hashPassword(INTERNAL_PASSWORD);
        setHashedAdminPassword(h);
      } catch (err) {
        console.error("failed to init hash", err);
      }
    })();
  }, []);

  // persist confessions
  useEffect(() => {
    try {
      localStorage.setItem("confessions_black_gold", JSON.stringify(confessions));
    } catch (e) {
      console.error("failed to persist confessions", e);
    }
  }, [confessions]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  async function hashPassword(p) {
    const data = new TextEncoder().encode(p);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function showSuccess(t) { setToast({ type: "success", text: t }); }
  function showError(t) { setToast({ type: "error", text: t }); }

  function triggerPulse() {
    const el = submitRef.current;
    if (!el) return;
    el.classList.add("scale-110");
    setTimeout(() => el.classList.remove("scale-110"), 180);
  }

  function submitConfession(e) {
    e && e.preventDefault();
    const text = confessionText.trim();
    if (!text) return showError("Confession cannot be empty.");

    const item = { id: Date.now().toString(), text, createdAt: new Date().toISOString(), read: false };
    setConfessions(prev => [item, ...prev]);
    setConfessionText("");
    showSuccess("Confession submitted.");
    triggerPulse();
  }

  async function adminLogin(username, password) {
    setBusy(true);
    try {
      if (!username || !password) throw new Error("Enter username & password");
      if (username !== INTERNAL_USERNAME) throw new Error("Invalid username or password");
      const hashed = await hashPassword(password);
      const real = hashedAdminPassword || await hashPassword(INTERNAL_PASSWORD);
      if (hashed !== real) throw new Error("Invalid username or password");
      setIsAdminLoggedIn(true);
      setShowPanelModal(false);
      showSuccess("Admin logged in successfully.");
    } catch (e) {
      showError(e.message || "Login failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  function adminLogout() {
    setIsAdminLoggedIn(false);
    setShowPanelModal(false);
    showSuccess("Admin logged out.");
  }

  function toggleRead(id) {
    setConfessions(prev => prev.map(c => c.id === id ? { ...c, read: !c.read } : c));
  }

  function deleteConfession(id) {
    if (!confirm("Delete this confession permanently?")) return;
    setConfessions(prev => prev.filter(c => c.id !== id));
    showSuccess("Deleted.");
  }

  return (
    <div className="min-h-screen relative bg-pink-100 text-black font-sans overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,230,240,0.9),_transparent_40%)]" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#b88500] to-[#ffd54a] flex items-center justify-center text-black text-3xl font-bold shadow-md">★</div>
            <div>
              <h1 className="text-4xl font-extrabold text-[#1b1b1b]">Campus Confessions</h1>
              <p className="text-sm text-[#3b3b3b]">Anonymous submissions — Admin-only visibility.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-[#3b3b3b]">Unread</div>
            <div className="px-3 py-1 rounded-full bg-[#FFD700] text-black text-sm font-semibold shadow-sm">{unreadCount}</div>

            {isAdminLoggedIn ? (
              <>
                <span className="text-green-800 font-semibold">Admin Logged In</span>
                <button onClick={() => setShowPanelModal(true)} className="px-4 py-2 rounded bg-[#FFD700] text-black font-semibold hover:shadow-lg transition">Panel</button>
                <button onClick={adminLogout} className="px-4 py-2 rounded border border-[#c99d1a] text-[#3b3b3b] hover:bg-[#c99d1a] hover:text-black transition">Logout</button>
              </>
            ) : (
              <button onClick={() => setShowPanelModal(true)} className="px-4 py-2 rounded-full border border-[#c99d1a] text-[#3b3b3b] hover:bg-[#c99d1a] hover:text-black transition">Sign in</button>
            )}
          </div>
        </header>

        <main className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-black/95 p-6 rounded-3xl border border-[rgba(0,0,0,0.08)] shadow-lg">
            <h2 className="text-2xl font-semibold text-[#FFD700] mb-2">Share a secret</h2>
            <p className="text-sm text-[#c9b06a] mb-4">Your confession is fully anonymous.</p>

            <form onSubmit={submitConfession} className="space-y-4">
              <div className="relative">
                <textarea
                  value={confessionText}
                  onChange={e => setConfessionText(e.target.value)}
                  placeholder="Type your confession..."
                  className="w-full h-48 p-5 rounded-2xl bg-[#0b0b0b] border border-[rgba(255,215,0,0.06)] text-[#f7eec7] placeholder-[#c9b06a] focus:ring-2 focus:ring-[#FFD700]/30 outline-none"
                />

                <div className="absolute right-4 bottom-4 flex items-center gap-3">
                  <button ref={submitRef} type="submit" className="px-5 py-3 rounded-full bg-[#FFD700] text-black font-bold hover:scale-105 transition">Send</button>
                  <button type="button" onClick={() => setConfessionText('')} className="px-4 py-2 rounded-full border border-[rgba(255,215,0,0.08)] text-[#f3e6b3] hover:bg-[#FFD700] hover:text-black transition">Clear</button>
                </div>
              </div>
            </form>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[#0b0b0b] border border-[rgba(255,215,0,0.04)]">Tip: Keep confessions short & clear.</div>
              <div className="p-4 rounded-lg bg-[#0b0b0b] border border-[rgba(255,215,0,0.04)]">You may submit multiple confessions anonymously.</div>
            </div>
          </section>

          <aside className="bg-black/95 p-6 rounded-3xl border border-[rgba(255,215,0,0.06)] shadow-lg">
            <h3 className="text-xl font-semibold text-[#FFD700] mb-2">Admin</h3>
            {isAdminLoggedIn ? (
              <p className="text-sm text-green-400 font-semibold mb-4">Admin is Logged In!</p>
            ) : (
              <p className="text-sm text-[#c9b06a] mb-4">Admin access required.</p>
            )}
            <button onClick={() => setShowPanelModal(true)} className="w-full px-4 py-3 rounded-full border border-[#c99d1a] text-[#3b3b3b] hover:bg-[#c99d1a] hover:text-black transition">{isAdminLoggedIn ? 'Open Admin Panel' : 'Sign in'}</button>
          </aside>
        </main>

        {toast && (
          <div className={`fixed right-8 bottom-8 px-4 py-3 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-[#FFD700] text-black' : 'bg-red-600 text-white'}`}>{toast.text}</div>
        )}

        {showPanelModal && (
          <PanelModal
            onClose={() => setShowPanelModal(false)}
            onLogin={adminLogin}
            onLogout={adminLogout}
            isLoggedIn={isAdminLoggedIn}
            confessions={confessions}
            onToggleRead={toggleRead}
            onDelete={deleteConfession}
          />
        )}
      </div>
    </div>
  );
}

/* Panel modal: login + admin view */
function PanelModal({ onClose, onLogin, onLogout, isLoggedIn, confessions, onToggleRead, onDelete }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
      setUsername("");
      setPassword("");
    } catch (err) {
      // parent shows toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between p-6 border-b border-[rgba(0,0,0,0.04)]">
          <div>
            <h3 className="text-xl font-semibold text-[#111]">Admin Panel</h3>
            <div className="text-sm text-[#444]">Confessions visible only while signed in.</div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? <button onClick={onLogout} className="px-3 py-2 rounded border">Logout</button> : null}
            <button onClick={onClose} className="px-3 py-2 rounded border">Close</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-1">
            {!isLoggedIn ? (
              <div className="p-4 rounded-lg bg-white border">
                <h4 className="font-medium text-[#111]">Admin sign-in</h4>
                <form onSubmit={submitLogin} className="mt-4 space-y-3">
                  <input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 rounded border" placeholder="Username" />
                  <input value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded border" placeholder="Password" type="password" />
                  <div className="flex gap-2">
                    <button disabled={loading} className="px-4 py-2 rounded bg-[#FFD700] text-black">Sign in</button>
                    <button type="button" onClick={() => { setUsername(''); setPassword(''); }} className="px-4 py-2 rounded border">Reset</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#f7f7f7] border">
                <h4 className="font-medium text-[#111]">Welcome, Admin</h4>
                <p className="text-sm text-[#444]">You can now review and moderate confessions.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {!isLoggedIn ? (
              <div className="p-6 rounded-lg border text-[#666]">Sign in to view confessions.</div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                {confessions.length === 0 ? (
                  <div className="p-4 rounded border text-[#666]">No confessions yet.</div>
                ) : (
                  confessions.map(c => (
                    <div key={c.id} className={`p-4 rounded-lg border ${c.read ? 'bg-white' : 'bg-[#fef3e7]'} border-[rgba(0,0,0,0.04)]`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs text-[#666]">{new Date(c.createdAt).toLocaleString()}</div>
                          <div className="mt-2 text-sm whitespace-pre-wrap text-[#111]">{c.text}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => onToggleRead(c.id)} className="px-3 py-1 rounded border">{c.read ? 'Mark unread' : 'Mark read'}</button>
                          <button onClick={() => onDelete(c.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
