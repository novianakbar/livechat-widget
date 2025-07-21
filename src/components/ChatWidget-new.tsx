import React, { useState } from 'react';
import { MessageCircle, X, Send, Paperclip, Minimize2, FileText, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { useChatWidget } from '../hooks/useChatWidget';
import type { Customer, WidgetConfig } from '../types/chat';
import './ChatWidget.css';

interface ChatWidgetProps {
    config?: Partial<WidgetConfig>;
}

// Pre-defined questions for OSS (Online Single Submission)
const ossQuestions = [
    "Bagaimana cara mengurus NIB (Nomor Induk Berusaha)?",
    "Berapa lama proses penerbitan izin usaha?",
    "Dokumen apa saja yang diperlukan untuk izin usaha?",
    "Apakah ada biaya untuk mengurus perizinan?",
    "Bagaimana cara cek status permohonan saya?",
    "Apa beda NIB dengan izin usaha lainnya?",
    "Bisa bantu saya dengan masalah login OSS?",
    "Izin apa saja yang diperlukan untuk usaha perdagangan?"
];

export function ChatWidget({ config }: ChatWidgetProps) {
    const { chatState, messages, isLoading, error, config: widgetConfig, actions } = useChatWidget(config);
    const [customerForm, setCustomerForm] = useState<Omit<Customer, 'id' | 'createdAt'>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
    });
    const [messageInput, setMessageInput] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerForm.name.trim()) return;

        await actions.startChat(customerForm);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        await actions.sendMessage(messageInput);
        setMessageInput('');
        actions.stopTyping();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await actions.uploadFile(file);
        e.target.value = '';
    };

    const handleInputChange = (value: string) => {
        setMessageInput(value);
        if (value.trim()) {
            actions.startTyping();
        } else {
            actions.stopTyping();
        }
    };

    return (
        <>
            {/* Widget Toggle Button */}
            {!chatState.isOpen && (
                <div
                    className={clsx(
                        'chat-widget-toggle',
                        `chat-widget-toggle--${widgetConfig.position}`
                    )}
                    onClick={actions.toggleWidget}
                    style={{ backgroundColor: widgetConfig.primaryColor }}
                >
                    <MessageCircle size={24} />
                    {chatState.unreadCount > 0 && (
                        <div className="chat-widget-badge">
                            {chatState.unreadCount}
                        </div>
                    )}
                </div>
            )}

            {/* Main Chat Widget */}
            {chatState.isOpen && (
                <div
                    className={clsx(
                        'chat-widget',
                        `chat-widget--${widgetConfig.position}`,
                        { 'chat-widget--minimized': isMinimized }
                    )}
                >
                    {/* Header */}
                    <div
                        className="chat-widget-header"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                    >
                        <div className="chat-widget-header-content">
                            <h3>Bantuan OSS Perizinan Berusaha</h3>
                            {chatState.assignedAdmin && (
                                <p className="chat-widget-admin">
                                    Admin: {chatState.assignedAdmin.name}
                                    <span className={clsx('status-indicator', {
                                        'status-indicator--online': chatState.assignedAdmin.isOnline
                                    })} />
                                </p>
                            )}
                        </div>
                        <div className="chat-widget-header-actions">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="chat-widget-button"
                            >
                                <Minimize2 size={16} />
                            </button>
                            <button
                                onClick={actions.closeWidget}
                                className="chat-widget-button"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="chat-widget-content">
                            {/* Error Display */}
                            {error && (
                                <div className="chat-widget-error">
                                    <p>{error}</p>
                                    <button onClick={actions.clearError}>×</button>
                                </div>
                            )}

                            {/* Customer Form */}
                            {!chatState.currentSession && (
                                <div className="chat-widget-form">
                                    <div className="oss-branding">
                                        <FileText className="oss-icon" size={20} />
                                        <h4>Bantuan OSS Perizinan Berusaha</h4>
                                    </div>
                                    <p className="chat-widget-welcome">
                                        Dapatkan bantuan untuk pengurusan izin berusaha melalui Online Single Submission (OSS)
                                    </p>

                                    {/* Quick Questions */}
                                    {showQuickQuestions && (
                                        <div className="quick-questions">
                                            <div className="quick-questions-header">
                                                <HelpCircle size={16} />
                                                <span>Pertanyaan Populer:</span>
                                                <button
                                                    onClick={() => setShowQuickQuestions(false)}
                                                    className="hide-questions-btn"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="questions-grid">
                                                {ossQuestions.slice(0, 4).map((question, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            setCustomerForm({ ...customerForm, subject: question });
                                                            setShowQuickQuestions(false);
                                                        }}
                                                        className="quick-question-btn"
                                                    >
                                                        {question}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleStartChat}>
                                        <input
                                            type="text"
                                            placeholder="Nama Lengkap *"
                                            value={customerForm.name}
                                            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                            required
                                            className="chat-widget-input"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email *"
                                            value={customerForm.email}
                                            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                            required
                                            className="chat-widget-input"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Nomor Telepon"
                                            value={customerForm.phone}
                                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                            className="chat-widget-input"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nama Perusahaan/Usaha"
                                            value={customerForm.company}
                                            onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                                            className="chat-widget-input"
                                        />
                                        <textarea
                                            placeholder="Jelaskan kebutuhan bantuan Anda (misal: cara mengurus NIB, status permohonan, dll)"
                                            value={customerForm.subject}
                                            onChange={(e) => setCustomerForm({ ...customerForm, subject: e.target.value })}
                                            rows={3}
                                            className="chat-widget-textarea"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="chat-widget-submit"
                                            style={{ backgroundColor: widgetConfig.primaryColor }}
                                        >
                                            {isLoading ? 'Memulai Chat...' : 'Mulai Chat dengan Admin OSS'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {chatState.currentSession && (
                                <div className="chat-widget-messages">
                                    <div className="chat-messages-container">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={clsx('chat-message', {
                                                    'chat-message--customer': message.sender === 'customer',
                                                    'chat-message--admin': message.sender === 'admin',
                                                })}
                                            >
                                                <div className="chat-message-content">
                                                    {message.type === 'file' ? (
                                                        <div className="chat-message-file">
                                                            <Paperclip size={16} />
                                                            <span>{message.content}</span>
                                                        </div>
                                                    ) : (
                                                        <p>{message.content}</p>
                                                    )}
                                                </div>
                                                <span className="chat-message-time">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                        {chatState.isTyping && (
                                            <div className="chat-typing-indicator">
                                                <span>Admin sedang mengetik...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={handleSendMessage} className="chat-input-form">
                                        <div className="chat-input-container">
                                            <input
                                                type="text"
                                                value={messageInput}
                                                onChange={(e) => handleInputChange(e.target.value)}
                                                placeholder="Ketik pesan Anda..."
                                                className="chat-input"
                                                disabled={isLoading}
                                            />
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                className="chat-file-input"
                                                id="file-upload"
                                                style={{ display: 'none' }}
                                                disabled={isLoading}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="chat-file-button"
                                            >
                                                <Paperclip size={18} />
                                            </label>
                                            <button
                                                type="submit"
                                                disabled={!messageInput.trim() || isLoading}
                                                className="chat-send-button"
                                                style={{ backgroundColor: widgetConfig.primaryColor }}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
