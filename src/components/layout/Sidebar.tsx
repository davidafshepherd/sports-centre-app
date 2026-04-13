import styles from './Sidebar.module.css';
import { memberLinks, staffLinks, adminLinks } from '../../lib/navigation';

interface SidebarProps {
    role: "member" | "staff" | "admin";
}

export default function Sidebar({ role }: SidebarProps) {
    return (
        <aside className={styles.sidebar}>
            {role === 'member' && <a href="/member">Sidebar</a>}
            {role === 'staff' && <a href="/staff">Staff Panel</a>}
            {role === 'admin' && <a href="/admin">Admin Panel</a>}
        </aside>
    )
}