import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-navy)' }}>
      <div className="bg-[var(--color-paper)] rounded-xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="font-display text-2xl">Uniform Shop</div>
          <div className="text-xs text-black/50 mt-1 tracking-wide">Billing &amp; Inventory Management</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Username</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon)]"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-maroon)]"
            />
          </div>
          {error && <div className="text-sm text-[var(--color-maroon)]">{error}</div>}
          <button
            disabled={loading}
            className="w-full py-2.5 rounded-md text-white font-medium disabled:opacity-60"
            style={{ background: 'var(--color-maroon)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
