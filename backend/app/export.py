import os
import uuid
import logging
from typing import Optional

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'exports')


def ensure_dirs():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    os.makedirs(EXPORTS_DIR, exist_ok=True)


def fill_docx_template(template_path: str, context: dict) -> Optional[str]:
    try:
        from docxtpl import DocxTemplate
    except ImportError:
        logger.error("docxtpl not installed. Run: pip install docxtpl")
        return None

    ensure_dirs()
    try:
        tpl = DocxTemplate(template_path)
        tpl.render(context)
        out_name = f"order_{context.get('order_id', uuid.uuid4())}_{uuid.uuid4().hex[:8]}.docx"
        out_path = os.path.join(EXPORTS_DIR, out_name)
        tpl.save(out_path)
        return out_path
    except Exception as e:
        logger.error(f"Error filling DOCX template: {e}")
        return None


def build_export_context(order_details: dict, names: dict = None) -> dict:
    order = order_details.get('order', {})
    delivery = order_details.get('delivery', {})
    delivered = order_details.get('delivered_items', [])
    not_delivered = order_details.get('not_delivered_items', [])
    extra = order_details.get('extra_items', [])

    created_at = order.get('created_at', '')
    day, month, year = '', '', ''
    if created_at:
        parts = created_at[:10].split('-')
        if len(parts) == 3:
            year, month, day = parts
            month_names = {
                '01': 'Января', '02': 'Февраля', '03': 'Марта', '04': 'Апреля',
                '05': 'Мая', '06': 'Июня', '07': 'Июля', '08': 'Августа',
                '09': 'Сентября', '10': 'Октября', '11': 'Ноября', '12': 'Декабря',
            }
            month = month_names.get(month, month)

    total_ordered = sum(i.get('ordered_qty', 0) for i in delivered + not_delivered)
    total_received = sum(i.get('received_qty', 0) for i in delivered + not_delivered)

    all_items = []
    for idx, item in enumerate(delivered + not_delivered, start=1):
        all_items.append({
            'number': idx,
            'product_name': item.get('product_name', ''),
            'unit': item.get('unit', ''),
            'ordered_qty': item.get('ordered_qty', 0),
            'received_qty': item.get('received_qty', 0),
            'status': item.get('status', ''),
        })

    return {
        'order_id': order.get('id', ''),
        'branch': order.get('branch', ''),
        'day': day,
        'month_name': month,
        'year': year,
        'time': '',
        'delivered_items': delivered,
        'not_delivered_items': not_delivered,
        'extra_items': extra,
        'all_items': all_items,
        'total_ordered': total_ordered,
        'total_received': total_received,
        'completion_rate': delivery.get('completion_rate', ''),
        'snabjenec_name': (names or {}).get('snabjenec_name', ''),
        'supplier_name':  (names or {}).get('supplier_name', ''),
        'chef_name':      (names or {}).get('chef_name', ''),
        'recipient_name': (names or {}).get('snabjenec_name', ''),
        'sender_name':    (names or {}).get('supplier_name', ''),
        'signature_date': created_at[:10] if created_at else '',
    }
