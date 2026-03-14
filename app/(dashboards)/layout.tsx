import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    return (
        <div>
            <Header />
            <div className="flex">
                <Sidebar role="member" />
                <main>{children}</main>
            </div>
        </div>
    )
}