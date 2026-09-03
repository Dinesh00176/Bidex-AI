import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tenderService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DecisionBadge from '../components/common/DecisionBadge';
import RiskBadge from '../components/common/RiskBadge';
import { Loader, EmptyState, ErrorState } from '../components/common/Loader';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Play,
  UploadCloud,
  ArrowUpRight,
  Clock,
  RefreshCw
} from 'lucide-react';

const TendersListPage = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (decisionFilter) params.decision = decisionFilter;

      const res = await tenderService.getAll(params);
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
    const timer = setTimeout(() => {
      fetchTenders();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, decisionFilter]);

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}" and all associated AI analysis?`)) return;

    try {
      setActionLoadingId(id);
      await tenderService.delete(id);
      showNotification(`Tender deleted successfully.`, 'info');
      setTenders(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcess = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await tenderService.processTender(id);
      showNotification('AI Analysis pipeline launched.', 'info');
      navigate(`/tenders/${id}`);
    } catch (err) {
      showNotification(err.message, 'error');
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tender Document Catalog</h1>
          <p className="page-subtitle">
            Manage, evaluate, and search all RFP, RFQ, and NIT procurement documents
          </p>
        </div>

        <Link to="/tenders/upload" className="btn btn-primary btn-sm">
          <UploadCloud size={15} /> Upload Tender PDF
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '22px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, ref #, or org..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Processing Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="uploaded">Uploaded (Pending Analysis)</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Decision Filter */}
          <div>
            <select
              className="form-select"
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
            >
              <option value="">All Bid Recommendations</option>
              <option value="BID">BID Only</option>
              <option value="REVIEW">REVIEW Only</option>
              <option value="NO-BID">NO-BID Only</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchTenders}
            style={{ width: 'fit-content' }}
          >
            <RefreshCw size={13} /> Refresh List
          </button>
        </div>
      </div>

      {/* Tenders Table */}
      {loading ? (
        <Loader message="Fetching tender records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTenders} />
      ) : tenders.length === 0 ? (
        <EmptyState
          title="No Matching Tenders Found"
          description={searchTerm || statusFilter || decisionFilter ? "Try adjusting your search criteria or filters." : "Upload your first tender PDF to trigger AI requirement extraction."}
          actionText="Upload Tender PDF"
          onAction={() => navigate('/tenders/upload')}
          icon={FileText}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tender / Organization</th>
                  <th>Reference #</th>
                  <th>Submission Deadline</th>
                  <th>Status</th>
                  <th>Recommendation</th>
                  <th>Overall Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/tenders/${t._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#0B1F3A' }}>{t.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {t.organization || 'Procurement Authority'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#334155' }}>
                        {t.referenceNumber || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {t.deadline ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#0F172A' }}>
                          <Clock size={12} color="#64748B" />
                          {new Date(t.deadline).toLocaleDateString()}
                        </div>
                      ) : '—'}
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
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          color: t.analysis.overallScore >= 75 ? '#16A34A' : t.analysis.overallScore >= 50 ? '#D97706' : '#DC2626'
                        }}>
                          {t.analysis.overallScore}/100
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {t.status !== 'completed' && t.status !== 'processing' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => handleProcess(e, t._id)}
                            disabled={actionLoadingId === t._id}
                            title="Run AI Pipeline"
                            style={{ padding: '5px 9px' }}
                          >
                            <Play size={12} />
                          </button>
                        )}
                        <Link
                          to={`/tenders/${t._id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 12px' }}
                        >
                          Workspace <ArrowUpRight size={13} />
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => handleDelete(e, t._id, t.title)}
                          disabled={actionLoadingId === t._id}
                          title="Delete Tender"
                          style={{ padding: '5px 9px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TendersListPage;
