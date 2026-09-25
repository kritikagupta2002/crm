import React, { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, Clock, Download, Eye, Filter, ShieldCheck, Award, RotateCcw, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { FileUpload } from '@/components/common/FileUpload';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const EmployeeDocumentsPage = () => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const [employees, setEmployees] = useState(() => storage.getEmployees());
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedProject, setSelectedProject] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    // Form State
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [docType, setDocType] = useState('Aadhaar Card');
    const [expiryDate, setExpiryDate] = useState('');
    const [records, setRecords] = useState(() => storage.getEmployeeDocuments());
    const reloadData = () => {
        setEmployees(storage.getEmployees());
        setRecords(storage.getEmployeeDocuments());
    };
    useEffect(() => {
        reloadData();
        window.addEventListener('focus', reloadData);
        return () => window.removeEventListener('focus', reloadData);
    }, []);
    const empId = user?.employeeId;
    const kpiRecords = isEmp
        ? records.filter((r) => (empId && r.employeeId === empId) || (user?.name && r.employeeName?.toLowerCase() === user.name.toLowerCase()))
        : records;
    const filteredRecords = kpiRecords.filter((rec) => {
        const matchesDept = isEmp || selectedDept === 'All' || rec.department === selectedDept;
        const matchesProject = isEmp || selectedProject === 'All' || getEmployeeProjectById(rec.employeeId) === selectedProject;
        const matchesStatus = selectedStatus === 'All' || rec.status === selectedStatus;
        return matchesDept && matchesProject && matchesStatus;
    });
    const handleUploadSubmit = (e) => {
        e.preventDefault();
        const effectiveEmpId = isEmp ? empId : selectedEmpId;
        if (!effectiveEmpId) {
            showToast('Please select an employee', 'error');
            return;
        }
        const emp = employees.find((e) => e.id === effectiveEmpId || e.employeeId === effectiveEmpId);
        const newRecord = {
            id: `doc-rec-${Date.now()}`,
            employeeId: isEmp ? empId : (emp?.employeeId || 'BGS-000'),
            employeeName: isEmp ? (user?.name || 'Staff Member') : (emp?.name || 'Staff Member'),
            department: isEmp ? (user?.department || 'Operations') : (emp?.employment?.department || 'Operations'),
            documentType: docType,
            fileName: `${docType.replace(/\s+/g, '_')}_${isEmp ? empId : emp?.employeeId}.pdf`,
            fileSize: '1.8 MB',
            uploadedOn: new Date().toLocaleDateString('en-CA'),
            status: 'Pending Review',
            expiryDate: expiryDate || undefined,
        };
        const updated = [newRecord, ...records];
        setRecords(updated);
        storage.setEmployeeDocuments(updated);
        setIsUploadModalOpen(false);
        showToast('Employee document uploaded and queued for HR verification', 'success');
    };
    const handleVerify = (id) => {
        if (isEmp)
            return;
        const updated = records.map((r) => (r.id === id ? { ...r, status: 'Verified' } : r));
        setRecords(updated);
        storage.setEmployeeDocuments(updated);
        showToast('Document marked as Verified & Compliant', 'success');
    };
    const columns = [
        ...(!isEmp
            ? [
                {
                    key: 'employeeName',
                    header: 'Employee',
                    sortable: true,
                    className: 'min-w-[180px] whitespace-nowrap',
                    render: (row) => (<div>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{row.employeeName}</span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">{row.employeeId}</span>
                  <span>•</span>
                  <span>{row.department}</span>
                </div>
              </div>),
                },
                {
                    key: 'project',
                    header: 'Project / Site',
                    sortable: true,
                    className: 'whitespace-nowrap',
                    render: (row) => {
                        const proj = getEmployeeProjectById(row.employeeId);
                        return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
                  {proj}
                </span>);
                    },
                },
            ]
            : []),
        {
            key: 'documentType',
            header: 'Document & Credential',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (row) => (<div>
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
            {row.documentType.includes('DGMS') || row.documentType.includes('Pilot') ? (<Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"/>) : (<FileText className="w-4 h-4 text-slate-500 shrink-0"/>)}
            <span>{row.documentType}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
            {row.fileName} ({row.fileSize})
          </span>
        </div>),
        },
        {
            key: 'uploadedOn',
            header: 'Upload Date',
            sortable: true,
            className: 'whitespace-nowrap tabular-nums',
            render: (row) => <span className="text-slate-600 dark:text-slate-400 text-xs tabular-nums whitespace-nowrap">{row.uploadedOn}</span>,
        },
        {
            key: 'expiryDate',
            header: 'Validity / Expiry',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (row) => (row.expiryDate ? (<span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 tabular-nums whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0"/>
            {row.expiryDate}
          </span>) : (<span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">Lifetime Validity</span>)),
        },
        {
            key: 'status',
            header: 'Compliance Status',
            sortable: true,
            className: 'text-center whitespace-nowrap',
            render: (row) => {
                const variants = {
                    Verified: 'emerald',
                    'Pending Review': 'amber',
                    Expired: 'rose',
                    Rejected: 'rose',
                };
                return (<div className="flex justify-center">
            <Badge variant={variants[row.status] || 'slate'}>{row.status}</Badge>
          </div>);
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) => (<div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(row)} title="Preview Document Details">
            <Eye className="w-3.5 h-3.5"/>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => showToast(`Downloading ${row.fileName}...`, 'info')} title="Download Document">
            <Download className="w-3.5 h-3.5 text-slate-600"/>
          </Button>
          {row.status === 'Pending Review' && !isEmp && (<Button variant="outline" size="sm" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-[11px]" onClick={() => handleVerify(row.id)}>
              Verify
            </Button>)}
        </div>),
        },
    ];
    return (<div className="space-y-6 pb-12">
      <PageHeader title={isEmp ? 'My Documents & Credentials' : 'Employee Documents'} description={isEmp
            ? 'Your uploaded identity proofs, qualification certificates, and statutory licenses.'
            : 'Repository of employee Aadhaar, PAN, educational degrees, and appointment records.'} breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Documents', path: '/hr/documents' },
            { label: isEmp ? 'My Documents' : 'Employee Documents' },
        ]} actions={<Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2"/>
            Upload Document
          </Button>}/>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-lg shrink-0">
            <FileText className="w-5 h-5"/>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Documents</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{kpiRecords.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-lg shrink-0">
            <CheckCircle className="w-5 h-5"/>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified & Compliant</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {kpiRecords.filter((r) => r.status === 'Verified').length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg shrink-0">
            <Clock className="w-5 h-5"/>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Review</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {kpiRecords.filter((r) => r.status === 'Pending Review').length}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg shrink-0">
            <ShieldCheck className="w-5 h-5"/>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">DGMS / Drone Licenses</p>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
              {kpiRecords.filter((r) => r.documentType.includes('DGMS') || r.documentType.includes('Pilot')).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-500"/>
            <span>Filter By:</span>
          </div>
          {!isEmp && (<>
              <div className="w-52">
                <Select options={[
                { label: 'All Departments', value: 'All' },
                { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                { label: 'Mining & Planning', value: 'Mining & Mine Planning' },
                { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                { label: 'HR & Admin', value: 'Human Resources & Admin' },
            ]} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}/>
              </div>
              <div className="w-56">
                <Select options={[
                { label: 'All Projects / Sites', value: 'All' },
                ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
            ]} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}/>
              </div>
            </>)}
          <div className="w-40">
            <Select options={[
            { label: 'All Statuses', value: 'All' },
            { label: 'Verified', value: 'Verified' },
            { label: 'Pending Review', value: 'Pending Review' },
        ]} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}/>
          </div>
          {((!isEmp && (selectedDept !== 'All' || selectedProject !== 'All')) || selectedStatus !== 'All') && (<Button variant="ghost" size="sm" onClick={() => {
                setSelectedDept('All');
                setSelectedProject('All');
                setSelectedStatus('All');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1">
              <RotateCcw className="w-3 h-3"/>
              <span>Reset</span>
            </Button>)}
        </div>

        <DataTable keyField="id" columns={columns} data={filteredRecords} searchPlaceholder={isEmp ? 'Search my documents...' : 'Search by employee, document type, file name...'} searchable pageSize={10}/>
      </Card>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={isEmp ? 'Upload Personal Credential or KYC Document' : 'Upload Employee Credential or KYC Document'} maxWidth="md">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {isEmp ? (<div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 text-xs">
              <p className="text-slate-500 dark:text-slate-400">Uploading Document For:</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {user?.name || 'Staff Member'} ({user?.employeeId || ''}) • {user?.department || 'Operations'}
              </p>
            </div>) : (<Select label="Select Employee" required options={[
                { label: '-- Select Employee --', value: '' },
                ...employees.map((e) => ({
                    label: `${e.name} (${e.employeeId} - ${e.employment.designation})`,
                    value: e.id,
                })),
            ]} value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}/>)}

          <Select label="Document Category / Type" required options={[
            { label: 'Aadhaar Card (UIDAI)', value: 'Aadhaar Card' },
            { label: 'PAN Card (Income Tax Dept)', value: 'PAN Card' },
            { label: 'Degree / Academic Diploma', value: 'Degree / Diploma' },
            { label: 'DGMS Mining Competency Certificate', value: 'DGMS Mining Competency' },
            { label: 'DGCA UAV Drone Pilot License', value: 'UAV Remote Pilot License' },
            { label: 'Official Appointment Letter', value: 'Appointment Letter' },
            { label: 'Confidentiality & NDA Agreement', value: 'NDA Agreement' },
        ]} value={docType} onChange={(e) => setDocType(e.target.value)}/>

          <Input label="Certificate Validity Expiry Date (if applicable)" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} helperText="Required for statutory DGMS certificates and DGCA drone licenses"/>

          <FileUpload label="Upload Document File (PDF, PNG, JPEG up to 10MB)" accept=".pdf,.png,.jpg,.jpeg" maxSizeMB={10} onFileSelect={() => { }}/>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} title="Document Verification Details" maxWidth="md">
        {selectedDoc && (<div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-800">{selectedDoc.employeeName} ({selectedDoc.employeeId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Department:</span>
                <span className="font-medium text-slate-700">{selectedDoc.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Document Type:</span>
                <span className="font-semibold text-blue-700">{selectedDoc.documentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">File Name:</span>
                <span className="font-mono text-slate-800">{selectedDoc.fileName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Uploaded On:</span>
                <span className="text-slate-700">{selectedDoc.uploadedOn}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Validity:</span>
                <span className="text-slate-700">{selectedDoc.expiryDate ? `Expires on ${selectedDoc.expiryDate}` : 'Permanent Document'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => {
                showToast(`Downloading ${selectedDoc.fileName}...`, 'info');
            }}>
                <Download className="w-4 h-4 mr-2"/>
                Download Original
              </Button>
              {selectedDoc.status === 'Pending Review' && !isEmp && (<Button variant="primary" onClick={() => {
                    handleVerify(selectedDoc.id);
                    setSelectedDoc(null);
                }}>
                  <CheckCircle className="w-4 h-4 mr-2"/>
                  Mark as Verified
                </Button>)}
            </div>
          </div>)}
      </Modal>
    </div>);
};
