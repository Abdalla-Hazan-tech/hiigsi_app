import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    username: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    first_name: string;
    last_name: string;
    is_mfa_enabled: boolean;
    consistency_goal: number;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, access: string, refresh: string) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            setAuth: (user, access, refresh) => {
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                set({ user, accessToken: access, refreshToken: refresh });
            },
            updateUser: (userData) => set((state) => ({
                user: state.user ? { ...state.user, ...userData } : null
            })),
            logout: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, accessToken: null, refreshToken: null });
            },
        }),
        {
            name: 'protrack-auth',
        }
    )
);
