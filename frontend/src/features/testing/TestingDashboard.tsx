import React, { useState } from 'react';
import { Smartphone, User, Briefcase, MapPin, Play, Loader2, RefreshCw, Sprout, GraduationCap } from 'lucide-react';
import { api } from '@/utils/api';

type Role = 'chef' | 'financier' | 'supplier' | 'snabjenec' | 'supplier_meat' | 'supplier_products';
type InstitutionType = 'land' | 'school';

interface BranchInfo {
    id: string;
    name: string;
}

interface PhoneState {
    id: number;
    fio: string;
    role: Role;
    instType: InstitutionType;
    branch: string;
    isActive: boolean;
    url: string;
    isRegistering: boolean;
    telegramId: number;
}

const ROLES: Role[] = ['chef', 'snabjenec', 'supplier_meat', 'supplier_products', 'financier', 'supplier'];

const LAND_BRANCHES: BranchInfo[] = [
    { id: 'beltepa_land', name: 'Белтепа-Land' },
    { id: 'uchtepa_land', name: 'Учтепа-Land' },
    { id: 'rakat_land', name: 'Ракат-Land' },
    { id: 'mukumiy_land', name: 'Мукумий-Land' },
    { id: 'yunusabad_land', name: 'Юнусабад-Land' },
    { id: 'novoi_land', name: 'Новои-Land' },
];

const SCHOOL_BRANCHES: BranchInfo[] = [
    { id: 'novza_school', name: 'Новза-School' },
    { id: 'uchtepa_school', name: 'Учтепа-School' },
    { id: 'almazar_school', name: 'Алмазар-School' },
    { id: 'general_uzakov_school', name: 'Генерал Узоков-School' },
    { id: 'namangan_school', name: 'Наманган-School' },
    { id: 'novoi_school', name: 'Новои-School' },
];

export default function TestingDashboard() {
    const [phones, setPhones] = useState<PhoneState[]>([
        { id: 1, fio: 'Шеф Повар', role: 'chef', instType: 'land', branch: 'beltepa_land', isActive: false, url: '', isRegistering: false, telegramId: 1001 },
        { id: 2, fio: 'Снабженец', role: 'snabjenec', instType: 'land', branch: 'all', isActive: false, url: '', isRegistering: false, telegramId: 1002 },
        { id: 3, fio: 'Мясник', role: 'supplier_meat', instType: 'land', branch: 'all', isActive: false, url: '', isRegistering: false, telegramId: 1003 },
        { id: 4, fio: 'Поставщик', role: 'supplier_products', instType: 'land', branch: 'all', isActive: false, url: '', isRegistering: false, telegramId: 1004 },
    ]);

    const handleUpdatePhone = (id: number, field: keyof PhoneState, value: any) => {
        setPhones(prev => prev.map(p => {
            if (p.id === id) {
                const newState = { ...p, [field]: value, isActive: false };
                
                // If type changes, reset branch if it's not 'all'
                if (field === 'instType' && p.branch !== 'all') {
                    const branches = value === 'land' ? LAND_BRANCHES : SCHOOL_BRANCHES;
                    newState.branch = branches[0].id;
                }
                
                // If role changes to non-chef, default branch to 'all' for easier testing 
                // but still allow overriding it later in the UI
                if (field === 'role' && value !== 'chef' && p.branch !== 'all') {
                    // newState.branch = 'all'; // Optional: auto-set to all
                }
                
                return newState;
            }
            return p;
        }));
    };

    const handleStart = async (id: number) => {
        const phone = phones.find(p => p.id === id);
        if (!phone) return;

        setPhones(prev => prev.map(p => p.id === id ? { ...p, isRegistering: true } : p));

        try {
            // First, simulate registration on backend
            await api.registerUser({
                telegram_id: phone.telegramId,
                full_name: phone.fio,
                role: phone.role,
                branch: phone.branch,
                language: 'ru'
            });

            // Then, build URL and activate iframe
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/?role=${phone.role}&branch=${phone.branch}&fio=${encodeURIComponent(phone.fio)}&user_id=${phone.telegramId}&isTest=true`;
            
            setPhones(prev => prev.map(p => 
                p.id === id ? { ...p, url, isActive: true, isRegistering: false } : p
            ));
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Ошибка имитации регистрации на бэкенде. Проверьте сеть.');
            setPhones(prev => prev.map(p => p.id === id ? { ...p, isRegistering: false } : p));
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
            <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        App Multi-Role Test Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Тестируйте все роли одновременно на одном экране</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-xl backdrop-blur-sm border border-slate-700">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Backend: Connected
                    </span>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                    >
                        Обновить всё
                    </button>
                </div>
            </header>

            <main className="max-w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                {phones.map((phone) => (
                    <div key={phone.id} className="flex flex-col gap-4">
                        {/* Phone Container */}
                        <div className="relative mx-auto w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden ring-4 ring-slate-800/50">
                            {/* iPhone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                            
                            {/* Content */}
                            <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center relative">
                                {phone.isActive ? (
                                    <iframe 
                                        src={phone.url} 
                                        className="w-full h-full border-none"
                                        title={`Role: ${phone.role}`}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center">
                                        <Smartphone size={64} className="opacity-20 translate-y-4" />
                                        <p className="text-sm font-medium">Настройте роль и нажмите Start</p>
                                    </div>
                                )}
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-400/20 rounded-full z-20"></div>
                        </div>

                        {/* Registration Form Simulation */}
                        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Imitation Login</h3>
                            <div className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="ФИО"
                                        value={phone.fio}
                                        onChange={(e) => handleUpdatePhone(phone.id, 'fio', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <select 
                                            value={phone.role}
                                            onChange={(e) => handleUpdatePhone(phone.id, 'role', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-2 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    {/* Institution Type Toggle */}
                                    <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1">
                                        <button
                                            onClick={() => handleUpdatePhone(phone.id, 'instType', 'land')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                phone.instType === 'land' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <Sprout size={12} />
                                            САДИК
                                        </button>
                                        <button
                                            onClick={() => handleUpdatePhone(phone.id, 'instType', 'school')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                phone.instType === 'school' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <GraduationCap size={12} />
                                            ШКОЛА
                                        </button>
                                    </div>

                                    {/* Branch Selection */}
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <select 
                                            value={phone.branch}
                                            onChange={(e) => handleUpdatePhone(phone.id, 'branch', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-2 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="all">Все филиалы (all)</option>
                                            {(phone.instType === 'land' ? LAND_BRANCHES : SCHOOL_BRANCHES).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleStart(phone.id)}
                                    disabled={phone.isRegistering}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                                        phone.isActive 
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-blue-900/20'
                                    } ${phone.isRegistering ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {phone.isRegistering ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Play size={16} fill="currentColor" />
                                    )}
                                    {phone.isRegistering ? 'Registering...' : phone.isActive ? 'Restart & Sync' : 'Register & Login'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            <footer className="mt-12 text-center text-slate-500 text-sm">
                Built for rapid multi-role testing • {new Date().toLocaleDateString()}
            </footer>
        </div>
    );
}
