// src/components/NekoAlertModal.tsx
import { Cat } from "lucide-react";

interface NekoAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export function NekoAlertModal({
  isOpen,
  onClose,
  title = "Thông báo từ mèo",
  message,
}: NekoAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-fade-in">
      <div className="modal-card-styled">
        {/* Mèo buồn dễ thương */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="pulsing-gradient-soft-glow" />
          <Cat className="w-full h-full extra-large-wiggle" />
        </div>

        <h2 className="section-title-bold">{title}</h2>
        <p className="paragraph-styled-large">{message}</p>

        <button onClick={onClose} className="gradient-cta-button">
          Được rồi mèo ơi!
        </button>
      </div>

      <style>{`
      .gradient-cta-button {
  /* px-12 py-5 */
  padding-left: 3rem; 
  padding-right: 3rem; 
  padding-top: 1.25rem; 
  padding-bottom: 1.25rem; 
  
  /* bg-gradient-to-r from-pink-500 to-purple-600 */
  background-image: linear-gradient(to right, #ec4899, #7c3aed);
  
  /* text-white */
  color: #ffffff;
  
  /* rounded-2xl */
  border-radius: 1rem;
  
  /* text-2xl */
  font-size: 1.5rem;
  
  /* font-bold */
  font-weight: 700;
  
  /* transition-all */
  transition: all 150ms ease-in-out;
  
  /* shadow-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

/* Các hiệu ứng hover */
.gradient-cta-button:hover {
  /* hover:scale-110 */
  transform: scale(1.1);
}
      .paragraph-styled-large {
  font-size: 1.5rem;
  color: #374151;
  margin-bottom: 2.5rem;
  line-height: 1.625;
}
      
      @keyframes wiggle-slow {
  0%, 100% {
    transform: rotate(-0.5deg);
  }
  50% {
    transform: rotate(0.5deg);
  }
}

.extra-large-wiggle {
  position: relative;
  z-index: 10;
  font-size: 8rem; /* text-9xl (128px) */
  animation: wiggle-slow 6s ease-in-out infinite;
}
      .section-title-bold {
  font-size: 2.25rem;
  font-weight: 900;
  color: #7c3aed;
  margin-bottom: 1rem;
}
      @keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}

.pulsing-gradient-soft-glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 9999px;
  background-image: linear-gradient(to bottom right, #fbcfe8, #a855f7);
  filter: blur(24px);
  opacity: 0.6;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
      @keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

.modal-card-styled {
  background-color: #ffffff;
  border-radius: 1.5rem;
  padding: 2.5rem;
  max-width: 28rem; /* max-w-md */
  width: 100%;
  margin-left: 1rem;
  margin-right: 1rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transform: scale(1);
  animation: bounce-in 400ms ease-out forwards;
}
      @keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-overlay-fade-in {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fade-in 300ms ease-out forwards;
}
        @keyframes wiggle-slow {
          0%,
          100% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(10deg);
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-wiggle-slow {
          animation: wiggle-slow 3s ease-in-out infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
