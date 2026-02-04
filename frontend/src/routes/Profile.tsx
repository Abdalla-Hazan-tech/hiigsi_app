import { useState, useEffect, FormEvent, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import client from '../api/client';
import { User, Shield, Camera, Goal, Check, ShieldAlert, Key, Trash2, X, Fingerprint } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropUtils';
import { getImageUrl } from '../utils/imageUtils';

export default function Profile() {
    const { user, updateUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState('general');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mfaData, setMfaData] = useState<any>(null);
    const [totpCode, setTotpCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Cropping states
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const [generalData, setGeneralData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        consistency_goal: user?.consistency_goal || 80,
    });

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await client.patch('auth/profile/update/', generalData);
            updateUser(res.data);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result as string);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleImageUpload = async () => {
        if (!imageToCrop || !croppedAreaPixels) return;

        setUploading(true);
        setError('');
        try {
            const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            const file = new File([croppedImageBlob], 'profile.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('profile_image', file);

            const res = await client.patch('auth/profile/update/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            updateUser(res.data);
            setSuccess('Profile image updated!');
            setImageToCrop(null);
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!confirm('Are you sure you want to remove your profile picture?')) return;
        setUploading(true);
        setError('');
        try {
            // Sending null to clear the ImageField
            const res = await client.patch('auth/profile/update/', { profile_image: null });
            updateUser(res.data);
            setSuccess('Profile image removed!');
        } catch (err) {
            setError('Failed to remove image');
        } finally {
            setUploading(false);
        }
    };

    const setupMFA = async () => {
        try {
            const res = await client.get('auth/mfa/setup/');
            setMfaData(res.data);
        } catch (err) {
            setError('Failed to fetch MFA setup data');
        }
    };

    const enableMFA = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await client.post('auth/mfa/enable/', { totp: totpCode });
            setRecoveryCodes(res.data.recovery_codes);
            updateUser({ is_mfa_enabled: true });
            setSuccess('MFA enabled successfully!');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid TOTP code');
        } finally {
            setLoading(false);
        }
    };

    const disableMFA = async () => {
        if (!confirm('Are you sure you want to disable MFA? This reduces your account security.')) return;
        setLoading(true);
        try {
            const password = prompt('Please enter your password to confirm:');
            if (!password) return;
            await client.post('auth/mfa/disable/', { password });
            updateUser({ is_mfa_enabled: false });
            setSuccess('MFA disabled successfully');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPasskey = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // 1. Get options from backend
            const startRes = await client.post('security/webauthn/register/start/');
            const options = startRes.data;

            // 2. Pass to browser API
            const credential = await startRegistration(options);

            // 3. Send to backend for verification
            await client.post('security/webauthn/register/finish/', credential);
            
            setSuccess('Passkey registered successfully! You can now use it to login.');
        } catch (err: any) {
            console.error(err);
            if (err.name === 'NotAllowedError') {
                setError('Passkey registration cancelled or timed out.');
            } else {
                setError(err.response?.data?.detail || err.message || 'Failed to register passkey');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
                    <p className="text-slate-400">Manage your profile information and security preferences.</p>
                </header>

                <div className="flex gap-8">
                    <aside className="w-56 space-y-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'general' ? 'bg-primary-500/20 text-primary-400 font-semibold' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <User className="w-5 h-5" /> General
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-primary-500/20 text-primary-400 font-semibold' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <Shield className="w-5 h-5" /> Security
                        </button>
                    </aside>

                    <main className="flex-1">
                        {activeTab === 'general' && (
                            <div className="glass-panel p-8 rounded-3xl space-y-8 animate-in">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className={`w-24 h-24 rounded-full bg-slate-800 border-2 ${uploading ? 'border-primary-500 animate-pulse' : 'border-primary-500/30'} overflow-hidden shadow-2xl transition-all`}>
                                            {user?.avatar_url ? (
                                                <img src={getImageUrl(user.avatar_url) || ''} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-400">
                                                    {user?.username?.[0].toUpperCase()}
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute bottom-0 right-0 bg-primary-600 p-2.5 rounded-full border-2 border-slate-900 text-white shadow-xl hover:bg-primary-500 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Change Profile Picture"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        {user?.avatar_url && (
                                            <button
                                                onClick={handleDeleteImage}
                                                disabled={uploading}
                                                className="absolute -top-1 -right-1 bg-red-500/80 hover:bg-red-500 p-1.5 rounded-full border border-slate-900 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                title="Remove Profile Picture"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{user?.username}</h3>
                                        <p className="text-slate-400 text-sm">{user?.email}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={generalData.first_name}
                                                onChange={e => setGeneralData({ ...generalData, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={generalData.last_name}
                                                onChange={e => setGeneralData({ ...generalData, last_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                            <Goal className="w-4 h-4" /> Consistency Goal (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none"
                                            value={generalData.consistency_goal}
                                            onChange={e => setGeneralData({ ...generalData, consistency_goal: parseInt(e.target.value) || 0 })}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">Target completion rate for your weekly/monthly consistency.</p>
                                    </div>



                                    {success && <div className="text-green-400 text-sm flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}
                                    {error && <div className="text-red-400 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {error}</div>}

                                    <button
                                        disabled={loading}
                                        className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="glass-panel p-8 rounded-3xl space-y-8 animate-in text-slate-200">
                                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                            <Fingerprint className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Passkeys (FaceID / TouchID)</h3>
                                            <p className="text-sm text-slate-400">Log in faster using your device's biometric security.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleRegisterPasskey} 
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl"
                                    >
                                        Add Passkey
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${user?.is_mfa_enabled ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-400'}`}>
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Two-Factor Authentication</h3>
                                            <p className="text-sm text-slate-400">{user?.is_mfa_enabled ? 'Active and protecting your account' : 'Highly recommended for better security'}</p>
                                        </div>
                                    </div>
                                    {user?.is_mfa_enabled ? (
                                        <button onClick={disableMFA} className="text-red-400 hover:text-red-300 font-semibold px-4 py-2 rounded-lg border border-red-400/20">
                                            Disable
                                        </button>
                                    ) : (
                                        <button onClick={setupMFA} className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2 rounded-xl">
                                            Setup MFA
                                        </button>
                                    )}
                                </div>

                                {mfaData && !user?.is_mfa_enabled && (
                                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700 space-y-6">
                                        <div className="flex gap-6 items-start">
                                            <div className="flex-1 space-y-4">
                                                <p className="text-sm">1. Install an authenticator app (like Google Authenticator or Authy).</p>
                                                <p className="text-sm">2. Enter this manual setup key in your app:</p>
                                                <div className="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-white/5">
                                                    <code className="text-primary-400 font-mono text-lg">{mfaData.otpauth_uri.split('secret=')[1].split('&')[0]}</code>
                                                </div>
                                                <p className="text-sm text-slate-400">3. Enter the 6-digit code from the app below to verify.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={enableMFA} className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="000000"
                                                maxLength={6}
                                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-center text-xl tracking-widest focus:ring-2 focus:ring-primary-500 outline-none"
                                                value={totpCode}
                                                onChange={e => setTotpCode(e.target.value)}
                                                required
                                            />
                                            <button className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 rounded-xl">
                                                Enable
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {recoveryCodes.length > 0 && (
                                    <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/20 space-y-4">
                                        <div className="flex items-center gap-2 text-green-400 font-bold">
                                            <Key className="w-5 h-5" /> Save your recovery codes!
                                        </div>
                                        <p className="text-sm text-slate-300">If you lose access to your device, these codes are the only way to log in.</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {recoveryCodes.map(code => (
                                                <div key={code} className="bg-black/40 p-2 rounded text-center font-mono text-sm">{code}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Crop Modal */}
            {imageToCrop && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-scale-up border border-white/5">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Crop Profile Picture</h3>
                            <button onClick={() => setImageToCrop(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="relative h-[300px] bg-slate-900">
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-black tracking-widest text-slate-500 block">Zoom</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setImageToCrop(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 font-bold hover:bg-white/5 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImageUpload}
                                    disabled={uploading}
                                    className="flex-1 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    {uploading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Apply Crop</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
