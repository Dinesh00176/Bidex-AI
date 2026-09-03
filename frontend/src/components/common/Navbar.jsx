import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, Building2, LogOut, User, FileText } from 'lucide-react';

const Navbar = () => {
  const { user, company, logout, seedDemoLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    const res = await seedDemoLogin();
    if (res?.tenderId) {
      navigate(`/tenders/${res.tenderId}`);
    }
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#0B1F3A',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 2px 8px 0 rgba(11, 31, 58, 0.15)'
    }}>
      {/* Brand Logo */}
      <Link to={isAuthenticated ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(15, 118, 110, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Shield size={20} color="#FFFFFF" strokeWidth={2.2} />
        </div>
        <div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Bidexa<span style={{ color: '#2DD4BF' }}>AI</span>
          </span>
          <span style={{ display: 'block', fontSize: '10px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Enterprise Procurement Platform
          </span>
        </div>
      </Link>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Demo Loader Button */}
        <button
          className="btn btn-sm"
          onClick={handleDemoClick}
          title="Seed a realistic IoT Smart City Tender & Apex CyberTech Company Profile"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#F59E0B',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontSize: '12.5px',
            fontWeight: 600
          }}
        >
          <Sparkles size={14} color="#F59E0B" />
          <span>⚡ Interactive Demo</span>
        </button>

        {isAuthenticated ? (
          <>
            {/* Active Company Name */}
            {company && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(255, 255, 255, 0.07)',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '12.5px',
                color: '#E2E8F0',
                fontWeight: 500
              }}>
                <Building2 size={13} color="#2DD4BF" />
                <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {company.companyName}
                </span>
              </div>
            )}

            {/* User Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#132D52',
                border: '1.5px solid #0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: '#2DD4BF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                className="btn btn-sm"
                onClick={logout}
                title="Logout"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  padding: '7px 10px'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
