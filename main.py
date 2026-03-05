# Telegram Bot for Optimizer Mini App
# Registration flow with language, FIO, role, password, and branch selection

import os
import logging
from typing import Optional
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)
import sqlite3
import json
import uuid

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Environment variables
BOT_TOKEN = os.getenv('BOT_TOKEN')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://your-webapp-url.com')

# Database path
DB_PATH = os.getenv('DB_PATH', 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Ensure tables exist (shared with api.py logic)
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        branch TEXT,
        language TEXT DEFAULT 'ru',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        products TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        deliveredAt TEXT,
        estimatedDeliveryDate TEXT,
        branch TEXT NOT NULL
    )
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS master_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL
    )
    ''')
    conn.commit()
    conn.close()

init_db()

# Conversation states
LANGUAGE, FIO, ROLE, PASSWORD, BRANCH, SETTINGS = range(6)

# Role passwords
ROLE_PASSWORDS = {
    'chef': 'P123',
    'financier': 'F123',
    'supplier': 'C123',
}

# Translations
TEXTS = {
    'ru': {
        'welcome': '👋 Добро пожаловать в Optimizer!\n\nВыберите язык:',
        'enter_fio': '📝 Введите ваше ФИО (Фамилия Имя Отчество):',
        'select_role': '👤 Выберите вашу роль:',
        'enter_password': '🔐 Введите пароль для роли "{role}":',
        'wrong_password': '❌ Неверный пароль. Попробуйте ещё раз:',
        'select_branch': '🏢 Выберите филиал:',
        'registration_complete': '✅ Отлично! Регистрация завершена.\n\n👤 {name}\n🎭 Роль: {role}\n🏢 Филиал: {branch}\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        'open_app': '📱 Открыть Optimizer',
        'back': '⬅️ Назад',
        'settings': '⚙️ Настройки',
        'settings_menu': '⚙️ Настройки\n\nВыберите, что хотите изменить:',
        'change_language': '🌐 Сменить язык',
        'change_fio': '📝 Изменить ФИО',
        'change_role': '👤 Сменить роль',
        'change_branch': '🏢 Сменить филиал',
        'language_changed': '✅ Язык изменён на Русский',
        'fio_changed': '✅ ФИО изменено на: {name}',
        'role_changed': '✅ Роль изменена на: {role}',
        'branch_changed': '✅ Филиал изменён на: {branch}',
        'already_registered': '👋 С возвращением, {name}!\n\n🎭 Роль: {role}\n🏢 Филиал: {branch}\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        # Roles
        'role_chef': '👨‍🍳 Шеф-повар',
        'role_financier': '💼 Финансист',
        'role_supplier': '🚚 Поставщик',
        # Branches
        'branch_chilanzar': 'Чиланзар (Новза)',
        'branch_uchtepa': 'Учтепа',
        'branch_shayzantaur': 'Шайзантаур',
        'branch_olmazar': 'Олмазар',
        'branch_all': 'Все филиалы',
    },
    'uz': {
        'welcome': "👋 Optimizer'ga xush kelibsiz!\n\nTilni tanlang:",
        'enter_fio': "📝 F.I.O. (Familiya Ism Otasining ismi) kiriting:",
        'select_role': '👤 Rolingizni tanlang:',
        'enter_password': '🔐 "{role}" roli uchun parolni kiriting:',
        'wrong_password': "❌ Noto'g'ri parol. Qayta urinib ko'ring:",
        'select_branch': '🏢 Filialni tanlang:',
        'registration_complete': "✅ Ajoyib! Ro'yxatdan o'tish yakunlandi.\n\n👤 {name}\n🎭 Rol: {role}\n🏢 Filial: {branch}\n\nIlovani ochish uchun quyidagi tugmani bosing:",
        'open_app': "📱 Optimizer'ni ochish",
        'back': '⬅️ Orqaga',
        'settings': '⚙️ Sozlamalar',
        'settings_menu': "⚙️ Sozlamalar\n\nNimani o'zgartirmoqchisiz:",
        'change_language': "🌐 Tilni o'zgartirish",
        'change_fio': "📝 F.I.O. o'zgartirish",
        'change_role': "👤 Rolni o'zgartirish",
        'change_branch': "🏢 Filialni o'zgartirish",
        'language_changed': "✅ Til O'zbekchaga o'zgartirildi",
        'fio_changed': "✅ F.I.O. o'zgartirildi: {name}",
        'role_changed': "✅ Rol o'zgartirildi: {role}",
        'branch_changed': "✅ Filial o'zgartirildi: {branch}",
        'already_registered': "👋 Qaytib kelganingizdan xursandmiz, {name}!\n\n🎭 Rol: {role}\n🏢 Filial: {branch}\n\nIlovani ochish uchun quyidagi tugmani bosing:",
        # Roles
        'role_chef': '👨‍🍳 Oshpaz',
        'role_financier': '💼 Moliyachi',
        'role_supplier': '🚚 Yetkazuvchi',
        # Branches
        'branch_chilanzar': 'Chilonzor (Novza)',
        'branch_uchtepa': 'Uchtepa',
        'branch_shayzantaur': 'Shayxontohur',
        'branch_olmazar': 'Olmazor',
        'branch_all': 'Barcha filiallar',
    }
}

def get_text(lang: str, key: str, **kwargs) -> str:
    """Get translated text"""
    text = TEXTS.get(lang, TEXTS['ru']).get(key, TEXTS['ru'].get(key, key))
    if kwargs:
        text = text.format(**kwargs)
    return text

def get_back_keyboard(lang: str) -> ReplyKeyboardMarkup:
    """Get keyboard with back button"""
    return ReplyKeyboardMarkup(
        [[get_text(lang, 'back')]],
        resize_keyboard=True,
        one_time_keyboard=False
    )

def get_user_by_telegram_id(telegram_id: int) -> Optional[dict]:
    """Get user from database by telegram ID"""
    conn = get_db_connection()
    try:
        user = conn.execute('SELECT * FROM users WHERE telegram_id = ?', (telegram_id,)).fetchone()
        if user:
            return dict(user)
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
    finally:
        conn.close()
    return None

def save_user(telegram_id: int, full_name: str, role: str, branch: str, language: str) -> bool:
    """Save or update user in database"""
    conn = get_db_connection()
    try:
        # Check if user exists
        existing = get_user_by_telegram_id(telegram_id)
        if existing:
            # Update
            conn.execute('''
                UPDATE users SET
                    full_name = ?,
                    role = ?,
                    branch = ?,
                    language = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            ''', (full_name, role, branch, language, telegram_id))
        else:
            # Insert
            conn.execute('''
                INSERT INTO users (id, telegram_id, full_name, role, branch, language)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (str(uuid.uuid4()), telegram_id, full_name, role, branch, language))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error saving user: {e}")
        return False
    finally:
        conn.close()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start command - check if user exists or start registration"""
    telegram_id = update.effective_user.id
    message = update.effective_message
    
    # Check if user already registered
    user = get_user_by_telegram_id(telegram_id)
    if user:
        lang = user.get('language', 'ru')
        role_key = f"role_{user['role']}"
        branch_key = f"branch_{user['branch']}"
        
        # Build message
        if user['role'] in ['financier', 'supplier']:
            msg = get_text(lang, 'already_registered',
                name=user['full_name'],
                role=get_text(lang, role_key),
                branch=get_text(lang, 'branch_all')
            )
        else:
            msg = get_text(lang, 'already_registered',
                name=user['full_name'],
                role=get_text(lang, role_key),
                branch=get_text(lang, branch_key)
            )

        # Show welcome back message with app button
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                get_text(lang, 'open_app'),
                web_app={'url': f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={user['role']}&branch={user['branch']}"}
            )],
            [InlineKeyboardButton(
                get_text(lang, 'settings'),
                callback_data='settings'
            )]
        ])
        
        await message.reply_text(msg, reply_markup=keyboard)
        return ConversationHandler.END
    
    # Start registration - show language selection
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton('🇷🇺 Русский', callback_data='lang_ru'),
            InlineKeyboardButton("🇺🇿 O'zbekcha", callback_data='lang_uz'),
        ]
    ])
    
    await message.reply_text(
        TEXTS['ru']['welcome'],
        reply_markup=keyboard
    )
    return LANGUAGE

async def language_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle language selection"""
    query = update.callback_query
    await query.answer()
    
    lang = query.data.split('_')[1]  # Extract 'ru' or 'uz' from 'lang_ru'
    context.user_data['language'] = lang
    
    # Send message with Back button (ReplyMarkup)
    keyboard = get_back_keyboard(lang)
    
    # Delete the inline keyboard message or edit it? 
    # Usually better to delete the inline menu to avoid confusion and send a new message with ReplyMarkup
    await query.delete_message()
    
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_fio'),
        reply_markup=keyboard
    )
    return FIO

async def fio_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle FIO entry"""
    lang = context.user_data.get('language', 'ru')
    text = update.message.text
    
    # Check for Back button
    if text == get_text(lang, 'back'):
        if context.user_data.get('changing_setting') == 'fio':
            return await settings_menu(update, context)
        return await start(update, context)
        
    context.user_data['full_name'] = text
    
    # If changing FIO from settings, save and return to settings
    if context.user_data.get('changing_setting') == 'fio':
        user = get_user_by_telegram_id(update.effective_user.id)
        # Update user with new name, keep other fields
        save_user(update.effective_user.id, text, user['role'], user['branch'], lang)
        
        await update.message.reply_text(
            get_text(lang, 'fio_changed', name=text),
            reply_markup=ReplyKeyboardRemove()
        )
        # We need to send the settings menu again. 
        # Since we are in a message handler, we can't edit the previous inline message easily.
        # So we send a new message.
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'change_language'), callback_data='setting_language')],
            [InlineKeyboardButton(get_text(lang, 'change_fio'), callback_data='setting_fio')],
            [InlineKeyboardButton(get_text(lang, 'change_role'), callback_data='setting_role')],
            [InlineKeyboardButton(get_text(lang, 'change_branch'), callback_data='setting_branch')],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_main')],
        ])
        await update.message.reply_text(get_text(lang, 'settings_menu'), reply_markup=keyboard)
        return SETTINGS

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
        [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_fio')],
    ])
    
    await update.message.reply_text(
        get_text(lang, 'select_role'),
        reply_markup=keyboard
    )
    return ROLE

async def role_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle role selection"""
    query = update.callback_query
    await query.answer()
    
    lang = context.user_data.get('language', 'ru')
    data = query.data
    
    # Handle Back button
    # Handle Back button
    if data == 'back_to_settings':
        return await settings_menu(update, context)

    if data == 'back_to_fio':
        await query.delete_message()
        # Ask for FIO again (with Back button)
        keyboard = get_back_keyboard(lang)
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=get_text(lang, 'enter_fio'),
            reply_markup=keyboard
        )
        return FIO
        
    role = data.split('_')[1]  # Extract 'chef', 'financier', or 'supplier'
    context.user_data['role'] = role
    
    # Show Back button (ReplyMarkup) for password entry
    keyboard = get_back_keyboard(lang)
    
    await query.delete_message()
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_password', role=get_text(lang, f'role_{role}')),
        reply_markup=keyboard
    )
    return PASSWORD

async def password_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle password entry"""
    lang = context.user_data.get('language', 'ru')
    role = context.user_data.get('role')
    text = update.message.text.strip()
    
    # Handle Back button
    # Handle Back button
    if text == get_text(lang, 'back'):
        # Go back to Role selection
        back_callback = 'back_to_settings' if context.user_data.get('changing_setting') == 'role' else 'back_to_fio'
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
            [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
            [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data=back_callback)],
        ])
        await update.message.reply_text(
            get_text(lang, 'select_role'),
            reply_markup=keyboard
        )
        return ROLE
    
    if text != ROLE_PASSWORDS.get(role):
        await update.message.reply_text(get_text(lang, 'wrong_password'), reply_markup=get_back_keyboard(lang))
        return PASSWORD
    
    # If financier or supplier, skip branch selection
    if role in ['financier', 'supplier']:
        context.user_data['branch'] = 'all'
        return await finalize_registration(update, context)
    
    # Show branch selection
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'branch_chilanzar'), callback_data='branch_chilanzar')],
        [InlineKeyboardButton(get_text(lang, 'branch_uchtepa'), callback_data='branch_uchtepa')],
        [InlineKeyboardButton(get_text(lang, 'branch_shayzantaur'), callback_data='branch_shayzantaur')],
        [InlineKeyboardButton(get_text(lang, 'branch_olmazar'), callback_data='branch_olmazar')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_role')],
    ])
    
    await update.message.reply_text(
        get_text(lang, 'select_branch'),
        reply_markup=keyboard
    )
    return BRANCH

async def branch_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle branch selection"""
    query = update.callback_query
    await query.answer()
    
    lang = context.user_data.get('language', 'ru')
    data = query.data
    
    # Handle Back button
    if data == 'back_to_role':
        await query.delete_message()
        # Go back to Role selection (skipping FIO entry)
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
            [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
            [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_fio')],
        ])
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=get_text(lang, 'select_role'),
            reply_markup=keyboard
        )
        return ROLE
    
    branch = data.split('_')[1]
    context.user_data['branch'] = branch
    
    return await finalize_registration(update, context)

async def finalize_registration(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Finalize registration and save user"""
    telegram_id = update.effective_user.id
    lang = context.user_data.get('language', 'ru')
    full_name = context.user_data.get('full_name')
    role = context.user_data.get('role')
    branch = context.user_data.get('branch', 'all')
    
    # Save to database
    save_user(telegram_id, full_name, role, branch, lang)
    
    # Build confirmation message
    role_key = f"role_{role}"
    if role in ['financier', 'supplier']:
        msg = get_text(lang, 'registration_complete',
            name=full_name,
            role=get_text(lang, role_key),
            branch=get_text(lang, 'role')  # Placeholder, not shown
        ).split('🏢')[0]  # Remove branch line
    else:
        branch_key = f"branch_{branch}"
        msg = get_text(lang, 'registration_complete',
            name=full_name,
            role=get_text(lang, role_key),
            branch=get_text(lang, branch_key)
        )
    
    # If coming from settings, we should probably return to settings instead of ending?
    # But usually changing role/branch is a major change, so creating a new session (end) is fine.
    # However, let's just make sure we clear the changing_setting flag
    context.user_data.pop('changing_setting', None)
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            get_text(lang, 'open_app'),
            web_app={'url': f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={role}&branch={branch}"}
        )]
    ])
    
    message = update.callback_query.message if update.callback_query else update.message
    await message.reply_text(msg, reply_markup=keyboard)
    
    return ConversationHandler.END

async def settings_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Show settings menu"""
    # Handle both callback query and command message
    if update.callback_query:
        query = update.callback_query
        await query.answer()
        telegram_id = update.effective_user.id
        message_func = query.edit_message_text
    else:
        telegram_id = update.effective_user.id
        message_func = update.message.reply_text
    
    user = get_user_by_telegram_id(telegram_id)
    
    if not user:
        # If user not found, try to register
        return await start(update, context)
    
    lang = user.get('language', 'ru')
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'change_language'), callback_data='setting_language')],
        [InlineKeyboardButton(get_text(lang, 'change_fio'), callback_data='setting_fio')],
        [InlineKeyboardButton(get_text(lang, 'change_role'), callback_data='setting_role')],
        [InlineKeyboardButton(get_text(lang, 'change_branch'), callback_data='setting_branch')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_main')],
    ])
    
    await message_func(
        get_text(lang, 'settings_menu'),
        reply_markup=keyboard
    )
    return SETTINGS

async def setting_language_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle language change"""
    query = update.callback_query
    await query.answer()
    
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    current_lang = user.get('language', 'ru')
    new_lang = 'uz' if current_lang == 'ru' else 'ru'
    
    save_user(telegram_id, user['full_name'], user['role'], user['branch'], new_lang)
    
    await query.edit_message_text(get_text(new_lang, 'language_changed'))
    await start(update, context)
    return ConversationHandler.END

async def setting_fio_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle FIO change request"""
    query = update.callback_query
    await query.answer()
    
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    lang = user.get('language', 'ru')
    
    context.user_data['language'] = lang
    context.user_data['role'] = user['role']
    context.user_data['branch'] = user['branch']
    context.user_data['changing_setting'] = 'fio'
    
    # Send text request with Back button (ReplyMarkup)
    keyboard = get_back_keyboard(lang)
    try:
        await query.delete_message()
    except Exception:
        pass # Message might be too old or already deleted
        
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_fio'),
        reply_markup=keyboard
    )
    return FIO

async def setting_role_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle role change request"""
    query = update.callback_query
    await query.answer()
    
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    lang = user.get('language', 'ru')
    
    context.user_data['language'] = lang
    context.user_data['full_name'] = user['full_name']
    context.user_data['changing_setting'] = 'role'
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
        [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_settings')],
    ])
    
    await query.edit_message_text(get_text(lang, 'select_role'), reply_markup=keyboard)
    return ROLE

async def setting_branch_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle branch change request"""
    query = update.callback_query
    await query.answer()
    
    telegram_id = update.effective_user.id
    user = get_user_by_telegram_id(telegram_id)
    lang = user.get('language', 'ru')
    
    context.user_data['language'] = lang
    context.user_data['full_name'] = user['full_name']
    context.user_data['role'] = user['role']
    context.user_data['changing_setting'] = 'branch'
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'branch_chilanzar'), callback_data='branch_chilanzar')],
        [InlineKeyboardButton(get_text(lang, 'branch_uchtepa'), callback_data='branch_uchtepa')],
        [InlineKeyboardButton(get_text(lang, 'branch_shayzantaur'), callback_data='branch_shayzantaur')],
        [InlineKeyboardButton(get_text(lang, 'branch_olmazar'), callback_data='branch_olmazar')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_settings')],
    ])
    
    await query.edit_message_text(get_text(lang, 'select_branch'), reply_markup=keyboard)
    return BRANCH

async def back_to_main_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Return to main menu"""
    query = update.callback_query
    await query.answer()
    
    # Reuse start() to show the main menu
    await start(update, context)
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel conversation"""
    await update.message.reply_text(
        '👋 До свидания!',
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END

def main() -> None:
    """Start the bot"""
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN not set in environment variables!")
        return
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Registration conversation handler
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler('start', start),
            CommandHandler('settings', settings_menu),
            CallbackQueryHandler(settings_menu, pattern='^settings$'),
        ],
        states={
            LANGUAGE: [CallbackQueryHandler(language_selected, pattern='^lang_')],
            FIO: [MessageHandler(filters.TEXT & ~filters.COMMAND, fio_entered)],
            ROLE: [
                CallbackQueryHandler(role_selected, pattern='^role_'),
                CallbackQueryHandler(settings_menu, pattern='^back_to_settings$'), # Handle back from role (settings mode)
            ],
            PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, password_entered)],
            BRANCH: [
                CallbackQueryHandler(branch_selected, pattern='^branch_'),
                CallbackQueryHandler(settings_menu, pattern='^back_to_settings$'), # Handle back from branch (settings mode)
            ],
            SETTINGS: [
                CallbackQueryHandler(setting_language_handle, pattern='^setting_language$'),
                CallbackQueryHandler(setting_fio_handle, pattern='^setting_fio$'),
                CallbackQueryHandler(setting_role_handle, pattern='^setting_role$'),
                CallbackQueryHandler(setting_branch_handle, pattern='^setting_branch$'),
                CallbackQueryHandler(back_to_main_handle, pattern='^back_to_main$'),
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        allow_reentry=True,
    )
    
    application.add_handler(conv_handler)
    
    # Start polling
    logger.info("Bot starting...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
