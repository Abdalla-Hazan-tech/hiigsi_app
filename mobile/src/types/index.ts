export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    profile_image: string;
    avatar_url: string;
    is_mfa_enabled: boolean;
    daily_goal_hours: string;
    consistency_goal: number;
}

export interface Category {
    id: number;
    name: string;
    color_hex: string;
}

export interface Activity {
    id: number;
    title: string;
    description: string;
    category: Category | null;
    is_completed: boolean;
    daily_occurrences: number;
    occurrence_count: number;
}
