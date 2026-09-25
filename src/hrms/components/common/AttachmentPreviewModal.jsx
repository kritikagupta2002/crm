import React, { useState, useEffect } from 'react';
import { 
    X, Download, ZoomIn, ZoomOut, RotateCcw, FileText, 
    Image as ImageIcon, Printer, CheckCircle2, 
    FileCheck2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { attachmentStorage } from '@/core/storage/attachmentStorage';

/**
 * Universal Attachment Preview Modal for HR/Admin.
 * Pure viewer for HR/Admin to inspect documents uploaded by employees.
 * Responsive sizing: Compact card for document details, wide canvas for real image/PDF previews.
 */
export const AttachmentPreviewModal = ({
    isOpen,
    onClose,
    attachment,
}) => {
    const [zoom, setZoom] = useState(1);
    const [realImageUrl, setRealImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const claimKey = attachment?.claimId || attachment?.expenseNumber || attachment?.id || 'claim-temp';
    const fileName = attachment?.receiptFileName || attachment?.fileName || attachment?.documentName || 'Attachment_Document';
    const fileSize = attachment?.receiptFileSize ? (attachment.receiptFileSize / (1024 * 1024)).toFixed(2) : null;

    const isPdf = Boolean(
        fileName?.toLowerCase().endsWith('.pdf') || 
        attachment?.receiptFileType === 'application/pdf'
    );
    const fileExt = fileName?.includes('.') ? fileName.split('.').pop()?.toUpperCase() : (isPdf ? 'PDF' : 'DOC');

    // Load the exact document uploaded by employee
    useEffect(() => {
        if (!isOpen || !attachment) {
            setRealImageUrl(null);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        const loadUploadedDocument = async () => {
            // 1. Direct DataURL or Blob in attachment object
            const rawUrl = attachment.receiptUrl || attachment.receiptDataUrl || attachment.url || attachment.fileUrl;
            if (rawUrl && (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http'))) {
                if (isMounted) {
                    setRealImageUrl(rawUrl);
                    setIsLoading(false);
                }
                return;
            }

            // 2. Query IndexedDB by claimKey
            const storedByClaim = await attachmentStorage.getFile(claimKey);
            if (storedByClaim && (storedByClaim.rawDataUrl || storedByClaim.previewDataUrl)) {
                if (isMounted) {
                    setRealImageUrl(storedByClaim.rawDataUrl || storedByClaim.previewDataUrl);
                    setIsLoading(false);
                }
                return;
            }

            // 3. Query IndexedDB by fileName
            if (fileName) {
                const storedByName = await attachmentStorage.getFile(fileName);
                if (storedByName && (storedByName.rawDataUrl || storedByName.previewDataUrl)) {
                    if (isMounted) {
                        setRealImageUrl(storedByName.rawDataUrl || storedByName.previewDataUrl);
                        setIsLoading(false);
                    }
                    return;
                }
            }

            // Binary data not present (pre-backend mock record)
            if (isMounted) {
                setRealImageUrl(null);
                setIsLoading(false);
            }
        };

        loadUploadedDocument();

        return () => {
            isMounted = false;
        };
    }, [isOpen, attachment, claimKey, fileName]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !attachment) return null;

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => setZoom(1);

    const handleDownload = () => {
        if (!realImageUrl) return;
        const link = document.createElement('a');
        link.href = realImageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!realImageUrl) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${fileName}</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; min-height: 100vh; }
                            img { max-width: 95%; max-height: 95vh; object-fit: contain; }
                        </style>
                    </head>
                    <body>
                        <img src="${realImageUrl}" onload="window.print();window.close();" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full ${
                    realImageUrl ? 'max-w-4xl max-h-[92vh]' : 'max-w-md'
                } bg-white dark:bg-[#111821] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-200`}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#16202C]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                            {isPdf ? <FileText className="w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>}
                        </div>
                        <div className="truncate">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {realImageUrl ? fileName : 'Attached Document Proof'}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                                <span>Ref: {attachment.expenseNumber || attachment.claimId}</span>
                                <span>•</span>
                                <span>{attachment.employeeName}</span>
                            </p>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                        {realImageUrl && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleZoomOut} 
                                    className="p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-4 h-4"/>
                                </Button>
                                <span className="text-[11px] font-mono font-bold text-slate-500 w-10 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleZoomIn} 
                                    className="p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-4 h-4"/>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleResetZoom} 
                                    className="p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300 hidden sm:flex"
                                    title="Reset Zoom"
                                >
                                    <RotateCcw className="w-3.5 h-3.5"/>
                                </Button>

                                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"/>

                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleDownload} 
                                    className="text-xs h-8 px-2.5 flex items-center gap-1 font-semibold"
                                >
                                    <Download className="w-3.5 h-3.5 text-blue-600"/>
                                    <span className="hidden sm:inline">Download</span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handlePrint} 
                                    className="p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300 hidden sm:flex"
                                    title="Print Document"
                                >
                                    <Printer className="w-4 h-4"/>
                                </Button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors ml-1"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                        <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mb-2.5"/>
                        <p className="text-xs font-semibold">Loading document...</p>
                    </div>
                ) : realImageUrl ? (
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/80 dark:bg-[#0c1219] flex items-center justify-center min-h-[420px] max-h-[calc(92vh-70px)]">
                        {isPdf ? (
                            <iframe 
                                src={realImageUrl} 
                                title={fileName}
                                className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow"
                            />
                        ) : (
                            <div 
                                className="transition-transform duration-150 ease-out origin-center flex justify-center items-center shadow-xl rounded-xl overflow-hidden bg-white max-w-full"
                                style={{ transform: `scale(${zoom})` }}
                            >
                                <img 
                                    src={realImageUrl} 
                                    alt={fileName}
                                    className="max-h-[72vh] w-auto object-contain select-none block"
                                    loading="eager"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Clean, Compact Document Proof Inspection Card */
                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                        {/* File Thumbnail Badge */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/60 flex flex-col items-center justify-center shadow-xs">
                                {isPdf ? (
                                    <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400"/>
                                ) : (
                                    <ImageIcon className="w-7 h-7 text-blue-600 dark:text-blue-400"/>
                                )}
                                <span className="text-[9px] font-extrabold tracking-wider text-blue-700 dark:text-blue-300 uppercase mt-0.5">
                                    {fileExt}
                                </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-[#111821] shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5"/>
                            </div>
                        </div>

                        {/* File Name & Status Tag */}
                        <div className="space-y-1 max-w-full">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white break-all leading-snug px-2">
                                {fileName}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <FileCheck2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400"/>
                                Verified Proof Attached
                            </span>
                        </div>

                        {/* Metadata Details Ledger */}
                        <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-200/60 dark:divide-slate-700/60 text-xs">
                            <div className="flex items-center justify-between py-1.5 first:pt-0">
                                <span className="text-slate-500 dark:text-slate-400">Claim ID</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {attachment.expenseNumber || attachment.claimId}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500 dark:text-slate-400">Claimant</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {attachment.employeeName}
                                </span>
                            </div>
                            {attachment.category && (
                                <div className="flex items-center justify-between py-1.5">
                                    <span className="text-slate-500 dark:text-slate-400">Category</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {attachment.category}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500 dark:text-slate-400">Claim Amount</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    ₹{Number(attachment.requestedAmount || attachment.amount || attachment.claimAmount || 0).toLocaleString('en-IN')}
                                </span>
                            </div>
                            {fileSize && (
                                <div className="flex items-center justify-between py-1.5 last:pb-0">
                                    <span className="text-slate-500 dark:text-slate-400">File Size</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">
                                        {fileSize} MB
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
