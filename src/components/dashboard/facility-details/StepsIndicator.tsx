import { Fragment } from 'react';
import { Check } from 'lucide-react';

// Steps displayed in the booking request form
const STEPS = [
    { label: 'Describe', desc: 'Fill out below' },
    { label: 'Staff review', desc: '1-2 days' },
    { label: 'Select slot', desc: 'After approval' },
];

// Shape of component's props
interface Props {
    step: 1 | 2 | 3;    // Current step in the booking process
}

export default function StepsIndicator({ step }: Props) {
    return (
        <div className="flex items-start">
            {/* Render booking steps */}
            {STEPS.map((s, i) => {
                const num = i + 1;              // Step number
                const done = num < step;        // Wether this step has been completed
                const active = num === step;    // Wether this is the current step
                return (
                    <Fragment key={i}>
                        <div className="flex flex-col items-center">
                            {/* Step number */}
                            <div 
                                className={[
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                    done ? "bg-green-500 text-white" : active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-400",
                                ].join(" ")}
                            >
                                {done ? <Check className="w-3.5 h-3.5" /> : num}
                            </div>
                            {/* Step label */}
                            <p 
                                className={[
                                    "text-xs mt-1 text-center whitespace-nowrap",
                                    done ? "text-green-600 font-medium" : active ? "text-sky-600 font-medium" : "text-slate-400",
                                ].join(" ")}
                            >
                                {s.label}
                            </p>
                            {/* Step description */}
                            <p 
                                className={[
                                    "text-xs text-center whitespace-nowrap",
                                    active ? "text-sky-400" : "text-slate-300",
                                ].join(" ")}
                            >
                                {s.desc}
                            </p>
                        </div>
                        {/* Connector line between steps */}
                        {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2 mt-3.5" />}
                    </Fragment>
                );
            })}
        </div>
    );
}
