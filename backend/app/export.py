import os
import re
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


def _set_cell_text(cell, text: str):
    """Write text into the first paragraph/run of a table cell, preserving formatting."""
    para = cell.paragraphs[0]
    if para.runs:
        para.runs[0].text = str(text)
        for r in para.runs[1:]:
            r.text = ''
    else:
        from docx.oxml import OxmlElement
        r_el = OxmlElement('w:r')
        t_el = OxmlElement('w:t')
        t_el.text = str(text)
        r_el.append(t_el)
        para._p.append(r_el)


def _normalize_product_name(raw: str) -> str:
    """Extract Russian-only part (before '(') and lowercase-strip."""
    russian = raw.split('(')[0].strip()
    return russian.lower()


def fill_docx_template(template_path: str, context: dict) -> Optional[str]:
    try:
        from docx import Document
    except ImportError:
        logger.error("python-docx not installed")
        return None

    ensure_dirs()
    try:
        doc = Document(template_path)

        day         = context.get('day', '')
        month_name  = context.get('month_name', '')
        branch      = context.get('branch', '')
        snabjenec   = context.get('snabjenec_name', '')
        supplier    = context.get('supplier_name', '')
        recipient   = context.get('recipient_name', '') or snabjenec

        # ── Fill header paragraphs ────────────────────────────────────────────
        for para in doc.paragraphs:
            full = para.text

            if 'Дата:' in full and para.runs:
                # Replace the underscores/blanks in the date run
                # run[0] looks like: '    Дата: «          » ______________ '
                r = para.runs[0]
                r.text = re.sub(
                    r'«[^»]*»\s+[_\s]+',
                    f'« {day} » {month_name}  ',
                    r.text
                )

            elif 'Филиал:' in full and para.runs:
                # Last run is the underscores placeholder
                for r in reversed(para.runs):
                    if '_' in r.text:
                        r.text = branch
                        break

            elif full.strip().startswith('Cнабженец:') and para.runs:
                r = para.runs[0]
                r.text = re.sub(r'_{5,}', lambda m, used=[False]: (
                    snabjenec if not used[0] and not used.__setitem__(0, True)
                    else m.group()
                ), r.text)

            elif full.strip().startswith('Поставщик:') and para.runs:
                r = para.runs[0]
                r.text = re.sub(r'_{5,}', lambda m, used=[False]: (
                    supplier if not used[0] and not used.__setitem__(0, True)
                    else m.group()
                ), r.text)

            elif full.strip().startswith('Получатель:') and para.runs:
                r = para.runs[0]
                r.text = re.sub(r'_{5,}', lambda m, used=[False]: (
                    recipient if not used[0] and not used.__setitem__(0, True)
                    else m.group()
                ), r.text)

        # ── Build order product lookup ────────────────────────────────────────
        all_items = context.get('all_items', [])
        extra_items = context.get('extra_items', [])

        # keyed by normalized Russian name
        order_lookup: dict[str, dict] = {}
        for item in all_items:
            key = _normalize_product_name(item.get('product_name', ''))
            if key:
                order_lookup[key] = item

        matched_keys: set[str] = set()

        # ── Fill table rows ───────────────────────────────────────────────────
        if doc.tables:
            table = doc.tables[0]
            andere_rows = []  # "Другие" empty rows to fill with unmatched items

            logger.info(f"[export] order_lookup keys: {list(order_lookup.keys())}")
            logger.info(f"[export] table has {len(table.rows)} rows")

            for row in table.rows:
                cells = row.cells
                # Get unique cells (merged cells can repeat)
                unique_cells = []
                seen = set()
                for c in cells:
                    if id(c) not in seen:
                        seen.add(id(c))
                        unique_cells.append(c)

                if len(unique_cells) < 2:
                    continue

                num_text  = unique_cells[0].text.strip()
                name_text = unique_cells[1].text.strip()

                logger.info(f"[export] row: num={repr(num_text)} name={repr(name_text)} ncells={len(unique_cells)}")

                # Skip header row and category rows (merged / no leading number)
                if not num_text.isdigit():
                    continue

                # "Другие" empty row
                if name_text == '':
                    andere_rows.append((row, unique_cells))
                    continue

                # Regular product row — try to match order data
                norm = _normalize_product_name(name_text)
                matched = None
                
                # 1. Try exact match first, but only if NOT already used
                if norm in order_lookup and norm not in matched_keys:
                    matched = order_lookup[norm]
                    matched_keys.add(norm)
                    logger.info(f"[export] exact match: {repr(norm)}")
                else:
                    # 2. Try partial word match, skipping already matched items
                    for ok, ov in order_lookup.items():
                        if ok in matched_keys:
                            continue
                            
                        ok_words   = set(ok.split())
                        tmpl_words = set(norm.split())
                        common     = ok_words & tmpl_words
                        
                        # Match if words are identical or have significant overlap
                        if (ok_words == tmpl_words) or (len(common) >= 2 and len(common) == len(ok_words)):
                            matched = ov
                            matched_keys.add(ok)
                            logger.info(f"[export] partial match: {repr(norm)} -> {repr(ok)}")
                            break
                    
                    if not matched:
                        logger.info(f"[export] NO match for: {repr(norm)}")

                if matched and len(unique_cells) >= 5:
                    _set_cell_text(unique_cells[2], matched.get('unit', ''))
                    _set_cell_text(unique_cells[3], matched.get('ordered_qty', ''))
                    _set_cell_text(unique_cells[4], matched.get('received_qty', ''))

            # Fill unmatched order items into "Другие" rows
            unmatched = [
                item for item in all_items
                if _normalize_product_name(item.get('product_name', '')) not in matched_keys
            ] + list(extra_items)

            for (row, ucells), item in zip(andere_rows, unmatched):
                if len(ucells) >= 5:
                    _set_cell_text(ucells[1], item.get('product_name', ''))
                    _set_cell_text(ucells[2], item.get('unit', ''))
                    _set_cell_text(ucells[3], item.get('ordered_qty', ''))
                    _set_cell_text(ucells[4], item.get('received_qty', ''))

        out_name = f"order_{context.get('order_id', uuid.uuid4())}_{uuid.uuid4().hex[:8]}.docx"
        out_path = os.path.join(EXPORTS_DIR, out_name)
        doc.save(out_path)
        return out_path
    except Exception as e:
        logger.exception(f"Error filling DOCX template: {e}")
        return None


BRANCH_NAMES = {
    'beltepa_land':          'Белтепа-Land',
    'uchtepa_land':          'Учтепа-Land',
    'rakat_land':            'Ракат-Land',
    'mukumiy_land':          'Мукумий-Land',
    'yunusabad_land':        'Юнусабад-Land',
    'novoi_land':            'Новои-Land',
    'novza_school':          'Новза-School',
    'uchtepa_school':        'Учтепа-School',
    'almazar_school':        'Алмазар-School',
    'general_uzakov_school': 'Генерал Узаков-School',
    'namangan_school':       'Наманган-School',
    'novoi_school':          'Новои-School',
}

MONTH_NAMES = {
    1: 'Января', 2: 'Февраля', 3: 'Марта', 4: 'Апреля',
    5: 'Мая', 6: 'Июня', 7: 'Июля', 8: 'Августа',
    9: 'Сентября', 10: 'Октября', 11: 'Ноября', 12: 'Декабря',
}


def build_export_context(order_details: dict, names: dict = None) -> dict:
    order           = order_details.get('order', {})
    delivery        = order_details.get('delivery', {})
    delivered       = order_details.get('delivered_items', [])
    not_delivered   = order_details.get('not_delivered_items', [])
    extra           = order_details.get('extra_items', [])
    
    source_items = delivered + not_delivered
    if not source_items:
        # Fallback to ordered items if delivery tracking hasn't started
        source_items = [
            {
                'product_name': p.get('product_name', '') or p.get('name', ''),
                'unit': p.get('unit', ''),
                'ordered_qty': p.get('ordered_qty', 0) or p.get('quantity', 0),
                'received_qty': '',
                'status': 'pending'
            }
            for p in order_details.get('ordered_products', [])
            if (p.get('ordered_qty', 0) or p.get('quantity', 0)) > 0
        ]

    now = datetime.now()
    day         = str(now.day)
    month       = MONTH_NAMES.get(now.month, str(now.month))
    year        = str(now.year)

    total_ordered  = sum(i.get('ordered_qty', 0) for i in source_items)
    total_received = sum(i.get('received_qty', 0) if isinstance(i.get('received_qty'), int) else 0 for i in source_items)

    all_items = []
    for idx, item in enumerate(source_items, start=1):
        all_items.append({
            'number':       idx,
            'product_name': item.get('product_name', ''),
            'unit':         item.get('unit', ''),
            'ordered_qty':  item.get('ordered_qty', 0) or '',
            'received_qty': item.get('received_qty', 0) if item.get('received_qty') != '' else '',
            'status':       item.get('status', ''),
        })

    snabjenec_name = (names or {}).get('snabjenec_name', '')
    supplier_name  = (names or {}).get('supplier_name', '')

    return {
        'order_id':         order.get('id', ''),
        'branch':           BRANCH_NAMES.get(order.get('branch', ''), order.get('branch', '')),
        'day':              day,
        'month_name':       month,
        'year':             year,
        'delivered_items':  delivered,
        'not_delivered_items': not_delivered,
        'extra_items':      extra,
        'all_items':        all_items,
        'total_ordered':    total_ordered,
        'total_received':   total_received,
        'completion_rate':  delivery.get('completion_rate', ''),
        'snabjenec_name':   snabjenec_name,
        'supplier_name':    supplier_name,
        'chef_name':        (names or {}).get('chef_name', ''),
        'recipient_name':   snabjenec_name,
        'sender_name':      supplier_name,
    }
