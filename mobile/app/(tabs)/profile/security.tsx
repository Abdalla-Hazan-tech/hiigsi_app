import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { ChevronLeft, Shield, Smartphone, Key, X, Check, Copy, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import client from '../../../src/api/client';

export default function SecurityScreen() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    
    // MFA States
    const [mfaModalVisible, setMfaModalVisible] = useState(false);
    const [mfaData, setMfaData] = useState<any>(null);
    const [totpCode, setTotpCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    
    // Disable MFA State
    const [disableModalVisible, setDisableModalVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // Password Change States
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleSetupMFA = async () => {
        setLoading(true);
        try {
            const res = await client.get('auth/mfa/setup/');
            setMfaData(res.data);
            setMfaModalVisible(true);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to setup MFA');
        } finally {
            setLoading(false);
        }
    };

    const handleEnableMFA = async () => {
        if (totpCode.length !== 6) return;
        setLoading(true);
        try {
            const res = await client.post('auth/mfa/enable/', { totp: totpCode });
            setRecoveryCodes(res.data.recovery_codes);
            await updateUser({ is_mfa_enabled: true });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Invalid TOTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableMFA = async () => {
        if (!confirmPassword) return;
        setLoading(true);
        try {
            await client.post('auth/mfa/disable/', { password: confirmPassword });
            await updateUser({ is_mfa_enabled: false });
            setDisableModalVisible(false);
            setConfirmPassword('');
            Alert.alert('Success', 'Two-Factor Authentication disabled');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await client.post('auth/password-change/', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            setPasswordModalVisible(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            Alert.alert('Success', 'Password changed successfully');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
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
                <Text style={styles.headerTitle}>Security</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.statusCard}>
                    <Shield size={40} color={user?.is_mfa_enabled ? '#10b981' : '#f59e0b'} />
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusTitle}>Two-Factor Authentication</Text>
                        <Text style={[styles.statusValue, { color: user?.is_mfa_enabled ? '#10b981' : '#f59e0b' }]}>
                            {user?.is_mfa_enabled ? 'Active' : 'Highly Recommended'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Login Security</Text>
                    
                    <TouchableOpacity style={styles.item} onPress={() => setPasswordModalVisible(true)}>
                        <View style={styles.itemLeft}>
                            <Key size={20} color="#94a3b8" />
                            <Text style={styles.itemLabel}>Change Password</Text>
                        </View>
                        <Text style={styles.itemBadge}>Update</Text>
                    </TouchableOpacity>

                    <View style={styles.item}>
                        <View style={styles.itemLeft}>
                            <Smartphone size={20} color="#94a3b8" />
                            <Text style={styles.itemLabel}>Two-Factor Auth</Text>
                        </View>
                        <Switch 
                            value={user?.is_mfa_enabled} 
                            trackColor={{ false: '#334155', true: '#0ea5e930' }}
                            thumbColor={user?.is_mfa_enabled ? '#0ea5e9' : '#94a3b8'}
                            onValueChange={() => user?.is_mfa_enabled ? setDisableModalVisible(true) : handleSetupMFA()}
                        />
                    </View>
                </View>

                <Text style={styles.note}>
                    Keep your account secure by using a strong password and enabling two-factor authentication.
                </Text>
            </View>

            {/* Change Password Modal */}
            <Modal visible={passwordModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                                <X color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <TextInput
                                style={styles.input}
                                placeholder="Old Password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={passwordData.old_password}
                                onChangeText={(val) => setPasswordData({...passwordData, old_password: val})}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={passwordData.new_password}
                                onChangeText={(val) => setPasswordData({...passwordData, new_password: val})}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={passwordData.confirm_password}
                                onChangeText={(val) => setPasswordData({...passwordData, confirm_password: val})}
                            />
                            <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Password</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Disable MFA Modal */}
            <Modal visible={disableModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Disable 2FA</Text>
                            <TouchableOpacity onPress={() => setDisableModalVisible(false)}>
                                <X color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalDesc}>To disable 2FA, please enter your password for verification.</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Your Password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#ef4444' }]} onPress={handleDisableMFA} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Disable 2FA</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Setup MFA Modal */}
            <Modal visible={mfaModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Setup 2FA</Text>
                            <TouchableOpacity onPress={() => { setMfaModalVisible(false); setRecoveryCodes([]); setTotpCode(''); }}>
                                <X color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {recoveryCodes.length > 0 ? (
                                <View>
                                    <View style={styles.successIcon}>
                                        <Check size={48} color="#10b981" />
                                    </View>
                                    <Text style={styles.successTitle}>2FA Enabled Successfully!</Text>
                                    <Text style={styles.modalDesc}>Save these recovery codes in a safe place. They are the only way to access your account if you lose your authenticator app.</Text>
                                    <View style={styles.codesGrid}>
                                        {recoveryCodes.map(code => (
                                            <View key={code} style={styles.codeItem}><Text style={styles.codeText}>{code}</Text></View>
                                        ))}
                                    </View>
                                    <TouchableOpacity style={styles.submitBtn} onPress={() => { setMfaModalVisible(false); setRecoveryCodes([]); setTotpCode(''); }}>
                                        <Text style={styles.submitText}>I've Saved Them</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <Text style={styles.stepTitle}>1. Link Authenticator</Text>
                                    <Text style={styles.modalDesc}>Scan this QR code in your authenticator app (Authy, Google Authenticator, etc.)</Text>
                                    
                                    <View style={styles.qrContainer}>
                                        <Image 
                                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaData?.otpauth_uri || '')}` }}
                                            style={styles.qrImage}
                                        />
                                    </View>

                                    <Text style={styles.modalDesc}>Or enter this code manually:</Text>
                                    <View style={styles.manualCode}>
                                        <Text style={styles.manualCodeText}>{mfaData?.otpauth_uri?.split('secret=')[1]?.split('&')[0]}</Text>
                                    </View>

                                    <Text style={[styles.stepTitle, { marginTop: 24 }]}>2. Verify Token</Text>
                                    <TextInput
                                        style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                                        placeholder="000000"
                                        placeholderTextColor="#64748b"
                                        keyboardType="numeric"
                                        maxLength={6}
                                        value={totpCode}
                                        onChangeText={setTotpCode}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.submitBtn, totpCode.length !== 6 && { opacity: 0.5 }]} 
                                        onPress={handleEnableMFA} 
                                        disabled={loading || totpCode.length !== 6}
                                    >
                                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enable 2FA</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#0f172a' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
    content: { padding: 24 },
    statusCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 32, borderWidth: 1, borderColor: '#334155' },
    statusInfo: { flex: 1 },
    statusTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
    statusValue: { fontSize: 14, marginTop: 4, fontWeight: '500' },
    section: { gap: 12 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 16, borderRadius: 16 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemLabel: { color: '#f8fafc', fontSize: 16 },
    itemBadge: { color: '#0ea5e9', fontSize: 14, fontWeight: 'bold' },
    note: { color: '#475569', fontSize: 13, textAlign: 'center', marginTop: 32, lineHeight: 20 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.95)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
    modalBody: { gap: 16 },
    modalDesc: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    input: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, color: '#f8fafc', fontSize: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
    submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 8 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // MFA Specific
    qrContainer: { alignItems: 'center', marginVertical: 24, padding: 16, backgroundColor: '#fff', borderRadius: 24 },
    qrImage: { width: 200, height: 200 },
    manualCode: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#0ea5e930', alignItems: 'center' },
    manualCodeText: { color: '#0ea5e9', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
    stepTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b98120', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginVertical: 24 },
    successTitle: { color: '#10b981', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    codesGrid: { gap: 8, marginVertical: 24, flexDirection: 'row', flexWrap: 'wrap' },
    codeItem: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' },
    codeText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
});
