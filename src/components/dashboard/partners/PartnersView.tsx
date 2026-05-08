"use client"

import { useState } from "react"
import PartnerTabs from "./PartnerTabs"
import MyProfileTab from "./MyProfileTab"
import FindPartnersTab from "./FindPartnersTab"
import RequestsTab from "./RequestsTab"

// top-level tab definitions for the partners section
const TABS = [
    { id: "profile", label: "My Profile" },
    { id: "find", label: "Find Partners" },
    { id: "requests", label: "Requests" },
]

export default function PartnersView() {
    const [activeTab, setActiveTab] = useState("profile")

    return (
        <div className="max-w-2xl space-y-4">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Find Partners</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Connect with other members for your favourite sports.
                </p>
            </div>

            <PartnerTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === "profile"  && <MyProfileTab />}
            {activeTab === "find"     && <FindPartnersTab />}
            {activeTab === "requests" && <RequestsTab />}
        </div>
    )
}