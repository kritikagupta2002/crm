import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
export const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', isLoading = false, }) => {
    return (<Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title={<div className="flex items-center gap-2.5 text-slate-900 font-bold">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
            <AlertTriangle className="w-5 h-5"/>
          </div>
          <span>{title}</span>
        </div>} footer={<>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </>}>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed py-1">
        {message}
      </p>
    </Modal>);
};
