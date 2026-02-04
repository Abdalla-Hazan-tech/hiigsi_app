export const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // Assuming backend is at localhost:8000 for now.
    // In production, this should likely be based on an environment variable.
    const baseUrl = 'http://localhost:8000'; 
    return `${baseUrl}${path}`;
};
