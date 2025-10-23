import { UserCheck, X } from 'lucide-react';
import './EscalationOffer.css';

interface EscalationOfferProps {
  message?: string;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing?: boolean;
}

export function EscalationOffer({
  message = "Apakah Anda ingin terhubung dengan agent manusia kami?",
  onAccept,
  onDecline,
  isProcessing = false
}: EscalationOfferProps) {

  return (
    <div className="escalation-offer">
      <div className="escalation-offer-icon">
        <UserCheck size={18} />
      </div>
      <div className="escalation-offer-content">
        <p className="escalation-offer-message">{message}</p>
        <div className="escalation-offer-buttons">
          <button
            onClick={onAccept}
            disabled={isProcessing}
            className="escalation-button escalation-button--accept"
          >
            {isProcessing ? 'Menghubungkan...' : '✓ Ya, hubungkan'}
          </button>
          <button
            onClick={onDecline}
            disabled={isProcessing}
            className="escalation-button escalation-button--decline"
          >
            <X size={14} /> Tidak
          </button>
        </div>
      </div>
    </div>
  );
}
