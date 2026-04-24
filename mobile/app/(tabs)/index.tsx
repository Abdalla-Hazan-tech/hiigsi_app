import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import client from '../../src/api/client';
import { CheckCircle, Clock, TrendingUp, Target } from 'lucide-react-native';
import Logo from '../../components/Logo';


interface Stats {
    planned_count: number;
    completed_count: number;
    date: string;
}

export default function DashboardScreen() {
    const { user } = useAuthStore();
    const [productivity, setProductivity] = useState<Stats[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const response = await client.get('analytics/productivity/?days=7');
            setProductivity(response.data);
        } catch (err) {
            console.error('Error fetching dashboard data', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const totalCompleted = productivity.reduce((acc, curr) => acc + curr.completed_count, 0);
    const totalPlanned = productivity.reduce((acc, curr) => acc + curr.planned_count, 0);
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
    
    const todayStats = productivity[productivity.length - 1];
    const todayPending = todayStats ? Math.max(0, todayStats.planned_count - todayStats.completed_count) : 0;

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        >
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Logo size={40} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0ea5e9' }}>Hiigsi Tracker</Text>
                </View>
                <Text style={styles.greeting}>Hello, {user?.display_name || user?.username}!</Text>
                <Text style={styles.subtitle}>Here's your summary for this week.</Text>
            </View>


            <View style={styles.statsGrid}>
                <StatsCard 
                    title="Completed" 
                    value={totalCompleted.toString()} 
                    icon={<CheckCircle size={20} color="#22c55e" />}
                    color="#22c55e"
                />
                <StatsCard 
                    title="Consistency" 
                    value={`${completionRate}%`} 
                    icon={<TrendingUp size={20} color="#0ea5e9" />}
                    color="#0ea5e9"
                />
                <StatsCard 
                    title="Planned" 
                    value={totalPlanned.toString()} 
                    icon={<Target size={20} color="#a855f7" />}
                    color="#a855f7"
                />
                <StatsCard 
                    title="Pending Today" 
                    value={todayPending.toString()} 
                    icon={<Clock size={20} color="#f43f5e" />}
                    color="#f43f5e"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Progress</Text>
                {productivity.slice().reverse().map((day, index) => (
                    <View key={day.date} style={styles.dayRow}>
                        <Text style={styles.dayText}>
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={styles.progressBarContainer}>
                            <View 
                                style={[
                                    styles.progressBar, 
                                    { 
                                        width: `${day.planned_count > 0 ? (day.completed_count / day.planned_count) * 100 : 0}%`,
                                        backgroundColor: day.completed_count === day.planned_count && day.planned_count > 0 ? '#22c55e' : '#0ea5e9'
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>{day.completed_count}/{day.planned_count}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

function StatsCard({ title, value, icon, color }: any) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                {icon}
            </View>
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020617',
    },
    header: {
        padding: 24,
        paddingTop: 48,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 12,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        flex: 1,
        minWidth: '45%',
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    cardTitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    section: {
        padding: 24,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 16,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    dayText: {
        color: '#94a3b8',
        fontSize: 12,
        width: 80,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#334155',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        color: '#f8fafc',
        fontSize: 12,
        width: 40,
        textAlign: 'right',
    },
});
