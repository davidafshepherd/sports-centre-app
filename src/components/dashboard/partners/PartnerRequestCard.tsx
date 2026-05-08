'use client';

import { CheckCircle, XCircle } from 'lucide-react';

import type { PartnerRequest } from '@/types/partnerProfile';

const STATUS_COLOURS: Record<PartnerRequest['status'], string> = {
    pending:  'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

interface Props {
    request: PartnerRequest;
    direction: 'received' | 'sent';
    respondingId: string | null;
    onRespond?: (request: PartnerRequest, response: 'accepted' | 'rejected') => void;
}

export default function PartnerRequestCard({ request, direction, respondingId, onRespond }: Props) {
    const isResponding = respondingId === request.id;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-medium text-slate-900">
                        {direction === 'received' ? request.senderName : request.receiverName}
                    </p>
                    <p className="text-sm text-slate-500">
                        {direction === 'received'
                            ? `Wants to play ${request.sport} with you`
                            : request.sport}
                    </p>
                    {request.message && (
                        <p className="text-sm text-slate-400 italic mt-1">&ldquo;{request.message}&rdquo;</p>
                    )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${STATUS_COLOURS[request.status]}`}>
                    {request.status}
                </span>
            </div>

            {direction === 'received' && request.status === 'pending' && onRespond && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                        onClick={() => onRespond(request, 'accepted')}
                        disabled={isResponding}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accept
                    </button>
                    <button
                        onClick={() => onRespond(request, 'rejected')}
                        disabled={isResponding}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                    </button>
                </div>
            )}
        </div>
    );
}
