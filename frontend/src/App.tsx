import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import Sidebar from './components/Sidebar';
import Logo from './components/common/Logo';
import Dashboard from './routes/Dashboard';
import Activities from './routes/Activities';
import Categories from './routes/Categories';
import Profile from './routes/Profile';
import History from './routes/History';
import LoginPage from './routes/Login';
import RegisterPage from './routes/Register';

function App() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setSidebarOpen(false);
        }
    }, [user]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [activeTab]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6">
                {authMode === 'login' ? (
                    <LoginPage onToggle={() => setAuthMode('register')} />
                ) : (
                    <RegisterPage onToggle={() => setAuthMode('login')} />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans lg:h-screen lg:overflow-hidden">
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur lg:hidden">
                <div className="flex items-center gap-3">
                    <Logo size={36} className="rounded-lg" />
                    <div>
                        <p className="text-sm font-semibold text-white">Hiigsi Tracker</p>
                        <p className="text-xs text-slate-400">{user.display_name || user.username}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10"
                    aria-label="Open navigation"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <div className="flex min-h-[calc(100vh-69px)] flex-col lg:h-screen lg:min-h-0 lg:flex-row">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.05),_transparent_40%),_radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.05),_transparent_40%)]">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'activities' && <Activities />}
                    {activeTab === 'categories' && <Categories />}
                    {activeTab === 'history' && <History />}
                    {activeTab === 'profile' && <Profile />}
                </main>
            </div>
        </div>
    );
}

export default App;
