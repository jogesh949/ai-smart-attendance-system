import React from 'react';
import { motion } from 'framer-motion';

const AISpinner = ({ size = "md" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={`relative ${sizes[size] || sizes.md} flex items-center justify-center`}>
      {/* Hexagon Path Spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-DEFAULT opacity-20">
          <path
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      {/* Pulse Rings */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-cyan-DEFAULT/20 rounded-full blur-xl"
      />

      {/* Core Dot */}
      <motion.div
        animate={{ scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-1/4 h-1/4 bg-cyan-DEFAULT rounded-full shadow-[0_0_15px_#00F5FF] z-10"
      />

      {/* Rotating Orbitals */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-dashed border-violet/30 rounded-full"
      />
    </div>
  );
};

export default AISpinner;
