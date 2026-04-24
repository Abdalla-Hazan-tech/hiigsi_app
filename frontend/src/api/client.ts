import axios from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'https://hiigsi-app.onrender.com/api/';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor to handle token refresh (simplified for now)
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const refreshUrl = new URL('auth/token/refresh/', API_BASE_URL).toString();
                    const res = await axios.post(refreshUrl, { refresh: refreshToken });
                    localStorage.setItem('access_token', res.data.access);
                    client.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    return client(originalRequest);
                } catch (refreshError) {
                    // Logout user if refresh fails
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default client;
