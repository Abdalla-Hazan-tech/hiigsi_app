import { useEffect, useState, FormEvent } from 'react';
import { Plus, Tag, X, Edit2, Trash2, Check } from 'lucide-react';
import client from '../api/client';

interface Category {
    id: number;
    name: string;
    color_hex: string;
}

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', color_hex: '#3b82f6' });
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await client.get('categories/');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await client.post('categories/', newCategory);
            setIsModalOpen(false);
            setNewCategory({ name: '', color_hex: '#3b82f6' });
            fetchCategories();
        } catch (err) {
            alert('Error creating category');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCategory = async (id: number) => {
        if (!confirm('Are you sure? Activities in this category will be uncategorized.')) return;
        try {
            await client.delete(`categories/${id}/`);
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            alert('Error deleting category');
        }
    };

    const CategorySkeleton = () => (
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4 w-full">
                <div className="w-4 h-4 rounded-full bg-slate-800" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
            <div className="w-5 h-5 bg-slate-800 rounded" />
        </div>
    );

    return (
        <div className="flex-1 p-8 overflow-y-auto animate-fade-in text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Categories</h1>
                    <p className="text-slate-400 font-medium">Organize your tasks with precision.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 font-bold shadow-[0_10px_20px_rgba(2,132,199,0.2)] hover:translate-y-[-2px] transition-all"
                >
                    <Plus className="w-5 h-5" />
                    New Category
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <CategorySkeleton key={i} />)
                ) : (
                    <>
                        {categories.map((category, index) => (
                            <div
                                key={category.id}
                                className="glass-panel p-6 rounded-2xl flex items-center justify-between group animate-slide-up hover:scale-[1.02] transition-all"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-4 h-4 rounded-lg shadow-lg relative overflow-hidden"
                                        style={{ backgroundColor: category.color_hex }}
                                    >
                                        <div className="absolute inset-0 bg-white/20" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight">{category.name}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => deleteCategory(category.id)}
                                        className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                        title="Delete Category"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="col-span-full py-24 text-center glass-panel rounded-3xl border-dashed border-2 border-slate-800 animate-fade-in">
                                <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Tag className="w-10 h-10 text-slate-700" />
                                </div>
                                <p className="text-2xl font-bold text-slate-300">No categories found</p>
                                <p className="text-slate-500 mt-2">Add your first category to start organizing.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-slide-up border border-slate-700/50">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white">New Category</h2>
                                <p className="text-slate-400 text-sm font-medium">Create a new organizational label</p>
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
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Category Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Work, Study, Health"
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none text-white font-medium transition-all"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 ml-1">Pick a Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#e2e8f0'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewCategory({ ...newCategory, color_hex: color })}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative overflow-hidden active:scale-95 ${newCategory.color_hex === color ? 'ring-2 ring-white ring-offset-4 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        >
                                            <div className="absolute inset-0 bg-white/10" />
                                            {newCategory.color_hex === color && <Check className="w-5 h-5 text-white shadow-sm" />}
                                        </button>
                                    ))}
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={newCategory.color_hex}
                                            onChange={(e) => setNewCategory({ ...newCategory, color_hex: e.target.value })}
                                            className="w-10 h-10 rounded-xl border-0 p-0 overflow-hidden cursor-pointer bg-slate-800 hover:scale-105 transition-transform"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                disabled={submitting}
                                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(2,132,199,0.3)] transition-all mt-4 hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                {submitting ? 'Generating...' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
