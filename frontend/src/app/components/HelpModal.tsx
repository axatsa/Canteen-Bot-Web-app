import { X } from 'lucide-react';

type HelpItem = {
    label: string;
    items: string[];
};

type HelpModalProps = {
    title: string;
    color: string;
    sections: HelpItem[];
    onClose: () => void;
};

export function HelpModal({ title, color, sections, onClose }: HelpModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex items-center justify-between text-white" style={{ backgroundColor: color }}>
                    <h2 className="font-bold text-lg">{title}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {sections.map((section, i) => (
                        <div key={i}>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{section.label}</p>
                            <ul className="space-y-1.5">
                                {section.items.map((item, j) => (
                                    <li key={j} className="text-sm text-gray-700 flex gap-2">
                                        <span className="mt-0.5 shrink-0">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
