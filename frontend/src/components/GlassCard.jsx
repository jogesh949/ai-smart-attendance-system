import React from 'react';
import { motion } from 'framer-motion';
import { Tilt } from 'react-tilt'; // Using react-tilt for 3D effects

const GlassCard = ({ children, className = '', glowColor = 'cyan', tilt = true, ...props }) => {
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const tiltOptions = {
    reverse: true, // reverse the tilt direction
    max: 8, // max tilt rotation (degrees)
    perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
    scale: 1.01, // 2 = 200%, 1.5 = 150%, etc..
    speed: 1000, // Speed of the enter/exit transition
    transition: true, // Set a transition on enter/exit.
    axis: null, // What axis should be disabled. Can be "x" or "y".
    reset: true, // If the tilt effect has to be reset on exit.
    easing: "cubic-bezier(.03,.98,.52,.99)", // Easing on enter/exit.
  };

  const glowClass = `hover:shadow-[0_0_20px_var(--color-${glowColor}-glow)]`;

  const content = (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );

  return tilt ? <Tilt options={tiltOptions}>{content}</Tilt> : content;
};

export default GlassCard;