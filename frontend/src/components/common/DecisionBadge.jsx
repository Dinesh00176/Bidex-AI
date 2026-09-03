import React from 'react';
import { CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

const DecisionBadge = ({ recommendation = 'REVIEW', size = 'md' }) => {
  const norm = (recommendation || 'REVIEW').toUpperCase();

  const getIcon = () => {
    switch (norm) {
      case 'BID':
        return <CheckCircle2 size={size === 'lg' ? 18 : 13} />;
      case 'NO-BID':
      case 'NO_BID':
        return <AlertOctagon size={size === 'lg' ? 18 : 13} />;
      case 'REVIEW':
      default:
        return <HelpCircle size={size === 'lg' ? 18 : 13} />;
    }
  };

  let badgeClass = 'badge badge-review';
  let label = 'REVIEW';

  if (norm === 'BID') {
    badgeClass = 'badge badge-bid';
    label = 'BID';
  } else if (norm === 'NO-BID' || norm === 'NO_BID') {
    badgeClass = 'badge badge-nobid';
    label = 'NO-BID';
  }

  const extraStyles = size === 'lg' ? {
    fontSize: '15px',
    padding: '6px 14px',
    letterSpacing: '0.05em'
  } : {};

  return (
    <span className={badgeClass} style={extraStyles}>
      {getIcon()}
      {label}
    </span>
  );
};

export default DecisionBadge;
