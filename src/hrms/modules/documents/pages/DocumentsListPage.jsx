import React, { useState, useEffect } from 'react';
import { FileText, UploadCloud, Download, Eye, Trash2, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { FileUpload } from '@/components/common/FileUpload';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { documentService } from '@/modules/documents/services/document.service';
export const DocumentsListPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [documents, setDocuments] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [docToDelete, setDocToDelete] = useState(null);
    // Upload Form State
    const [docTitle, setDocTitle] = useState('');
    const [docCategory, setDocCategory] = useState('Company Documents');
    const [docDesc, setDocDesc] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const load = async () => {
        const data = await documentService.getDocuments();
        setDocuments(data);
    };
    useEffect(() => {
        load();
    }, []);
    const handleUpload = async () => {
        if (!docTitle.trim()) {
            toast.error('Document title is required.', 'Validation Error');
            return;
        }
        await documentService.uploadDocument({
            title: docTitle,
            category: docCategory,
            fileName: uploadedFile ? uploadedFile.name : `${docTitle.replace(/\s+/g, '_')}.pdf`,
            fileSize: uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB',
            fileType: 'PDF',
            uploadedBy: user?.name || 'Dr. Amit Kumar Bansal',
            description: docDesc,
            accessRole: 'all',
        });
        toast.success(`Document "${docTitle}" uploaded to corporate repository.`, 'File Uploaded');
        setIsUploadOpen(false);
        setDocTitle('');
        setDocDesc('');
        setUploadedFile(null);
        load();
    };
    const handleDelete = async () => {
        if (!docToDelete)
            return;
        await documentService.deleteDocument(docToDelete.id);
        toast.success(`Document "${docToDelete.title}" removed.`, 'Document Deleted');
        setDocToDelete(null);
        load();
    };
    const handleDownload = (doc) => {
        toast.success(`Initiating download for ${doc.fileName}...`, 'Downloading');
    };
    const filteredDocs = documents.filter((d) => {
        if (selectedCategory !== 'All' && d.category !== selectedCategory)
            return false;
        return true;
    });
    const categories = [
        'All',
        'Company Documents',
        'Identity',
        'Education',
        'Joining Documents',
        'Other',
    ];
    const columns = [
        {
            key: 'title',
            header: 'Document Name',
            sortable: true,
            render: (d) => (<div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5"/>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {d.title}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">
              {d.fileName} • {d.fileSize}
            </p>
          </div>
        </div>),
        },
        {
            key: 'category',
            header: 'Category',
            sortable: true,
            render: (d) => <Badge variant="blue" size="sm">{d.category}</Badge>,
        },
        {
            key: 'uploadedBy',
            header: 'Uploaded By',
            render: (d) => <span className="text-slate-700 dark:text-slate-200 text-xs">{d.uploadedBy}</span>,
        },
        {
            key: 'uploadDate',
            header: 'Upload Date',
            sortable: true,
            className: 'font-mono text-xs text-slate-600 dark:text-slate-300',
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (d) => (<div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setPreviewDoc(d)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 rounded-lg transition-colors" title="Preview Document">
            <Eye className="w-4 h-4"/>
          </button>
          <button onClick={() => handleDownload(d)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Download">
            <Download className="w-4 h-4"/>
          </button>
          <button onClick={() => setDocToDelete(d)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Document Vault" description="Centralized corporate repository for SOPs, compliance guidelines, licenses, and verified employee KYC." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Documents' },
        ]} actions={<Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)} leftIcon={<UploadCloud className="w-4 h-4"/>}>
            Upload Document
          </Button>}/>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] overflow-x-auto">
        {categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#253344]'}`}>
            {cat}
          </button>))}
      </div>

      <DataTable columns={columns} data={filteredDocs} keyField="id" searchPlaceholder="Search document title, file name, or author..." searchFields={['title', 'fileName', 'uploadedBy']} onRowClick={(d) => setPreviewDoc(d)}/>

      {/* Upload Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Corporate Document" description="Add technical procedures, statutory filings, or employee credential proofs." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpload}>
              Upload to Vault
            </Button>
          </>}>
        <div className="space-y-4">
          <Input label="Document Title" isRequired value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Bhilwara Tailings Dam Monitoring SOP 2026"/>

          <Select label="Category" isRequired value={docCategory} onChange={(e) => setDocCategory(e.target.value)} options={[
            { label: 'Company Documents (SOP, Policies, Circulars)', value: 'Company Documents' },
            { label: 'Identity (Aadhaar, PAN, Passport)', value: 'Identity' },
            { label: 'Education (Degree, Certifications, DGMS)', value: 'Education' },
            { label: 'Joining Documents (Appointment, NDA)', value: 'Joining Documents' },
            { label: 'Other', value: 'Other' },
        ]}/>

          <FileUpload label="Select PDF or Document File" onFileSelect={(f) => setUploadedFile(f)}/>

          <Textarea label="Summary / Remarks" value={docDesc} onChange={(e) => setDocDesc(e.target.value)} placeholder="Brief purpose and revision notes..." rows={2}/>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="2xl" title={previewDoc?.title} description={`Category: ${previewDoc?.category} • Uploaded by ${previewDoc?.uploadedBy}`} footer={<>
            <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => previewDoc && handleDownload(previewDoc)} leftIcon={<Download className="w-4 h-4"/>}>
              Download Original
            </Button>
          </>}>
        <div className="p-8 bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] rounded-xl flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1A2430] shadow-xs border border-slate-200 dark:border-[#253344] flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-8 h-8"/>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc?.fileName}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Size: {previewDoc?.fileSize} • Format: PDF Encrypted</p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md italic mt-2">
            "{previewDoc?.description || 'Corporate confidential document belonging to Bansal Geo Solutions Pvt. Ltd.'}"
          </p>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmationDialog isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} onConfirm={handleDelete} title="Delete Document" message={`Are you sure you want to permanently remove "${docToDelete?.title}" from the corporate document vault?`} confirmText="Yes, Delete Document" variant="danger"/>
    </div>);
};
