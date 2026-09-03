import React from 'react';
import { X, FileText, Bookmark, CheckCircle, ShieldCheck } from 'lucide-react';

const EvidenceModal = ({ isOpen, onClose, evidenceData }) => {
  if (!isOpen || !evidenceData) return null;

  const {
    title,
    category,
    sourcePage = 1,
    sourceText,
    confidence = 0.95,
    mandatory,
    companyEvidence,
    reason
  } = evidenceData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(15, 118, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#0F766E" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1F3A' }}>
                Document Evidence & Citation
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                Factual extraction verified against tender source page
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Header Metadata */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ background: '#0B1F3A', color: '#FFFFFF' }}>
              <Bookmark size={11} /> Source: Page {sourcePage}
            </span>
            <span className="badge" style={{ background: '#EDE9FE', color: '#7C3AED', border: '1px solid #C4B5FD' }}>
              {category}
            </span>
            {mandatory && (
              <span className="badge badge-nobid">
                MANDATORY CLAUSE
              </span>
            )}
            <span className="badge" style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #86EFAC', marginLeft: 'auto' }}>
              Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>

          <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: '#0B1F3A', marginBottom: '10px', lineHeight: 1.4 }}>
            {title}
          </h4>

          {/* Extracted Verbatim Quotation */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderLeft: '4px solid #0F766E',
            borderRadius: '6px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#0F172A',
            lineHeight: 1.6,
            marginBottom: '18px',
            whiteSpace: 'pre-wrap'
          }}>
            "{sourceText || 'Exact quotation extracted from tender document.'}"
          </div>

          {/* Reasoning & Company Match if applicable */}
          {reason && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', marginBottom: '4px' }}>
                AI Analysis & Compliance Evaluation
              </div>
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>{reason}</p>
            </div>
          )}

          {companyEvidence && (
            <div style={{ background: 'rgba(15, 118, 110, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid #CCFBF1' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <ShieldCheck size={14} /> Company Credential Evidence
              </div>
              <p style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{companyEvidence}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Evidence Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceModal;
