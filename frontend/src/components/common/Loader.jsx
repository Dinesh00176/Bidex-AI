import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', size = 28 }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '14px',
      color: '#64748B'
    }}>
      <Loader2 size={size} className="animate-spin" color="#0F766E" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0B1F3A' }}>{message}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const EmptyState = ({ title, description, actionText, onAction, icon: Icon }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '52px 28px',
      border: '1.5px dashed #CBD5E1',
      borderRadius: '12px',
      background: '#FFFFFF',
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
      margin: '20px 0'
    }}>
      {Icon && (
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 118, 110, 0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px'
        }}>
          <Icon size={28} color="#0F766E" />
        </div>
      )}
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0B1F3A', marginBottom: '8px' }}>{title}</h3>
      {description && <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.55 }}>{description}</p>}
      {actionText && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction} style={{ padding: '8px 18px', fontSize: '13px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({ title = 'Failed to load', message, onRetry }) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '36px 24px',
      border: '1px solid #FCA5A5',
      borderRadius: '10px',
      background: '#FEF2F2',
      margin: '20px 0'
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>{title}</h3>
      {message && <p style={{ fontSize: '13.5px', color: '#7F1D1D', marginBottom: '16px' }}>{message}</p>}
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ borderColor: '#F87171', color: '#B91C1C' }}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default Loader;
