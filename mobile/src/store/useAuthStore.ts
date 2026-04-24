import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    setAuth: (user: User, access: string, refresh: string) => Promise<void>;
    updateUser: (user: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true,

    setAuth: async (user, access, refresh) => {
        console.log('setAuth called for user:', user?.username);
        await SecureStore.setItemAsync('access_token', access);
        await SecureStore.setItemAsync('refresh_token', refresh);
        await SecureStore.setItemAsync('user_data', JSON.stringify(user));
        set({ user, accessToken: access, refreshToken: refresh });
    },

    updateUser: async (userData) => {
        const currentUser = get().user;
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
            set({ user: updatedUser });
        }
    },

    logout: async () => {
        console.log('logout called');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user_data');
        set({ user: null, accessToken: null, refreshToken: null });
    },

    init: async () => {
        try {
            const access = await SecureStore.getItemAsync('access_token');
            const refresh = await SecureStore.getItemAsync('refresh_token');
            const userData = await SecureStore.getItemAsync('user_data');
            
            console.log('AuthStore init - tokens:', !!access, !!refresh, 'userData:', !!userData);

            if (access && refresh && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    console.log('AuthStore init - parsed user:', parsedUser?.username);
                    set({ 
                        user: parsedUser, 
                        accessToken: access, 
                        refreshToken: refresh,
                        loading: false 
                    });
                } catch (e) {
                    console.error('AuthStore init - JSON parse error:', e);
                    set({ loading: false });
                }
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false });
        }
    },
}));
