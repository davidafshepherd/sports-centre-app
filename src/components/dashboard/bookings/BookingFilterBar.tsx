'use client';

import { ChevronDown, Search } from 'lucide-react';

// Shape of a select filter
interface SelectConfig {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: { value: string; label: string }[];
    width?: string;  // Tailwind width class, defaults to 'w-48'
}

// Shape of a text search filter
interface SearchConfig {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

// Shape of component's props
interface Props {
    selects?: SelectConfig[];
    search?: SearchConfig;
    hasFilters: boolean;
    onClear: () => void;
}

export default function BookingFilterBar({ selects = [], search, hasFilters, onClear }: Props) {
    return (
        <div className="flex items-center gap-2 mb-4">
            {/* Select dropdowns */}
            {selects.map((s, i) => (
                <div key={i} className={`relative ${s.width ?? 'w-48'}`}>
                    {/* Select dropdown */}
                    <select
                        className="w-full appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                        value={s.value}
                        onChange={e => s.onChange(e.target.value)}
                    >
                        <option value="">{s.placeholder}</option>
                        {s.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {/* Dropdown icon */}
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
            ))}
            {/* Text searches */}
            {search && (
                <div className="relative">
                    {/* Search icon */}
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    {/* Text search */}
                    <input
                        className="pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
                        type="text"
                        placeholder={search.placeholder}
                        value={search.value}
                        onChange={e => search.onChange(e.target.value)}
                    />
                </div>
            )}
            {/* Clear button */}
            {hasFilters && (
                <button
                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    onClick={onClear}
                >
                    Clear
                </button>
            )}
        </div>
    );
}
