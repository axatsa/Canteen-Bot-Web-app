import { useState, useEffect } from 'react';
import { ArrowLeft, Send, ChefHat, MessageSquare, Check, Trash2, Plus, RefreshCcw, Calendar, Truck } from 'lucide-react';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

// Localized branch names handled by t() key 'branch' + id

type ChefViewProps = {
  order: Order;
  onUpdateOrder: (order: Order) => void;
  onBackToRoles: () => void;
  branch: Branch;
  onRefresh?: () => void;
  isFromBot?: boolean;
  chefTab?: 'order' | 'delivery';
  onSetChefTab?: (tab: 'order' | 'delivery') => void;
};

export function ChefView({ order, onUpdateOrder, onBackToRoles, branch, onRefresh, isFromBot, chefTab, onSetChefTab }: ChefViewProps) {
  const { t } = useLanguage();
  const [localProducts, setLocalProducts] = useState(order.products);
  const [customProductName, setCustomProductName] = useState('');

  // Синхронизация localProducts при изменении order.products
  useEffect(() => {
    setLocalProducts(order.products);
  }, [order.products]);

  const handleUpdateProduct = (productId: string, field: string, value: any) => {
    setLocalProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const handleAddCustomProduct = () => {
    if (!customProductName.trim()) return;
    const newProduct = {
      id: 'custom_' + Date.now().toString(),
      name: customProductName.trim(),
      category: 'Дополнительные товары',
      unit: 'шт', // по умолчанию
      quantity: 1, // ставим 1 по умолчанию для удобства
    };
    setLocalProducts(prev => [...prev, newProduct]);
    setCustomProductName('');
  };

  const handleSend = () => {
    if (order.status === 'sent_to_chef') {
      // Валидация: проверяем, что хотя бы один продукт имеет quantity > 0
      const hasProducts = localProducts.some(p => p.quantity > 0);
      if (!hasProducts) {
        alert(t('alertNoProducts'));
        return;
      }

      onUpdateOrder({
        ...order,
        products: localProducts,
        status: 'review_snabjenec',
      });
      alert(t('alertSentToChef')); // 'alertSentToChef' text is now 'Готово!' maybe we shouldn't worry about alert name
      // Reset to new order? App component handles this by creating new currenOrder
    } else if (order.status === 'chef_checking') {
      onUpdateOrder({
        ...order,
        products: localProducts,
        status: 'financier_checking',
      });
      alert(t('alertCheckComplete'));
    }
  };

  const isReadOnly = order.status !== 'sent_to_chef' && order.status !== 'chef_checking';
  const isCheckingMode = order.status === 'chef_checking';

  // Group products by category
  // In checking mode, show only selected products
  const displayProducts = isCheckingMode
    ? localProducts.filter(p => p.quantity > 0)
    : localProducts;

  const categories = Array.from(new Set(displayProducts.map(p => p.category)));
  const isEmptyDelivery = isCheckingMode && displayProducts.length === 0 && order.id === 'empty';

  return (
    <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
      <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#8B0000' }}>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            {/* Toggle Button for Chef */}
            {onSetChefTab && (
              <button
                onClick={() => onSetChefTab(chefTab === 'order' ? 'delivery' : 'order')}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors mr-2"
              >
                {chefTab === 'order' ? <Truck className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            )}

            <ChefHat className="w-4 h-4" />
            <h1 className="text-lg font-bold">{chefTab === 'delivery' ? 'Приёмка' : t('chefTitle')}</h1>
          </div>
          {onRefresh ? (
            <button
              onClick={onRefresh}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-white/80 text-[10px] uppercase font-semibold">{t('branch')}: {t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}</p>

            <h2 className="text-xl font-bold italic tracking-tight leading-none">
              {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                day: 'numeric',
                month: 'short'
              })}
            </h2>
            {order.estimatedDeliveryDate && (
              <p className="text-white/90 text-xs font-bold mt-1 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg w-fit">
                <Calendar className="w-3 h-3" />
                {t('estimatedDelivery')}: {order.estimatedDeliveryDate.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            )}
          </div>
          <StatusBadge status={order.status} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 -mt-2 pb-[180px]">
        {isEmptyDelivery ? (
          <div className="flex flex-col items-center justify-center p-8 h-full text-center text-gray-500">
            <Truck className="w-16 h-16 mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">На данный момент поставок нет</h2>
            <p>Когда поставщик привезет товары, они появятся здесь.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryProducts = displayProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 pl-2 border-l-4" style={{ borderColor: '#8B0000' }}>
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryProducts.map(product => (
                      <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 transition-all active:scale-[0.98]">
                        <div className="flex items-start justify-between gap-3">
                          {isCheckingMode && (
                            <button
                              onClick={() => handleUpdateProduct(product.id, 'checked', !product.checked)}
                              className={`mt-1 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${product.checked
                                ? 'bg-[#8B0000] border-[#8B0000] text-white'
                                : 'bg-white border-gray-200 text-transparent'
                                }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex-1">
                            <h4 className={`font-bold text-gray-900 text-lg leading-tight mb-1 ${isCheckingMode && product.checked ? 'text-gray-400 line-through' : ''}`}>
                              {product.name}
                            </h4>
                            {isCheckingMode && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {product.price && (
                                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                    {t('price')}: {product.price.toLocaleString()} {t('sum')}
                                  </span>
                                )}
                                {product.comment && (
                                  <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100 w-full">
                                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                    <p><b>{t('supplier')}:</b> {product.comment}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {isCheckingMode && (
                              <textarea
                                placeholder={t('deliveryComment')}
                                value={product.chefComment || ''}
                                onChange={(e) => handleUpdateProduct(product.id, 'chefComment', e.target.value)}
                                rows={1}
                                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm mt-2 focus:ring-1 focus:ring-[#8B0000] transition-all resize-none"
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                value={product.quantity || ''}
                                onChange={(e) => handleUpdateProduct(product.id, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
                                placeholder="0"
                                disabled={isReadOnly || isCheckingMode}
                                className="w-20 bg-gray-50 border-none rounded-2xl px-2 py-2 text-center font-bold text-lg disabled:opacity-50"
                                style={{ outlineColor: '#8B0000' }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {product.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {!isCheckingMode && !isReadOnly && (
              <div className="mt-8 mb-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 opacity-95">
                <h3 className="text-md font-bold text-gray-800 mb-3 pl-2 border-l-4" style={{ borderColor: '#8B0000' }}>
                  Нет в списке? Добавьте:
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="Название нового товара..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:outline-none transition-all"
                    style={{ focusRingColor: '#8B0000' }}
                  />
                  <button 
                    onClick={handleAddCustomProduct}
                    disabled={!customProductName.trim()}
                    className="bg-[#8B0000] text-white px-4 py-3 rounded-2xl shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Action bar and info summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-4 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">{t('positions')}:</span>
            <span className="text-2xl font-black text-gray-900 leading-none">
              {localProducts.filter(p => p.quantity > 0).length}
            </span>
          </div>
        </div>

        <div className="flex-none">
          {!isReadOnly && (
            <button
              onClick={handleSend}
              className="bg-[#8B0000] text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:opacity-90"
            >
              <Send className="w-4 h-4" />
              {order.status === 'sent_to_chef' ? t('send') : t('finishCheck')}
            </button>
          )}
          {isReadOnly && (
            <div className="px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
              <p className="text-gray-500 text-xs font-bold">{t('readOnly')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
