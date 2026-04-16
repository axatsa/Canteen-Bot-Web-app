import { MapPin, ArrowLeft, Truck, Check, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import type { Branch } from '@/lib/api';
import thompsonLogo from '@/assets/logo.png';

type BranchSelectorProps = {
  onSelectBranch: (branch: Branch) => void;
  onCheckDeliveries: () => void;
  deliveryBranches?: Branch[];
  onBack?: () => void;
  onRefresh?: () => void;
  isFromBot?: boolean;
};

const branches: { id: Branch; name: string; color: string }[] = [
  { id: 'chilanzar', name: 'Чиланзар (Новза)', color: 'from-[#9b59b6] to-[#8e44ad]' },
  { id: 'uchtepa', name: 'Учтепа', color: 'from-[#3498db] to-[#2980b9]' },
  { id: 'shayzantaur', name: 'Шайхантаур', color: 'from-[#e74c3c] to-[#c0392b]' },
  { id: 'olmazar', name: 'Олмазар', color: 'from-[#16a085] to-[#138d75]' },
];

export function BranchSelector({ onSelectBranch, onCheckDeliveries, deliveryBranches = [], onBack, onRefresh, isFromBot }: BranchSelectorProps) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white flex flex-col p-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-6 z-10 relative">
        {(onBack && !isFromBot) ? (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
        ) : <div className="w-10" />}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full active:scale-90 transition-all shadow-sm border border-gray-100"
          >
            <RefreshCcw className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img
              src={thompsonLogo}
              alt="Thompson International School"
              className="h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {t('selectBranch')}
          </h1>
          <p className="text-gray-500 text-center mb-10 font-medium">
            {t('selectBranchDesc')}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => onCheckDeliveries()}
              className="w-full bg-orange-50 rounded-3xl p-6 shadow-sm active:scale-95 transition-all border border-orange-100 hover:bg-orange-100/50 mb-6 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold text-orange-900 leading-tight">{t('checkDeliveries')}</h2>
                  <p className="text-orange-600/70 text-sm font-medium mt-1">{t('checkDeliveriesDesc')}</p>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-px bg-gray-100 flex-1" />
              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{t('orSelectBranch')}</span>
              <div className="h-px bg-gray-100 flex-1" />
            </div>

            {branches.map(branch => {
              const hasDelivery = deliveryBranches.includes(branch.id);
              return (
                <button
                  key={branch.id}
                  onClick={() => onSelectBranch(branch.id)}
                  className={`w-full bg-gray-50 rounded-3xl p-6 shadow-sm active:scale-95 transition-all border border-gray-100 hover:bg-gray-100/50 ${hasDelivery ? 'border-green-200' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${branch.color} rounded-2xl flex items-center justify-center shadow-lg relative`}>
                      <MapPin className="w-8 h-8 text-white" />
                      {hasDelivery && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="text-xl font-bold text-gray-900">{t(`branch${branch.id.charAt(0).toUpperCase() + branch.id.slice(1)}` as any)}</h2>
                      {hasDelivery && (
                        <p className="text-green-600 text-[10px] font-bold uppercase tracking-tight mt-1 flex items-center gap-1">
                          {t('hasDelivery')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

