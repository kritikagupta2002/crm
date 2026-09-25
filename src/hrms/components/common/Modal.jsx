import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export const Modal = ({ isOpen, onClose, title, description, children, footer, maxWidth = 'lg', }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in" onClick={onClose}/>

      <div className="flex min-h-full items-center justify-center p-2.5 sm:p-4 text-center">
        <div className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-[#1A2430] text-left shadow-[0_8px_40px_-8px_rgba(139,90,43,0.15),0_20px_60px_-20px_rgba(139,90,43,0.10)] dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] transition-all w-full ${maxWidthClasses[maxWidth]} my-2 sm:my-8 border border-[#E8E4DC]/90 dark:border-[#253344]`} onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#F0EDE8] dark:border-[#253344] bg-[#FAFAF8]/60 dark:bg-[#111821]/50">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (<h3 className="text-sm sm:text-base font-bold text-[#1A2430] dark:text-slate-100 truncate">{title}</h3>) : (title)}
              {description && (<p className="text-xs text-[#8B7355] dark:text-slate-400 mt-0.5">{description}</p>)}
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-[#A09080] hover:text-[#1A2430] dark:hover:text-slate-200 hover:bg-[#F5F0E8] dark:hover:bg-[#253344] transition-all duration-200 focus:outline-none shrink-0 ml-2" aria-label="Close modal">
              <X className="w-5 h-5"/>
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[75vh] overflow-y-auto">
            {children}
          </div>

          {/* Modal Footer */}
          {footer && (<div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#FAFAF8]/80 dark:bg-[#111821]/70 border-t border-[#F0EDE8] dark:border-[#253344] flex flex-wrap items-center justify-end gap-2 sm:gap-3 [&>button]:w-full [&>button]:sm:w-auto">
              {footer}
            </div>)}
        </div>
      </div>
    </div>);
};
