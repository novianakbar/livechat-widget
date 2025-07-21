import { Volume2, VolumeX, Bell, BellOff, Smartphone, TestTube } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationSettings.css';

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
    const {
        settings,
        hasPermission,
        updateSettings,
        requestPermission,
        testNotification,
        isAudioSupported,
        isNotificationSupported,
    } = useNotifications();

    if (!isOpen) return null;

    const handleRequestPermission = async () => {
        const granted = await requestPermission();
        if (!granted) {
            alert('Notifikasi browser tidak diizinkan. Silakan aktifkan melalui pengaturan browser Anda.');
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="notification-settings-overlay" onClick={handleOverlayClick}>
            <div className="notification-settings-modal">
                <div className="notification-settings-header">
                    <h3>Pengaturan Notifikasi</h3>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="notification-settings-content">
                    {/* Sound Settings */}
                    <div className="setting-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">
                                    {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    <span>Suara Notifikasi</span>
                                </div>
                                <p className="setting-description">
                                    Memainkan suara saat ada pesan masuk
                                </p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.soundEnabled}
                                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                                    disabled={!isAudioSupported}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {/* Sound Type Selection */}
                        {settings.soundEnabled && isAudioSupported && (
                            <div className="setting-item sound-type-control">
                                <label>Jenis Suara:</label>
                                <select
                                    value={settings.soundType}
                                    onChange={(e) => updateSettings({ soundType: e.target.value as 'success' | 'warning' | 'error' | 'info' })}
                                    className="sound-type-select"
                                >
                                    <option value="info">Info (Beep tunggal)</option>
                                    <option value="success">Sukses (Beep naik)</option>
                                    <option value="warning">Peringatan (Beep sedang)</option>
                                    <option value="error">Error (Beep ganda rendah)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Browser Notifications */}
                    <div className="setting-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">
                                    {settings.browserNotificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                                    <span>Notifikasi Browser</span>
                                </div>
                                <p className="setting-description">
                                    Tampilkan notifikasi browser saat widget tertutup
                                </p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.browserNotificationsEnabled && hasPermission}
                                    onChange={(e) => {
                                        if (e.target.checked && !hasPermission) {
                                            handleRequestPermission();
                                        } else {
                                            updateSettings({ browserNotificationsEnabled: e.target.checked });
                                        }
                                    }}
                                    disabled={!isNotificationSupported}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {!hasPermission && settings.browserNotificationsEnabled && (
                            <div className="setting-warning">
                                <p>
                                    Permission notifikasi browser belum diberikan.{' '}
                                    <button onClick={handleRequestPermission} className="permission-button">
                                        Izinkan Notifikasi
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Vibration */}
                    <div className="setting-group">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">
                                    {settings.vibrationEnabled ? <Smartphone size={16} /> : <Smartphone size={16} className="icon-disabled" />}
                                    <span>Getaran</span>
                                </div>
                                <p className="setting-description">
                                    Getaran pada perangkat mobile saat ada pesan
                                </p>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.vibrationEnabled}
                                    onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                                    disabled={!('vibrate' in navigator)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Test Button */}
                    <div className="setting-group">
                        <button onClick={testNotification} className="test-notification-button">
                            <TestTube size={16} />
                            Tes Notifikasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
