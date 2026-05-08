'use client';

import { useState } from 'react';

import PartnerTabs from './PartnerTabs';
import MyProfileTab from './MyProfileTab';
import FindPartnersTab from './FindPartnersTab';
import RequestsTab from './RequestsTab';

const TABS = [
    { id: 'profile', label: 'My Profile' },
    { id: 'find', label: 'Find Partners' },
    { id: 'requests', label: 'Requests' },
];

export default function PartnersView() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <PartnerTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'profile'  && <MyProfileTab />}
            {activeTab === 'find'     && <FindPartnersTab />}
            {activeTab === 'requests' && <RequestsTab />}
        </div>
    );
}
