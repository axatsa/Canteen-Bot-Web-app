import { useState, useEffect, useRef } from 'react';
import { Send, ChefHat, Plus, RefreshCcw, Calendar, HelpCircle, Minus } from 'lucide-react';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { HelpModal } from '@/app/components/HelpModal';
import { useLanguage } from '@/app/context/LanguageContext';

type ChefViewProps = {
  order: Order;
  onUpdateOrder: (order: Order) => void;
  onBackToRoles: () => void;
  branch: Branch;
  onRefresh?: () => void;
  isFromBot?: boolean;
};

function Stepper({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const toDisplay = (n: number) => n === 0 ? '' : String(n).replace('.', ',');
  const [display, setDisplay] = useState(() => toDisplay(value));
  const focused = useRef(false);
  const prevExternal = useRef(value);

  useEffect(() => {
    if (!focused.current && value !== prevExternal.current) {
      prevExternal.current = value;
      setDisplay(toDisplay(value));
    }
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focused.current = true;
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9.,]/g, '');
    if ((raw.match(/[.,]/g) || []).length > 1) return;
    setDisplay(raw);
    const normalized = raw.replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && !normalized.endsWith('.')) {
      const clamped = Math.max(0, num);
      prevExternal.current = clamped;
      onChange(clamped);
    } else if (raw === '') {
      prevExternal.current = 0;
      onChange(0);
    }
  };

  const handleBlur = () => {
    focused.current = false;
    const normalized = display.replace(',', '.');
    const num = parseFloat(normalized);
    if (isNaN(num) || display === '') {
      prevExternal.current = 0;
      onChange(0);
      setDisplay('');
    } else {
      const clamped = Math.max(0, num);
      prevExternal.current = clamped;
      onChange(clamped);
      setDisplay(toDisplay(clamped));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          const newVal = Math.max(0, Math.round((value - 0.1) * 10) / 10);
          onChange(newVal);
        }}
        disabled={disabled || value <= 0}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200 disabled:opacity-30 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="0"
        className="w-16 text-center font-black text-xl text-gray-900 tabular-nums leading-none bg-transparent border-b-2 border-transparent focus:border-[#8B0000] focus:outline-none placeholder-gray-300 rounded-none"
      />
      <button
        type="button"
        onClick={() => {
          const newVal = Math.round((value + 0.1) * 10) / 10;
          onChange(newVal);
        }}
        disabled={disabled}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#8B0000] text-white active:opacity-80 disabled:opacity-30 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ChefView({ order, onUpdateOrder, onBackToRoles: _onBackToRoles, branch, onRefresh, isFromBot: _isFromBot }: ChefViewProps) {
  const { t } = useLanguage();
  const [localProducts, setLocalProducts] = useState(order.products);
  const [customProductName, setCustomProductName] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'meat' | 'products'>('products');

  useEffect(() => {
    setLocalProducts(order.products);
  }, [order.products]);

  const handleUpdateProduct = (productId: string, field: string, value: any) => {
    setLocalProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, [field]: value } : p)
    );
  };

  const handleAddCustomProduct = () => {
    if (!customProductName.trim()) return;
    const newProduct = {
      id: 'custom_' + Date.now().toString(),
      name: customProductName.trim(),
      category: 'Дополнительные товары',
      unit: 'шт',
      quantity: 1,
    };
    setLocalProducts(prev => [...prev, newProduct]);
    setCustomProductName('');
  };

  const getMeatProducts = () => localProducts.filter(p => p.category === '🥩 Мясо');
  const getNonMeatProducts = () => localProducts.filter(p => p.category !== '🥩 Мясо');

  const handleSend = () => {
    const productsToSend = activeTab === 'meat' ? getMeatProducts() : getNonMeatProducts();
    const hasProducts = productsToSend.some(p => p.quantity > 0);
    if (!hasProducts) {
      alert(t('alertNoProducts'));
      return;
    }
    const productsWithQuantity = productsToSend.filter(p => p.quantity > 0);
    onUpdateOrder({
      ...order,
      products: productsWithQuantity,
      status: 'review_snabjenec'
    });
    alert(t('alertSentToChef'));
  };

  const isReadOnly = order.status !== 'sent_to_chef';

  const productsToDisplay = activeTab === 'meat' ? getMeatProducts() : getNonMeatProducts();
  const categories = Array.from(new Set(productsToDisplay.map(p => p.category)));
  const selectedCount = productsToDisplay.filter(p => p.quantity > 0).length;

  const totalPrice = productsToDisplay.reduce((sum, p) => {
    const price = p.price || p.lastPrice || 0;
    return sum + (price * (p.quantity || 0));
  }, 0);

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">

        {/* Header */}
        <header
          className="flex-none text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg"
          style={{ backgroundColor: '#8B0000' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 opacity-80" />
                <h1 className="text-base font-bold">{t('chefTitle')}</h1>
              </div>
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

          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider mb-1">
                {t('branch')}: {t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}
              </p>
              <h2 className="text-2xl font-black tracking-tight leading-none">
                {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </h2>
              {order.estimatedDeliveryDate && (
                <p className="text-white/80 text-xs font-semibold mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t('estimatedDelivery')}: {order.estimatedDeliveryDate.toLocaleDateString(
                    t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU',
                    { day: 'numeric', month: 'long' }
                  )}
                </p>
              )}
            </div>
            <StatusBadge status={order.status} />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex-none bg-white border-b border-gray-100 px-4 pt-3 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'products'
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🥬 Продукты
          </button>
          <button
            onClick={() => setActiveTab('meat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'meat'
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🥩 Мясо
          </button>
        </div>

        {/* Product list */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[140px]">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryProducts = localProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryProducts.map(product => {
                      const isSelected = product.quantity > 0;
                      return (
                        <div
                          key={product.id}
                          className={`bg-white rounded-2xl border transition-all ${
                            isSelected ? 'border-[#8B0000]/20 shadow-sm' : 'border-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between px-4 py-3 gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm leading-tight ${
                                isSelected ? 'text-gray-900' : 'text-gray-500'
                              }`}>
                                {product.name}
                              </h4>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Stepper
                                value={product.quantity || 0}
                                onChange={(v) => handleUpdateProduct(product.id, 'quantity', v)}
                                disabled={isReadOnly}
                              />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                {product.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Add custom product */}
            {!isReadOnly && (
              <div className="mt-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">
                  Добавить позицию
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-2">
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomProduct()}
                    placeholder="Название товара..."
                    className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm border-none focus:ring-1 focus:outline-none focus:ring-[#8B0000] transition-all"
                  />
                  <button
                    onClick={handleAddCustomProduct}
                    disabled={!customProductName.trim()}
                    className="w-11 h-11 flex items-center justify-center bg-[#8B0000] text-white rounded-xl shadow active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('positions')}</p>
              <p className="text-3xl font-black text-gray-900 leading-none tabular-nums">{selectedCount}</p>
              {totalPrice > 0 && (
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  {(totalPrice / 1000000).toLocaleString('ru-RU')} млн
                </p>
              )}
            </div>

            {!isReadOnly ? (
              <button
                onClick={handleSend}
                className="bg-[#8B0000] text-white font-bold py-3.5 px-7 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                {t('send')}
              </button>
            ) : (
              <div className="px-4 py-2.5 bg-gray-100 rounded-xl">
                <p className="text-gray-400 text-xs font-bold">{t('readOnly')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showHelp && (
        <HelpModal
          title="Шеф-повар"
          color="#8B0000"
          onClose={() => setShowHelp(false)}
          sections={[
            {
              label: 'Что делать',
              items: [
                'Нажать + чтобы добавить количество нужного продукта',
                'При необходимости добавить свой продукт',
                'Нажать «Отправить» — список уйдёт снабженцу',
              ],
            },
            {
              label: 'Обязательные условия',
              items: [
                'Хотя бы у одного продукта должно быть количество больше 0',
                'Нельзя отправить полностью пустой список',
              ],
            },
            {
              label: 'После получения доставки',
              items: [
                'Проверить что привезли и оставить комментарий',
                'Нажать «Завершить» для передачи финансисту',
              ],
            },
          ]}
        />
      )}
    </>
  );
}
