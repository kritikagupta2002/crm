import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, AlertCircle, CheckCircle2, Camera, ShieldAlert, X } from 'lucide-react';
import { storage } from '../../hrms/core/storage/storage';
import { employeeService } from '../../hrms/modules/employees/services/employee.service';

export function ProfileCompletionModal({ user, role, onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [empRecord, setEmpRecord] = useState(null);

  // Form fields
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
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
      setDesignation(emp.employment?.designation || user.title || user.designation || 'Staff');
      setAddress(emp.contact?.currentAddress || '');
      setAvatarUrl(emp.avatarUrl || user.avatarUrl || '');

      // Check if any mandatory details are missing
      const isMissing =
        !emp.contact?.phone ||
        !emp.personal?.dob ||
        !emp.employment?.joiningDate ||
        !emp.emergency?.name ||
        !emp.emergency?.phone ||
        !emp.contact?.currentAddress;

      if (isMissing) {
        setIsOpen(true);
      }
    }
  }, [user]);

  // Handle Photo File Upload & Convert to Base64
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Profile photo must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!name.trim()) return setErrorMsg('Full Name is required.');
    if (!email.trim()) return setErrorMsg('Corporate Email is required.');
    if (!phone.trim()) return setErrorMsg('Mobile Number is required.');
    if (!dob) return setErrorMsg('Date of Birth is required.');
    if (!joiningDate) return setErrorMsg('Date of Joining is required.');
    if (!emergencyName.trim()) return setErrorMsg('Emergency Contact Name is required.');
    if (!emergencyPhone.trim()) return setErrorMsg('Emergency Mobile Number is required.');
    if (!address.trim()) return setErrorMsg('Residential Address is required.');

    setIsSaving(true);
    try {
      const employees = storage.getEmployees() || [];
      const empId = empRecord?.employeeId || user?.employeeId || `BGS-${Date.now()}`;
      const targetId = empRecord?.id || empId;

      const updatedData = {
        ...(empRecord || {}),
        name: name.trim(),
        avatarUrl: avatarUrl || empRecord?.avatarUrl || '',
        contact: {
          ...(empRecord?.contact || {}),
          workEmail: email.trim(),
          phone: phone.trim(),
          currentAddress: address.trim(),
          city: empRecord?.contact?.city || 'Jaipur',
          state: empRecord?.contact?.state || 'Rajasthan',
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
          relationship: empRecord?.emergency?.relationship || 'Family / Relative',
        },
      };

      // 1. Update in local storage
      const idx = employees.findIndex((e) => e.employeeId === empId || e.id === targetId);
      if (idx !== -1) {
        employees[idx] = updatedData;
      } else {
        employees.push(updatedData);
      }
      storage.setEmployees([...employees]);

      // 2. Sync to Backend API
      try {
        await employeeService.update(targetId, updatedData);
      } catch (apiErr) {
        console.warn('[Profile Completion] Backend update failed, saved locally:', apiErr.message);
      }

      setIsOpen(false);
      if (onComplete) onComplete(updatedData);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            backgroundColor: '#0f4c5c',
            backgroundImage: 'linear-gradient(135deg, #0f4c5c 0%, #1a6b7d 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldAlert size={20} color="#fbbf24" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '-0.01em' }}>
                Complete Your Employee Profile
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', opacity: 0.9 }}>
              Bansal Geo Solutions requires your verified contact, emergency, and personal records for administrative and attendance compliance.
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
            title="Dismiss for now"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '24px', overflowY: 'auto' }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              paddingBottom: '18px',
              marginBottom: '18px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid #0f4c5c',
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={36} color="#64748b" />
              )}
            </div>
            <div>
              <label
                htmlFor="profile-photo-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <Camera size={15} />
                Upload Profile Photo
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                PNG, JPG or JPEG up to 2MB. Clear portrait photo recommended.
              </p>
            </div>
          </div>

          {/* Grid Layout of Required Fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikas Verma"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Corporate Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Corporate Email <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bansalgeo.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98290 12345"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Date of Birth <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Date of Joining */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Date of Joining <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Emergency Contact Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Parent / Spouse / Relative name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Emergency Mobile Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Emergency Contact Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 90010 12345"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Department <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Mining & Survey / Mineral Exploration"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Designation <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Surveyor / GIS Analyst"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          {/* Current Address (Full Width) */}
          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Current Residential Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Flat No., Street, Landmark, Area, Jaipur, Rajasthan - PIN"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              required
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Fill Later
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: '#0f4c5c',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 22px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#ffffff',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} />
              {isSaving ? 'Saving...' : 'Save & Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

