const HUDFrame = ({ children, active = false, className = '' }) => {
  const borderColor = active ? 'border-cyan-DEFAULT' : 'border-white/10';
  const pulseClass = active ? 'animate-glow' : '';

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute inset-0 rounded-lg ${borderColor} ${pulseClass}`} style={{ borderWidth: '2px' }}>
        {/* Top-left corner */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg border-cyan-DEFAULT" />
        {/* Top-right corner */}
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg border-cyan-DEFAULT" />
        {/* Bottom-left corner */}
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg border-cyan-DEFAULT" />
        {/* Bottom-right corner */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br-lg border-cyan-DEFAULT" />
      </div>
      {/* Inner content, slightly inset to show the border */}
      <div className="relative p-1">
        {children}
      </div>
    </div>
  );
};

export default HUDFrame;