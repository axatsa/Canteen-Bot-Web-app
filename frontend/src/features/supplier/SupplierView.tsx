import type { Order, Branch, Role } from '@/utils/api';
import { SupplierListView } from './SupplierListView';
import { SupplierDetailView } from './SupplierDetailView';

type SupplierViewProps =
  | {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
    role: Role;
  }
  | {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
    isFromBot?: boolean;
    role: Role;
  };

export function SupplierView(props: SupplierViewProps) {
  // If showing list of orders
  if ('orders' in props) {
    return <SupplierListView {...props} />;
  }

  // If showing details of a single order
  return <SupplierDetailView {...props} />;
}
