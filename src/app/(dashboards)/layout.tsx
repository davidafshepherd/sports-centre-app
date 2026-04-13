import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    return (
        <div>
            <Header />
            <div className="flex">
                <Sidebar role="member" />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    )
}

//TODO: next steps: create some cards in a scrolling section that will house the sports facilities, and add some basic navigation buttons to the sidebar.