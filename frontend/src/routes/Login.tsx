import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import { LogIn, UserPlus, ShieldCheck, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

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
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();
        console.log('Attempting login for:', trimmedUser);
        try {
            const res = await client.post('/auth/login/', {
                username: trimmedUser,
                password: trimmedPass
            });
            console.log('Login response:', res.status, res.data);
            if (res.data.mfa_required) {
                setMfaRequired(true);
                setMfaTicket(res.data.mfa_ticket);
            } else {
                setAuth(res.data.user, res.data.access, res.data.refresh);
            }
        } catch (err: any) {
            console.error('Login error detail:', err);
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
            const res = await client.post('/auth/mfa/verify/', { mfa_ticket: mfaTicket, totp });
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
            // 1. Get options from backend (optionally send username if provided)
            const startRes = await client.post('security/webauthn/login/start/', {
                username: username.trim() || undefined
            });
            const options = startRes.data;

            // 2. Pass to browser API
            const credential = await startAuthentication(options);

            // 3. Send to backend for verification
            const verifyRes = await client.post('security/webauthn/login/finish/', credential);
            
            setAuth(verifyRes.data.user, verifyRes.data.access, verifyRes.data.refresh);
        } catch (err: any) {
            console.error(err);
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
            <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in">
                <div className="flex justify-center mb-6">
                    <div className="bg-primary-500/20 p-4 rounded-full">
                        <ShieldCheck className="w-8 h-8 text-primary-500" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-2">Two-Factor Authentication</h2>
                <p className="text-slate-400 text-center mb-6">Enter the code from your authenticator app.</p>

                <form onSubmit={handleMfaVerify} className="space-y-4">
                    <input
                        type="text"
                        placeholder="000000"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 outline-none"
                        value={totp}
                        onChange={(e) => setTotp(e.target.value)}
                        maxLength={6}
                        required
                    />
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in">
            <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                    <input
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                    <input
                        type="password"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
                </button>
                
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-900 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Fingerprint className="w-5 h-5 text-blue-400" /> Sign in with Passkey
                </button>
            </form>

            <p className="mt-8 text-center text-slate-400">
                Don't have an account?{' '}
                <button onClick={onToggle} className="text-primary-400 hover:text-primary-300 font-medium">
                    Create one
                </button>
            </p>
        </div>
    );
}
