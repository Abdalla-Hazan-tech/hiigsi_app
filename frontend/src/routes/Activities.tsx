import { useEffect, useState, FormEvent } from 'react';
import { Plus, CheckCircle2, Circle, Calendar, X, Trash2 } from 'lucide-react';
import client from '../api/client';
import { format, parseISO } from 'date-fns';
import { Activity, Category } from '../types';

export default function Activities() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Default to today
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        daily_occurrences: 1,
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            query.append('date', selectedDate);

            const [actRes, catRes] = await Promise.all([
                client.get(`activities/?${query.toString()}`),
                client.get('categories/')
            ]);
            setActivities(actRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error('Error fetching activities', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Create a general task definition (no date attached to creation)
            await client.post('activities/', formData);
            setIsModalOpen(false);
            setFormData({
                title: '',
                description: '',
                category: '',
                daily_occurrences: 1,
            });
            fetchData();
        } catch (err) {
            alert('Error creating activity');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleComplete = async (id: number, increment: boolean = true) => {
        try {
            // Optimistic update
            setActivities(prev => prev.map(a => {
                if (a.id !== id) return a;

                const newCount = increment
                    ? Math.min((a.occurrence_count || 0) + 1, a.daily_occurrences)
                    : Math.max((a.occurrence_count || 0) - 1, 0);

                const isCompleted = newCount === a.daily_occurrences;

                return {
                    ...a,
                    occurrence_count: newCount,
                    is_completed: isCompleted
                };
            }));

            const res = await client.post(`activities/${id}/toggle_complete/`, {
                date: selectedDate,
                increment
            });

            // Update with actual server state
            setActivities(prev => prev.map(a =>
                a.id === id ? res.data : a
            ));
        } catch (err) {
            alert('Error toggling activity');
            fetchData(); // Revert on error
        }
    };

    const deleteActivity = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task? It will be removed from all days.')) return;
        try {
            await client.delete(`activities/${id}/`);
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert('Error deleting activity');
        }
    };

    const ActivitySkeleton = () => (
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-6 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
            <div className="w-5 h-5 bg-slate-800 rounded" />
        </div>
    );

    return (
        <div className="flex-1 p-8 overflow-y-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-1">Daily Tasks</h1>
                    <p className="text-slate-400 font-medium">Elevate your productivity, one task at a time.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(2,132,199,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Date Picker / Header */}
            <div className="flex items-center gap-4 mb-8 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/50 backdrop-blur-md">
                <div className="bg-primary-500/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary-500/70">Selected Date</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-white font-semibold outline-none cursor-pointer hover:text-primary-400 transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-hidden">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <ActivitySkeleton key={i} />)
                ) : activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <div
                            key={activity.id}
                            className="glass-panel p-5 rounded-2xl flex items-center gap-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all group animate-slide-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                    <h4 className={`font-bold text-lg leading-tight transition-all ${activity.is_completed ? 'text-slate-500 line-through decoration-2' : 'text-white'}`}>
                                        {activity.title}
                                    </h4>
                                    {activity.category && (
                                        <span
                                            className="px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-tighter"
                                            style={{
                                                backgroundColor: `${activity.category.color_hex}15`,
                                                color: activity.category.color_hex,
                                                border: `1px solid ${activity.category.color_hex}30`
                                            }}
                                        >
                                            {activity.category.name}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate transition-colors ${activity.is_completed ? 'text-slate-600' : 'text-slate-400 font-medium'}`}>
                                    {activity.description || 'No description provided'}
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                {activity.daily_occurrences > 1 ? (
                                    // Multi-occurrence view
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: activity.daily_occurrences }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    // Only allow clicking the next available or the last completed
                                                    const currentCount = activity.occurrence_count || 0;
                                                    if (i === currentCount) toggleComplete(activity.id, true); // Increment
                                                    else if (i === currentCount - 1) toggleComplete(activity.id, false); // Decrement
                                                }}
                                                className={`transition-all ${i < (activity.occurrence_count || 0)
                                                    ? 'text-green-500 hover:text-red-400'
                                                    : 'text-slate-600 hover:text-green-500/50'}`}
                                            >
                                                {i < (activity.occurrence_count || 0) ? (
                                                    <CheckCircle2 className="w-6 h-6" />
                                                ) : (
                                                    <Circle className="w-6 h-6" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    // Single occurrence view (standard)
                                    <button
                                        onClick={() => toggleComplete(activity.id, !activity.is_completed)}
                                        className="relative transition-transform active:scale-90"
                                    >
                                        {activity.is_completed ? (
                                            <div className="bg-green-500 rounded-full p-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                            </div>
                                        ) : (
                                            <Circle className="w-8 h-8 text-slate-600 hover:text-primary-400" />
                                        )}
                                    </button>
                                )}
                                {activity.daily_occurrences > 1 && (
                                    <span className="text-[10px] font-bold text-slate-500">
                                        {activity.occurrence_count || 0}/{activity.daily_occurrences}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => deleteActivity(activity.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-all"
                                title="Delete Task"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="py-24 text-center glass-panel rounded-3xl border-dashed border-2 border-slate-800 animate-fade-in">
                        <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-2xl font-bold text-slate-300">All clear for today!</p>
                        <p className="text-slate-500 mt-2 max-w-xs mx-auto">Create a task to keep building your momentum.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-[2rem] w-full max-w-lg shadow-2xl animate-slide-up border border-slate-700/50">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white">New Task</h2>
                                <p className="text-slate-400 text-sm font-medium">Define a new daily habit</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-slate-800/50 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Task Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none placeholder-slate-600 text-white font-medium transition-all"
                                    placeholder="What needs to be done?"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Notes</label>
                                <textarea
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none h-28 placeholder-slate-600 text-white font-medium transition-all"
                                    placeholder="Add some details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Category</label>
                                <select
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-white font-medium appearance-none transition-all cursor-pointer"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Uncategorized</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Daily Occurrences</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-white font-medium transition-all"
                                        placeholder="1"
                                        value={formData.daily_occurrences}
                                        onChange={(e) => setFormData({ ...formData, daily_occurrences: parseInt(e.target.value) || 1 })}
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none">times/day</span>
                                </div>
                            </div>

                            <button
                                disabled={submitting}
                                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(2,132,199,0.3)] transition-all mt-4 hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                {submitting ? 'Creating Habit...' : 'Deploy Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
