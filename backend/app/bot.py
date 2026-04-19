import os
import logging
from typing import Optional
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
from . import crud

logger = logging.getLogger(__name__)

# Constants from environment
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://your-webapp-url.com')

# Conversation states
LANGUAGE, TYPE, FIO, ROLE, PASSWORD, BRANCH, SETTINGS = range(7)

# Role passwords
ROLE_PASSWORDS = {
    'chef': 'P123',
    'financier': 'F123',
    'supplier': 'C123',
    'snabjenec': 'S123',
}

# Branch data
LAND_BRANCHES = [
    ('beltepa_land', 'Белтепа-Land'),
    ('uchtepa_land', 'Учтепа-Land'),
    ('rakat_land', 'Ракат-Land'),
    ('mukumiy_land', 'Мукумий-Land'),
    ('yunusabad_land', 'Юнусабад-Land'),
    ('novoi_land', 'Новои-Land'),
]
SCHOOL_BRANCHES = [
    ('novza_school', 'Новза-School'),
    ('uchtepa_school', 'Учтепа-School'),
    ('almazar_school', 'Алмазар-School'),
    ('general_uzakov_school', 'Генерал Узоков-School'),
    ('namangan_school', 'Наманган-School'),
    ('novoi_school', 'Новои-School'),
]
ALL_BRANCHES = LAND_BRANCHES + SCHOOL_BRANCHES
BRANCH_NAMES = {bid: name for bid, name in ALL_BRANCHES}
BRANCH_NAMES['all'] = 'Все филиалы'

# Translations
TEXTS = {
    'ru': {
        'welcome': '👋 Добро пожаловать в Optimizer!\n\nВыберите язык:',
        'select_type': '🏫 Вы работаете в садике или школе?',
        'type_land': '🌱 Садик',
        'type_school': '🎓 Школа',
        'enter_fio': '📝 Введите ваше ФИО (Фамилия Имя Отчество):',
        'select_role': '👤 Выберите вашу роль:',
        'enter_password': '🔐 Введите пароль для роли "{role}":',
        'wrong_password': '❌ Неверный пароль. Попробуйте ещё раз:',
        'select_branch': '🏢 Выберите ваш филиал:',
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
        'role_chef': '👨‍🍳 Шеф-повар',
        'role_snabjenec': '📦 Снабженец',
        'role_financier': '💼 Финансист',
        'role_supplier': '🚚 Поставщик',
        'branch_all': 'Все филиалы',
    },
    'uz': {
        'welcome': "👋 Optimizer'ga xush kelibsiz!\n\nTilni tanlang:",
        'select_type': "🏫 Siz bog'cha yoki maktabda ishleysizmi?",
        'type_land': "🌱 Bog'cha",
        'type_school': '🎓 Maktab',
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
        'role_chef': '👨‍🍳 Oshpaz',
        'role_snabjenec': "📦 Ta'minotchi",
        'role_financier': '💼 Moliyachi',
        'role_supplier': '🚚 Yetkazuvchi',
        'branch_all': 'Barcha filiallar',
    }
}

def get_text(lang: str, key: str, **kwargs) -> str:
    text = TEXTS.get(lang, TEXTS['ru']).get(key, TEXTS['ru'].get(key, key))
    if kwargs:
        text = text.format(**kwargs)
    return text

def get_back_keyboard(lang: str) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup([[get_text(lang, 'back')]], resize_keyboard=True)

def build_branch_keyboard(inst_type: str, back_callback: str, lang: str) -> InlineKeyboardMarkup:
    """Build branch keyboard filtered by inst_type ('land' or 'school')."""
    branches = LAND_BRANCHES if inst_type == 'land' else SCHOOL_BRANCHES
    rows = []
    for i in range(0, len(branches), 2):
        row = [InlineKeyboardButton(branches[i][1], callback_data=f'branch_{branches[i][0]}')]
        if i + 1 < len(branches):
            row.append(InlineKeyboardButton(branches[i + 1][1], callback_data=f'branch_{branches[i + 1][0]}'))
        rows.append(row)
    rows.append([InlineKeyboardButton(get_text(lang, 'back'), callback_data=back_callback)])
    return InlineKeyboardMarkup(rows)

def build_all_branches_keyboard(back_callback: str, lang: str) -> InlineKeyboardMarkup:
    """Build branch keyboard showing all 12 branches in two groups."""
    rows = []
    for i in range(0, len(LAND_BRANCHES), 2):
        row = [InlineKeyboardButton('🌱 ' + LAND_BRANCHES[i][1], callback_data=f'branch_{LAND_BRANCHES[i][0]}')]
        if i + 1 < len(LAND_BRANCHES):
            row.append(InlineKeyboardButton('🌱 ' + LAND_BRANCHES[i + 1][1], callback_data=f'branch_{LAND_BRANCHES[i + 1][0]}'))
        rows.append(row)
    for i in range(0, len(SCHOOL_BRANCHES), 2):
        row = [InlineKeyboardButton('🎓 ' + SCHOOL_BRANCHES[i][1], callback_data=f'branch_{SCHOOL_BRANCHES[i][0]}')]
        if i + 1 < len(SCHOOL_BRANCHES):
            row.append(InlineKeyboardButton('🎓 ' + SCHOOL_BRANCHES[i + 1][1], callback_data=f'branch_{SCHOOL_BRANCHES[i + 1][0]}'))
        rows.append(row)
    rows.append([InlineKeyboardButton(get_text(lang, 'back'), callback_data=back_callback)])
    return InlineKeyboardMarkup(rows)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    telegram_id = update.effective_user.id
    user = crud.get_user_by_telegram_id(telegram_id)

    if user:
        lang = user.get('language', 'ru')
        role_text = get_text(lang, f"role_{user['role']}")
        branch_text = BRANCH_NAMES.get(user['branch'], user['branch'])

        msg = get_text(lang, 'already_registered', name=user['full_name'], role=role_text, branch=branch_text)
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'open_app'), web_app={'url': f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={user['role']}&branch={user['branch']}"})],
            [InlineKeyboardButton(get_text(lang, 'settings'), callback_data='settings')]
        ])
        await update.effective_message.reply_text(msg, reply_markup=keyboard)
        return ConversationHandler.END

    keyboard = InlineKeyboardMarkup([[InlineKeyboardButton('🇷🇺 Русский', callback_data='lang_ru'), InlineKeyboardButton("🇺🇿 O'zbekcha", callback_data='lang_uz')]])
    await update.effective_message.reply_text(TEXTS['ru']['welcome'], reply_markup=keyboard)
    return LANGUAGE

async def language_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = query.data.split('_')[1]
    context.user_data['language'] = lang
    await query.delete_message()
    # Ask school or land
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'type_land'), callback_data='type_land'),
         InlineKeyboardButton(get_text(lang, 'type_school'), callback_data='type_school')]
    ])
    await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'select_type'), reply_markup=keyboard)
    return TYPE

async def type_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    inst_type = query.data.split('_')[1]  # 'land' or 'school'
    context.user_data['inst_type'] = inst_type
    await query.delete_message()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'enter_fio'), reply_markup=get_back_keyboard(lang))
    return FIO

async def fio_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    lang = context.user_data.get('language', 'ru')
    text = update.message.text
    if text == get_text(lang, 'back'):
        if context.user_data.get('changing_setting') == 'fio': return await settings_menu(update, context)
        return await start(update, context)

    context.user_data['full_name'] = text
    if context.user_data.get('changing_setting') == 'fio':
        user = crud.get_user_by_telegram_id(update.effective_user.id)
        crud.save_user(update.effective_user.id, text, user['role'], user['branch'], lang)
        await update.message.reply_text(get_text(lang, 'fio_changed', name=text), reply_markup=ReplyKeyboardRemove())
        return await settings_menu(update, context)

    msg = await update.message.reply_text("⏳", reply_markup=ReplyKeyboardRemove())
    await msg.delete()

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
        [InlineKeyboardButton(get_text(lang, 'role_snabjenec'), callback_data='role_snabjenec')],
        [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_fio')]
    ])
    await update.message.reply_text(get_text(lang, 'select_role'), reply_markup=keyboard)
    return ROLE

async def role_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    data = query.data
    if data == 'back_to_settings': return await settings_menu(update, context)
    if data == 'back_to_fio':
        await query.delete_message()
        await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'enter_fio'), reply_markup=get_back_keyboard(lang))
        return FIO

    role = data.split('_')[1]
    context.user_data['role'] = role
    await query.delete_message()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'enter_password', role=get_text(lang, f'role_{role}')), reply_markup=get_back_keyboard(lang))
    return PASSWORD

async def password_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    lang = context.user_data.get('language', 'ru')
    role = context.user_data.get('role')
    text = update.message.text.strip()
    if text == get_text(lang, 'back'):
        back_callback = 'back_to_settings' if context.user_data.get('changing_setting') == 'role' else 'back_to_fio'
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
            [InlineKeyboardButton(get_text(lang, 'role_snabjenec'), callback_data='role_snabjenec')],
            [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
            [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data=back_callback)]
        ])
        await update.message.reply_text(get_text(lang, 'select_role'), reply_markup=keyboard)
        return ROLE

    if text != ROLE_PASSWORDS.get(role):
        await update.message.reply_text(get_text(lang, 'wrong_password'), reply_markup=get_back_keyboard(lang))
        return PASSWORD

    msg = await update.message.reply_text("⏳", reply_markup=ReplyKeyboardRemove())
    await msg.delete()

    if role in ['financier', 'supplier', 'snabjenec']:
        context.user_data['branch'] = 'all'
        return await finalize_registration(update, context)

    # Chef: show branches filtered by selected type
    inst_type = context.user_data.get('inst_type', 'land')
    keyboard = build_branch_keyboard(inst_type, 'back_to_role', lang)
    await update.message.reply_text(get_text(lang, 'select_branch'), reply_markup=keyboard)
    return BRANCH

async def branch_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    if query.data == 'back_to_role':
        await query.delete_message()
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
            [InlineKeyboardButton(get_text(lang, 'role_snabjenec'), callback_data='role_snabjenec')],
            [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
            [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_fio')]
        ])
        await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'select_role'), reply_markup=keyboard)
        return ROLE

    # Extract full branch id (e.g. 'beltepa_land' from 'branch_beltepa_land')
    context.user_data['branch'] = query.data[7:]  # remove 'branch_' prefix
    return await finalize_registration(update, context)

async def finalize_registration(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    telegram_id = update.effective_user.id
    lang, full_name, role = context.user_data.get('language', 'ru'), context.user_data.get('full_name'), context.user_data.get('role')
    branch = context.user_data.get('branch', 'all')
    crud.save_user(telegram_id, full_name, role, branch, lang)

    branch_text = BRANCH_NAMES.get(branch, branch)
    msg = get_text(lang, 'registration_complete', name=full_name, role=get_text(lang, f"role_{role}"), branch=branch_text)
    keyboard = InlineKeyboardMarkup([[InlineKeyboardButton(get_text(lang, 'open_app'), web_app={'url': f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={role}&branch={branch}"})]])

    message = update.callback_query.message if update.callback_query else update.message
    await message.reply_text(msg, reply_markup=keyboard)
    return ConversationHandler.END

async def settings_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    if query: await query.answer()
    telegram_id = update.effective_user.id
    user = crud.get_user_by_telegram_id(telegram_id)
    if not user: return await start(update, context)

    lang = user.get('language', 'ru')
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'change_language'), callback_data='setting_language')],
        [InlineKeyboardButton(get_text(lang, 'change_fio'), callback_data='setting_fio')],
        [InlineKeyboardButton(get_text(lang, 'change_role'), callback_data='setting_role')],
        [InlineKeyboardButton(get_text(lang, 'change_branch'), callback_data='setting_branch')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_main')]
    ])
    msg_text = get_text(lang, 'settings_menu')
    if query: await query.edit_message_text(msg_text, reply_markup=keyboard)
    else: await update.message.reply_text(msg_text, reply_markup=keyboard)
    return SETTINGS

async def setting_language_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    telegram_id = update.effective_user.id
    user = crud.get_user_by_telegram_id(telegram_id)
    new_lang = 'uz' if user.get('language', 'ru') == 'ru' else 'ru'
    crud.save_user(telegram_id, user['full_name'], user['role'], user['branch'], new_lang)
    await query.edit_message_text(get_text(new_lang, 'language_changed'))
    await start(update, context)
    return ConversationHandler.END

async def setting_fio_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    user = crud.get_user_by_telegram_id(update.effective_user.id)
    lang = user.get('language', 'ru')
    context.user_data.update({'language': lang, 'role': user['role'], 'branch': user['branch'], 'changing_setting': 'fio'})
    await query.delete_message()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=get_text(lang, 'enter_fio'), reply_markup=get_back_keyboard(lang))
    return FIO

async def setting_role_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    user = crud.get_user_by_telegram_id(update.effective_user.id)
    lang = user.get('language', 'ru')
    context.user_data.update({'language': lang, 'full_name': user['full_name'], 'changing_setting': 'role'})
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
        [InlineKeyboardButton(get_text(lang, 'role_snabjenec'), callback_data='role_snabjenec')],
        [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier'), callback_data='role_supplier')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_settings')]
    ])
    await query.edit_message_text(get_text(lang, 'select_role'), reply_markup=keyboard)
    return ROLE

async def setting_branch_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    user = crud.get_user_by_telegram_id(update.effective_user.id)
    lang = user.get('language', 'ru')
    context.user_data.update({'language': lang, 'full_name': user['full_name'], 'role': user['role'], 'changing_setting': 'branch'})
    keyboard = build_all_branches_keyboard('back_to_settings', lang)
    await query.edit_message_text(get_text(lang, 'select_branch'), reply_markup=keyboard)
    return BRANCH

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text('👋 До свидания!', reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END

def get_bot_handler():
    return ConversationHandler(
        entry_points=[CommandHandler('start', start), CommandHandler('settings', settings_menu), CallbackQueryHandler(settings_menu, pattern='^settings$')],
        states={
            LANGUAGE: [CallbackQueryHandler(language_selected, pattern='^lang_')],
            TYPE: [CallbackQueryHandler(type_selected, pattern='^type_')],
            FIO: [MessageHandler(filters.TEXT & ~filters.COMMAND, fio_entered)],
            ROLE: [CallbackQueryHandler(role_selected, pattern='^role_'), CallbackQueryHandler(settings_menu, pattern='^back_to_settings$')],
            PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, password_entered)],
            BRANCH: [CallbackQueryHandler(branch_selected, pattern='^branch_'), CallbackQueryHandler(settings_menu, pattern='^back_to_settings$')],
            SETTINGS: [
                CallbackQueryHandler(setting_language_handle, pattern='^setting_language$'),
                CallbackQueryHandler(setting_fio_handle, pattern='^setting_fio$'),
                CallbackQueryHandler(setting_role_handle, pattern='^setting_role$'),
                CallbackQueryHandler(setting_branch_handle, pattern='^setting_branch$'),
                CallbackQueryHandler(start, pattern='^back_to_main$'),
            ],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
        allow_reentry=True,
    )
