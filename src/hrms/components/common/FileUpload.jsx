import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, X } from 'lucide-react';
export const FileUpload = ({ label, helperText = 'PDF, DOCX, PNG, JPG up to 10MB', accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg', onFileSelect, error, isRequired, }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);
    const processFile = (file) => {
        setSelectedFile(file);
        if (!file) {
            onFileSelect?.(null, null);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            onFileSelect?.(file, ev.target?.result || null);
        };
        reader.onerror = () => {
            onFileSelect?.(file, null);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    const handleInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };
    const removeFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        onFileSelect?.(null, null);
        if (inputRef.current)
            inputRef.current.value = '';
    };
    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}

      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
        }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors duration-150 ${isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
            : selectedFile
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-[#374B63] hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-[#111821] hover:bg-white dark:hover:bg-[#151D28]'} ${error ? 'border-rose-400' : ''}`}>
        <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden"/>

        {selectedFile ? (<div className="flex items-center justify-between p-1 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                <File className="w-5 h-5"/>
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"/>
              <button type="button" onClick={removeFile} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>) : (<div className="flex flex-col items-center py-2">
            <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1.5"/>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Click to upload or drag & drop
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{helperText}</p>
          </div>)}
      </div>

      {error && <span className="text-xs text-rose-600 font-medium">{error}</span>}
    </div>);
};
