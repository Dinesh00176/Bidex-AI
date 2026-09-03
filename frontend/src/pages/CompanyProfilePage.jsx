import React, { useState, useEffect, useRef } from 'react';
import { companyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Loader } from '../components/common/Loader';
import {
  Building2,
  FileCheck2,
  UploadCloud,
  Trash2,
  Save,
  Plus,
  FileText,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const CompanyProfilePage = () => {
  const { company, refreshCompany } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    yearsExperience: 0,
    annualTurnover: 0,
    currency: 'INR',
    employeeCount: 0,
    certifications: '',
    technicalSkills: '',
    services: '',
    locations: ''
  });

  const [saving, setSaving] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('ISO Certificate');
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || '',
        industry: company.industry || '',
        yearsExperience: company.yearsExperience || 0,
        annualTurnover: company.annualTurnover || 0,
        currency: company.currency || 'INR',
        employeeCount: company.employeeCount || 0,
        certifications: (company.certifications || []).join(', '),
        technicalSkills: (company.technicalSkills || []).join(', '),
        services: (company.services || []).join(', '),
        locations: (company.locations || []).join(', ')
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        yearsExperience: Number(formData.yearsExperience),
        annualTurnover: Number(formData.annualTurnover),
        employeeCount: Number(formData.employeeCount),
        certifications: formData.certifications.split(',').map(s => s.trim()).filter(Boolean),
        technicalSkills: formData.technicalSkills.split(',').map(s => s.trim()).filter(Boolean),
        services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
        locations: formData.locations.split(',').map(s => s.trim()).filter(Boolean)
      };

      await companyService.updateProfile(payload);
      await refreshCompany();
      showNotification('Company capability profile updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('Only PDF capability documents are accepted.', 'error');
      return;
    }

    const docFormData = new FormData();
    docFormData.append('file', file);
    docFormData.append('title', docTitle || file.name);
    docFormData.append('docType', docType);

    setDocUploading(true);
    try {
      await companyService.uploadDocument(docFormData);
      await refreshCompany();
      setDocTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showNotification('Capability document uploaded and analyzed for credential verification!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this capability document?')) return;

    try {
      await companyService.deleteDocument(docId);
      await refreshCompany();
      showNotification('Document deleted.', 'info');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Profile & Capability Credentials</h1>
          <p className="page-subtitle">
            Configure audited credentials, certifications, and capabilities used by the Bid Decision Engine
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Profile Attributes Form */}
        <div className="card" style={{ padding: '28px' }}>
          <div className="card-header">
            <div className="card-title">
              <Building2 size={16} color="#0F766E" />
              <span>Core Operational Profile</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label" htmlFor="companyName">Legal Organization / Company Name</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                className="form-input"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="industry">Industry Sector / Domain</label>
              <input
                id="industry"
                name="industry"
                type="text"
                className="form-input"
                value={formData.industry}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="yearsExperience">Years in Business</label>
                <input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  className="form-input"
                  value={formData.yearsExperience}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="employeeCount">Employee Headcount</label>
                <input
                  id="employeeCount"
                  name="employeeCount"
                  type="number"
                  className="form-input"
                  value={formData.employeeCount}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="annualTurnover">Annual Financial Turnover (INR)</label>
              <input
                id="annualTurnover"
                name="annualTurnover"
                type="number"
                className="form-input"
                value={formData.annualTurnover}
                onChange={handleChange}
                min="0"
              />
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                ₹{((formData.annualTurnover || 0) / 10000000).toFixed(2)} Crore (Used to evaluate financial criteria threshold)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="certifications">Accredited Certifications (Comma Separated)</label>
              <input
                id="certifications"
                name="certifications"
                type="text"
                className="form-input"
                placeholder="ISO 9001:2015, ISO 27001:2013, CMMI Level 3"
                value={formData.certifications}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="technicalSkills">Technical Core Competencies (Comma Separated)</label>
              <input
                id="technicalSkills"
                name="technicalSkills"
                type="text"
                className="form-input"
                placeholder="Cloud Architecture, IoT Telemetry, Kubernetes, Cybersecurity"
                value={formData.technicalSkills}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="services">Services & Solutions (Comma Separated)</label>
              <input
                id="services"
                name="services"
                type="text"
                className="form-input"
                placeholder="System Integration, Managed NOC/SOC, Smart Infrastructure"
                value={formData.services}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 20px' }}>
              <Save size={15} /> {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Upload Credential Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={16} color="#16A34A" />
                <span>Upload Verified Capability Documents</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="form-label" htmlFor="docTitle">Document Title</label>
                <input
                  id="docTitle"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ISO 27001 Certificate 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="docType">Document Category</label>
                <select
                  id="docType"
                  className="form-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="ISO Certificate">ISO Certificate</option>
                  <option value="Audit Report">Audited Financial Report</option>
                  <option value="Project Completion">Past Project Completion Certificate</option>
                  <option value="Technical Capability">Technical Capability Deck</option>
                  <option value="Other">Other Credential</option>
                </select>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadDocument}
                accept="application/pdf"
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={docUploading}
                style={{ marginTop: '6px' }}
              >
                <UploadCloud size={15} color="#0F766E" />
                <span>{docUploading ? 'Extracting & Verifying Facts...' : 'Select PDF Credential to Ingest'}</span>
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Uploaded documents are processed to extract verified credential facts used during tender requirement matching.
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-header">
              <div className="card-title">
                <FileCheck2 size={16} color="#0F766E" />
                <span>Active Credentials & Evidence ({(company?.documents || []).length})</span>
              </div>
            </div>

            {(company?.documents || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '13px' }}>
                No capability documents uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {company.documents.map((doc) => (
                  <div
                    key={doc._id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="#0F766E" />
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0B1F3A' }}>{doc.title}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        {doc.docType} • {(doc.fileSize / 1024).toFixed(0)} KB
                      </div>
                      {doc.extractedSummary && (
                        <p style={{ fontSize: '12.5px', color: '#334155', marginTop: '6px', lineHeight: 1.4 }}>
                          {doc.extractedSummary}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 7px' }}
                      title="Delete Document"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
