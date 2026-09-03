import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tenderService, analysisService, chatService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import DecisionBadge from '../components/common/DecisionBadge';
import RiskBadge from '../components/common/RiskBadge';
import StatusBadge from '../components/common/StatusBadge';
import EvidenceModal from '../components/common/EvidenceModal';
import { Loader, EmptyState, ErrorState } from '../components/common/Loader';
import {
  FileText,
  Scale,
  ShieldAlert,
  Bot,
  Layers,
  Sparkles,
  Download,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  ExternalLink,
  Send,
  Trash2,
  ArrowLeft,
  Play,
  FileCheck2,
  Bookmark,
  Loader2,
  RefreshCw,
  Cpu,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const TenderAnalysisPage = () => {
  const { id } = useParams();
  const [tender, setTender] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('decision');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Evidence modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Requirement filter
  const [reqCategoryFilter, setReqCategoryFilter] = useState('');
  const [reqSearchTerm, setReqSearchTerm] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Polling ref to ensure single active timer and proper unmount cleanup
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const clearPoller = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Fetch full analysis with retry support for brief DB flush delays
  const fetchAnalysisWithRetry = useCallback(async (tenderId, maxRetries = 3, delayMs = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await analysisService.getFull(tenderId);
        if (res.data?.success && res.data.analysis) {
          return res.data.analysis;
        }
      } catch (err) {
        if (attempt === maxRetries) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    return null;
  }, []);

  // Robust Polling State Machine
  const startPolling = useCallback(() => {
    clearPoller();
    let consecutiveErrors = 0;

    const poll = async () => {
      if (!isMountedRef.current) return;

      try {
        const statusRes = await tenderService.getStatus(id);
        if (!isMountedRef.current) return;

        if (statusRes.data?.success) {
          consecutiveErrors = 0;
          const { status, progress, progressStep: step, errorMessage } = statusRes.data;

          setProgressPercent(progress || 20);
          setProgressStep(step || 'Processing tender document...');

          if (status === 'completed') {
            clearPoller();
            setProgressPercent(100);
            setProgressStep('Analysis Completed');
            showNotification('Tender AI analysis completed successfully!', 'success');

            // Retrieve the newly persisted analysis
            try {
              const fullAnalysis = await fetchAnalysisWithRetry(id);
              if (isMountedRef.current) {
                setAnalysis(fullAnalysis);
                setProcessing(false);
                setTender(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
              }
            } catch (aErr) {
              if (isMountedRef.current) {
                setProcessing(false);
                setError('Analysis completed, but failed to load results. Please click Retry.');
              }
            }
            return;
          } else if (status === 'failed') {
            clearPoller();
            if (isMountedRef.current) {
              setProcessing(false);
              const errMsg = errorMessage || 'Analysis pipeline encountered an error.';
              setError(errMsg);
              setTender(prev => prev ? { ...prev, status: 'failed', errorMessage: errMsg } : null);
              showNotification(`Analysis failed: ${errMsg}`, 'error');
            }
            return;
          }
        }
      } catch (pollErr) {
        consecutiveErrors++;
        // Allow up to 10 transient network glitches with bounded backoff
        if (consecutiveErrors >= 10) {
          clearPoller();
          if (isMountedRef.current) {
            setProcessing(false);
            setError('Connection lost while monitoring analysis. Click "Check Status" to reconnect.');
          }
          return;
        }
      }

      // Schedule next poll step
      if (isMountedRef.current) {
        const interval = Math.min(2000 + (consecutiveErrors * 500), 6000);
        pollTimerRef.current = setTimeout(poll, interval);
      }
    };

    pollTimerRef.current = setTimeout(poll, 1500);
  }, [id, clearPoller, fetchAnalysisWithRetry, showNotification]);

  // Initial Data Loader
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearPoller();

      const tenderRes = await tenderService.getById(id);
      if (!isMountedRef.current) return;

      if (tenderRes.data?.success && tenderRes.data.tender) {
        const currentTender = tenderRes.data.tender;
        setTender(currentTender);

        if (currentTender.status === 'processing') {
          setProcessing(true);
          setProgressPercent(currentTender.progress || 20);
          setProgressStep(currentTender.progressStep || 'Processing tender document with Gemini AI...');
          startPolling();
        } else if (currentTender.status === 'completed') {
          setProcessing(false);
          try {
            const analysisData = await fetchAnalysisWithRetry(id);
            if (isMountedRef.current) {
              setAnalysis(analysisData);
            }
          } catch (aErr) {
            if (isMountedRef.current) {
              setError('Analysis document could not be retrieved. Please click Retry.');
            }
          }
        } else if (currentTender.status === 'failed') {
          setProcessing(false);
          setError(currentTender.errorMessage || 'Tender analysis failed.');
        } else {
          setProcessing(false);
        }
      }

      // Load Chat history
      try {
        const chatRes = await chatService.getHistory(id);
        if (isMountedRef.current && chatRes.data?.success) {
          setChatMessages(chatRes.data.messages || []);
        }
      } catch (cErr) {
        // Chat load is non-blocking
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load tender.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, clearPoller, startPolling, fetchAnalysisWithRetry]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
      clearPoller();
    };
  }, [loadData, clearPoller]);

  const handleStartProcess = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      setError(null);
      setProgressPercent(10);
      setProgressStep('Initializing Gemini AI extraction pipeline...');

      await tenderService.processTender(id);
      showNotification('AI Analysis started.', 'info');
      startPolling();
    } catch (err) {
      setProcessing(false);
      setError(err.message || 'Failed to start analysis.');
      showNotification(err.message || 'Failed to start analysis.', 'error');
    }
  };

  const handleOpenEvidence = (item) => {
    setSelectedEvidence(item);
    setEvidenceModalOpen(true);
  };

  const handleSendChat = async (questionToSend) => {
    const q = questionToSend || chatInput;
    if (!q || q.trim() === '' || chatLoading) return;

    const userMsg = {
      role: 'user',
      content: q.trim(),
      citations: [],
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await chatService.ask(id, q.trim());
      if (res.data?.success) {
        setChatMessages(res.data.chatHistory || [...chatMessages, userMsg, res.data.message]);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to get answer from AI.', 'error');
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Gemini AI service error.'}`,
          citations: [],
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all conversation history for this tender?')) return;
    try {
      await chatService.clearHistory(id);
      setChatMessages([]);
      showNotification('Chat history cleared.', 'info');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  if (loading) return <Loader message="Loading tender workspace and AI evaluation models..." />;
  if (error && !processing && !tender) return <ErrorState message={error} onRetry={loadData} />;
  if (!tender) return <EmptyState title="Tender not found" actionText="Back to catalog" onAction={() => navigate('/tenders')} />;

  const decision = analysis?.decision;
  const requirements = analysis?.requirements || [];
  const matches = analysis?.matches || [];
  const risks = analysis?.risks || [];

  // Filtered requirements
  const filteredRequirements = requirements.filter(r => {
    const matchesCat = !reqCategoryFilter || r.category === reqCategoryFilter;
    const matchesSearch = !reqSearchTerm ||
      (r.title && r.title.toLowerCase().includes(reqSearchTerm.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(reqSearchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Score breakdown chart data
  const scoreBreakdownData = decision?.scoreBreakdown ? [
    { name: 'Eligibility', score: decision.scoreBreakdown.eligibility, weight: '25%' },
    { name: 'Technical', score: decision.scoreBreakdown.technical, weight: '20%' },
    { name: 'Financial', score: decision.scoreBreakdown.financial, weight: '15%' },
    { name: 'Experience', score: decision.scoreBreakdown.experience, weight: '15%' },
    { name: 'Compliance', score: decision.scoreBreakdown.compliance, weight: '10%' },
    { name: 'Risk', score: decision.scoreBreakdown.risk, weight: '10%' },
    { name: 'Timeline', score: decision.scoreBreakdown.timeline, weight: '5%' }
  ] : [];

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Link to="/tenders" style={{ color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to Tender Catalog
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '23px' }}>{tender.title}</h1>
            {decision && <DecisionBadge recommendation={decision.recommendation} size="lg" />}
          </div>
          <div style={{ display: 'flex', gap: '18px', marginTop: '6px', fontSize: '13px', color: '#64748B', flexWrap: 'wrap' }}>
            <span><strong>Authority:</strong> <span style={{ color: '#0F172A' }}>{tender.organization}</span></span>
            <span><strong>Ref:</strong> <span style={{ color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{tender.referenceNumber || 'N/A'}</span></span>
            <span><strong>Pages:</strong> <span style={{ color: '#0F172A' }}>{tender.pageCount} Pages</span></span>
            {tender.deadline && (
              <span><strong>Deadline:</strong> <span style={{ color: '#0F172A' }}>{new Date(tender.deadline).toLocaleDateString()}</span></span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleStartProcess}
            className="btn btn-secondary btn-sm"
            disabled={processing}
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} color="#0F766E" />}
            <span>{processing ? 'Analyzing...' : (tender.status === 'completed' ? 'Re-run Analysis' : 'Process Tender')}</span>
          </button>
          {decision && (
            <Link to={`/tenders/${tender._id}/report`} className="btn btn-primary btn-sm">
              <Download size={14} /> Export Dossier
            </Link>
          )}
        </div>
      </div>

      {/* Error Message if pipeline failed */}
      {error && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C', fontSize: '13.5px' }}>
            <AlertTriangle size={18} />
            <span><strong>Analysis Alert:</strong> {error}</span>
          </div>
          <button onClick={handleStartProcess} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
            <RefreshCw size={12} /> Retry Analysis
          </button>
        </div>
      )}

      {/* Processing Progress Bar when active */}
      {processing && (
        <div className="card" style={{ marginBottom: '22px', borderLeft: '4px solid #0F766E', background: 'rgba(15, 118, 110, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={20} className="animate-spin" color="#0F766E" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#0B1F3A', marginBottom: '6px' }}>
                <span>{progressStep || 'Processing Tender Document with Gemini AI...'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#0F766E', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If not yet analyzed */}
      {!analysis && !processing && (
        <EmptyState
          title="Tender Analysis Ready"
          description="Click 'Process Tender' to trigger page-by-page text parsing, Gemini requirement extraction across 10 canonical categories, company credential matching, and explainable decision scoring."
          actionText="⚡ Run AI Decision Pipeline"
          onAction={handleStartProcess}
          icon={Sparkles}
        />
      )}

      {analysis && (
        <>
          {/* Non-blocking Fallback Warning Banner if Gemini was unavailable */}
          {(analysis?.metadata?.extractionProvider === 'fallback' || analysis?.metadata?.extractionWarning) && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              borderRadius: '8px',
              padding: '10px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#92400E'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, color: '#D97706' }} />
              <div>
                <strong>Notice:</strong> {analysis?.metadata?.extractionWarning || 'AI extraction temporarily unavailable. Analysis completed using deterministic fallback extraction.'}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'decision' ? 'active' : ''}`}
              onClick={() => setActiveTab('decision')}
            >
              <Scale size={15} /> Bid Decision & Score
            </button>
            <button
              className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
              onClick={() => setActiveTab('requirements')}
            >
              <FileCheck2 size={15} /> Extracted Requirements ({requirements.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'matching' ? 'active' : ''}`}
              onClick={() => setActiveTab('matching')}
            >
              <Layers size={15} /> Company Fit Match
            </button>
            <button
              className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveTab('risks')}
            >
              <ShieldAlert size={15} /> Risk Matrix ({risks.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
              onClick={() => setActiveTab('evidence')}
            >
              <Bookmark size={15} /> Document Evidence ({requirements.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <Bot size={15} /> AI Tender Chat (RAG)
            </button>
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FileText size={15} /> Scope & Overview
            </button>
          </div>

          {/* TAB 1: DECISION & SCORE */}
          {activeTab === 'decision' && (
            <div>
              {/* Hard Failure Alert Banner */}
              {decision?.hardFailures && decision.hardFailures.length > 0 && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, fontSize: '14.5px', marginBottom: '6px' }}>
                    <XCircle size={17} /> Hard Qualification Failures Detected
                  </div>
                  <p style={{ fontSize: '13px', color: '#991B1B', marginBottom: '8px' }}>
                    Mandatory tender criteria were not satisfied. High overall capability score cannot override mandatory disqualification thresholds:
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#B91C1C' }}>
                    {decision.hardFailures.map((hf, i) => (
                      <li key={i}>• {hf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Decision Banner */}
              {decision && (
                <div className="card" style={{
                  marginBottom: '24px',
                  borderLeft: decision.recommendation === 'BID' ? '6px solid #16A34A' : decision.recommendation === 'REVIEW' ? '6px solid #F59E0B' : '6px solid #DC2626',
                  background: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: '6px' }}>
                        Official AI Decision Recommendation
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{
                          fontSize: '36px',
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          color: decision.recommendation === 'BID' ? '#16A34A' : decision.recommendation === 'REVIEW' ? '#D97706' : '#DC2626'
                        }}>
                          {decision.recommendation}
                        </span>
                        <DecisionBadge recommendation={decision.recommendation} size="lg" />
                      </div>
                      <p style={{ fontSize: '14px', color: '#334155', marginTop: '10px', maxWidth: '680px', lineHeight: 1.55 }}>
                        {decision.summaryRationale}
                      </p>
                    </div>

                    {/* Overall Fit Score Gauge */}
                    <div style={{
                      textAlign: 'center',
                      background: '#F8FAFC',
                      padding: '18px 30px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Overall Fit Score
                      </div>
                      <div style={{
                        fontSize: '44px',
                        fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: decision.overallScore >= 75 ? '#16A34A' : decision.overallScore >= 50 ? '#D97706' : '#DC2626',
                        margin: '4px 0'
                      }}>
                        {decision.overallScore}<span style={{ fontSize: '20px', color: '#94A3B8' }}>/100</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>Weighted Composite Score</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Two Column Breakdown: Strengths vs Concerns */}
              {decision && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {/* Positive Strengths */}
                  <div className="card" style={{ borderTop: '3px solid #16A34A' }}>
                    <div className="card-header">
                      <div className="card-title" style={{ color: '#16A34A' }}>
                        <CheckCircle2 size={16} /> Key Strengths & Compliances
                      </div>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {decision.keyStrengths?.map((str, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                          <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Concerns & Caveats */}
                  <div className="card" style={{ borderTop: '3px solid #F59E0B' }}>
                    <div className="card-header">
                      <div className="card-title" style={{ color: '#D97706' }}>
                        <AlertTriangle size={16} /> Flagged Concerns & Risk Caveats
                      </div>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {decision.keyConcerns?.map((con, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
                          <span style={{ color: '#D97706', fontWeight: 700 }}>⚠</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Score Breakdown Bar Chart */}
              {scoreBreakdownData.length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                  <div className="card-header">
                    <div className="card-title">Detailed Dimension Scoring Breakdown</div>
                  </div>
                  <div style={{ height: '240px', width: '100%', marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreBreakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value}/100`, 'Score']} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {scoreBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 75 ? '#16A34A' : entry.score >= 50 ? '#F59E0B' : '#DC2626'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Machine Learning Predictive Signal (Hybrid Layer) */}
              <div className="card" style={{ borderLeft: '4px solid #6366F1', marginTop: '16px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4338CA', fontSize: '15px' }}>
                    <Cpu size={18} /> Machine Learning Win Probability Model (Bidexa ML)
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: (analysis?.mlPrediction?.status === 'AVAILABLE' || decision?.mlPrediction?.status === 'AVAILABLE') ? '#DCFCE7' : '#FEF3C7',
                    color: (analysis?.mlPrediction?.status === 'AVAILABLE' || decision?.mlPrediction?.status === 'AVAILABLE') ? '#166534' : '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>{(analysis?.mlPrediction?.status === 'AVAILABLE' || decision?.mlPrediction?.status === 'AVAILABLE') ? '●' : '○'}</span>
                    {(analysis?.mlPrediction?.status === 'AVAILABLE' || decision?.mlPrediction?.status === 'AVAILABLE') ? 'ML MODEL ACTIVE' : 'INSUFFICIENT TRAINING DATA'}
                  </span>
                </div>

                {(analysis?.mlPrediction?.status === 'AVAILABLE' || decision?.mlPrediction?.status === 'AVAILABLE') ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', margin: '14px 0 16px' }}>
                      <div style={{ background: '#F8FAFC', padding: '14px 22px', borderRadius: '8px', border: '1px solid #E2E8F0', minWidth: '180px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>ESTIMATED WIN PROBABILITY</div>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: '#4F46E5', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {(analysis?.mlPrediction?.confidencePercent ?? decision?.mlPrediction?.confidencePercent ?? Math.round((analysis?.mlPrediction?.probability || decision?.mlPrediction?.probability || 0) * 100))}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Based on calibrated model weights</div>
                      </div>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                          Prediction: {(analysis?.mlPrediction?.predictedOutcome || decision?.mlPrediction?.predictedOutcome)?.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                          Model: <strong>{(analysis?.mlPrediction?.modelVersion || decision?.mlPrediction?.modelVersion || 'bidexa-v1.0.0')}</strong> • Schema: <strong>{(analysis?.mlPrediction?.featureSchemaVersion || decision?.mlPrediction?.featureSchemaVersion || 'bidexa-features-v1')}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          Architecture: {(analysis?.mlPrediction?.modelType || decision?.mlPrediction?.modelType || 'L2-Regularized Calibrated Linear Classifier')}
                        </div>
                      </div>
                    </div>

                    {/* Top Positive & Negative Explanations */}
                    {((analysis?.mlPrediction?.topInfluencingFactors || decision?.mlPrediction?.topInfluencingFactors)?.length > 0) && (
                      <div style={{ marginTop: '14px', background: '#FAFAFA', padding: '12px 16px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                          FACTUAL INFLUENCING FACTORS (EXPLAINABILITY):
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155' }}>
                          {(analysis?.mlPrediction?.topInfluencingFactors || decision?.mlPrediction?.topInfluencingFactors).map((factor, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                color: factor.startsWith('+') ? '#16A34A' : '#DC2626',
                                fontWeight: 700,
                                background: factor.startsWith('+') ? '#DCFCE7' : '#FEE2E2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '11px'
                              }}>
                                {factor.startsWith('+') ? '+ POSITIVE' : '- NEGATIVE'}
                              </span>
                              <span>{factor.replace(/^[+-]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginTop: '10px' }}>
                    <p>
                      <strong>ML Status:</strong> INSUFFICIENT TRAINING DATA — Rule-Based Decision Active.
                    </p>
                    <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      Deterministic compliance criteria and Gemini document extraction are active. Historical procurement dataset requires at least 100 labeled records to activate machine learning win probability predictions.
                    </p>
                  </div>
                )}
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '8px', fontStyle: 'italic' }}>
                  * Decision Support Notice: ML win probability provides an empirical estimate based on historical patterns. A high ML score will never override a mandatory eligibility failure (hard failure gate enforced).
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXTRACTED REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div>
              {/* Filter controls */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                    placeholder="Search extracted requirements..."
                    value={reqSearchTerm}
                    onChange={(e) => setReqSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '180px', fontSize: '13px' }}
                  value={reqCategoryFilter}
                  onChange={(e) => setReqCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories ({requirements.length})</option>
                  <option value="Eligibility">Eligibility</option>
                  <option value="Experience">Experience</option>
                  <option value="Financial">Financial</option>
                  <option value="Technical">Technical</option>
                  <option value="Certification">Certification</option>
                  <option value="Staffing">Staffing</option>
                  <option value="Legal">Legal</option>
                  <option value="Timeline">Timeline</option>
                  <option value="Documents">Documents</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Requirements Table */}
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Category</th>
                      <th>Requirement Title & Specification</th>
                      <th style={{ width: '100px' }}>Mandatory</th>
                      <th style={{ width: '80px' }}>Page</th>
                      <th style={{ width: '120px' }}>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequirements.map((req, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600 }}>
                            {req.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13.5px' }}>{req.title}</div>
                          <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>{req.description}</div>
                        </td>
                        <td>
                          {req.mandatory ? (
                            <span className="badge badge-danger" style={{ fontSize: '11px' }}>Mandatory</span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>Optional</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#0F766E' }}>
                            Page {req.sourcePage || 1}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenEvidence(req)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Bookmark size={12} /> View Citation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMPANY FIT MATCHING */}
          {/* TAB 3: COMPANY CAPABILITY FIT MATCH */}
          {activeTab === 'matching' && (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Category</th>
                    <th style={{ width: '280px' }}>Tender Requirement & Citation</th>
                    <th style={{ width: '110px' }}>Match Status</th>
                    <th>Verified Company Evidence & Evaluation</th>
                    <th style={{ width: '80px' }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 600 }}>
                          {m.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13.5px' }}>{m.requirementTitle}</div>
                        {m.mandatory && <span className="badge badge-danger" style={{ fontSize: '10px', marginTop: '3px' }}>Mandatory</span>}
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontStyle: 'italic', background: '#F8FAFC', padding: '4px 6px', borderRadius: '4px' }}>
                          "{m.tenderEvidence?.quote || m.sourceText || m.requirementTitle}"
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{m.reason}</div>
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                          {m.companyEvidence ? (
                            <span style={{ color: '#047857', fontWeight: 500 }}>
                              <strong>✓ Company Evidence:</strong> {m.companyEvidence}
                            </span>
                          ) : (
                            <span style={{ color: '#B45309', fontWeight: 500 }}>
                              <strong>⚠ Company Evidence:</strong> Not provided (Pending profile/doc upload)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenEvidence(m)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          Page {m.sourcePage || 1}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: RISK MATRIX */}
          {activeTab === 'risks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {risks.map((risk, idx) => (
                <div key={idx} className="card" style={{
                  borderLeft: risk.severity === 'CRITICAL' ? '5px solid #DC2626' : risk.severity === 'HIGH' ? '5px solid #EA580C' : risk.severity === 'MEDIUM' ? '5px solid #F59E0B' : '5px solid #10B981'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <RiskBadge severity={risk.severity} />
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{risk.title}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{risk.category}</span>
                    </div>
                    {risk.sourcePage && (
                      <span style={{ fontSize: '12px', color: '#0F766E', fontWeight: 600 }}>
                        Page {risk.sourcePage}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#334155', marginTop: '10px', lineHeight: 1.5 }}>
                    {risk.description}
                  </p>
                  {risk.mitigation && (
                    <div style={{ marginTop: '10px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ color: '#0F766E' }}>Recommended Action / Mitigation:</strong> {risk.mitigation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DOCUMENT EVIDENCE */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13.5px', color: '#475569', marginBottom: '6px' }}>
                Every requirement below is factually linked to exact pages and text snippets inside the uploaded tender document.
              </div>
              {requirements.map((req, idx) => (
                <div key={idx} className="card" style={{ borderLeft: '4px solid #0F766E' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0F172A' }}>{req.title}</div>
                    <span className="badge badge-neutral" style={{ fontWeight: 700, color: '#0F766E' }}>Page {req.sourcePage || 1}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>{req.description}</div>
                  <div style={{
                    marginTop: '10px',
                    background: '#F1F5F9',
                    borderLeft: '3px solid #0F766E',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#0F172A',
                    lineHeight: 1.5
                  }}>
                    "{req.sourceText}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: AI TENDER CHAT (RAG) */}
          {activeTab === 'chat' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '580px', padding: '0' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} color="#0F766E" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Grounded AI Tender Assistant</span>
                </div>
                <button onClick={handleClearChat} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11.5px' }}>
                  <Trash2 size={12} /> Clear History
                </button>
              </div>

              {/* Chat Message Stream */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {chatMessages.length === 0 && (
                  <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '420px', color: '#64748B' }}>
                    <Bot size={36} color="#0F766E" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px', marginBottom: '6px' }}>Ask Questions About This Tender</div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                      Ask about financial turnover thresholds, mandatory ISO certifications, SLA penalty clauses, EMD deposits, or delivery milestones.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                      <button onClick={() => handleSendChat("What is the minimum annual turnover required?")} className="btn btn-secondary btn-sm" style={{ textAlign: 'left', fontSize: '12px' }}>
                        💬 "What is the minimum annual turnover required?"
                      </button>
                      <button onClick={() => handleSendChat("What are the mandatory certifications?")} className="btn btn-secondary btn-sm" style={{ textAlign: 'left', fontSize: '12px' }}>
                        💬 "What are the mandatory certifications?"
                      </button>
                      <button onClick={() => handleSendChat("What are the penalty and liquidated damages clauses?")} className="btn btn-secondary btn-sm" style={{ textAlign: 'left', fontSize: '12px' }}>
                        💬 "What are the penalty and liquidated damages clauses?"
                      </button>
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '78%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      lineHeight: 1.55,
                      background: msg.role === 'user' ? '#0F766E' : '#F1F5F9',
                      color: msg.role === 'user' ? '#FFFFFF' : '#0F172A',
                      borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px'
                    }}>
                      {msg.content}
                    </div>

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {msg.citations.map((c, cIdx) => (
                          <span key={cIdx} className="badge badge-neutral" style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600 }}>
                            📄 Page {c.sourcePage}: {c.sectionTitle || 'Tender Clause'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F766E', fontSize: '13px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gemini AI is analyzing tender pages and citing sources...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '13.5px' }}
                  placeholder="Ask a factual question about this tender (e.g. 'What is the required EMD amount?')..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  disabled={chatLoading}
                />
                <button
                  onClick={() => handleSendChat()}
                  className="btn btn-primary"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} /> Send
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: SCOPE & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Tender Scope & Specification Overview</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Contract Value</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                    {tender.estimatedValue ? `₹${(tender.estimatedValue / 10000000).toFixed(2)} Crore (INR ${tender.estimatedValue.toLocaleString()})` : 'Not Stated / To Be Quoted'}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Project Execution Location</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                    {tender.location || 'As specified in RFP'}
                  </div>
                </div>
              </div>

              {tender.summary && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Executive Summary</h4>
                  <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>{tender.summary}</p>
                </div>
              )}

              {tender.scopeOfWork && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Scope of Work</h4>
                  <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>{tender.scopeOfWork}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Evidence Viewer Modal */}
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        evidence={selectedEvidence}
      />
    </div>
  );
};

export default TenderAnalysisPage;
