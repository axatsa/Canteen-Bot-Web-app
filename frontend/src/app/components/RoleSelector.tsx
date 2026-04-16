import type { Role } from '@/lib/api';
import logo from '@/assets/logo.png';
import { useLanguage } from '@/app/context/LanguageContext';
import { ChefHat, Wallet, Truck } from 'lucide-react';

type RoleSelectorProps = {
  onSelectRole: (role: Role) => void;
  onBack: () => void;
};

export function RoleSelector({ onSelectRole, onBack }: RoleSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center z-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-36 h-36 flex items-center justify-center">
              <img src={logo} alt="Thompson Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {t('appTitle')}
          </h1>
          <p className="text-gray-500 text-center mb-10 font-medium">
            {t('selectRole')}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => onSelectRole('chef')}
              className="w-full bg-gray-50 rounded-3xl p-6 shadow-sm active:scale-95 transition-all border border-gray-100 hover:bg-gray-100/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #8B0000, #A52A2A)' }}>
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold text-gray-900">{t('chef')}</h2>
                  <p className="text-sm text-gray-500">{t('chefDesc')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectRole('financier')}
              className="w-full bg-gray-50 rounded-3xl p-6 shadow-sm active:scale-95 transition-all border border-gray-100 hover:bg-gray-100/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #003366, #004080)' }}>
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold text-gray-900">{t('financier')}</h2>
                  <p className="text-sm text-gray-500">{t('financierDesc')}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectRole('supplier')}
              className="w-full bg-gray-50 rounded-3xl p-6 shadow-sm active:scale-95 transition-all border border-gray-100 hover:bg-gray-100/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #FF6B00, #FF8C00)' }}>
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-bold text-gray-900">{t('supplier')}</h2>
                  <p className="text-sm text-gray-500">{t('supplierDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}

