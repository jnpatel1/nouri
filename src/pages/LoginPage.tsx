import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface)' }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ opacity: 0.4 }}
      >
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'var(--accent)', opacity: 0.08 }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'var(--accent)', opacity: 0.05 }}
        />
      </div>

      <div className="w-full max-w-sm relative animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #4ade80)',
              boxShadow: '0 8px 32px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Leaf size={32} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Nouri
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            AI-powered nutrition, simplified
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] mb-4"
          style={{
            background: 'var(--surface-raised)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              <User size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
                required
              />
            </div>
          )}

          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            <Mail size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            <Lock size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-xs px-1" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="font-medium"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Demo hint */}
        {isDemo && (
          <div
            className="mt-6 p-3 rounded-xl text-center text-xs"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent-text)',
            }}
          >
            Demo mode active. Enter any credentials to explore, or connect Supabase for full auth.
          </div>
        )}
      </div>
    </div>
  );
}
