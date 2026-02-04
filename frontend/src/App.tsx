import { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Sidebar from './components/Sidebar';
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

    // Handle auto-navigation if just logged in
    useEffect(() => {
        if (user) {
            // Could add logic to redirect from login if needed
        }
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
                {authMode === 'login' ? (
                    <LoginPage onToggle={() => setAuthMode('register')} />
                ) : (
                    <RegisterPage onToggle={() => setAuthMode('login')} />
                )}
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.05),_transparent_40%),_radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.05),_transparent_40%)]">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'activities' && <Activities />}
                {activeTab === 'categories' && <Categories />}
                {activeTab === 'history' && <History />}
                {activeTab === 'profile' && <Profile />}
            </main>
        </div>
    );
}

export default App;
