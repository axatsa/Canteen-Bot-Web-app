import type { Order, Branch } from '@/lib/api';
import { SnabjenecListView } from './SnabjenecListView';
import { SnabjenecDetailView } from './SnabjenecDetailView';

type SnabjenecViewProps =
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

export function SnabjenecView(props: SnabjenecViewProps) {
  if ('orders' in props) {
    return <SnabjenecListView {...props} />;
  }
  return <SnabjenecDetailView {...props} />;
}
