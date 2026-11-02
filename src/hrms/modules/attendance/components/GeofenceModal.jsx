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
            <h3 className="modal-title">Office geofence</h3>
            <p className="modal-subtitle">Bansal Geo Solutions, Jaipur head office</p>
          </div>
        </div>
      }
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            Office attendance can be punched only when your device's GPS places you inside the office boundary. Field staff on duty punch with their GPS position recorded for review.
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
