import { useLanguage } from '@/store/LanguageContext';
import type { Status } from '@/utils/api';

type StatusBadgeProps = {
  status: Status;
};

const statusConfig: Record<Status, { labelKey: string; color: string; bgColor: string }> = {
  sent_to_chef:                { labelKey: 'statusSentToChef',                color: '#1a237e', bgColor: '#e8eaf6' },
  review_snabjenec:            { labelKey: 'statusReviewSnabjenec',            color: '#827717', bgColor: '#f9fbe7' },
  sent_to_supplier:            { labelKey: 'statusSentToSupplier',             color: '#1a237e', bgColor: '#e8eaf6' },
  waiting_snabjenec_receive:   { labelKey: 'statusWaitingSnabjenecReceive',    color: '#006064', bgColor: '#e0f7fa' },
  sent_to_financier:           { labelKey: 'statusSentToFinancier',            color: '#1a237e', bgColor: '#e8eaf6' },
  archived:                    { labelKey: 'statusArchived',                   color: '#424242', bgColor: '#eeeeee' },
  completed:                   { labelKey: 'statusCompleted',                  color: '#388e3c', bgColor: '#e8f5e9' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status] ?? { labelKey: status, color: '#424242', bgColor: '#eeeeee' };

  return (
    <div
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {t(config.labelKey as any)}
    </div>
  );
}
