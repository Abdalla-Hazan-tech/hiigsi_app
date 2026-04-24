import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// For mobile, we need to use the local IP instead of localhost
const API_BASE_URL = 'https://hiigsitrackerbacken.onrender.com/api/';

console.log('--- API CONFIGURATION ---');
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('-------------------------');

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle token refresh
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_BASE_URL}auth/token/refresh/`, { refresh: refreshToken });
                    await SecureStore.setItemAsync('access_token', res.data.access);
                    client.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    await SecureStore.deleteItemAsync('access_token');
                    await SecureStore.deleteItemAsync('refresh_token');
                    await SecureStore.deleteItemAsync('user_data');
                }
            }
        }
        return Promise.reject(error);
    }
);

export const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Remove /api/ from end of base and append relative url
    const baseUrl = API_BASE_URL.replace('/api/', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default client;
