// Shape of component's props
interface Props {
    name: string;
}

export default function MemberAvatar({ name }: Props) {
    const parts = name.trim().split(' ');
    const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
    return (
        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
        </div>
    );
}
