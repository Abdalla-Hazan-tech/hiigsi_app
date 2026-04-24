import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TextInput,
  RefreshControl
} from 'react-native';
import { Search, CheckCircle } from 'lucide-react-native';
import Logo from '../../../components/Logo';

import client from '../../../src/api/client';

interface HistoryItem {
    id: number;
    date: string;
    activity_title: string;
    category_name: string;
    category_color: string;
}

export default function HistoryScreen() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await client.get('analytics/history-list/?days=90');
            setHistory(res.data);
        } catch (err) {
            console.error('Error fetching history', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const filteredHistory = history.filter(item =>
        item.activity_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
                <Text style={styles.activityTitle}>{item.activity_title}</Text>
                <View style={styles.categoryInfo}>
                    <View style={[styles.colorDot, { backgroundColor: item.category_color }]} />
                    <Text style={styles.categoryName}>{item.category_name}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </Text>
            </View>
            <View style={styles.statusBadge}>
                <CheckCircle size={14} color="#22c55e" />
                <Text style={styles.statusText}>Done</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Logo size={40} />
                    <View>
                        <Text style={styles.title}>History</Text>
                        <Text style={styles.subtitle}>Past 90 days</Text>
                    </View>
                </View>
            </View>


            <View style={styles.searchContainer}>
                <Search size={18} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    placeholderTextColor="#64748b"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredHistory}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No history found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { padding: 24, paddingTop: 48 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    subtitle: { fontSize: 14, color: '#94a3b8' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 16 },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, height: 48, color: '#f8fafc' },
    list: { padding: 24 },
    historyCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    historyInfo: { flex: 1, gap: 4 },
    activityTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    colorDot: { width: 8, height: 8, borderRadius: 4 },
    categoryName: { color: '#94a3b8', fontSize: 12 },
    dateText: { color: '#64748b', fontSize: 11, marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22c55e15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#22c55e', fontSize: 10, fontWeight: 'bold' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontSize: 16 },
});
