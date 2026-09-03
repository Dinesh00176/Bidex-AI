import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  FileSearch,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Lock,
  FileText,
  BarChart3,
  Bot
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, seedDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    const res = await seedDemoLogin();
    if (res?.tenderId) {
      navigate(`/tenders/${res.tenderId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-body)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <header style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(15, 118, 110, 0.3)'
          }}>
            <Shield size={22} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0B1F3A' }}>
            Bidexa<span style={{ color: '#0F766E' }}>AI</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleDemoClick}
            className="btn btn-sm"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#D97706',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontWeight: 600
            }}
          >
            <Sparkles size={14} color="#F59E0B" />
            <span>⚡ Interactive Demo</span>
          </button>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Open Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '76px 24px 54px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(15, 118, 110, 0.08)',
          border: '1px solid rgba(15, 118, 110, 0.25)',
          color: '#0F766E',
          fontSize: '12.5px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          marginBottom: '24px'
        }}>
          <Scale size={14} />
          Enterprise Tender Intelligence & Procurement Decision Engine
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5.5vw, 58px)',
          fontWeight: 800,
          lineHeight: 1.16,
          letterSpacing: '-0.03em',
          marginBottom: '22px',
          color: '#0B1F3A'
        }}>
          Understand the Tender. <br />
          <span style={{
            color: '#0F766E'
          }}>
            Quantify the Risk. Bid Smarter.
          </span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#475569',
          maxWidth: '760px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Transform complex, 100+ page procurement RFP documents into structured compliance requirements, company capability matches, quantified risk matrices, and explainable <strong>BID / REVIEW / NO-BID</strong> decisions with factual page citations.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDemoClick}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '15px' }}
          >
            <Sparkles size={16} />
            Launch Live Demo Workspace
          </button>
          <Link
            to="/register"
            className="btn btn-secondary"
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            Create Company Account
          </Link>
        </div>
      </section>

      {/* Snapshot Preview Card */}
      <section style={{ maxWidth: '1040px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge" style={{ background: '#0B1F3A', color: '#FFFFFF', marginBottom: '8px' }}>SAMPLE PROCUREMENT EVALUATION</span>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#0B1F3A' }}>Smart City Integrated IoT Command & Control Platform</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-bid" style={{ fontSize: '14px', padding: '6px 14px' }}>
                <CheckCircle2 size={15} /> BID (Score: 88/100)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '18px' }}>
            <div style={{ background: '#F0FDF4', padding: '18px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> Key Capability Matches
              </div>
              <ul style={{ listStyle: 'none', fontSize: '13px', color: '#14532D', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>✓ Annual Turnover: ₹7.5 Cr vs ₹5.0 Cr required (Page 2)</li>
                <li>✓ ISO 27001 & ISO 9001 certifications verified active</li>
                <li>✓ 99.9% High Availability SLA technical compliance</li>
              </ul>
            </div>

            <div style={{ background: '#FFFBEB', padding: '18px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#D97706', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} /> Flagged Concerns & Caveats
              </div>
              <ul style={{ listStyle: 'none', fontSize: '13px', color: '#78350F', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>⚠ Designate PMP certified project director in proposal</li>
                <li>⚠ 10% Liquidated damages cap (Flagged for legal review)</li>
                <li>⚠ ₹13 Lakh EMD Bank Guarantee required (Page 2)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Intelligence Pipeline */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0B1F3A', marginBottom: '10px' }}>
            The 4-Stage Decision Intelligence Pipeline
          </h2>
          <p style={{ color: '#64748B', fontSize: '15px' }}>
            From raw tender PDF to an explainable board-level bidding recommendation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            {
              step: '01',
              title: 'PDF Parsing & Page Isolation',
              desc: 'Extracts tender text page-by-page. Guarantees 0% fabricated citation pages by anchoring all clauses to verifiable document page indices.',
              icon: FileSearch
            },
            {
              step: '02',
              title: 'Structured Extraction',
              desc: 'Gemini categorizes requirements across 10 dimensions: Financial, Technical, Experience, Certifications, Timeline, Contract Penalties & Legal.',
              icon: Zap
            },
            {
              step: '03',
              title: 'Company Fit Matching',
              desc: 'Evaluates your company credentials against tender thresholds, assigning MATCH, PARTIAL, MISSING, UNKNOWN, or CONFLICT states.',
              icon: Scale
            },
            {
              step: '04',
              title: 'Decision & Risk Scoring',
              desc: 'Computes explainable weighted scores with a strict Hard-Failure Gate preventing false BID outputs when mandatory criteria fail.',
              icon: BarChart3
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="card" style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(15, 118, 110, 0.2)',
                  marginBottom: '10px'
                }}>
                  {item.step}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icon size={18} color="#0F766E" />
                  <h4 style={{ fontSize: '15px', color: '#0B1F3A', fontWeight: 700 }}>{item.title}</h4>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Security */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto 100px',
        padding: '40px 36px',
        backgroundColor: '#0B1F3A',
        borderRadius: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '28px',
        alignItems: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2DD4BF', fontWeight: 700, fontSize: '12.5px', marginBottom: '8px', letterSpacing: '0.04em' }}>
            <Lock size={15} /> ENTERPRISE SECURITY & DATA PRIVACY
          </div>
          <h3 style={{ fontSize: '23px', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
            Multi-Tenant Isolation & Prompt Defense
          </h3>
          <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: 1.6 }}>
            API secrets are strictly backend-confined. Untrusted tender text is defensively sandboxed from system instructions, and multi-tenant database rules prevent cross-organization data leakage.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#F1F5F9', fontWeight: 500 }}>
            <CheckCircle2 size={17} color="#16A34A" /> No client-side API secrets or Gemini keys
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#F1F5F9', fontWeight: 500 }}>
            <CheckCircle2 size={17} color="#16A34A" /> Grounded RAG with anti-hallucination guardrails
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#F1F5F9', fontWeight: 500 }}>
            <CheckCircle2 size={17} color="#16A34A" /> Verifiable document evidence on every finding
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '32px 24px',
        fontSize: '13px',
        color: '#64748B',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ color: '#0B1F3A' }}>Bidexa AI</strong> — Enterprise Tender Intelligence & Procurement Platform &copy; 2026. Built with MERN + Google Gemini.
          </div>
          <div>
            <span>Decision Support System. Not legal or financial guarantee.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
