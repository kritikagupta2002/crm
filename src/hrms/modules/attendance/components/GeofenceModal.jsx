import React from 'react';
import { Modal } from '@/components/common/Modal';
import { GeofenceMap } from './GeofenceMap';
import { MapPin, ShieldCheck } from 'lucide-react';

export function GeofenceModal({
  isOpen,
  onClose,
  userCoords,
  onCoordsChange,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Office Attendance Geofence Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bansal Geo Solutions Pvt. Ltd. · Verified Attendance Zone
            </p>
          </div>
        </div>
      }
      size="2xl"
    >
      <div className="space-y-4">
        <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            <strong>Geofenced Attendance Policy:</strong> To ensure accurate onsite verification, attendance punch-in and punch-out are strictly enabled only when your device GPS is inside the designated office polygon.
          </span>
        </div>

        <GeofenceMap
          userCoords={userCoords}
          onCoordsChange={onCoordsChange}
          compact={false}
          height="420px"
        />
      </div>
    </Modal>
  );
}
