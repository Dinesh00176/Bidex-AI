import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenderService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
  ShieldAlert,
  Download
} from 'lucide-react';

const TenderUploadPage = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autoProcess, setAutoProcess] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const validateAndSetFile = (selectedFile) => {
    setValidationError(null);

    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Invalid file format. Only official PDF documents (.pdf) are permitted.');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setValidationError('File size exceeds the 25MB limit. Please upload a smaller document.');
      return;
    }

    if (selectedFile.size === 0) {
      setValidationError('Selected file is empty (0 bytes).');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setValidationError('Please select a tender PDF to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (organization) formData.append('organization', organization);
    if (referenceNumber) formData.append('referenceNumber', referenceNumber);
    if (deadline) formData.append('deadline', deadline);
    formData.append('autoProcess', autoProcess);

    setUploading(true);
    setUploadProgress(10);

    try {
      const res = await tenderService.upload(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (res.data.success) {
        showNotification('Tender uploaded and parsed successfully!', 'success');
        navigate(`/tenders/${res.data.tender._id}`);
      }
    } catch (err) {
      showNotification(err.message, 'error');
      setValidationError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Procurement Tender</h1>
          <p className="page-subtitle">
            Ingest RFP, RFQ, or NIT documents for AI requirement extraction & bid evaluation
          </p>
        </div>
      </div>

      {/* Sample Tenders Download Banner */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(15, 118, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#0F766E" />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0B1F3A' }}>
              Need a sample tender PDF to test?
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Download pre-formatted RFP/NIT procurement documents to test the AI extraction pipeline.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="/Smart_City_IoT_Tender_RFP_2026.pdf"
            download="Smart_City_IoT_Tender_RFP_2026.pdf"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Download size={13} color="#0F766E" /> Smart City IoT RFP (4 Pages)
          </a>
          <a
            href="/Healthcare_Cloud_HMIS_Tender_NIT_2026.pdf"
            download="Healthcare_Cloud_HMIS_Tender_NIT_2026.pdf"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Download size={13} color="#0F766E" /> Healthcare HMIS NIT (3 Pages)
          </a>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {validationError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13.5px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#DC2626" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragOver ? '2px dashed #0F766E' : '2px dashed #CBD5E1',
              backgroundColor: isDragOver ? 'rgba(15, 118, 110, 0.05)' : '#F8FAFC',
              borderRadius: '12px',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '24px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              style={{ display: 'none' }}
            />

            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={32} color="#16A34A" />
                </div>
                <div style={{ fontWeight: 700, color: '#0B1F3A', fontSize: '15px', marginTop: '4px' }}>{file.name}</div>
                <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Ingestion & Analysis
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                >
                  <X size={13} /> Select Different Document
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={30} color="#0F766E" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1F3A' }}>
                  Drag & drop your Tender PDF here, or <span style={{ color: '#0F766E' }}>browse file</span>
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B' }}>
                  Supports procurement RFP, NIT, and Tender specifications up to 25MB (PDF only)
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#0F172A', fontWeight: 600, marginBottom: '6px' }}>
                <span>Uploading document & extracting page text...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#0F766E', transition: 'width 0.2s ease' }}></div>
              </div>
            </div>
          )}

          {/* Tender Metadata Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '22px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Tender / Project Title</label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="e.g. Smart City IoT Infrastructure Platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="organization">Issuing Authority / Client</label>
              <input
                id="organization"
                type="text"
                className="form-input"
                placeholder="e.g. National Urban Infrastructure Authority"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="referenceNumber">RFP / Tender Reference Number</label>
              <input
                id="referenceNumber"
                type="text"
                className="form-input"
                placeholder="e.g. RFP-2026-IOT-99"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Submission Deadline</label>
              <input
                id="deadline"
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Auto Process Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            background: 'rgba(15, 118, 110, 0.05)',
            borderRadius: '8px',
            border: '1px solid #CCFBF1',
            marginBottom: '26px'
          }}>
            <input
              id="autoProcess"
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0F766E' }}
            />
            <label htmlFor="autoProcess" style={{ fontSize: '13px', color: '#0F172A', cursor: 'pointer' }}>
              <strong style={{ color: '#0F766E' }}>Automatically trigger full AI analysis</strong> (Requirement extraction, company fit matching, risk matrix, bid decision) immediately after upload.
            </label>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tenders')}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !file}
              style={{ padding: '10px 20px' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Ingesting Tender PDF...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Ingest & Analyze Tender
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenderUploadPage;
