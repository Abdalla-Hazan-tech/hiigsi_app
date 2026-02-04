import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Search, Filter, ArrowUpDown } from 'lucide-react';
import client from '../api/client';

interface HistoryItem {
    id: number;
    date: string;
    activity_title: string;
    category_name: string;
    category_color: string;
}

export default function History() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await client.get('analytics/history-list/?days=90');
                setHistory(res.data);
            } catch (err) {
                console.error('Error fetching history', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(item =>
        item.activity_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activity History</h1>
                    <p className="text-slate-400">Review all your completed tasks over the last 90 days.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tasks or categories..."
                        className="bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-12 pr-6 py-3 w-full md:w-80 focus:ring-2 focus:ring-primary-500 underline-none transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-500">Date</th>
                                <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-500">Task Name</th>
                                <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-500">Category</th>
                                <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-mono text-sm text-slate-400">
                                            {new Date(item.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-slate-200">{item.activity_title}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                                    style={{ backgroundColor: item.category_color }}
                                                />
                                                <span className="text-slate-300 font-medium">{item.category_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-green-400 font-bold text-sm bg-green-400/10 px-3 py-1.5 rounded-lg w-fit">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Completed
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-slate-500">
                                        No historical data found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
