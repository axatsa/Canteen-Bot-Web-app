import os
import uuid
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'exports')


def ensure_dirs():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    os.makedirs(EXPORTS_DIR, exist_ok=True)


def _replace_text_in_para(para, context: dict):
    full = ''.join(r.text for r in para.runs)
    for key, val in context.items():
        full = full.replace('{{ ' + key + ' }}', str(val or ''))
        full = full.replace('{{' + key + '}}', str(val or ''))
    if para.runs:
        para.runs[0].text = full
        for r in para.runs[1:]:
            r.text = ''


def fill_docx_template(template_path: str, context: dict) -> Optional[str]:
    try:
        from docx import Document
        from docx.shared import Pt
        from docx.oxml.ns import qn
        from docx.oxml import OxmlElement
        from copy import deepcopy
    except ImportError:
        logger.error("python-docx not installed")
        return None

    ensure_dirs()
    try:
        doc = Document(template_path)

        # 1. Replace simple {{ var }} placeholders in paragraphs
        for para in doc.paragraphs:
            _replace_text_in_para(para, context)

        # 2. Handle table: find marker row and replace with actual data rows
        all_items = context.get('all_items', [])
        for table in doc.tables:
            marker_row_idx = None
            for i, row in enumerate(table.rows):
                row_text = ''.join(
                    ''.join(r.text for r in cell.paragraphs[0].runs)
                    for cell in row.cells
                )
                if 'ITEMS_ROW' in row_text or '{%tr' in row_text or 'item.product_name' in row_text:
                    marker_row_idx = i
                    break

            if marker_row_idx is None:
                continue

            # Copy style from marker row, then remove it
            template_row = table.rows[marker_row_idx]
            tr_template = deepcopy(template_row._tr)

            # Remove marker row from table
            tbl = table._tbl
            tbl.remove(template_row._tr)

            # Insert actual data rows at the same position
            ref_tr = table.rows[marker_row_idx]._tr if marker_row_idx < len(table.rows) else None
            # When inserting before ref_tr each row shifts up, so iterate reversed to get correct order
            items_iter = reversed(all_items) if ref_tr is not None else all_items
            for item in items_iter:
                new_tr = deepcopy(tr_template)
                cells = new_tr.findall(qn('w:tc'))
                values = [
                    str(item.get('number', '')),
                    str(item.get('product_name', '')),
                    str(item.get('unit', '')),
                    str(item.get('ordered_qty', '')),
                    str(item.get('received_qty', '')),
                ]
                for cell_el, val in zip(cells, values):
                    for p_el in cell_el.findall(qn('w:p')):
                        # Clear all runs
                        for r_el in p_el.findall(qn('w:r')):
                            p_el.remove(r_el)
                        # Add single clean run
                        r_new = OxmlElement('w:r')
                        t_new = OxmlElement('w:t')
                        t_new.text = val
                        r_new.append(t_new)
                        p_el.append(r_new)
                        break  # only first paragraph

                if ref_tr is not None:
                    tbl.insert(list(tbl).index(ref_tr), new_tr)
                else:
                    tbl.append(new_tr)

        out_name = f"order_{context.get('order_id', uuid.uuid4())}_{uuid.uuid4().hex[:8]}.docx"
        out_path = os.path.join(EXPORTS_DIR, out_name)
        doc.save(out_path)
        return out_path
    except Exception as e:
        logger.error(f"Error filling DOCX template: {e}")
        return None


BRANCH_NAMES = {
    'beltepa_land': 'Белтепа-Land',
    'uchtepa_land': 'Учтепа-Land',
    'novza_school': 'Новза-School',
    'uchtepa_school': 'Учтепа-School',
    'almazar_school': 'Алмазар-School',
    'rakat_land': 'Ракат-Land',
    'mukumiy_land': 'Мукумий-Land',
    'general_uzakov_school': 'Генерал Узаков-School',
    'yunusabad_land': 'Юнусабад-Land',
    'namangan_school': 'Наманган-School',
}

MONTH_NAMES = {
    1: 'Января', 2: 'Февраля', 3: 'Марта', 4: 'Апреля',
    5: 'Мая', 6: 'Июня', 7: 'Июля', 8: 'Августа',
    9: 'Сентября', 10: 'Октября', 11: 'Ноября', 12: 'Декабря',
}


def build_export_context(order_details: dict, names: dict = None) -> dict:
    order = order_details.get('order', {})
    delivery = order_details.get('delivery', {})
    delivered = order_details.get('delivered_items', [])
    not_delivered = order_details.get('not_delivered_items', [])
    extra = order_details.get('extra_items', [])

    created_at = order.get('created_at', '')
    now = datetime.now()
    day = str(now.day)
    month = MONTH_NAMES.get(now.month, str(now.month))
    year = str(now.year)

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
        'branch': BRANCH_NAMES.get(order.get('branch', ''), order.get('branch', '')),
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
