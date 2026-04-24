import React, { useState } from 'react';
import { LogIn, ShieldCheck, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import Logo from '../components/common/Logo';

export default function LoginPage({ onToggle }: { onToggle: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaTicket, setMfaTicket] = useState('');
    const [totp, setTotp] = useState('');

    const setAuth = useAuthStore((state) => state.setAuth);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await client.post('auth/login/', {
                username: username.trim(),
                password: password.trim(),
            });

            if (res.data.mfa_required) {
                setMfaRequired(true);
                setMfaTicket(res.data.mfa_ticket);
            } else {
                setAuth(res.data.user, res.data.access, res.data.refresh);
            }
        } catch (err: any) {
            if (!err.response) {
                setError('Cannot reach server. Is the backend running?');
            } else if (err.response.status === 403) {
                setError('Security Block (CORS/CSRF). Check console.');
            } else {
                setError(err.response.data?.detail || err.response.data?.non_field_errors?.[0] || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await client.post('auth/mfa/verify/', { mfa_ticket: mfaTicket, totp });
            setAuth(res.data.user, res.data.access, res.data.refresh);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeyLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const startRes = await client.post('security/webauthn/login/start/', {
                username: username.trim() || undefined,
            });
            const credential = await startAuthentication(startRes.data);
            const verifyRes = await client.post('security/webauthn/login/finish/', credential);
            setAuth(verifyRes.data.user, verifyRes.data.access, verifyRes.data.refresh);
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Passkey login cancelled or timed out.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to authenticate with passkey');
            }
        } finally {
            setLoading(false);
        }
    };

    if (mfaRequired) {
        return (
            <div className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-primary-500/20 p-4">
                        <ShieldCheck className="h-8 w-8 text-primary-500" />
                    </div>
                </div>
                <h2 className="mb-2 text-center text-2xl font-bold">Two-Factor Authentication</h2>
                <p className="mb-6 text-center text-slate-400">Enter the code from your authenticator app.</p>

                <form onSubmit={handleMfaVerify} className="space-y-4">
                    <input
                        type="text"
                        placeholder="000000"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-primary-500"
                        value={totp}
                        onChange={(e) => setTotp(e.target.value)}
                        maxLength={6}
                        required
                    />
                    {error && <p className="text-center text-sm text-red-400">{error}</p>}
                    <button
                        disabled={loading}
                        className="w-full rounded-lg bg-primary-600 py-3 font-bold text-white transition-all hover:bg-primary-500 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="glass-panel flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl animate-in lg:flex-row">
            <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-primary-600/5 p-8 text-center lg:w-5/12 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
                <Logo size={90} className="mb-6" />
                <h2 className="mb-2 text-4xl font-black tracking-tighter text-white">Hiigsi</h2>
                <h3 className="mb-4 ml-1 text-lg font-bold uppercase tracking-[0.2em] text-cyan-400">Tracker</h3>
                <div className="mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-primary-500" />
                <p className="max-w-[200px] text-xs font-medium leading-relaxed text-slate-400">
                    Master your time. Reach your goals.
                </p>
            </div>

            <div className="flex-1 p-8 lg:p-12">
                <div className="mb-8">
                    <h2 className="mb-1 text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-sm text-slate-500">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username / Email</label>
                        <input
                            type="text"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="john_doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                        <input
                            type="password"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.01] hover:bg-primary-500 active:scale-[0.99] disabled:opacity-50"
                        >
                            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><LogIn className="h-5 w-5" /> Sign In</>}
                        </button>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-[#020617] px-3 text-slate-600">Secure Access</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePasskeyLogin}
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700/50 bg-slate-800/40 py-3 font-medium text-white transition-all hover:bg-slate-800/60 disabled:opacity-50"
                    >
                        <Fingerprint className="h-5 w-5 text-primary-400" /> Passkey Sign-In
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    First time here?{' '}
                    <button onClick={onToggle} className="font-bold text-primary-400 hover:text-primary-300">
                        Create Account
                    </button>
                </p>
            </div>
        </div>
    );
}
