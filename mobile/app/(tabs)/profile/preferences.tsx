import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import client from '../../../src/api/client';
import { ChevronLeft, Goal, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function PreferencesScreen() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [goal, setGoal] = useState(user?.consistency_goal?.toString() || '80');

    const handleSave = async () => {
        const goalNum = parseInt(goal);
        if (isNaN(goalNum) || goalNum < 1 || goalNum > 100) {
            Alert.alert('Error', 'Please enter a valid percentage (1-100)');
            return;
        }

        setLoading(true);
        try {
            const response = await client.patch('auth/profile/update/', {
                consistency_goal: goalNum
            });
            await updateUser(response.data);
            Alert.alert('Success', 'Preferences updated');
            router.replace('/(tabs)/profile');
        } catch (error) {
            console.error('Update preferences error:', error);
            Alert.alert('Error', 'Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Preferences</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Goals</Text>
                    
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Goal size={24} color="#0ea5e9" />
                            <Text style={styles.cardTitle}>Consistency Goal</Text>
                        </View>
                        <Text style={styles.cardDesc}>
                            Set your target completion rate for activities.
                        </Text>
                        
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={goal}
                                onChangeText={setGoal}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                            <Text style={styles.unit}>%</Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.saveBtn} 
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Save size={20} color="#ffffff" />
                                    <Text style={styles.saveText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.section, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>App Appearance</Text>
                    <View style={styles.item}>
                        <Text style={styles.itemLabel}>Dark Mode (Default)</Text>
                        <Text style={styles.itemValue}>System</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#0f172a' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
    content: { padding: 24 },
    section: { gap: 12 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    card: { backgroundColor: '#1e293b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
    cardDesc: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 24 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#0ea5e9', fontSize: 24, fontWeight: 'bold', textAlign: 'center', width: 80, borderWidth: 1, borderColor: '#334155' },
    unit: { fontSize: 24, fontWeight: 'bold', color: '#94a3b8' },
    saveBtn: { backgroundColor: '#0ea5e9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
    saveText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 16, borderRadius: 16 },
    itemLabel: { color: '#f8fafc', fontSize: 16 },
    itemValue: { color: '#475569', fontSize: 14 },
});
