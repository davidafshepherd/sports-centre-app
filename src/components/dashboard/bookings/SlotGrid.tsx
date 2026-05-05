'use client';

import { formatSlot } from '@/lib/utils/date';

// Shape of component's props
interface Props {
    slots: number[];
    booked: number[];
    selected: number;
    loading: boolean;
    onSelect: (slot: number) => void;
    slotDurationMins?: number;
}

export default function SlotGrid({ slots, booked, selected, loading, onSelect, slotDurationMins = 60 }: Props) {
    return (
        <div>
            {/* Header */}
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Slot {loading && <span className="text-slate-400 font-normal">(loading…)</span>}
            </label>
            {/* Slot buttons */}
            <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => {
                    const isBooked = booked.includes(slot); // Whether this slot is unavailable
                    const isSel = selected === slot;        // Whether this slot is the currently selected one
                    return (
                        <button 
                            key={slot} 
                            className={[
                                "py-1.5 text-xs rounded-lg border font-medium transition-colors",
                                isBooked ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50" : isSel ? "bg-sky-600 text-white border-sky-600 cursor-pointer" : "bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50 cursor-pointer",
                            ].join(' ')}
                            type="button" 
                            disabled={isBooked}
                            onClick={() => onSelect(slot)}
                        >
                            {formatSlot(slot, slotDurationMins).split('-')[0].trim()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
