import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const StatusBadge = ({ variant, className = '' }) => {
  let colorClass;
  let icon;
  let text;

  switch (variant) {
    case 'present':
      colorClass = 'bg-success/10 text-success border-success/20';
      icon = <CheckCircle size={14} />;
      text = 'Present';
      break;
    case 'absent':
      colorClass = 'bg-danger/10 text-danger border-danger/20';
      icon = <XCircle size={14} />;
      text = 'Absent';
      break;
    default:
      colorClass = 'bg-text-muted/10 text-text-muted border-text-muted/20';
      icon = <HelpCircle size={14} />;
      text = 'Unknown';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-orbitron font-bold uppercase tracking-wider ${colorClass} ${className}`}>
      {icon} {text}
    </span>
  );
};

export default StatusBadge;