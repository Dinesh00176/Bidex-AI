import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  UploadCloud,
  Building2,
  FileCheck2,
  ShieldAlert,
  Bot
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/tenders', label: 'Tender Catalog', icon: FileSpreadsheet },
    { to: '/tenders/upload', label: 'Upload Tender PDF', icon: UploadCloud },
    { to: '/company', label: 'Company Credentials', icon: Building2 }
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0B1F3A',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }} className="sidebar">
      {/* Navigation list */}
      <div style={{ padding: '20px 14px', flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748B',
          padding: '4px 12px 14px'
        }}>
          Procurement Platform
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? '#0F766E' : 'transparent',
                  boxShadow: isActive ? '0 2px 6px rgba(15, 118, 110, 0.35)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                })}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Decision Support Compliance Notice */}
      <div style={{
        padding: '14px 16px',
        margin: '14px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11.5px',
        color: '#94A3B8',
        lineHeight: 1.45
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', fontWeight: 700, marginBottom: '6px' }}>
          <ShieldAlert size={14} color="#F59E0B" />
          <span>Decision Support</span>
        </div>
        Procurement risk matrices provide decision-support intelligence. Mandatory legal review required prior to binding bid submission.
      </div>
    </aside>
  );
};

export default Sidebar;
