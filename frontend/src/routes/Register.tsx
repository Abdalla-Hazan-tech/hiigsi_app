import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import { UserPlus } from 'lucide-react';

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
        <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in">
            <h2 className="text-3xl font-bold text-center mb-8">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                    <input
                        name="username"
                        type="text"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                    <input
                        name="password"
                        type="password"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Confirm Password</label>
                    <input
                        name="password_confirm"
                        type="password"
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                    />
                    {errors.password_confirm && <p className="text-red-400 text-xs mt-1">{errors.password_confirm[0]}</p>}
                </div>

                {errors.detail && <p className="text-red-400 text-sm text-center">{errors.detail}</p>}

                <button
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
                >
                    <UserPlus className="w-5 h-5" />
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            <p className="mt-8 text-center text-slate-400">
                Already have an account?{' '}
                <button onClick={onToggle} className="text-primary-400 hover:text-primary-300 font-medium">
                    Sign in
                </button>
            </p>
        </div>
    );
}
