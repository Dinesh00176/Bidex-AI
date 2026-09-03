import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, seedDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // notification shown by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@bidwise.ai');
    setPassword('demoPassword123!');
  };

  const handleInstantDemo = async () => {
    setLoading(true);
    try {
      const res = await seedDemoLogin();
      if (res?.tenderId) {
        navigate(`/tenders/${res.tenderId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-body)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
        }}>
          <Shield size={26} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>
          Sign In to Bidexa AI
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Enterprise Tender Intelligence & Procurement Platform
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Quick Demo Workspace Banner */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
            <Sparkles size={15} color="#F59E0B" /> Evaluation & Demo Quick-Start
          </div>
          <p style={{ fontSize: '12.5px', color: '#78350F', lineHeight: 1.45 }}>
            Instant access with realistic IoT Smart City Tender & Apex CyberTech company profile.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleInstantDemo}
              className="btn btn-amber btn-sm"
              style={{ flex: 1, fontSize: '12px', padding: '7px 10px', fontWeight: 600 }}
              disabled={loading}
            >
              ⚡ Launch 1-Click Demo
            </button>
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px', padding: '7px 10px' }}
            >
              Fill Credentials
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#64748B' }}>
          Don't have an enterprise account?{' '}
          <Link to="/register" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: 700 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
