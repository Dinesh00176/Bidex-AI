import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

const RiskBadge = ({ severity = 'LOW', showIcon = true, size = 'md' }) => {
  const normalized = (severity || 'LOW').toUpperCase();

  const getIcon = () => {
    switch (normalized) {
      case 'CRITICAL':
        return <ShieldAlert size={12} />;
      case 'HIGH':
        return <AlertCircle size={12} />;
      case 'MEDIUM':
        return <AlertTriangle size={12} />;
      case 'LOW':
      default:
        return <ShieldCheck size={12} />;
    }
  };

  const badgeClass = `badge badge-risk-${normalized.toLowerCase()}`;

  return (
    <span className={badgeClass} title={`Risk Level: ${normalized}`}>
      {showIcon && getIcon()}
      {normalized}
    </span>
  );
};

export default RiskBadge;
