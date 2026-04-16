// Localization data for RU/UZ languages

export type Language = 'ru' | 'uz';

export type TranslationKey = keyof typeof translations.ru;

export const translations = {
    ru: {
        // Role Selector
        appTitle: 'Optimizer',
        selectRole: 'Выберите вашу роль для продолжения',
        chef: 'Шеф-повар',
        chefDesc: 'Создание списка продуктов',
        financier: 'Финансист',
        financierDesc: 'Проверка и корректировка',
        supplier: 'Поставщик',
        supplierDesc: 'Установка цен и доставка',

        // Common
        back: 'Назад',
        send: 'Отправить',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        add: 'Добавить',
        refresh: 'Обновить',
        total: 'Итого',
        positions: 'Позиций',
        branch: 'Филиал',
        date: 'Дата',
        sum: 'сум',
        readOnly: 'Только чтение',
        noOrders: 'Нет заявок',

        // Branches
        branchChilanzar: 'Чиланзар (Новза)',
        branchUchtepa: 'Учтепа',
        branchShayzantaur: 'Шайзантаур',
        branchOlmazar: 'Олмазар',
        branchAll: 'Все филиалы',
        selectBranch: 'Выберите филиал',
        selectBranchDesc: 'С каким филиалом вы работаете?',
        checkDeliveries: 'Проверить привоз',
        checkDeliveriesDesc: 'Что привезли сегодня?',
        orSelectBranch: 'Или выберите филиал',
        hasDelivery: 'Есть привоз для проверки',

        // Chef View
        chefTitle: 'Шеф-повар',
        sendToFinancier: 'Отправить',
        finishCheck: 'Завершить',
        deliveryComment: 'Ваш комментарий по доставке...',
        price: 'Цена',

        // Financier View
        financierTitle: 'Финансист',
        allOrders: 'Все заявки',
        incomingOrders: 'Входящие заявки',
        finalCheckOrders: 'Заявки на финальную проверку',
        archive: 'Архив',
        orderFromChef: 'Заявка от шеф-повара',
        orderFromSupplier: 'Заявка от поставщика',
        orderAfterChefCheck: 'Заявка после проверки шеф-повара',
        clickForDetails: 'Нажмите для детального просмотра',
        totalAmount: 'Общая сумма',
        totalPrice: 'Общая стоимость',
        approve: 'Утвердить',
        complete: 'Завершить',
        newProduct: 'Новый товар',
        productName: 'Наименование',
        quantity: 'Кол-во',
        unit: 'Ед. изм.',
        category: 'Категория',
        filterByBranch: 'Фильтр по филиалу',
        allBranches: 'Все филиалы',

        // Supplier View
        supplierTitle: 'Поставщик',
        noOrdersYet: 'Заказов пока нет',
        noOrdersDesc: 'Сейчас нет новых заявок для обработки.',
        pricePerUnit: 'Цена за ед.',
        comment: 'Комментарий...',
        filled: 'Заполнено',
        deliveryDate: 'Дата доставки',
        estimatedDelivery: 'Ожидаемая доставка',
        delivered: 'Доставлено',

        // Status
        statusSentToChef: 'Отправлено шефу',
        statusSentToFinancier: 'У финансиста',
        statusSentToSupplier: 'У поставщика',
        statusSupplierCollecting: 'Сборка заказа',
        statusSupplierDelivering: 'Доставка',
        statusChefChecking: 'Проверка шефа',
        statusFinancierChecking: 'Финальная проверка',
        statusCompleted: 'Завершено',

        // Alerts - friendly versions
        alertListSent: 'Готово! Список улетел к финансисту 🚀',
        alertCheckComplete: 'Супер! Отправлено финансисту на финальную проверку ✅',
        alertApproved: 'Отлично! Список одобрен и отправлен поставщику 📦',
        alertOrderComplete: 'Ура! Заказ успешно завершён! 🎉',
        alertSentToChef: 'Готово! Заявка отправлена шеф-повару на проверку 👨‍🍳',
        alertNoProducts: 'Подождите! Укажите количество хотя бы для одного продукта 📝',
        alertNoPrices: 'Стоп! Укажите цену для всех товаров. Финансист не примет без цен 💰',
        alertNoDeliveries: 'Пока ничего не привезли 📭',
        alertDeleteConfirm: 'Удалить этот продукт?',

        // Example products
        exampleProduct: 'Например: Помидоры Черри',
    },
    uz: {
        // Role Selector
        appTitle: 'Optimizer',
        selectRole: 'Davom etish uchun rolingizni tanlang',
        chef: 'Oshpaz',
        chefDesc: 'Mahsulotlar ro\'yxatini yaratish',
        financier: 'Moliyachi',
        financierDesc: 'Tekshirish va tuzatish',
        supplier: 'Yetkazuvchi',
        supplierDesc: 'Narxlarni belgilash va yetkazish',

        // Common
        back: 'Orqaga',
        send: 'Yuborish',
        save: 'Saqlash',
        cancel: 'Bekor qilish',
        delete: 'O\'chirish',
        edit: 'Tahrirlash',
        add: 'Qo\'shish',
        refresh: 'Yangilash',
        total: 'Jami',
        positions: 'Pozitsiyalar',
        branch: 'Filial',
        date: 'Sana',
        sum: 'so\'m',
        readOnly: 'Faqat o\'qish',
        noOrders: 'Buyurtmalar yo\'q',

        // Branches
        branchChilanzar: 'Chilonzor (Novza)',
        branchUchtepa: 'Uchtepa',
        branchShayzantaur: 'Shayxontohur',
        branchOlmazar: 'Olmazor',
        branchAll: 'Barcha filiallar',
        selectBranch: 'Filialni tanlang',
        selectBranchDesc: 'Qaysi filial bilan ishleysiz?',
        checkDeliveries: 'Привозни текшириш',
        checkDeliveriesDesc: 'Bugun nima келишди?',
        orSelectBranch: 'Yoki filialni tanlang',
        hasDelivery: 'Tekshirish uchun mahsulot kelgan',

        // Chef View
        chefTitle: 'Oshpaz',
        sendToFinancier: 'Yuborish',
        finishCheck: 'Tugatish',
        deliveryComment: 'Yetkazib berish bo\'yicha izoh...',
        price: 'Narx',

        // Financier View
        financierTitle: 'Moliyachi',
        allOrders: 'Barcha buyurtmalar',
        incomingOrders: 'Kiruvchi buyurtmalar',
        finalCheckOrders: 'Yakuniy tekshiruv uchun buyurtmalar',
        archive: 'Arxiv',
        orderFromChef: 'Oshpazdan buyurtma',
        orderFromSupplier: 'Yetkazuvchidan buyurtma',
        orderAfterChefCheck: 'Oshpaz tekshiruvidan so\'ng buyurtma',
        clickForDetails: 'Batafsil ko\'rish uchun bosing',
        totalAmount: 'Umumiy summa',
        totalPrice: 'Umumiy narx',
        approve: 'Tasdiqlash',
        complete: 'Yakunlash',
        newProduct: 'Yangi mahsulot',
        productName: 'Nomi',
        quantity: 'Miqdor',
        unit: 'O\'lchov',
        category: 'Kategoriya',
        filterByBranch: 'Filial bo\'yicha filter',
        allBranches: 'Barcha filiallar',

        // Supplier View
        supplierTitle: 'Yetkazuvchi',
        noOrdersYet: 'Hozircha buyurtmalar yo\'q',
        noOrdersDesc: 'Hozirda yangi buyurtmalar yo\'q.',
        pricePerUnit: 'Birlik narxi',
        comment: 'Izoh...',
        filled: 'To\'ldirilgan',
        deliveryDate: 'Yetkazish sanasi',
        estimatedDelivery: 'Taxminiy yetkazish',
        delivered: 'Yetkazildi',

        // Status
        statusSentToChef: 'Oshpazga yuborildi',
        statusSentToFinancier: 'Moliyachida',
        statusSentToSupplier: 'Yetkazuvchida',
        statusSupplierCollecting: 'Buyurtma yig\'ilmoqda',
        statusSupplierDelivering: 'Yetkazilmoqda',
        statusChefChecking: 'Oshpaz tekshiruvi',
        statusFinancierChecking: 'Yakuniy tekshiruv',
        statusCompleted: 'Yakunlandi',

        // Alerts - friendly versions
        alertListSent: 'Tayyor! Ro\'yxat moliyachiga yuborildi 🚀',
        alertCheckComplete: 'Zo\'r! Yakuniy tekshiruv uchun moliyachiga yuborildi ✅',
        alertApproved: 'A\'lo! Ro\'yxat tasdiqlandi va yetkazuvchiga yuborildi 📦',
        alertOrderComplete: 'Ura! Buyurtma muvaffaqiyatli yakunlandi! 🎉',
        alertSentToChef: 'Tayyor! Buyurtma oshpazga tekshiruv uchun yuborildi 👨‍🍳',
        alertNoProducts: 'Kuting! Kamida bitta mahsulot miqdorini kiriting 📝',
        alertNoPrices: 'To\'xtang! Barcha mahsulotlar uchun narx kiriting. Moliyachi narxsiz qabul qilmaydi 💰',
        alertNoDeliveries: 'Hozircha yetkazib berish yo\'q 📭',
        alertDeleteConfirm: 'Bu mahsulotni o\'chirish kerakmi?',

        // Example products
        exampleProduct: 'Masalan: Pomidor Cherri',
    }
} as const;

export function getTranslation(lang: Language, key: TranslationKey): string {
    return translations[lang]?.[key] ?? translations.ru[key] ?? key;
}


