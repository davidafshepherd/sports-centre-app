'use client';

import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { getPartnerRequestsReceived, getPartnerRequestsSent, respondToPartnerRequest } from '@/lib/partners';
import type { PartnerRequest } from '@/types/partnerProfile';
import PartnerTabs from './PartnerTabs';
import PartnerRequestCard from './PartnerRequestCard';

export default function RequestsTab() {
    const { user } = useAuth();
    const [received, setReceived] = useState<PartnerRequest[]>([]);
    const [sent, setSent] = useState<PartnerRequest[]>([]);
    const [activeTab, setActiveTab] = useState('received');
    const [loading, setLoading] = useState(true);
    const [respondingId, setRespondingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user) return;
        const [receivedRequests, sentRequests] = await Promise.all([
            getPartnerRequestsReceived(user.uid),
            getPartnerRequestsSent(user.uid),
        ]);
        setReceived(receivedRequests);
        setSent(sentRequests);
        setLoading(false);
    }, [user]);

    useEffect(() => { load(); }, [load]);

    async function handleRespond(request: PartnerRequest, response: 'accepted' | 'rejected') {
        setRespondingId(request.id);
        await respondToPartnerRequest(request.id, request, response);
        setRespondingId(null);
        load();
    }

    const pendingReceivedCount = received.filter(r => r.status === 'pending').length;

    const tabs = [
        { id: 'received', label: 'Received', count: pendingReceivedCount },
        { id: 'sent', label: 'Sent' },
    ];

    if (loading) return (
        <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-xl" />
            ))}
        </div>
    );

    return (
        <>
            <PartnerTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'received' && (
                <div className="space-y-3">
                    {received.length === 0 ? (
                        <p className="text-center py-10 text-sm text-slate-500">No requests received yet.</p>
                    ) : received.map(request => (
                        <PartnerRequestCard
                            key={request.id}
                            request={request}
                            direction="received"
                            respondingId={respondingId}
                            onRespond={handleRespond}
                        />
                    ))}
                </div>
            )}

            {activeTab === 'sent' && (
                <div className="space-y-3">
                    {sent.length === 0 ? (
                        <p className="text-center py-10 text-sm text-slate-500">No requests sent yet.</p>
                    ) : sent.map(request => (
                        <PartnerRequestCard
                            key={request.id}
                            request={request}
                            direction="sent"
                            respondingId={respondingId}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
