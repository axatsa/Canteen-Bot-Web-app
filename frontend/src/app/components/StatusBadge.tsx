import { useLanguage } from '@/app/context/LanguageContext';
import type { Status } from '@/lib/api';

type StatusBadgeProps = {
  status: Status;
};

const statusConfig: Record<Status, { labelKey: string; color: string; bgColor: string }> = {
  sent_to_chef: { labelKey: 'statusSentToChef', color: '#1a237e', bgColor: '#e8eaf6' },
  sent_to_financier: { labelKey: 'statusSentToFinancier', color: '#1a237e', bgColor: '#e8eaf6' },
  sent_to_supplier: { labelKey: 'statusSentToSupplier', color: '#1a237e', bgColor: '#e8eaf6' },
  supplier_collecting: { labelKey: 'statusSupplierCollecting', color: '#f57c00', bgColor: '#fff3e0' },
  supplier_delivering: { labelKey: 'statusSupplierDelivering', color: '#f57c00', bgColor: '#fff3e0' },
  chef_checking: { labelKey: 'statusChefChecking', color: '#d32f2f', bgColor: '#ffebee' },
  financier_checking: { labelKey: 'statusFinancierChecking', color: '#388e3c', bgColor: '#e8f5e9' },
  completed: { labelKey: 'statusCompleted', color: '#388e3c', bgColor: '#e8f5e9' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status];

  return (
    <div
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{
        backgroundColor: config.bgColor,
        color: config.color
      }}
    >
      {t(config.labelKey as any)}
    </div>
  );
}
