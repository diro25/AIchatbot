import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      if (isRegister) await register({ email, password });
      else await login({ email, password });
      navigate(location.state?.from || '/chat', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-stage">
      <div className="auth-noise" aria-hidden="true" />
      <section className="auth-card">
        <div className="mb-12 flex items-center justify-between">
          <BrandMark />
          <span className="eyebrow">Private workspace</span>
        </div>
        <div className="mb-9 max-w-md">
          <p className="eyebrow mb-4 text-emerald-700 dark:text-mint">{isRegister ? 'Start a signal' : 'Good to see you'}</p>
          <h1 className="display-title">{isRegister ? 'Make room for better conversations.' : 'Pick up where you left off.'}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">A focused space for useful answers, clear context, and work that stays organized.</p>
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="field-label">
            Email address
            <span className="field-wrap"><Mail size={17} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required /></span>
          </label>
          <label className="field-label">
            Password
            <span className="field-wrap"><LockKeyhole size={17} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 8 characters" minLength={8} required /><button className="icon-button" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button w-full justify-center" disabled={pending} type="submit">
            {pending ? 'Working…' : isRegister ? 'Create account' : 'Log in'} <ArrowRight size={17} />
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {isRegister ? 'Already have an account?' : 'New to Signal Room?'}{' '}
          <Link className="font-semibold text-emerald-700 hover:underline dark:text-mint" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </section>
      <footer className="auth-footer"><span className="status-dot" /> Encrypted session · Your API key stays server-side</footer>
    </main>
  );
}
