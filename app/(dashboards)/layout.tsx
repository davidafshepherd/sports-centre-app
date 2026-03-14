import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    return (
        <div className="flex">
            <Sidebar role="member" />
            <main>{children}</main>
        </div>
    )
}