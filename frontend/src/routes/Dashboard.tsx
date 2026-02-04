import { useEffect, useState } from 'react';
import { ShoppingBag, Star, Clock, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import client from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

interface Stats {
    planned_count: number;
    completed_count: number;
    date: string;
}

interface CategoryTotal {
    category: string;
    color_hex: string;
    count: number;
}

export default function Dashboard() {
    const [productivity, setProductivity] = useState<Stats[]>([]);
    const [distribution, setDistribution] = useState<CategoryTotal[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, distRes] = await Promise.all([
                    client.get('analytics/productivity/?days=7'),
                    client.get('analytics/time-distribution/?days=7')
                ]);
                setProductivity(prodRes.data);
                setDistribution(distRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalCompleted = productivity.reduce((acc, curr) => acc + curr.completed_count, 0);
    const totalPlanned = productivity.reduce((acc, curr) => acc + curr.planned_count, 0);
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    const todayStats = productivity[productivity.length - 1];
    const todayUndone = todayStats ? Math.max(0, todayStats.planned_count - todayStats.completed_count) : 0;

    // Daily (today)
    const dailyCompleted = todayStats?.completed_count || 0;
    const dailyPlanned = todayStats?.planned_count || 0;
    const dailyPending = Math.max(0, dailyPlanned - dailyCompleted);
    const dailyRate = dailyPlanned > 0 ? Math.round((dailyCompleted / dailyPlanned) * 100) : 0;

    // Weekly (last 7 days)
    const weeklyCompleted = totalCompleted;
    const weeklyPlanned = totalPlanned;
    const weeklyPending = Math.max(0, weeklyPlanned - weeklyCompleted);
    const weeklyRate = weeklyPlanned > 0 ? Math.round((weeklyCompleted / weeklyPlanned) * 100) : 0;

    // Monthly (last 30 days) - we'll use productivity data multiplied by ~4.3
    const monthlyCompleted = Math.round(totalCompleted * 4.3);
    const monthlyPlanned = Math.round(totalPlanned * 4.3);
    const monthlyPending = Math.max(0, monthlyPlanned - monthlyCompleted);
    const monthlyRate = monthlyPlanned > 0 ? Math.round((monthlyCompleted / monthlyPlanned) * 100) : 0;

    // Yearly (extrapolated from weekly data)
    const yearlyCompleted = Math.round(totalCompleted * 52);
    const yearlyPlanned = Math.round(totalPlanned * 52);
    const yearlyPending = Math.max(0, yearlyPlanned - yearlyCompleted);
    const yearlyRate = yearlyPlanned > 0 ? Math.round((yearlyCompleted / yearlyPlanned) * 100) : 0;

    const createDoughnutData = (completed: number, pending: number) => ({
        labels: ['Completed', 'Pending'],
        datasets: [{
            data: [completed, pending],
            backgroundColor: ['#22c55e', '#f43f5e'],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
        }]
    });

    const dailyDoughnut = createDoughnutData(dailyCompleted, dailyPending);
    const weeklyDoughnut = createDoughnutData(weeklyCompleted, weeklyPending);
    const monthlyDoughnut = createDoughnutData(monthlyCompleted, monthlyPending);
    const yearlyDoughnut = createDoughnutData(yearlyCompleted, yearlyPending);

    const doneLineData = {
        labels: productivity.map(p => new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
            {
                label: 'Tasks Completed',
                data: productivity.map(p => p.completed_count),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const undoneLineData = {
        labels: productivity.map(p => new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
            {
                label: 'Pending Tasks',
                data: productivity.map(p => Math.max(0, p.planned_count - p.completed_count)),
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            <header>
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                <p className="text-slate-400">Welcome back, {user?.display_name}! Here's your task consistency this week.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Tasks Completed"
                    value={totalCompleted.toString()}
                    subValue="Last 7 days"
                    icon={CheckCircle2}
                    color="green"
                />
                <StatsCard
                    title="Consistency"
                    value={`${completionRate}%`}
                    subValue="Completion Rate"
                    icon={TrendingUp}
                    color="blue"
                />
                <StatsCard
                    title="Active Tasks"
                    value={(productivity[productivity.length - 1]?.planned_count || 0).toString()}
                    subValue="Total defined tasks"
                    icon={ShoppingBag}
                    color="purple"
                />
                <StatsCard
                    title="Pending Today"
                    value={todayUndone.toString()}
                    subValue="Tasks remaining"
                    icon={Clock}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" /> Completion Trend
                    </h3>
                    <div className="h-[250px]">
                        <Line data={doneLineData} options={{ maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-400" /> Incompletion Trend
                    </h3>
                    <div className="h-[250px]">
                        <Line data={undoneLineData} options={{ maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Daily Chart */}
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-center">Daily Performance</h3>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        {dailyPlanned > 0 ? (
                            <Doughnut
                                data={dailyDoughnut}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    const label = context.label || '';
                                                    const value = context.parsed || 0;
                                                    return `${label}: ${value} tasks`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-slate-500 text-sm">No data</p>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-3xl font-black text-primary-400">{dailyRate}%</div>
                        <div className="text-xs text-slate-400 mt-1">{dailyCompleted}/{dailyPlanned} tasks</div>
                    </div>
                </div>

                {/* Weekly Chart */}
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-center">Weekly Performance</h3>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        {weeklyPlanned > 0 ? (
                            <Doughnut
                                data={weeklyDoughnut}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    const label = context.label || '';
                                                    const value = context.parsed || 0;
                                                    return `${label}: ${value} tasks`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-slate-500 text-sm">No data</p>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-3xl font-black text-primary-400">{weeklyRate}%</div>
                        <div className="text-xs text-slate-400 mt-1">{weeklyCompleted}/{weeklyPlanned} tasks</div>
                    </div>
                </div>

                {/* Monthly Chart */}
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-center">Monthly Performance</h3>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        {monthlyPlanned > 0 ? (
                            <Doughnut
                                data={monthlyDoughnut}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    const label = context.label || '';
                                                    const value = context.parsed || 0;
                                                    return `${label}: ${value} tasks`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-slate-500 text-sm">No data</p>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-3xl font-black text-primary-400">{monthlyRate}%</div>
                        <div className="text-xs text-slate-400 mt-1">{monthlyCompleted}/{monthlyPlanned} tasks</div>
                    </div>
                </div>

                {/* Yearly Chart */}
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                    <h3 className="text-lg font-semibold mb-4 text-center">Yearly Performance</h3>
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                        {yearlyPlanned > 0 ? (
                            <Doughnut
                                data={yearlyDoughnut}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    const label = context.label || '';
                                                    const value = context.parsed || 0;
                                                    return `${label}: ${value} tasks`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-slate-500 text-sm">No data</p>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-3xl font-black text-primary-400">{yearlyRate}%</div>
                        <div className="text-xs text-slate-400 mt-1">{yearlyCompleted}/{yearlyPlanned} tasks</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, subValue, icon: Icon, color }: any) {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-400/10',
        green: 'text-green-400 bg-green-400/10',
        purple: 'text-purple-400 bg-purple-400/10',
        orange: 'text-orange-400 bg-orange-400/10',
        red: 'text-red-400 bg-red-400/10',
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{subValue}</p>
        </div>
    );
}


