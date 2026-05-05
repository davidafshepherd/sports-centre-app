'use client';

// Shape of a single tab
interface Tab {
    id: string;
    label: string;
    count?: number;
}

// Shape of component's props
interface Props {
    tabs: Tab[];
    active: string;
    onChange: (id: string) => void;
}

export default function BookingTabs({ tabs, active, onChange }: Props) {
    return (
        <div className="flex gap-1 border-b border-slate-200 mb-5">
            {/* Tab buttons */}
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    className={[
                        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                        active === tab.id ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                    onClick={() => onChange(tab.id)}
                >
                    {/* Tab label */}
                    {tab.label}
                    {/* Count badge */}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1.5 bg-sky-100 text-sky-700 text-xs px-1.5 py-0.5 rounded-full">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
