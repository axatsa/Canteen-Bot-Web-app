import os
import logging
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

WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://your-webapp-url.com')

# Conversation states
LANGUAGE, FIO, ROLE, PASSWORD, TYPE, BRANCH, SETTINGS = range(7)

ROLE_PASSWORDS = {
    'chef': 'P123',
    'financier': 'F123',
    'supplier': 'C123',
    'snabjenec': 'S123',
    'supplier_meat': 'C123',
    'supplier_products': 'C123',
}

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
BRANCH_NAMES['all'] = {'ru': 'Все филиалы', 'uz': 'Barcha filiallar'}

TEXTS = {
    'ru': {
        'welcome': '👋 Добро пожаловать в Optimizer!\n\nВыберите язык:',
        'enter_fio': '📝 Введите ваше ФИО (Фамилия Имя Отчество):',
        'select_role': '👤 Выберите вашу роль:',
        'enter_password': '🔐 Введите пароль для роли "{role}":',
        'wrong_password': '❌ Неверный пароль. Попробуйте ещё раз:',
        'select_type': '🏫 Вы работаете с садиком или школой?',
        'type_land': '🌱 Садики',
        'type_school': '🎓 Школы',
        'select_branch': '🏢 Выберите филиал:',
        'registration_complete': '✅ Готово! Регистрация завершена.\n\n👤 {name}\n🎭 Роль: {role}\n🏢 Филиал: {branch}\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        'registration_complete_no_branch': '✅ Готово! Регистрация завершена.\n\n👤 {name}\n🎭 Роль: {role}\n\nНажмите кнопку ниже, чтобы открыть приложение:',
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
        'already_registered_no_branch': '👋 С возвращением, {name}!\n\n🎭 Роль: {role}\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        'role_chef': '👨‍🍳 Шеф-повар',
        'role_snabjenec': '📦 Снабженец',
        'role_financier': '💼 Финансист',
        'role_supplier': '🚚 Поставщик (Общий)',
        'role_supplier_meat': '🥩 Поставщик мяса',
        'role_supplier_products': '🛒 Поставщик продуктов',
    },
    'uz': {
        'welcome': "👋 Optimizer'ga xush kelibsiz!\n\nTilni tanlang:",
        'enter_fio': '📝 F.I.O. kiriting:',
        'select_role': '👤 Rolingizni tanlang:',
        'enter_password': '🔐 "{role}" roli uchun parolni kiriting:',
        'wrong_password': "❌ Noto'g'ri parol. Qayta urinib ko'ring:",
        'select_type': '🏫 Bog\'cha yoki maktab bilan ishleysizmi?',
        'type_land': '🌱 Bog\'chalar',
        'type_school': '🎓 Maktablar',
        'select_branch': '🏢 Filialni tanlang:',
        'registration_complete': "✅ Tayyor! Ro'yxatdan o'tish yakunlandi.\n\n👤 {name}\n🎭 Rol: {role}\n🏢 Filial: {branch}\n\nIlovani ochish uchun quyidagi tugmani bosing:",
        'registration_complete_no_branch': "✅ Tayyor! Ro'yxatdan o'tish yakunlandi.\n\n👤 {name}\n🎭 Rol: {role}\n\nIlovani ochish uchun quyidagi tugmani bosing:",
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
        'already_registered_no_branch': "👋 Qaytib kelganingizdan xursandmiz, {name}!\n\n🎭 Rol: {role}\n\nIlovani ochish uchun quyidagi tugmani bosing:",
        'role_chef': '👨‍🍳 Oshpaz',
        'role_snabjenec': "📦 Ta'minotchi",
        'role_financier': '💼 Moliyachi',
        'role_supplier': '🚚 Yetkazuvchi (Umumiy)',
        'role_supplier_meat': '🥩 Go‘sht yetkazib beruvchi',
        'role_supplier_products': '🛒 Mahsulot yetkazib beruvchi',
    }
}


def get_text(lang: str, key: str, **kwargs) -> str:
    text = TEXTS.get(lang, TEXTS['ru']).get(key, TEXTS['ru'].get(key, key))
    if kwargs:
        text = text.format(**kwargs)
    return text


def get_back_keyboard(lang: str) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup([[get_text(lang, 'back')]], resize_keyboard=True)


def build_branch_keyboard(inst_type: str, back_cb: str) -> InlineKeyboardMarkup:
    branches = LAND_BRANCHES if inst_type == 'land' else SCHOOL_BRANCHES
    rows = []
    for i in range(0, len(branches), 2):
        row = [InlineKeyboardButton(name, callback_data=f'branch_{bid}') for bid, name in branches[i:i+2]]
        rows.append(row)
    rows.append([InlineKeyboardButton('⬅️ Назад', callback_data=back_cb)])
    return InlineKeyboardMarkup(rows)


def build_all_branches_keyboard(back_cb: str) -> InlineKeyboardMarkup:
    rows = []
    land_row_label = [InlineKeyboardButton('── 🌱 Садики ──', callback_data='noop')]
    rows.append(land_row_label)
    for i in range(0, len(LAND_BRANCHES), 2):
        row = [InlineKeyboardButton(name, callback_data=f'branch_{bid}') for bid, name in LAND_BRANCHES[i:i+2]]
        rows.append(row)
    school_row_label = [InlineKeyboardButton('── 🎓 Школы ──', callback_data='noop')]
    rows.append(school_row_label)
    for i in range(0, len(SCHOOL_BRANCHES), 2):
        row = [InlineKeyboardButton(name, callback_data=f'branch_{bid}') for bid, name in SCHOOL_BRANCHES[i:i+2]]
        rows.append(row)
    rows.append([InlineKeyboardButton('⬅️ Назад', callback_data=back_cb)])
    return InlineKeyboardMarkup(rows)


def _role_keyboard(lang: str, back_cb: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(get_text(lang, 'role_chef'), callback_data='role_chef')],
        [InlineKeyboardButton(get_text(lang, 'role_snabjenec'), callback_data='role_snabjenec')],
        [InlineKeyboardButton(get_text(lang, 'role_financier'), callback_data='role_financier')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier_meat'), callback_data='role_supplier_meat')],
        [InlineKeyboardButton(get_text(lang, 'role_supplier_products'), callback_data='role_supplier_products')],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data=back_cb)],
    ])


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    telegram_id = update.effective_user.id
    user = crud.get_user_by_telegram_id(telegram_id)

    if user:
        lang = user.get('language', 'ru')
        role_text = get_text(lang, f"role_{user['role']}")
        branch = user.get('branch', 'all')

        if branch == 'all':
            msg = get_text(lang, 'already_registered_no_branch', name=user['full_name'], role=role_text)
        else:
            branch_name = BRANCH_NAMES.get(branch, branch)
            msg = get_text(lang, 'already_registered', name=user['full_name'], role=role_text, branch=branch_name)

        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(get_text(lang, 'open_app'), web_app={'url': f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={user['role']}&branch={branch}"})],
            [InlineKeyboardButton(get_text(lang, 'settings'), callback_data='settings')],
        ])
        await update.effective_message.reply_text(msg, reply_markup=keyboard)
        return ConversationHandler.END

    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton('🇷🇺 Русский', callback_data='lang_ru'),
        InlineKeyboardButton("🇺🇿 O'zbekcha", callback_data='lang_uz'),
    ]])
    await update.effective_message.reply_text(TEXTS['ru']['welcome'], reply_markup=keyboard)
    return LANGUAGE


async def language_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = query.data.split('_')[1]
    context.user_data['language'] = lang
    await query.delete_message()
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_fio'),
        reply_markup=get_back_keyboard(lang),
    )
    return FIO


async def fio_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    lang = context.user_data.get('language', 'ru')
    text = update.message.text

    if text == get_text(lang, 'back'):
        if context.user_data.get('changing_setting') == 'fio':
            return await settings_menu(update, context)
        return await start(update, context)

    context.user_data['full_name'] = text

    if context.user_data.get('changing_setting') == 'fio':
        user = crud.get_user_by_telegram_id(update.effective_user.id)
        crud.save_user(update.effective_user.id, text, user['role'], user['branch'], lang)
        await update.message.reply_text(get_text(lang, 'fio_changed', name=text), reply_markup=ReplyKeyboardRemove())
        return await settings_menu(update, context)

    msg = await update.message.reply_text('⏳', reply_markup=ReplyKeyboardRemove())
    await msg.delete()

    await update.message.reply_text(
        get_text(lang, 'select_role'),
        reply_markup=_role_keyboard(lang, 'back_to_fio'),
    )
    return ROLE


async def role_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    data = query.data

    if data == 'back_to_settings':
        return await settings_menu(update, context)
    if data == 'back_to_fio':
        await query.delete_message()
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=get_text(lang, 'enter_fio'),
            reply_markup=get_back_keyboard(lang),
        )
        return FIO

    role = data[5:]  # strip "role_"
    context.user_data['role'] = role
    await query.delete_message()
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_password', role=get_text(lang, f'role_{role}')),
        reply_markup=get_back_keyboard(lang),
    )
    return PASSWORD


async def password_entered(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    lang = context.user_data.get('language', 'ru')
    role = context.user_data.get('role')
    text = update.message.text.strip()

    if text == get_text(lang, 'back'):
        back_cb = 'back_to_settings' if context.user_data.get('changing_setting') == 'role' else 'back_to_fio'
        await update.message.reply_text(
            get_text(lang, 'select_role'),
            reply_markup=_role_keyboard(lang, back_cb),
        )
        return ROLE

    if text != ROLE_PASSWORDS.get(role):
        await update.message.reply_text(get_text(lang, 'wrong_password'), reply_markup=get_back_keyboard(lang))
        return PASSWORD

    msg = await update.message.reply_text('⏳', reply_markup=ReplyKeyboardRemove())
    await msg.delete()

    # Supplier / snabjenec / financier — no branch needed
    if role in ('financier', 'supplier', 'snabjenec', 'supplier_meat', 'supplier_products'):
        context.user_data['branch'] = 'all'
        return await finalize_registration(update, context)

    # Chef — ask land or school first
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(get_text(lang, 'type_land'), callback_data='type_land'),
            InlineKeyboardButton(get_text(lang, 'type_school'), callback_data='type_school'),
        ],
        [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_role')],
    ])
    await update.message.reply_text(get_text(lang, 'select_type'), reply_markup=keyboard)
    return TYPE


async def type_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    data = query.data

    if data == 'back_to_role':
        await query.delete_message()
        back_cb = 'back_to_settings' if context.user_data.get('changing_setting') == 'role' else 'back_to_fio'
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=get_text(lang, 'select_role'),
            reply_markup=_role_keyboard(lang, back_cb),
        )
        return ROLE

    inst_type = data[5:]  # strip "type_"
    context.user_data['inst_type'] = inst_type
    await query.edit_message_text(
        get_text(lang, 'select_branch'),
        reply_markup=build_branch_keyboard(inst_type, 'back_to_type'),
    )
    return BRANCH


async def branch_selected(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    lang = context.user_data.get('language', 'ru')
    data = query.data

    if data == 'noop':
        return BRANCH

    if data == 'back_to_type':
        inst_type = context.user_data.get('inst_type', 'land')
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton(get_text(lang, 'type_land'), callback_data='type_land'),
                InlineKeyboardButton(get_text(lang, 'type_school'), callback_data='type_school'),
            ],
            [InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_role')],
        ])
        await query.edit_message_text(get_text(lang, 'select_type'), reply_markup=keyboard)
        return TYPE

    if data == 'back_to_settings':
        return await settings_menu(update, context)

    branch_id = data[7:]  # strip "branch_"
    context.user_data['branch'] = branch_id

    if context.user_data.get('changing_setting') == 'branch':
        user = crud.get_user_by_telegram_id(update.effective_user.id)
        crud.save_user(update.effective_user.id, user['full_name'], user['role'], branch_id, lang)
        branch_name = BRANCH_NAMES.get(branch_id, branch_id)
        await query.edit_message_text(get_text(lang, 'branch_changed', branch=branch_name))
        return await settings_menu(update, context)

    return await finalize_registration(update, context)


async def finalize_registration(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    telegram_id = update.effective_user.id
    lang = context.user_data.get('language', 'ru')
    full_name = context.user_data.get('full_name')
    role = context.user_data.get('role')
    branch = context.user_data.get('branch', 'all')

    crud.save_user(telegram_id, full_name, role, branch, lang)

    role_text = get_text(lang, f'role_{role}')
    webapp_url = f"{WEBAPP_URL}?user_id={telegram_id}&lang={lang}&role={role}&branch={branch}"

    if branch == 'all':
        msg = get_text(lang, 'registration_complete_no_branch', name=full_name, role=role_text)
    else:
        branch_name = BRANCH_NAMES.get(branch, branch)
        msg = get_text(lang, 'registration_complete', name=full_name, role=role_text, branch=branch_name)

    keyboard = InlineKeyboardMarkup([[
        InlineKeyboardButton(get_text(lang, 'open_app'), web_app={'url': webapp_url}),
    ]])

    message = update.callback_query.message if update.callback_query else update.message
    await message.reply_text(msg, reply_markup=keyboard)
    return ConversationHandler.END


async def settings_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    if query:
        await query.answer()
    telegram_id = update.effective_user.id
    user = crud.get_user_by_telegram_id(telegram_id)
    if not user:
        return await start(update, context)

    lang = user.get('language', 'ru')
    role = user.get('role', '')
    rows = [
        [InlineKeyboardButton(get_text(lang, 'change_language'), callback_data='setting_language')],
        [InlineKeyboardButton(get_text(lang, 'change_fio'), callback_data='setting_fio')],
        [InlineKeyboardButton(get_text(lang, 'change_role'), callback_data='setting_role')],
    ]
    # Only chef has a branch
    if role == 'chef':
        rows.append([InlineKeyboardButton(get_text(lang, 'change_branch'), callback_data='setting_branch')])
    rows.append([InlineKeyboardButton(get_text(lang, 'back'), callback_data='back_to_main')])

    keyboard = InlineKeyboardMarkup(rows)
    msg_text = get_text(lang, 'settings_menu')

    if query:
        await query.edit_message_text(msg_text, reply_markup=keyboard)
    else:
        await update.message.reply_text(msg_text, reply_markup=keyboard)
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
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=get_text(lang, 'enter_fio'),
        reply_markup=get_back_keyboard(lang),
    )
    return FIO


async def setting_role_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    user = crud.get_user_by_telegram_id(update.effective_user.id)
    lang = user.get('language', 'ru')
    context.user_data.update({'language': lang, 'full_name': user['full_name'], 'changing_setting': 'role'})
    await query.edit_message_text(
        get_text(lang, 'select_role'),
        reply_markup=_role_keyboard(lang, 'back_to_settings'),
    )
    return ROLE


async def setting_branch_handle(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    user = crud.get_user_by_telegram_id(update.effective_user.id)
    lang = user.get('language', 'ru')
    context.user_data.update({'language': lang, 'full_name': user['full_name'], 'role': user['role'], 'changing_setting': 'branch'})
    await query.edit_message_text(
        get_text(lang, 'select_branch'),
        reply_markup=build_all_branches_keyboard('back_to_settings'),
    )
    return BRANCH


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text('👋 До свидания!', reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END


def get_bot_handler():
    return ConversationHandler(
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
                CallbackQueryHandler(settings_menu, pattern='^back_to_settings$'),
            ],
            PASSWORD: [MessageHandler(filters.TEXT & ~filters.COMMAND, password_entered)],
            TYPE: [
                CallbackQueryHandler(type_selected, pattern='^type_'),
                CallbackQueryHandler(type_selected, pattern='^back_to_role$'),
            ],
            BRANCH: [
                CallbackQueryHandler(branch_selected, pattern='^branch_'),
                CallbackQueryHandler(branch_selected, pattern='^back_to_type$'),
                CallbackQueryHandler(branch_selected, pattern='^back_to_settings$'),
                CallbackQueryHandler(branch_selected, pattern='^noop$'),
            ],
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
