import React, { useState, useEffect } from 'react';
import {
  Save,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Eye,
  Download,
  AlertTriangle,
  UploadCloud,
  X,
  FileCheck2,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { employeeService } from '@/modules/employees/services/employee.service';
import { documentService } from '@/modules/documents/services/document.service';

export const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'documents'

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [empRecord, setEmpRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docType, setDocType] = useState('Aadhaar Card');
  const [uploadFile, setUploadFile] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [reuploadTargetDoc, setReuploadTargetDoc] = useState(null);

  const isManagerOrAdmin = ['director', 'super_admin', 'manager', 'hr'].includes(user?.role?.toLowerCase?.() || '');

  // Load employee profile and personal documents
  const loadProfile = () => {
    if (!user) return;
    const employees = storage.getEmployees() || [];
    const emp = employees.find(
      (e) =>
        (user.employeeId && e.employeeId === user.employeeId) ||
        (user.id && (e.id === user.id || e.employeeId === user.id)) ||
        (user.email && e.contact?.workEmail === user.email) ||
        (user.name && e.name?.toLowerCase() === user.name?.toLowerCase())
    );

    if (emp) {
      setEmpRecord(emp);
      setName(emp.name || user.name || '');
      setEmail(emp.contact?.workEmail || user.email || '');
      setPhone(emp.contact?.phone || '');
      setDob(emp.personal?.dob || '');
      setJoiningDate(emp.employment?.joiningDate || '');
      setEmergencyName(emp.emergency?.name || '');
      setEmergencyPhone(emp.emergency?.phone || '');
      setDepartment(emp.employment?.department || user.department || 'Mineral Exploration');
      setDesignation(emp.employment?.designation || user.designation || 'Staff');
      setAddress(emp.contact?.currentAddress || '');
      setAvatarUrl(emp.avatarUrl || user.avatarUrl || '');
    }

    // Load personal documents
    loadDocuments(emp?.employeeId || user.employeeId);
  };

  const loadDocuments = (targetEmpId) => {
    const allDocs = storage.getEmployeeDocuments() || [];
    if (!isManagerOrAdmin || activeTab !== 'documents') {
      const myDocs = allDocs.filter(
        (d) =>
          (targetEmpId && d.employeeId === targetEmpId) ||
          (user?.name && d.employeeName?.toLowerCase() === user.name?.toLowerCase())
      );
      setDocuments(myDocs);
    } else {
      setDocuments(allDocs);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user, activeTab]);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be less than 2MB.', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
      toast.success('Photo preview updated. Click "Save Profile" to apply.', 'Photo Selected');
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Full Name is required.');
    if (!email.trim()) return toast.error('Corporate Email is required.');
    if (!phone.trim()) return toast.error('Mobile Number is required.');
    if (!dob) return toast.error('Date of Birth is required.');
    if (!joiningDate) return toast.error('Date of Joining is required.');
    if (!emergencyName.trim()) return toast.error('Emergency Contact Name is required.');
    if (!emergencyPhone.trim()) return toast.error('Emergency Mobile is required.');
    if (!address.trim()) return toast.error('Residential Address is required.');

    setIsSaving(true);
    try {
      const employees = storage.getEmployees() || [];
      const empId = empRecord?.employeeId || user?.employeeId || `BGS-${Date.now()}`;
      const targetId = empRecord?.id || empId;

      const updated = {
        ...(empRecord || {}),
        name: name.trim(),
        avatarUrl: avatarUrl || empRecord?.avatarUrl || '',
        contact: {
          ...(empRecord?.contact || {}),
          workEmail: email.trim(),
          phone: phone.trim(),
          currentAddress: address.trim(),
        },
        personal: {
          ...(empRecord?.personal || {}),
          dob,
          firstName: name.split(' ')[0] || name,
          lastName: name.split(' ').slice(1).join(' ') || '',
        },
        employment: {
          ...(empRecord?.employment || {}),
          department,
          designation,
          joiningDate,
        },
        emergency: {
          ...(empRecord?.emergency || {}),
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
        },
      };

      const idx = employees.findIndex((e) => e.employeeId === empId || e.id === targetId);
      if (idx !== -1) employees[idx] = updated;
      else employees.push(updated);
      storage.setEmployees([...employees]);

      // Update AuthContext user state
      if (updateUser) {
        updateUser({
          name: updated.name,
          email: updated.contact.workEmail,
          avatarUrl: updated.avatarUrl,
          department: updated.employment.department,
          designation: updated.employment.designation,
        });
      }

      // Sync to Express API
      try {
        await employeeService.update(targetId, updated);
      } catch (apiErr) {
        console.warn('[Profile Save] Backend sync notice:', apiErr.message);
      }

      toast.success('Your complete employee profile has been updated.', 'Profile Saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload New Document
  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    const effectiveEmpId = empRecord?.employeeId || user?.employeeId || 'BGS-000';
    const effectiveEmpName = empRecord?.name || user?.name || 'Staff Member';
    const effectiveDept = empRecord?.employment?.department || user?.department || 'Operations';

    const fileName = uploadFile ? uploadFile.name : `${docType.replace(/\s+/g, '_')}_${effectiveEmpId}.pdf`;
    const fileSize = uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB';

    try {
      if (reuploadTargetDoc) {
        // Re-upload rejected document
        await documentService.reuploadEmployeeDocument(reuploadTargetDoc.id, {
          fileName,
          fileSize,
        });
        toast.success(`New copy of ${docType} submitted for manager verification.`, 'Document Re-uploaded');
      } else {
        // Upload fresh document
        await documentService.uploadEmployeeDocument({
          employeeId: effectiveEmpId,
          employeeName: effectiveEmpName,
          department: effectiveDept,
          documentType: docType,
          fileName,
          fileSize,
        });
        toast.success(`${docType} uploaded and queued for manager verification.`, 'Document Submitted');
      }

      setIsUploadModalOpen(false);
      setReuploadTargetDoc(null);
      setUploadFile(null);
      loadDocuments(effectiveEmpId);
    } catch (err) {
      toast.error(err.message || 'Failed to submit document.', 'Upload Error');
    }
  };

  // Manager Approves / Verifies Document
  const handleVerifyDoc = async (docId) => {
    try {
      await documentService.reviewEmployeeDocument(docId, 'Verified', '', user?.name || 'Manager');
      toast.success('Document marked as Verified & Compliant.', 'Verified');
      loadDocuments(empRecord?.employeeId || user?.employeeId);
    } catch (err) {
      toast.error(err.message || 'Failed to verify document.', 'Error');
    }
  };

  // Manager Submits Rejection with Comment
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionComment.trim()) {
      toast.error('Please specify the reason for rejection.', 'Reason Required');
      return;
    }

    try {
      await documentService.reviewEmployeeDocument(
        selectedDoc.id,
        'Rejected',
        rejectionComment.trim(),
        user?.name || 'Manager'
      );
      toast.warning('Document rejected and sent back to employee for correction.', 'Document Rejected');
      setIsRejectModalOpen(false);
      setSelectedDoc(null);
      setRejectionComment('');
      loadDocuments(empRecord?.employeeId || user?.employeeId);
    } catch (err) {
      toast.error(err.message || 'Failed to reject document.', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-[#0f4c5c] text-[#0f4c5c] dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Personal &amp; Corporate Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-[#0f4c5c] text-[#0f4c5c] dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Personal Verification Documents</span>
          {documents.some((d) => d.status === 'Rejected') && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              Action Req.
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Complete Personal Profile Form */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official Employee Profile
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All fields are mandatory and synced across executive director and administrator dashboards.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              ID: {empRecord?.employeeId || user?.employeeId || 'BGSPL'}
            </Badge>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Avatar
                  src={avatarUrl || empRecord?.avatarUrl || user?.avatarUrl}
                  name={name || user?.name}
                  size="xl"
                  className="w-20 h-20 border-2 border-[#0f4c5c]"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-avatar-input"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  Change Profile Photo
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  JPG or PNG up to 2MB. Clear portrait photo recommended for company ID cards.
                </p>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                isRequired
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Amit Kumar Bansal"
              />
              <Input
                label="Corporate Email"
                isRequired
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bansalgeo.com"
              />
              <Input
                label="Mobile Number"
                isRequired
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98876 95208"
              />
              <Input
                label="Date of Birth (DOB)"
                isRequired
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <Input
                label="Date of Joining"
                isRequired
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
              <Input
                label="Emergency Contact Name"
                isRequired
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Family member / Relative name"
              />
              <Input
                label="Emergency Mobile Number"
                isRequired
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 90010 85208"
              />
              <Input
                label="Department"
                isRequired
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Mineral Exploration / Mining & Survey"
              />
              <Input
                label="Designation"
                isRequired
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Managing Director / Surveyor"
              />
              <Input
                label="Employee Code"
                disabled
                value={empRecord?.employeeId || user?.employeeId || 'BGSPL'}
              />
            </div>

            {/* Residential Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Residential Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete street address, building/flat no., city, state, pincode"
                rows={2}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f4c5c]"
                required
              />
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Details
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: Personal Documents Verification Workflow */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal Document Verification &amp; Compliance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload Aadhaar, PAN, educational degrees, and technical licenses for manager review and statutory HR records.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setReuploadTargetDoc(null);
                  setDocType('Aadhaar Card');
                  setIsUploadModalOpen(true);
                }}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload Personal Document
              </Button>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#0f4c5c]" />
                <p className="text-sm font-semibold">No personal documents uploaded yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Upload your Aadhaar, PAN card, or qualification certificate for verification.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => {
                  const isRejected = doc.status === 'Rejected';
                  const isVerified = doc.status === 'Verified';
                  const isPending = doc.status === 'Pending Verification' || doc.status === 'Pending Review';

                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isRejected
                          ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                          : isVerified
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-lg ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : isRejected
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {doc.documentType}
                              </h4>
                              {isVerified && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Pending Verification
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Rejected by Manager
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {doc.fileName} • {doc.fileSize || '1.8 MB'} • Uploaded on {doc.uploadedOn}
                            </p>
                            {isManagerOrAdmin && doc.employeeName && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                                Employee: {doc.employeeName} ({doc.employeeId}) • {doc.department}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Re-upload button for Employee if rejected */}
                          {isRejected && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                setReuploadTargetDoc(doc);
                                setDocType(doc.documentType);
                                setIsUploadModalOpen(true);
                              }}
                              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            >
                              Re-upload Document
                            </Button>
                          )}

                          {/* Manager Review Controls */}
                          {isManagerOrAdmin && isPending && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                onClick={() => handleVerifyDoc(doc.id)}
                                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                              >
                                Accept &amp; Verify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-300 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setRejectionComment('');
                                  setIsRejectModalOpen(true);
                                }}
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Rejection Details Callout */}
                      {isRejected && doc.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-100/70 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            <div>
                              <strong className="font-bold">Manager Feedback &amp; Reason for Rejection:</strong>
                              <p className="mt-0.5">{doc.rejectionReason}</p>
                              {doc.reviewedBy && (
                                <p className="text-[11px] text-red-700 dark:text-red-300 mt-1 opacity-80">
                                  Reviewed by: {doc.reviewedBy} on {doc.reviewedAt?.slice(0, 10) || 'Recently'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Upload / Re-upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setReuploadTargetDoc(null);
        }}
        title={reuploadTargetDoc ? `Re-upload ${reuploadTargetDoc.documentType}` : 'Upload Personal Verification Document'}
        maxWidth="md"
      >
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          {reuploadTargetDoc && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <strong>Previous Rejection Feedback:</strong>
              <p className="mt-0.5">{reuploadTargetDoc.rejectionReason}</p>
              <p className="text-[11px] mt-1 text-amber-700">Please attach a revised, compliant scan.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={Boolean(reuploadTargetDoc)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="Aadhaar Card">Aadhaar Card (UIDAI Verified)</option>
              <option value="PAN Card">PAN Card (Income Tax Dept)</option>
              <option value="Degree / Diploma">Educational Degree / Marksheet</option>
              <option value="Bank Passbook / Cheque">Bank Passbook / Cancelled Cheque</option>
              <option value="Driving License">Driving License / Identity Proof</option>
              <option value="DGMS Mining Competency">DGMS Statutory Mining Certificate</option>
              <option value="Appointment Letter">Signed Appointment / Joining Letter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Attach Scanned Copy <span className="text-rose-500">*</span>
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
                  accept=".pdf, .png, .jpg, .jpeg"
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

      {/* Manager Reject Modal */}
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
            Please provide a specific reason or comment so{' '}
            <strong>{selectedDoc?.employeeName || 'the employee'}</strong> understands what needs to be corrected
            when re-uploading their <strong>{selectedDoc?.documentType}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rejection Comments / Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="e.g. Scanned copy is blurry and details are illegible. Please upload a clear color scan."
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
