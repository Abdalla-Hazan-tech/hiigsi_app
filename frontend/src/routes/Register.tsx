import { useState, FormEvent, ChangeEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import Logo from '../components/common/Logo';

export default function RegisterPage({ onToggle }: { onToggle: () => void }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const res = await client.post('auth/register/', formData);
            setAuth(res.data.user, res.data.access, res.data.refresh);
        } catch (err: any) {
            setErrors(err.response?.data || { detail: 'Registration failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="glass-panel flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 shadow-2xl animate-in lg:flex-row">
            <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-primary-600/5 p-8 text-center lg:w-5/12 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
                <Logo size={90} className="mb-6" />
                <h2 className="mb-2 text-4xl font-black tracking-tighter text-white">Hiigsi</h2>
                <h3 className="mb-4 ml-1 text-lg font-bold uppercase tracking-[0.2em] text-cyan-400">Tracker</h3>
                <div className="mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-primary-500" />
                <p className="max-w-[200px] text-xs font-medium leading-relaxed text-slate-400">
                    Join the community of achievers.
                </p>
            </div>

            <div className="flex-1 p-8 lg:p-12">
                <div className="mb-6 text-center lg:text-left">
                    <h2 className="mb-1 text-2xl font-bold text-white">Create Account</h2>
                    <p className="text-sm text-slate-500">Join Hiigsi Tracker today</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                    <div className="md:col-span-1">
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
                        <input
                            name="username"
                            type="text"
                            placeholder="johndoe"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary-500"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        {errors.username && <p className="ml-1 mt-1 text-[10px] text-red-400">{errors.username[0]}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary-500"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && <p className="ml-1 mt-1 text-[10px] text-red-400">{errors.email[0]}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary-500"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {errors.password && <p className="ml-1 mt-1 text-[10px] text-red-400">{errors.password[0]}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="ml-1 mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Confirm</label>
                        <input
                            name="password_confirm"
                            type="password"
                            placeholder="Confirm password"
                            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5 text-sm text-white outline-none transition-all focus:ring-2 focus:ring-primary-500"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {errors.detail && <p className="md:col-span-2 rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-center text-sm text-red-400">{errors.detail}</p>}

                    <div className="pt-2 md:col-span-2">
                        <button
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.01] hover:bg-primary-500 active:scale-[0.99] disabled:opacity-50"
                        >
                            <UserPlus className="h-5 w-5" />
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <button onClick={onToggle} className="font-bold text-primary-400 hover:text-primary-300">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}
