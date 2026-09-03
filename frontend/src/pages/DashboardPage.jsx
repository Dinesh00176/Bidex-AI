import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tenderService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DecisionBadge from '../components/common/DecisionBadge';
import RiskBadge from '../components/common/RiskBadge';
import { Loader, EmptyState, ErrorState } from '../components/common/Loader';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UploadCloud,
  ArrowUpRight,
  Clock,
  Building2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const DashboardPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { company, seedDemoLogin } = useAuth();
  const navigate = useNavigate();

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tenderService.getAll();
      if (res.data.success) {
        setTenders(res.data.tenders || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  // Compute metrics
  const totalTenders = tenders.length;
  const analyzedTenders = tenders.filter(t => t.analysis);
  const bidCount = analyzedTenders.filter(t => t.analysis.recommendation === 'BID').length;
  const reviewCount = analyzedTenders.filter(t => t.analysis.recommendation === 'REVIEW').length;
  const noBidCount = analyzedTenders.filter(t => t.analysis.recommendation === 'NO-BID' || t.analysis.recommendation === 'NO_BID').length;

  const totalCriticalRisks = analyzedTenders.reduce((sum, t) => sum + (t.analysis.criticalRisksCount || 0), 0);
  const totalHighRisks = analyzedTenders.reduce((sum, t) => sum + (t.analysis.highRisksCount || 0), 0);

  // Chart Data
  const decisionData = [
    { name: 'BID', count: bidCount, color: '#16A34A' },
    { name: 'REVIEW', count: reviewCount, color: '#F59E0B' },
    { name: 'NO-BID', count: noBidCount, color: '#DC2626' }
  ].filter(d => d.count > 0);

  const handleSeedDemo = async () => {
    const res = await seedDemoLogin();
    if (res?.tenderId) {
      navigate(`/tenders/${res.tenderId}`);
    } else {
      fetchTenders();
    }
  };

  if (loading) return <Loader message="Loading procurement intelligence overview..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTenders} />;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Tender Intelligence</h1>
          <p className="page-subtitle">
            Enterprise procurement decision support for <strong style={{ color: '#0B1F3A' }}>{company?.companyName || 'Your Organization'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/tenders/upload" className="btn btn-primary btn-sm">
            <UploadCloud size={15} /> Upload Tender PDF
          </Link>
          {totalTenders === 0 && (
            <button onClick={handleSeedDemo} className="btn btn-secondary btn-sm" style={{ color: '#0F766E', borderColor: '#0F766E' }}>
              <Sparkles size={15} /> Load Demo Tender
            </button>
          )}
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '3px solid #0B1F3A' }}>
          <div className="stat-label">Total Tenders</div>
          <div className="stat-value">{totalTenders}</div>
          <div className="stat-footer">
            <FileText size={13} color="#64748B" />
            <span>{analyzedTenders.length} Processed by AI</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #16A34A' }}>
          <div className="stat-label" style={{ color: '#16A34A' }}>BID Decisions</div>
          <div className="stat-value" style={{ color: '#16A34A' }}>{bidCount}</div>
          <div className="stat-footer">
            <CheckCircle2 size={13} color="#16A34A" />
            <span>High Capability Match</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #F59E0B' }}>
          <div className="stat-label" style={{ color: '#D97706' }}>REVIEW Decisions</div>
          <div className="stat-value" style={{ color: '#D97706' }}>{reviewCount}</div>
          <div className="stat-footer">
            <AlertTriangle size={13} color="#F59E0B" />
            <span>Requires Caveat Review</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #DC2626' }}>
          <div className="stat-label" style={{ color: '#DC2626' }}>NO-BID Decisions</div>
          <div className="stat-value" style={{ color: '#DC2626' }}>{noBidCount}</div>
          <div className="stat-footer">
            <XCircle size={13} color="#DC2626" />
            <span>Hard Criteria Gaps</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid #EA580C' }}>
          <div className="stat-label" style={{ color: '#EA580C' }}>Critical / High Risks</div>
          <div className="stat-value" style={{ color: totalCriticalRisks > 0 ? '#DC2626' : '#0B1F3A' }}>
            {totalCriticalRisks + totalHighRisks}
          </div>
          <div className="stat-footer">
            <AlertTriangle size={13} color="#EA580C" />
            <span>{totalCriticalRisks} Critical Unmitigated</span>
          </div>
        </div>
      </div>

      {totalTenders === 0 ? (
        <EmptyState
          title="No Tender Documents Ingested Yet"
          description="Upload an official procurement tender PDF or initialize the interactive demo workspace to explore full AI extraction and decision matrices."
          actionText="Upload Tender PDF"
          onAction={() => navigate('/tenders/upload')}
          icon={FileText}
        />
      ) : (
        <>
          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {/* Decision Distribution */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <TrendingUp size={16} color="#0F766E" />
                  <span>Bid Decision Distribution</span>
                </div>
              </div>
              <div style={{ height: '220px', width: '100%' }}>
                {decisionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decisionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', color: '#0F172A', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {decisionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', fontSize: '13px' }}>
                    Process tenders to generate decision metrics
                  </div>
                )}
              </div>
            </div>

            {/* Ingestion & Qualification Summary */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Building2 size={16} color="#0F766E" />
                  <span>Company Match Profile</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Annual Turnover Capacity:</span>
                  <span style={{ fontWeight: 700, color: '#0B1F3A', fontFamily: 'var(--font-mono)' }}>
                    ₹{((company?.annualTurnover || 0) / 10000000).toFixed(2)} Cr
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Industry Experience:</span>
                  <span style={{ fontWeight: 700, color: '#0B1F3A' }}>{company?.yearsExperience || 0} Years</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Active Certifications:</span>
                  <span style={{ fontWeight: 700, color: '#0F766E' }}>
                    {(company?.certifications || []).length} Verified (ISO 27001/9001)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#64748B' }}>Uploaded Capability Docs:</span>
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>{(company?.documents || []).length} Document(s)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tenders Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ margin: 0 }}>
                <FileText size={16} color="#0F766E" />
                <span>Recent Tender Ingestions</span>
              </div>
              <Link to="/tenders" style={{ fontSize: '13px', color: '#0F766E', textDecoration: 'none', fontWeight: 600 }}>
                View All Tenders →
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tender Title & Reference</th>
                    <th>Issuing Authority</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Decision</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.slice(0, 5).map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0B1F3A' }}>{t.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {t.referenceNumber || 'N/A'} • {t.pageCount} Pages
                        </div>
                      </td>
                      <td>{t.organization || 'Procurement Authority'}</td>
                      <td>
                        {t.deadline ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#0F172A' }}>
                            <Clock size={12} color="#64748B" />
                            {new Date(t.deadline).toLocaleDateString()}
                          </div>
                        ) : 'Not specified'}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'completed' ? 'badge-bid' : t.status === 'processing' ? 'badge-review' : 'badge-nobid'}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {t.analysis?.recommendation ? (
                          <DecisionBadge recommendation={t.analysis.recommendation} />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748B' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        {t.analysis?.overallScore !== undefined ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: t.analysis.overallScore >= 75 ? '#16A34A' : t.analysis.overallScore >= 50 ? '#D97706' : '#DC2626' }}>
                            {t.analysis.overallScore}/100
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/tenders/${t._id}`} className="btn btn-secondary btn-sm" style={{ padding: '5px 12px' }}>
                          Open Workspace <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
