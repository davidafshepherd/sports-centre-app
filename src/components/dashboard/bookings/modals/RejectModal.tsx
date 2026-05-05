'use client';

import { useState } from 'react';

// Shape of component's props
interface Props {
    title: string;
    placeholder: string;
    onClose: () => void;
    onConfirm: (note: string) => Promise<void>;
}

export default function RejectModal({ title, placeholder, onClose, onConfirm }: Props) {
    const [note, setNote] = useState('');                   // Optional reason note
    const [submitting, setSubmitting] = useState(false);    // Whether the form is being submitted

    // Submit the rejection
    async function handleConfirm() {
        setSubmitting(true);
        await onConfirm(note);
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal */}
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {/* Reason note */}
                    <textarea 
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" 
                        rows={3} 
                        value={note} 
                        onChange={e => setNote(e.target.value)}
                        placeholder={placeholder}
                    />
                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button 
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            onClick={handleConfirm} disabled={submitting}
                        >
                            {submitting ? "Confirming…" : "Confirm"}
                        </button>
                        <button 
                            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
