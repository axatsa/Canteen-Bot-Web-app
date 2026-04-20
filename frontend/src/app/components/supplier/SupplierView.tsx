import type { Order, Branch } from '@/lib/api';
import { SupplierListView } from './supplier/SupplierListView';
import { SupplierDetailView } from './supplier/SupplierDetailView';

type SupplierViewProps =
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

export function SupplierView(props: SupplierViewProps) {
  // If showing list of orders
  if ('orders' in props) {
    return <SupplierListView {...props} />;
  }

  // If showing details of a single order
  return <SupplierDetailView {...props} />;
}
