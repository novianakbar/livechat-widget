import { RefreshCw } from 'lucide-react';
import type { ChatHistoryItem } from '../services/api';

interface ChatHistoryProps {
    chatHistory: ChatHistoryItem[];
    isLoadingHistory: boolean;
    onSelectSession: (sessionId: string) => void;
    onRefreshHistory: () => void;
}

export function ChatHistory({
    chatHistory,
    isLoadingHistory,
    onSelectSession,
    onRefreshHistory
}: ChatHistoryProps) {

    const handleSelectSession = (sessionId: string) => {
        onSelectSession(sessionId);
    };

    return (
        <>
            {/* Chat History */}
            {isLoadingHistory ? (
                <div className="loading-history">
                    <p className="loading-history-text">Memuat riwayat chat</p>
                </div>
            ) : chatHistory.length > 0 ? (
                <div style={{ margin: '20px 0' }}>
                    <div className="history-refresh-container">
                        <h5 className="history-section-title">
                            Riwayat Chat Sebelumnya
                        </h5>
                        <button
                            onClick={onRefreshHistory}
                            className="history-refresh-btn"
                            title="Refresh Riwayat"
                            disabled={isLoadingHistory}
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                    <div className="chat-history-container">
                        {chatHistory.map((session) => (
                            <button
                                key={session.session_id}
                                onClick={() => handleSelectSession(session.session_id)}
                                className="chat-history-item"
                            >
                                <div className="history-topic">
                                    {session.topic}
                                </div>
                                <div className="history-meta">
                                    <span className={`history-status-badge history-status-badge--closed`}>
                                        <span className="history-status-indicator"></span>
                                        {session.status}
                                    </span>
                                    <span>
                                        {new Date(session.started_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    {session.contact && (
                                        <span>{session.contact.contact_name}</span>
                                    )}
                                </div>
                                {session.last_message && (
                                    <div className="history-last-message">
                                        "{session.last_message.message}"
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="no-history">
                    <p>
                        Belum ada riwayat chat. Mulai percakapan pertama Anda dengan admin OSS.
                    </p>
                    <div style={{ marginTop: '12px' }}>
                        <button
                            onClick={onRefreshHistory}
                            className="no-history-refresh-btn"
                            disabled={isLoadingHistory}
                        >
                            <RefreshCw size={14} />
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
