import { X } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', loading, ...props }) => {
  const variants = {
    primary: "bg-[#1a2b6d] text-white hover:bg-[#121f4f]",
    accent: "bg-[#00c9a7] text-white hover:bg-[#00b093]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100"
  };
  return (
    <button className={`inline-flex items-center justify-center px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <span className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span> : null}
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>
);

export const Badge = ({ children, variant = 'success' }) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    primary: "bg-blue-100 text-[#1a2b6d]",
    warning: "bg-yellow-100 text-yellow-800",
    neutral: "bg-gray-100 text-gray-800"
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>{children}</span>;
};

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>;

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 max-w-sm">{message}</p>
  </div>
);
