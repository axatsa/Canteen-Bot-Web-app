import type { Order, Branch } from '@/lib/api';
import { FinancierListView } from './financier/FinancierListView';
import { FinancierDetailView } from './financier/FinancierDetailView';

type FinancierViewProps =
  | {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
  }
  | {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
    isFromBot?: boolean;
  };
export function FinancierView(props: FinancierViewProps) {
  // Если передан массив заявок - показываем список
  if ('orders' in props) {
    return <FinancierListView {...props} />;
  }

  // Если передан один заказ - показываем детали
  return <FinancierDetailView {...props} />;
}
