import React from 'react';
import { LayoutDashboard, ListTodo, Tag, User, LogOut, History, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl } from '../utils/imageUtils';
import Logo from './common/Logo';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuthStore();

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'activities', icon: ListTodo, label: 'Activities' },
        { id: 'categories', icon: Tag, label: 'Categories' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onClose}
            />

            <div
                className={`fixed inset-y-0 left-0 z-50 flex w-[min(85vw,20rem)] flex-col bg-slate-950 p-4 shadow-2xl transition-transform lg:static lg:z-auto lg:m-4 lg:h-[calc(100vh-2rem)] lg:w-64 lg:translate-x-0 lg:bg-transparent lg:p-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="glass-panel flex h-full flex-col overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 p-6">
                        <div className="flex items-center gap-3">
                            <Logo size={52} className="rounded-lg" />
                            <span className="text-xl font-bold tracking-tight">Hiigsi Tracker</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
                            aria-label="Close navigation"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2 p-4 lg:mt-4">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    onClose();
                                }}
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

                    <div className="border-t border-white/10 p-4">
                        <div className="mb-4 flex items-center gap-3 px-2">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-primary-500/30 bg-primary-900">
                                {user?.avatar_url ? (
                                    <img src={getImageUrl(user.avatar_url) || ''} alt={user.username} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center font-bold text-primary-400">
                                        {user?.username?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{user?.display_name || user?.username}</p>
                                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-400 transition-all hover:bg-red-400/10"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
