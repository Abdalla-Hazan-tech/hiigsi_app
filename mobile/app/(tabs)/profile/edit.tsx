import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import client, { getImageUrl } from '../../../src/api/client';
import { Camera, Check, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
    });

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const localUri = uri;
            const filename = localUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;

            const data = new FormData();
            // @ts-ignore
            data.append('profile_image', { uri: localUri, name: filename, type });

            const response = await client.patch('auth/profile/update/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await updateUser(response.data);
            Alert.alert('Success', 'Profile picture updated');
        } catch (error) {
            console.error('Upload image error:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await client.patch('auth/profile/update/', formData);
            await updateUser(response.data);
            Alert.alert('Success', 'Profile updated successfully');
            router.replace('/(tabs)/profile');
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile');
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
                <Text style={styles.headerTitle}>Personal Information</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                    {loading ? <ActivityIndicator size="small" color="#0ea5e9" /> : <Check size={24} color="#0ea5e9" />}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatar} onPress={handlePickImage} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color="#0ea5e9" />
                        ) : user?.avatar_url ? (
                            <Image 
                                source={{ uri: getImageUrl(user.avatar_url) }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <Text style={styles.avatarText}>{user?.username?.[0].toUpperCase()}</Text>
                        )}
                        <View style={styles.cameraBtn}>
                            <Camera size={16} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.username}>@{user?.username}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.first_name}
                            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                            placeholder="Enter first name"
                            placeholderTextColor="#475569"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.last_name}
                            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                            placeholder="Enter last name"
                            placeholderTextColor="#475569"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email (Read Only)</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email}
                            editable={false}
                        />
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
    saveBtn: { padding: 8 },
    content: { padding: 24 },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0ea5e9', position: 'relative', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 40, fontWeight: 'bold', color: '#0ea5e9' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0ea5e9', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#020617' },
    username: { marginTop: 12, color: '#94a3b8', fontSize: 16 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { color: '#94a3b8', fontSize: 14, fontWeight: '500', marginLeft: 4 },
    input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#f8fafc', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
    disabledInput: { opacity: 0.6, backgroundColor: '#0f172a' },
});
