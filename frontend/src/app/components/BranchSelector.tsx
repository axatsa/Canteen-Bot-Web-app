import { MapPin, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import type { Branch } from '@/lib/api';

type BranchSelectorProps = {
  onSelectBranch: (branch: Branch) => void;
  onBack?: () => void;
  onRefresh?: () => void;
  isFromBot?: boolean;
};

const LAND_BRANCHES: { id: Branch; color: string }[] = [
  { id: 'beltepa_land',   color: '#4caf50' },
  { id: 'uchtepa_land',   color: '#388e3c' },
  { id: 'rakat_land',     color: '#2e7d32' },
  { id: 'mukumiy_land',   color: '#66bb6a' },
  { id: 'yunusabad_land', color: '#43a047' },
  { id: 'novoi_land',     color: '#1b5e20' },
];

const SCHOOL_BRANCHES: { id: Branch; color: string }[] = [
  { id: 'novza_school',            color: '#1976d2' },
  { id: 'uchtepa_school',          color: '#1565c0' },
  { id: 'almazar_school',          color: '#0d47a1' },
  { id: 'general_uzakov_school',   color: '#2196f3' },
  { id: 'namangan_school',         color: '#42a5f5' },
  { id: 'novoi_school',            color: '#1e88e5' },
];

export function BranchSelector({ onSelectBranch, onBack, onRefresh, isFromBot }: BranchSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#8B0000] text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {!isFromBot && onBack && (
              <button
                onClick={onBack}
                className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <h1 className="text-2xl font-black tracking-tight">{t('selectBranch')}</h1>
        <p className="text-white/60 text-xs mt-1">{t('selectBranchDesc')}</p>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Садики */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">
            Садики (Land)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LAND_BRANCHES.map(b => (
              <BranchCard
                key={b.id}
                id={b.id}
                color={b.color}
                label={t(`branch${b.id.charAt(0).toUpperCase() + b.id.slice(1)}` as any)}
                onSelect={onSelectBranch}
              />
            ))}
          </div>
        </div>

        {/* Школы */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">
            Школы (School)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SCHOOL_BRANCHES.map(b => (
              <BranchCard
                key={b.id}
                id={b.id}
                color={b.color}
                label={t(`branch${b.id.charAt(0).toUpperCase() + b.id.slice(1)}` as any)}
                onSelect={onSelectBranch}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function BranchCard({ id, color, label, onSelect }: {
  id: Branch;
  color: string;
  label: string;
  onSelect: (b: Branch) => void;
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      className="bg-white rounded-2xl border border-gray-100 px-3 py-4 flex items-center gap-3 text-left active:scale-[0.97] transition-all shadow-sm"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        <MapPin className="w-4 h-4" style={{ color }} />
      </div>
      <span className="font-semibold text-sm text-gray-900 leading-tight">{label}</span>
    </button>
  );
}
