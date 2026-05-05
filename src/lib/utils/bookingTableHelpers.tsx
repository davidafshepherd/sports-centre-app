'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

// Shape of SortHeader's props
interface SortHeaderProps {
    label: string;
    dir: SortDir;
    onToggle: () => void;
}

export function SortHeader({ label, dir, onToggle }: SortHeaderProps) {
    const Icon = dir === 'asc' ? ArrowUp : ArrowDown;
    return (
        <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-sky-600 hover:text-sky-700 transition-colors cursor-pointer min-w-0 overflow-hidden"
        >
            <span className="truncate min-w-0">{label}</span>
            <Icon className="w-3 h-3 shrink-0" />
        </button>
    );
}

// Shape of ResizeHandle's props
interface ResizeHandleProps {
    onMouseDown: (e: React.MouseEvent) => void;
}

export function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
    return (
        <div
            className="absolute right-0 top-1 bottom-1 w-3 flex items-center justify-center cursor-col-resize z-10 group/rh"
            onMouseDown={e => { e.preventDefault(); onMouseDown(e); }}
        >
            <div className="w-0.5 h-full rounded-full bg-slate-300 group-hover/rh:bg-sky-500 group-hover/rh:w-1 transition-all duration-100" />
        </div>
    );
}

/**
 * Returns a drag-to-resize handler for a table's column widths.
 * @param setWidths State setter for the column widths record.
 * @returns Handler function that starts a resize drag on a given column.
 */
export function makeResizer<T extends Record<string, number>>(
    setWidths: React.Dispatch<React.SetStateAction<T>>,
) {
    return (col: keyof T & string, startX: number, startWidth: number) => {
        function onMove(e: MouseEvent) {
            setWidths(prev => ({ ...prev, [col]: Math.max(80, startWidth + e.clientX - startX) }));
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
}
