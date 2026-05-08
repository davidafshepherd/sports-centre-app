'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, UserSearch } from 'lucide-react';

import { useAuth } from '@/providers/AuthProvider';
import { searchPartnerProfiles } from '@/lib/partners';
import { SPORTS, AVAILABILITY_OPTIONS } from '@/types/partnerProfile';
import type { PartnerProfile } from '@/types/partnerProfile';
import SendRequestModal from './SendRequestModal';

const selectCls = 'flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent cursor-pointer';

export default function FindPartnersTab() {
    const { user, userProfile } = useAuth();

    const [profiles, setProfiles] = useState<PartnerProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [sportFilter, setSportFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [requestTarget, setRequestTarget] = useState<PartnerProfile | null>(null);
    const [sentUids, setSentUids] = useState<Set<string>>(new Set());

    const search = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const results = await searchPartnerProfiles(
            user.uid,
            sportFilter || undefined,
            levelFilter || undefined,
        );
        setProfiles(results);
        setLoading(false);
    }, [user, sportFilter, levelFilter]);

    useEffect(() => { search(); }, [search]);

    const senderName = `${userProfile?.firstName ?? ''} ${userProfile?.lastName ?? ''}`.trim();

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <select
                    value={sportFilter}
                    onChange={e => setSportFilter(e.target.value)}
                    className={selectCls}
                >
                    <option value="">All sports</option>
                    {SPORTS.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                    ))}
                </select>
                <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className={selectCls}
                >
                    <option value="">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-200 rounded-xl" />
                    ))}
                </div>
            ) : profiles.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <UserSearch className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium text-slate-700">No partners found.</p>
                    <p className="text-sm mt-1">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {profiles.map(profile => (
                        <div key={profile.uid} className="bg-white rounded-xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">{profile.displayName}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {profile.sport} · <span className="capitalize">{profile.skillLevel}</span>
                                    </p>
                                    {profile.bio && (
                                        <p className="text-sm text-slate-600 mt-1">{profile.bio}</p>
                                    )}
                                    {profile.availability.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {profile.availability.slice(0, 5).map(slotValue => {
                                                const label = AVAILABILITY_OPTIONS.find(o => o.value === slotValue)?.label ?? slotValue;
                                                return (
                                                    <span key={slotValue} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                            {profile.availability.length > 5 && (
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                    +{profile.availability.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setRequestTarget(profile)}
                                    disabled={sentUids.has(profile.uid)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-60 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    {sentUids.has(profile.uid) ? 'Sent' : 'Connect'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {requestTarget && user && (
                <SendRequestModal
                    target={requestTarget}
                    sport={requestTarget.sport}
                    senderId={user.uid}
                    senderName={senderName}
                    onClose={() => setRequestTarget(null)}
                    onDone={() => {
                        setSentUids(prev => new Set(prev).add(requestTarget.uid));
                        setRequestTarget(null);
                    }}
                />
            )}
        </div>
    );
}
