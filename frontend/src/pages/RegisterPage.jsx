import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, seedDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    try {
      await register({ name, email, password, companyName });
      navigate('/dashboard');
    } catch (err) {
    } finally {
      setLoading(false);
    }
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
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
          Create Enterprise Account
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Deploy AI tender intelligence for your procurement & bidding team
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Legal Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="companyName">Company / Organization Name</label>
            <input
              id="companyName"
              type="text"
              className="form-input"
              placeholder="Apex CyberTech Solutions Pvt Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="alex@apextech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password (minimum 6 characters)</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Complete Account Registration'}
          </button>
        </form>

        <div style={{
          marginTop: '22px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={handleInstantDemo}
            className="btn btn-sm"
            style={{
              width: '100%',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              color: '#D97706',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontWeight: 600,
              padding: '8px'
            }}
          >
            <Sparkles size={14} color="#F59E0B" /> Skip Setup & Launch Demo Workspace
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#64748B' }}>
          Already have an enterprise account?{' '}
          <Link to="/login" style={{ color: '#0F766E', textDecoration: 'none', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
