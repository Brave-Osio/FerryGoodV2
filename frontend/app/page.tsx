'use client';
// app/page.tsx — Login page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { getErrorMessage } from '../lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Anchor, Waves } from 'lucide-react';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter your credentials.');
      return;
    }
    setBusy(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome aboard!');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
  <div className="min-h-screen flex items-center justify-center bg-sand-50">
    <div className="w-8 h-8 border-2 border-ocean/20 border-t-ocean rounded-full animate-spin" />
  </div>
);

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-ocean-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative waves */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-seafoam"
              style={{ top: `${15 + i * 15}%`, opacity: 1 - i * 0.12, transform: `scaleX(${0.7 + i * 0.06})` }}
            />
          ))}
        </div>
        {/* Animated circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-seafoam/10 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-ocean-300/20 blur-2xl animate-pulse-soft" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-seafoam/20 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-seafoam" />
            </div>
            <span className="font-display text-2xl font-semibold text-white tracking-wide">Ferry Good</span>
          </div>

          <h1 className="font-display text-5xl font-semibold text-white leading-tight mb-6">
            Smooth sailing,<br />
            <span className="text-seafoam">seamlessly managed.</span>
          </h1>
          <p className="text-sand-200/70 text-lg leading-relaxed max-w-sm font-light">
            The complete ferry scheduling and passenger assignment platform for Philippine inter-island routes.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: '8+', label: 'Active Routes' },
            { num: '5',  label: 'Vessels' },
            { num: '∞',  label: 'Departures' },
          ].map(({ num, label }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="font-display text-3xl font-semibold text-seafoam">{num}</p>
              <p className="text-sand-300/70 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-sand-50">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <Anchor className="w-6 h-6 text-ocean" />
            <span className="font-display text-xl font-semibold text-navy">Ferry Good</span>
          </div>

          <div className="mb-10">
            <h2 className="font-display text-4xl font-semibold text-navy mb-2">Sign in</h2>
            <p className="text-navy-300 text-sm">Enter your credentials to access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={busy}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Anchor className="w-4 h-4" />
                  Sign in
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl border border-sand-300 bg-sand-100">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="space-y-2">
              {[
                { role: 'Admin',    username: 'admin',          password: 'Admin@123' },
                { role: 'Register', username: 'register_staff', password: 'Register@123' },
                { role: 'Client',   username: 'client_user',    password: 'Client@123' },
              ].map(({ role, username: u, password: p }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setUsername(u); setPassword(p); }}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg
                             text-xs text-navy-400 hover:bg-white hover:text-navy
                             transition-colors duration-150 text-left group"
                >
                  <span className="font-semibold text-navy group-hover:text-ocean">{role}</span>
                  <span className="font-mono text-navy-300">{u}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}