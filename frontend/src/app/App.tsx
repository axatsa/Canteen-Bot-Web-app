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
import { FinancierDesktop } from '@/app/components/financierDesktop/FinancierDesktop';
import { SupplierView } from '@/app/components/supplier/SupplierView';
import { SnabjenecView } from '@/app/components/snabjenec/SnabjenecView';
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
        api.getOrders(selectedRole || undefined, selectedBranch || undefined, userName || undefined),
        api.getProducts(selectedBranch || undefined)
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
      const data = await api.getOrders(selectedRole || undefined, selectedBranch || undefined, userName || undefined);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  useEffect(() => {
    if (!selectedRole) return;

    loadInitialData();

    // Polling disabled to prevent data reset while editing
    // const interval = setInterval(() => {
    //   loadOrders();
    // }, 5000);

    // return () => {
    //   clearInterval(interval);
    // };
  }, [selectedRole, selectedBranch, userName]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const saveOrder = async (updatedOrder: Order) => {
    // 1. Optimistic Update (Update local state immediately)
    setOrders(prev => {
      const existing = prev.find(o => o.id === updatedOrder.id);
      if (existing) {
        return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
      }
      return [...prev, updatedOrder];
    });

    // Keep detail view open for snabjenec (they need to send to multiple suppliers)
    if (selectedRole !== 'snabjenec') {
      setSelectedOrderId(null);
    }

    // Only reset branch for financier — all other roles are branch-specific
    if (selectedRole === 'financier') {
      setSelectedBranch(null);
    }

    // 2. Send to local API — attach user's name to the correct role field
    const orderWithUser: Order = {
      ...updatedOrder,
      ...(selectedRole === 'chef' ? { chefName: userName || 'Chef' } : {}),
      ...(selectedRole === 'snabjenec' ? { snabjenecName: userName || 'Snabjenec' } : {}),
      ...(selectedRole?.startsWith('supplier') ? { supplierName: userName || 'Supplier' } : {}),
    };
    try {
      const roleForBackend = selectedRole?.startsWith('supplier') ? 'supplier' : selectedRole ?? undefined;
      const effectiveName = userName
        || orderWithUser.chefName
        || orderWithUser.snabjenecName
        || orderWithUser.supplierName
        || roleForBackend
        || 'user';
      const effectiveBranch = selectedBranch || orderWithUser.branch || undefined;
      await api.upsertOrder(orderWithUser, roleForBackend, effectiveName, effectiveBranch);
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

  if (selectedRole === 'financier') {
    return (
      <FinancierDesktop
        onBackToRoles={handleBackToStart}
        role={selectedRole}
        branch={selectedBranch || undefined}
        userName={userName || undefined}
      />
    );
  }

  // Для поставщика тоже сразу показываем список заявок (без выбора филиала)
  if (selectedRole?.startsWith('supplier')) {
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
          role={selectedRole}
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
        role={selectedRole}
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

  // Только для шеф-повара выбираем филиал
  if (!selectedBranch) {
    return (
      <BranchSelector
        onSelectBranch={setSelectedBranch}
        onBack={() => setSelectedRole(null)}
        onRefresh={loadOrders}
        isFromBot={isFromBot}
      />
    );
  }


  let currentOrder: Order | undefined;

  if (selectedRole === 'chef') {
    const draft = orders.find(o =>
      o.branch === selectedBranch &&
      o.status === 'sent_to_chef' &&
      (!o.chefName || o.chefName === userName)
    );

    if (isLoadingProducts) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#f5f5f5]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#8B0000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Загрузка продуктов...</p>
          </div>
        </div>
      );
    }

    // Always base on master list to ensure new products appear
    const baseProducts = masterProducts.map((p) => {
      // Check if this product is already in the draft
      const existing = draft?.products.find(dp => dp.id === p.id);
      return {
        ...p,
        quantity: existing?.quantity || 0,
        price: existing?.price,
        comment: existing?.comment,
        chefComment: existing?.chefComment,
      };
    });

    currentOrder = {
      id: draft?.id || Date.now().toString(),
      status: 'sent_to_chef',
      createdAt: draft?.createdAt || getTashkentDate(),
      branch: selectedBranch!,
      products: baseProducts,
    };
  }

  const handleBack = () => {
    setSelectedBranch(null);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {selectedRole === 'chef' && currentOrder && (
        <ChefView
          order={currentOrder}
          onUpdateOrder={saveOrder}
          onBackToRoles={() => setSelectedBranch(null)}
          branch={selectedBranch!}
          onRefresh={loadOrders}
          isFromBot={isFromBot}
        />
      )}
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

