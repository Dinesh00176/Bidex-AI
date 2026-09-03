import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysisService } from '../services/api';
import DecisionBadge from '../components/common/DecisionBadge';
import RiskBadge from '../components/common/RiskBadge';
import StatusBadge from '../components/common/StatusBadge';
import { Loader, ErrorState } from '../components/common/Loader';
import {
  Printer,
  ArrowLeft,
  Shield,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Bookmark
} from 'lucide-react';

const ReportExportPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await analysisService.getReport(id);
        if (res.data.success) {
          setReport(res.data.report);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return <Loader message="Generating executive procurement dossier..." />;
  if (error) return <ErrorState message={error} />;
  if (!report) return null;

  const { tender, company, decision, requirementsList, matchesList, risksList, generatedAt } = report;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to={`/tenders/${id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Analysis Workspace
        </Link>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '9px 18px' }}>
          <Printer size={15} /> Print / Save as PDF Dossier
        </button>
      </div>

      {/* Printable Document Dossier */}
      <div className="card" style={{ padding: '40px', backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-md)' }}>
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F766E', fontWeight: 800, fontSize: '15px', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#0F766E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              Bidexa AI — Executive Procurement Dossier
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0B1F3A', marginTop: '6px', letterSpacing: '-0.02em' }}>
              {tender.title}
            </h1>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
              Issuing Organization: <strong style={{ color: '#0F172A' }}>{tender.organization}</strong> • Reference: <strong style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{tender.referenceNumber || 'N/A'}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Generated On</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0B1F3A', marginTop: '2px' }}>{generatedAt}</div>
          </div>
        </div>

        {/* 1. Executive Recommendation */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '22px',
          marginBottom: '26px',
          borderLeft: decision.recommendation === 'BID' ? '6px solid #16A34A' : decision.recommendation === 'REVIEW' ? '6px solid #F59E0B' : '6px solid #DC2626'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>
                Executive Decision Recommendation
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: decision.recommendation === 'BID' ? '#16A34A' : decision.recommendation === 'REVIEW' ? '#D97706' : '#DC2626', marginTop: '2px' }}>
                {decision.recommendation}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Overall Fit Score</div>
              <div style={{ fontSize: '34px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#0B1F3A' }}>
                {decision.overallScore}<span style={{ fontSize: '18px', color: '#94A3B8' }}>/100</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.55 }}>
            {decision.summaryRationale}
          </p>
        </div>

        {/* 2. Key Findings & Concerns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginBottom: '30px' }}>
          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Key Strengths
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
              {decision.keyStrengths?.map((str, i) => (
                <li key={i} style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#D97706', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} color="#F59E0B" /> Key Risk Caveats
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
              {decision.keyConcerns?.map((con, i) => (
                <li key={i} style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#D97706', fontWeight: 700 }}>⚠</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Requirement Match Matrix */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1F3A', marginBottom: '14px' }}>
            Requirement Compliance & Evidence Matrix ({matchesList.length} Clauses)
          </h3>

          <div className="table-container">
            <table className="table" style={{ fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Factual Reason & Company Evidence</th>
                  <th>Page</th>
                </tr>
              </thead>
              <tbody>
                {matchesList.map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0B1F3A' }}>{m.requirementTitle}</div>
                      {m.mandatory && <span className="badge badge-nobid" style={{ display: 'block', width: 'fit-content', marginTop: '3px', fontSize: '9px' }}>MANDATORY</span>}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>
                        {m.category}
                      </span>
                    </td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>
                      <div style={{ color: '#334155' }}>{m.reason}</div>
                      <div style={{ fontSize: '11.5px', color: '#0F172A', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>{m.companyEvidence}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F766E' }}>
                        Page {m.sourcePage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Risk Matrix & Mitigations */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1F3A', marginBottom: '14px' }}>
            Procurement Risk Assessment ({risksList.length} Identified Risks)
          </h3>

          <div className="table-container">
            <table className="table" style={{ fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Risk Title & Description</th>
                  <th>Category</th>
                  <th>Recommended Action</th>
                  <th>Page</th>
                </tr>
              </thead>
              <tbody>
                {risksList.map((r, idx) => (
                  <tr key={idx}>
                    <td><RiskBadge severity={r.severity} /></td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0B1F3A' }}>{r.title}</div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>{r.description}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ color: '#0F766E', fontWeight: 600 }}>{r.recommendedAction}</td>
                    <td>
                      <span className="badge" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F766E' }}>
                        Page {r.sourcePage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dossier Sign-off Footer */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px', fontSize: '12px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
          <span>Prepared for: <strong style={{ color: '#0B1F3A' }}>{company.name}</strong></span>
          <span><strong>Bidexa AI</strong> • Decision-Support Intelligence Only</span>
        </div>
      </div>
    </div>
  );
};

export default ReportExportPage;
