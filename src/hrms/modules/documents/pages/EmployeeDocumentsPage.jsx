import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Download,
  Eye,
  ShieldCheck,
  Award,
  RotateCcw,
  XCircle,
  AlertTriangle,
  UploadCloud,
  X,
  FileCheck2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { documentService } from '@/modules/documents/services/document.service';

export const EmployeeDocumentsPage = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const isEmp = currentRole === 'employee' || user?.role === 'employee';

  const [employees, setEmployees] = useState(() => storage.getEmployees());
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [reuploadTargetDoc, setReuploadTargetDoc] = useState(null);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [docType, setDocType] = useState('Aadhaar Card');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [records, setRecords] = useState(() => storage.getEmployeeDocuments());

  const reloadData = async () => {
    setEmployees(storage.getEmployees());
    try {
      const docs = await documentService.getEmployeeDocuments();
      setRecords(docs);
    } catch {
      setRecords(storage.getEmployeeDocuments());
    }
  };

  useEffect(() => {
    reloadData();
    window.addEventListener('focus', reloadData);
    return () => window.removeEventListener('focus', reloadData);
  }, []);

  const empId = user?.employeeId;
  const kpiRecords = isEmp
    ? records.filter(
        (r) =>
          (empId && r.employeeId === empId) ||
          (user?.name && r.employeeName?.toLowerCase() === user.name.toLowerCase())
      )
    : records;

  const filteredRecords = kpiRecords.filter((rec) => {
    const matchesDept = isEmp || selectedDept === 'All' || rec.department === selectedDept;
    const matchesStatus =
      selectedStatus === 'All' ||
      rec.status === selectedStatus ||
      (selectedStatus === 'Pending' && (rec.status === 'Pending Verification' || rec.status === 'Pending Review'));
    return matchesDept && matchesStatus;
  });

  // Handle Document Upload / Re-upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const effectiveEmpId = isEmp ? empId : selectedEmpId;
    if (!effectiveEmpId) {
      showToast('Please select an employee', 'error');
      return;
    }
    const emp = employees.find((e) => e.id === effectiveEmpId || e.employeeId === effectiveEmpId);
    const fileName = uploadFile ? uploadFile.name : `${docType.replace(/\s+/g, '_')}_${effectiveEmpId}.pdf`;
    const fileSize = uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';

    try {
      if (reuploadTargetDoc) {
        await documentService.reuploadEmployeeDocument(reuploadTargetDoc.id, {
          fileName,
          fileSize,
        });
        showToast('Revised document re-submitted for manager verification', 'success');
      } else {
        await documentService.uploadEmployeeDocument({
          employeeId: isEmp ? empId : emp?.employeeId || 'BGS/04',
          employeeName: isEmp ? user?.name || 'Staff Member' : emp?.name || 'Staff Member',
          department: isEmp ? user?.department || 'Operations' : emp?.employment?.department || 'Operations',
          documentType: docType,
          fileName,
          fileSize,
          expiryDate: expiryDate || null,
        });
        showToast('Document uploaded and submitted for manager verification', 'success');
      }

      setIsUploadModalOpen(false);
      setReuploadTargetDoc(null);
      setUploadFile(null);
      reloadData();
    } catch (err) {
      showToast(err.message || 'Failed to upload document', 'error');
    }
  };

  // Manager Verify / Approve
  const handleVerify = async (id) => {
    if (isEmp) return;
    try {
      await documentService.reviewEmployeeDocument(id, 'Verified', '', user?.name || 'Manager');
      showToast('Document verified and marked as compliant', 'success');
      reloadData();
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  // Manager Reject with Comments
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionComment.trim()) {
      showToast('Please enter the reason for rejection', 'error');
      return;
    }
    try {
      await documentService.reviewEmployeeDocument(
        selectedDoc.id,
        'Rejected',
        rejectionComment.trim(),
        user?.name || 'Manager'
      );
      showToast('Document rejected with feedback sent to employee', 'warning');
      setIsRejectModalOpen(false);
      setSelectedDoc(null);
      setRejectionComment('');
      reloadData();
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };

  const columns = [
    ...(!isEmp
      ? [
          {
            key: 'employeeName',
            header: 'Employee',
            sortable: true,
            className: 'min-w-[180px] whitespace-nowrap',
            render: (row) => (
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{row.employeeName}</span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-teal-700 dark:text-teal-400 font-bold">{row.employeeId}</span>
                  <span>•</span>
                  <span>{row.department}</span>
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'documentType',
      header: 'Document & Credential',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
            {row.documentType.includes('DGMS') || row.documentType.includes('Pilot') ? (
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <span>{row.documentType}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
            {row.fileName} ({row.fileSize || '1.8 MB'})
          </span>
        </div>
      ),
    },
    {
      key: 'uploadedOn',
      header: 'Upload Date',
      sortable: true,
      className: 'whitespace-nowrap tabular-nums',
      render: (row) => (
        <span className="text-slate-600 dark:text-slate-400 text-xs tabular-nums whitespace-nowrap">
          {row.uploadedOn}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Validity / Expiry',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) =>
        row.expiryDate ? (
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 tabular-nums whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {row.expiryDate}
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">Permanent</span>
        ),
    },
    {
      key: 'status',
      header: 'Verification Status',
      sortable: true,
      className: 'text-center whitespace-nowrap',
      render: (row) => {
        const isVerified = row.status === 'Verified';
        const isRejected = row.status === 'Rejected';
        return (
          <div className="flex flex-col items-center gap-1">
            <Badge variant={isVerified ? 'emerald' : isRejected ? 'rose' : 'amber'}>
              {isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending Verification'}
            </Badge>
            {isRejected && row.rejectionReason && (
              <span className="text-[10px] text-red-600 dark:text-red-400 max-w-[140px] truncate" title={row.rejectionReason}>
                {row.rejectionReason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const isPending = row.status === 'Pending Verification' || row.status === 'Pending Review';
        const isRejected = row.status === 'Rejected';

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(row)} title="Preview Document Details">
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => showToast(`Downloading ${row.fileName}...`, 'info')}
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
            </Button>

            {/* Employee Re-upload Button */}
            {isRejected && isEmp && (
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-[11px]"
                onClick={() => {
                  setReuploadTargetDoc(row);
                  setDocType(row.documentType);
                  setIsUploadModalOpen(true);
                }}
                leftIcon={<RotateCcw className="w-3 h-3" />}
              >
                Re-upload
              </Button>
            )}

            {/* Manager / Admin Verify & Reject Actions */}
            {!isEmp && isPending && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px]"
                  onClick={() => handleVerify(row.id)}
                  leftIcon={<CheckCircle className="w-3 h-3" />}
                >
                  Verify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50 text-[11px]"
                  onClick={() => {
                    setSelectedDoc(row);
                    setRejectionComment('');
                    setIsRejectModalOpen(true);
                  }}
                  leftIcon={<XCircle className="w-3 h-3" />}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const totalVerified = records.filter((r) => r.status === 'Verified').length;
  const totalPending = records.filter(
    (r) => r.status === 'Pending Verification' || r.status === 'Pending Review'
  ).length;
  const totalRejected = records.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={isEmp ? 'My Personal Verification Documents' : 'Employee Document Verification'}
        description={
          isEmp
            ? 'Official identity proofs, academic credentials, and statutory licenses uploaded for manager review.'
            : 'Manager verification portal: review, approve, or reject employee personal documents with compliance remarks.'
        }
        breadcrumbs={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Documents', path: '/hr/documents' },
          { label: isEmp ? 'My Documents' : 'Verification Queue' },
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setReuploadTargetDoc(null);
              setDocType('Aadhaar Card');
              setIsUploadModalOpen(true);
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="stat-grid">
        <StatCard title="Total documents" value={kpiRecords.length} icon={<FileText />} tone="tone-info" />
        <StatCard title="Verified" value={totalVerified} icon={<ShieldCheck />} tone="tone-good" />
        <StatCard title="Pending verification" value={totalPending} icon={<Clock />} tone="tone-attention" />
        <StatCard title="Rejected" value={totalRejected} icon={<XCircle />} tone="tone-urgent" caption="needs re-upload" />
      </div>

      {/* Documents Data Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        keyField="id"
        emptyTitle="No documents found matching the filter criteria."
        filterComponent={<>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'All Statuses', value: 'All' },
                { label: 'Pending Verification', value: 'Pending' },
                { label: 'Verified', value: 'Verified' },
                { label: 'Rejected', value: 'Rejected' },
              ]}
              className="text-xs w-44"
            />

            {!isEmp && (
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                options={[
                  { label: 'All Departments', value: 'All' },
                  { label: 'Mineral Exploration', value: 'Mineral Exploration' },
                  { label: 'Mining & Survey', value: 'Mining & Survey' },
                  { label: 'Administration', value: 'Administration' },
                ]}
                className="text-xs w-44"
              />
            )}
        </>}
      />

      {/* Upload / Re-upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setReuploadTargetDoc(null);
        }}
        title={reuploadTargetDoc ? `Re-upload ${reuploadTargetDoc.documentType}` : 'Upload Personal Document'}
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {reuploadTargetDoc && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg text-xs text-red-900 dark:text-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <strong>Manager Rejection Feedback:</strong>
                  <p className="mt-0.5">{reuploadTargetDoc.rejectionReason}</p>
                  <p className="text-[11px] mt-1 text-red-700">Please attach a revised, compliant scan.</p>
                </div>
              </div>
            </div>
          )}

          {!isEmp && !reuploadTargetDoc ? (
            <Select
              label="Select Employee"
              required
              options={[
                { label: '-- Select Employee --', value: '' },
                ...employees.map((e) => ({
                  label: `${e.name} (${e.employeeId} - ${e.employment?.designation})`,
                  value: e.id,
                })),
              ]}
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
            />
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs">
              <span className="text-slate-500">Employee:</span>{' '}
              <strong className="text-slate-800 dark:text-white">
                {user?.name} ({user?.employeeId})
              </strong>
            </div>
          )}

          <Select
            label="Document Category / Type"
            required
            disabled={Boolean(reuploadTargetDoc)}
            options={[
              { label: 'Aadhaar Card (UIDAI Verified)', value: 'Aadhaar Card' },
              { label: 'PAN Card (Income Tax Dept)', value: 'PAN Card' },
              { label: 'Degree / Academic Diploma', value: 'Degree / Diploma' },
              { label: 'Bank Passbook / Cancelled Cheque', value: 'Bank Passbook / Cheque' },
              { label: 'DGMS Mining Competency Certificate', value: 'DGMS Mining Competency' },
              { label: 'Official Appointment Letter', value: 'Appointment Letter' },
              { label: 'Confidentiality & NDA Agreement', value: 'NDA Agreement' },
            ]}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />

          <Input
            label="Validity / Expiry Date (if applicable)"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            helperText="Required for statutory certificates with a renewal term"
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Document File <span className="text-rose-500">*</span>
            </label>
            
            {!uploadFile ? (
              <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to browse or drag & drop file here
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports PDF, PNG, JPG or JPEG up to 10MB
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {['PDF', 'PNG', 'JPG'].map((fmt) => (
                    <span key={fmt} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {fmt}
                    </span>
                  ))}
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
              </label>
            ) : (
              <div className="p-3.5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {uploadFile.name}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setReuploadTargetDoc(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {reuploadTargetDoc ? 'Submit Revised Document' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={Boolean(selectedDoc && !isRejectModalOpen)}
        onClose={() => setSelectedDoc(null)}
        title="Document Details & Verification History"
        maxWidth="md"
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedDoc.employeeName} ({selectedDoc.employeeId})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedDoc.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">{selectedDoc.documentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">File Name:</span>
                <span className="font-mono text-slate-800 dark:text-white">{selectedDoc.fileName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Status:</span>
                <Badge
                  variant={
                    selectedDoc.status === 'Verified' ? 'emerald' : selectedDoc.status === 'Rejected' ? 'rose' : 'amber'
                  }
                >
                  {selectedDoc.status}
                </Badge>
              </div>
              {selectedDoc.rejectionReason && (
                <div className="py-2 text-red-600 dark:text-red-400 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold block">Rejection Feedback:</span>
                  <span>{selectedDoc.rejectionReason}</span>
                </div>
              )}
              {selectedDoc.reviewedBy && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Reviewed By:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedDoc.reviewedBy} on {selectedDoc.reviewedAt?.slice(0, 10) || 'Recently'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  showToast(`Downloading ${selectedDoc.fileName}...`, 'info');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Original
              </Button>

              {!isEmp && (selectedDoc.status === 'Pending Verification' || selectedDoc.status === 'Pending Review') && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-300"
                    onClick={() => {
                      setIsRejectModalOpen(true);
                    }}
                  >
                    Reject with Reason
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleVerify(selectedDoc.id);
                      setSelectedDoc(null);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve &amp; Verify
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedDoc(null);
        }}
        title="Reject Document - Reason for Rejection"
        maxWidth="sm"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Provide actionable feedback for{' '}
            <strong>{selectedDoc?.employeeName}</strong> explaining why their{' '}
            <strong>{selectedDoc?.documentType}</strong> was rejected so they can re-upload a compliant copy.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Comments / Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="e.g. Scanned copy is illegible/truncated. Please upload a clear color PDF."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedDoc(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
