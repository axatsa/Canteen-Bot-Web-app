import os
import httpx
import logging
from typing import List
from . import crud

logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv('BOT_TOKEN')

async def send_telegram_message(chat_id: int, text: str):
    if not BOT_TOKEN:
        logger.warning("BOT_TOKEN not set, cannot send notification")
        return
    
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }
            resp = await client.post(url, json=payload, timeout=10.0)
            resp.raise_for_status()
        except Exception as e:
            logger.error(f"Error sending telegram message to {chat_id}: {e}")

async def notify_new_order(order_data: dict):
    """Notify all snabjenecs when Chef creates an order."""
    snabjenecs = crud.get_users_by_role('snabjenec')
    branch_name = order_data.get('branch', 'Неизвестный филиал')
    
    # Resolve branch name (importing here to avoid circular imports if any)
    from .bot import BRANCH_NAMES
    branch_display = BRANCH_NAMES.get(branch_name, branch_name)
    
    text = (
        f"<b>📦 Новый заказ!</b>\n\n"
        f"Филиал: {branch_display}\n"
        f"ID: <code>{order_data['id'][:8]}</code>\n\n"
        f"Пожалуйста, проверьте и отправьте поставщику."
    )
    
    for s in snabjenecs:
        await send_telegram_message(s['telegram_id'], text)

async def notify_order_archived(order_id: str):
    """Notify all financiers when Snabjenec archives an order."""
    order = crud.get_order_by_id(order_id)
    if not order: return
    
    financiers = crud.get_users_by_role('financier')
    branch_name = order.get('branch', 'Неизвестный филиал')
    from .bot import BRANCH_NAMES
    branch_display = BRANCH_NAMES.get(branch_name, branch_name)

    text = (
        f"<b>💼 Заказ архивирован</b>\n\n"
        f"Филиал: {branch_display}\n"
        f"ID: <code>{order_id[:8]}</code>\n\n"
        f"Снабженец завершил приёмку товара. Заказ готов к проверке."
    )
    
    for f in financiers:
        await send_telegram_message(f['telegram_id'], text)
