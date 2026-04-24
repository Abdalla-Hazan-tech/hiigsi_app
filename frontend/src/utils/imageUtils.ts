export const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
};
