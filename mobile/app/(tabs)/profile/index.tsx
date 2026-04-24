import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';

import { useRouter } from 'expo-router';
import { User as UserIcon, LogOut, Shield, Settings, ChevronRight } from 'lucide-react-native';
import Logo from '../../../components/Logo';
import Loading from '../../../components/Loading';


import { getImageUrl } from '../../../src/api/client';

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    console.log('Profile Screen rendering, user:', !!user, user?.username);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => await logout() }
        ]);
    };

    if (!user) {
        return <Loading message="Loading profile..." />;
    }


    return (
        <ScrollView style={styles.container}>
            <View style={{ position: 'absolute', top: 48, left: 24, zIndex: 10 }}>
                <Logo size={32} />
            </View>
            <View style={styles.header}>

                <View style={styles.avatarContainer}>
                    {user.avatar_url ? (
                        <Image 
                            source={{ uri: getImageUrl(user.avatar_url) }} 
                            style={styles.avatarImage} 
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {user.username?.[0].toUpperCase() || 'U'}
                        </Text>
                    )}
                </View>
                <Text style={styles.displayName}>{user.display_name || user.username}</Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <ProfileItem 
                    icon={<UserIcon size={20} color="#0ea5e9" />} 
                    label="Personal Information" 
                    onPress={() => router.push('/(tabs)/profile/edit')}
                />
                <ProfileItem 
                    icon={<Shield size={20} color="#10b981" />} 
                    label="Security" 
                    onPress={() => router.push('/(tabs)/profile/security')}
                />
                <ProfileItem 
                    icon={<Settings size={20} color="#f59e0b" />} 
                    label="Preferences" 
                    onPress={() => router.push('/(tabs)/profile/preferences')}
                />
            </View>

            <View style={[styles.section, { marginTop: 24 }]}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

function ProfileItem({ icon, label, onPress }: any) {
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.itemLeft}>
                <View style={styles.iconWrapper}>{icon}</View>
                <Text style={styles.itemLabel}>{label}</Text>
            </View>
            <ChevronRight size={20} color="#475569" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { padding: 40, alignItems: 'center', backgroundColor: '#1e293b60', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0ea5e920', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#0ea5e9', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#0ea5e9' },
    displayName: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
    email: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
    section: { padding: 24 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    itemLabel: { color: '#f8fafc', fontSize: 16, fontWeight: '500' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#ef444415', padding: 18, borderRadius: 16, borderColor: '#ef444430', borderWidth: 1 },
    logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
});
