import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

import { ChefView } from '@/app/components/ChefView';
import { FinancierView } from '@/app/components/FinancierView';
import { SupplierView } from '@/app/components/SupplierView';
import { SnabjenecView } from '@/app/components/SnabjenecView';
import { RoleSelector } from '@/app/components/RoleSelector';
import { BranchSelector } from '@/app/components/BranchSelector';
import { LanguageProvider, useLanguage } from '@/app/context/LanguageContext';

import { api } from '@/lib/api';
import type { Order, Product, Status, Branch, Role } from '@/lib/api';

export { getTashkentDate };
function getTashkentDate(): Date {
  const now = new Date();
  const tashkentOffset = 5 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (tashkentOffset * 60000));
}

export default function App() {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Добавляем флаг "из бота"
  const [isFromBot, setIsFromBot] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    // Detect role and branch from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') as Role | null;
    const branch = urlParams.get('branch') as Branch | 'all' | null;
    const fio = urlParams.get('fio');
    const isTest = urlParams.get('isTest') === 'true';

    if (role) {
      console.log('🔗 Detected role from URL:', role);
      setSelectedRole(role);
      setIsFromBot(true);
    }
    if (branch && branch !== 'all') {
      console.log('🔗 Detected branch from URL:', branch);
      setSelectedBranch(branch as Branch);
    }
    if (fio) {
      setUserName(fio);
    }
    if (isTest) {
      setIsTestMode(true);
    }
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const loadInitialData = async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getProducts()
      ]);

      setOrders(ordersData);
      setMasterProducts(productsData);
      setIsLoadingProducts(false);
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      alert('[V2.1] Ошибка при загрузке продуктов с сервера! Проверьте, что сервер (' + api.API_URL + ') работает. Ошибка: ' + error.message);
      setIsLoadingProducts(false); // Stop loading even on error
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Polling disabled to prevent data reset while editing
    // const interval = setInterval(() => {
    //   loadOrders();
    // }, 5000);

    // return () => {
    //   clearInterval(interval);
    // };
  }, []);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [chefTab, setChefTab] = useState<'order' | 'delivery'>('order');

  const saveOrder = async (updatedOrder: Order) => {
    // 1. Optimistic Update (Update local state immediately)
    setOrders(prev => {
      const existing = prev.find(o => o.id === updatedOrder.id);
      if (existing) {
        return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
      }
      return [...prev, updatedOrder];
    });

    // Close detail view if open
    // Close detail view if open
    setSelectedOrderId(null);

    // Only reset branch if role is NOT chef (chef should stay on the same branch view)
    if (selectedRole !== 'chef') {
      setSelectedBranch(null);
    }

    // 2. Send to local API
    try {
      await api.upsertOrder(updatedOrder);
      console.log('✅ Order saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving order:', error);
      alert(`Ошибка сохранения! Данные не отправлены.\nОшибка: ${error.message}`);
      loadOrders(); // Reload actual data to revert
    }
  };

  const handleBackToStart = () => {
    if (!isFromBot && !isTestMode) {
      setSelectedRole(null);
      setSelectedBranch(null);
      setSelectedOrderId(null);
    }
  };

  // Если открыли НЕ через бота и нет выбранной роли - показываем сообщение об ошибке (или селектор, если хотим оставить)
  // Но пользователь сказал "в мини апп это можно убрать", так что сделаем заглушку
  if (!selectedRole && isFromBot) {
    return (
      <div className="h-screen flex items-center justify-center p-8 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Доступ ограничен</h1>
          <p className="text-gray-500">Пожалуйста, откройте приложение через меню вашего Telegram бота.</p>
        </div>
      </div>
    );
  }

  // Если роль не выбрана (и мы не в режиме "из бота"), показываем выбор роли
  if (!selectedRole) {
    return (
      <RoleSelector
        onSelectRole={setSelectedRole}
        onBack={() => { }}
      />
    );
  }

  // Если выбрали финансиста - сразу показываем список заявок
  if (selectedRole === 'financier') {
    const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

    if (selectedOrder) {
      return (
        <FinancierView
          order={selectedOrder}
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedOrderId(null)}
          branch={selectedOrder.branch}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
        />
      );
    }

    return (
      <FinancierView
        orders={orders}
        onSelectOrder={setSelectedOrderId}
        onBackToRoles={handleBackToStart}
        onRefresh={loadOrders}
        isFromBot={isFromBot}
      />
    );
  }

  // Для поставщика тоже сразу показываем список заявок (без выбора филиала)
  if (selectedRole === 'supplier') {
    const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

    if (selectedOrder) {
      return (
        <SupplierView
          order={selectedOrder}
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedOrderId(null)}
          branch={selectedOrder.branch}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
        />
      );
    }

    return (
      <SupplierView
        orders={orders}
        onSelectOrder={setSelectedOrderId}
        onBackToRoles={handleBackToStart}
        onRefresh={loadOrders}
        isFromBot={isFromBot}
      />
    );
  }

  // Для снабженца
  if (selectedRole === 'snabjenec') {
    const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

    if (selectedOrder) {
      return (
        <SnabjenecView
          order={selectedOrder}
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedOrderId(null)}
          branch={selectedOrder.branch}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
        />
      );
    }

    return (
      <SnabjenecView
        orders={orders}
        onSelectOrder={setSelectedOrderId}
        onBackToRoles={handleBackToStart}
        onRefresh={loadOrders}
        isFromBot={isFromBot}
      />
    );
  }

  const handleCheckDeliveries = () => {
    const deliveryOrders = orders.filter(o => o.status === 'chef_checking');
    if (deliveryOrders.length > 0) {
      // For now, if there are multiple, we could show a list, 
      // but let's just pick the first one and set the branch to open it
      const firstDelivery = deliveryOrders[0];
      setSelectedBranch(firstDelivery.branch);
    } else {
      alert(t('alertNoDeliveries'));
      loadOrders(); // Попробуем обновить данные
    }
  };

  // Только для шеф-повара выбираем филиал
  if (!selectedBranch) {
    const deliveryBranches = Array.from(new Set(orders.filter(o => o.status === 'chef_checking').map(o => o.branch)));

    return (
      <BranchSelector
        onSelectBranch={setSelectedBranch}
        onCheckDeliveries={handleCheckDeliveries}
        deliveryBranches={deliveryBranches}
        onBack={() => setSelectedRole(null)}
        onRefresh={loadOrders}
        isFromBot={isFromBot}
      />
    );
  }


  let currentOrder: Order | undefined;

  if (selectedRole === 'chef') {
    if (chefTab === 'order') {
      currentOrder = orders.find(o => o.branch === selectedBranch && o.status === 'sent_to_chef');

      if (!currentOrder) {
        // ВАЖНО: Проверяем, что продукты уже загрузились из API
        if (isLoadingProducts) {
          // Показываем загрузку, пока продукты не загрузятся
          return (
            <div className="h-screen flex items-center justify-center bg-[#f5f5f5]">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Загрузка продуктов...</p>
              </div>
            </div>
          );
        }

        // Создаем новую заявку с базовым списком продуктов из БД
        const baseProducts = masterProducts.map((p) => ({
          ...p,
          quantity: 0,
          price: undefined,
          comment: undefined
        }));

        currentOrder = {
          id: Date.now().toString(),
          status: 'sent_to_chef',
          createdAt: getTashkentDate(),
          branch: selectedBranch!,
          products: baseProducts,
        };
      }
    } else {
      // delivery tab
      currentOrder = orders.find(o => o.branch === selectedBranch && o.status === 'chef_checking');
    }
  }

  const handleBack = () => {
    setSelectedBranch(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {selectedRole === 'chef' && currentOrder ? (
        <ChefView
          order={currentOrder}
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedBranch(null)}
          branch={selectedBranch!}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
          chefTab={chefTab}
          onSetChefTab={setChefTab}
        />
      ) : selectedRole === 'chef' && !currentOrder && chefTab === 'delivery' ? (
        <ChefView
          order={
            // Dummy empty order for "No deliveries" state
            { id: 'empty', status: 'chef_checking', branch: selectedBranch!, products: [], createdAt: new Date() }
          }
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedBranch(null)}
          branch={selectedBranch!}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
          chefTab={chefTab}
          onSetChefTab={setChefTab}
        />
      ) : null}
      {isTestMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-white/20 flex items-center gap-3 text-xs font-semibold">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{userName || 'Test User'}</span>
            <span className="opacity-40">|</span>
            <span className="uppercase">{selectedRole}</span>
            <span className="opacity-40">|</span>
            <span className="capitalize">{String(selectedBranch)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

