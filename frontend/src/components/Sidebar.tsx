import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl } from '../utils/imageUtils';
import { LayoutDashboard, ListTodo, Tag, User, Settings, LogOut, Clock, History } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const { user, logout } = useAuthStore();

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'activities', icon: ListTodo, label: 'Activities' },
        { id: 'categories', icon: Tag, label: 'Categories' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="w-64 glass-panel h-[calc(100vh-2rem)] m-4 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 flex items-center gap-3 border-b border-white/10">
                <div className="bg-primary-500 p-2 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">ProTrack</span>
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-900 border border-primary-500/30 overflow-hidden">
                        {user?.avatar_url ? (
                            <img src={getImageUrl(user.avatar_url) || ''} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-400 font-bold">
                                {user?.username?.[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.display_name || user?.username}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}
