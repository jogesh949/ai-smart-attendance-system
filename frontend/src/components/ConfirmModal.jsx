import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'info' }) => {
  if (!isOpen) return null;

  const icon = variant === 'danger' ? <AlertTriangle size={24} className="text-danger" /> : <CheckCircle2 size={24} className="text-cyan-DEFAULT" />;
  const confirmButtonClass = variant === 'danger' ? 'bg-danger hover:bg-red-700' : 'bg-cyan-DEFAULT text-cosmic hover:bg-cyan-DEFAULT/80';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
          >
            <div className="mb-4 flex justify-center">
              {icon}
            </div>
            <h3 className="font-orbitron text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-text-muted text-sm mb-6">{message}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-orbitron font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-6 py-3 rounded-xl text-white font-orbitron font-bold uppercase tracking-widest text-xs transition-all ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;