import React from 'react';
import { Check, AlertCircle, HelpCircle, XCircle, Slash } from 'lucide-react';

const StatusBadge = ({ status = 'UNKNOWN' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();

  const getIcon = () => {
    switch (norm) {
      case 'MATCH':
        return <Check size={11} strokeWidth={3} />;
      case 'PARTIAL':
        return <AlertCircle size={11} />;
      case 'MISSING':
        return <XCircle size={11} />;
      case 'CONFLICT':
        return <Slash size={11} />;
      case 'UNKNOWN':
      default:
        return <HelpCircle size={11} />;
    }
  };

  const badgeClass = `badge badge-${norm.toLowerCase()}`;

  return (
    <span className={badgeClass}>
      {getIcon()}
      {norm}
    </span>
  );
};

export default StatusBadge;
