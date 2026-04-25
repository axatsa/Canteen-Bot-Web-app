import { Product } from '@/lib/api';

export const MASTER_PRODUCT_LIST: Product[] = [
    // 🥛 Молочные продукты
    { id: '1', name: 'Молоко (Sut)', category: '🥛 Молочные продукты', quantity: 0, unit: 'л' },
    { id: '2', name: 'Кефир (Kefir)', category: '🥛 Молочные продукты', quantity: 0, unit: 'л' },
    { id: '3', name: 'Творог (Tvorog / Suzma)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '4', name: 'Каймак (Qaymoq)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '5', name: 'Сметана (Smetana / Qaymoqcha)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '6', name: 'Сыр твёрдый (Qattiq pishloq)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '7', name: 'Сыр плавленый (Eritilgan pishloq)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '8', name: 'Сыр моцарелла (Motsarella pishlog‘i)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '9', name: 'Сыр Ханский (Xon pishlog‘i)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '10', name: 'Сырок (Shirin pishloqcha)', category: '🥛 Молочные продукты', quantity: 0, unit: 'шт' },
    { id: '11', name: 'Сливочное масло (Sariyog‘)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },
    { id: '12', name: 'Маргарин «Шедрое лето» (Margarin)', category: '🥛 Молочные продукты', quantity: 0, unit: 'кг' },

    // 🥚 Яйца и мясо
    { id: '13', name: 'Яйца куриные (Tovuq tuxumi)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'шт' },
    { id: '14', name: 'Яйца перепелиные (Bedana tuxumi)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'шт' },
    { id: '15', name: 'Индейка (Kurka go‘shti)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'кг' },
    { id: '16', name: 'Колбаса варёная (Qaynatilgan kolbasa)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'кг' },
    { id: '17', name: 'Колбаса копчёная (Dudlangan kolbasa)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'кг' },
    { id: '18', name: 'Сосиски (Sosiska)', category: '🥚 Яйца и мясо', quantity: 0, unit: 'кг' },

    // 🍞 Хлеб и мучное
    { id: '19', name: 'Мука (Un)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '20', name: 'Лаваш (Lavash non)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'шт' },
    { id: '21', name: 'Хлеб (Non)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'шт' },
    { id: '22', name: 'Тостовый хлеб (Tost noni)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'шт' },
    { id: '23', name: 'Манпар (тесто) (Xamir)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '24', name: 'Макароны (Makaron)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '25', name: 'Спагетти (Spagetti)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '26', name: 'Вермишель (Vermishel)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '27', name: 'Фунчоза (Funchuza)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '28', name: 'Манная крупа (Manka yormasi)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },
    { id: '29', name: 'Овсянка (Suli yormasi)', category: '🍞 Хлеб и мучное', quantity: 0, unit: 'кг' },

    // 🍚 Крупы и бобовые
    { id: '30', name: 'Рис (Guruch)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'кг' },
    { id: '31', name: 'Рис обычный (Oddiy guruch)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'кг' },
    { id: '32', name: 'Рис Лазер (Lazer guruch)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'кг' },
    { id: '33', name: 'Перловка (Arpa yormasi)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'кг' },
    { id: '34', name: 'Нут / горох (No‘xat)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'кг' },
    { id: '35', name: 'Горох (консерва) (Konserva no‘xat)', category: '🍚 Крупы и бобовые', quantity: 0, unit: 'шт' },

    // 🧂 Специи и приправы
    { id: '36', name: 'Соль (Tuz)', category: '🧂 Специи и приправы', quantity: 0, unit: 'кг' },
    { id: '37', name: 'Корейская соль (Koreys tuzi)', category: '🧂 Специи и приправы', quantity: 0, unit: 'кг' },
    { id: '38', name: 'Зира (Zira)', category: '🧂 Специи и приправы', quantity: 0, unit: 'г' },
    { id: '39', name: 'Приправа для лагмана (Lag‘mon ziravori)', category: '🧂 Специи и приправы', quantity: 0, unit: 'г' },
    { id: '40', name: 'Лавровый лист (Dafna bargi)', category: '🧂 Специи и приправы', quantity: 0, unit: 'шт' },
    { id: '41', name: 'Роллтон (приправа) (Rollton ziravori)', category: '🧂 Специи и приправы', quantity: 0, unit: 'шт' },
    { id: '42', name: 'Кунжут (Kunjut)', category: '🧂 Специи и приправы', quantity: 0, unit: 'г' },

    // ☕ Напитки и сладкое
    { id: '43', name: 'Какао (Kakao)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },
    { id: '44', name: 'Чёрный чай (Qora choy)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },
    { id: '45', name: 'Сахар (Shakar)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },
    { id: '46', name: 'Варенье (Murabbo)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },
    { id: '47', name: 'Шоколадная паста (Shokolad pastasi)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'шт' },
    { id: '48', name: 'Миллер (вафли) (Vafli)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'шт' },
    { id: '49', name: 'Изюм (Mayiz)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },
    { id: '50', name: 'Грецкий орех (Yong‘oq)', category: '☕ Напитки и сладкое', quantity: 0, unit: 'кг' },

    // 🥫 Соусы и добавки
    { id: '51', name: 'Майонез (Mayonez)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'кг' },
    { id: '52', name: 'Соевый соус (Soya sousi)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'л' },
    { id: '53', name: 'Уксус (Sirka)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'л' },
    { id: '54', name: 'Томатная паста (Tomat pastasi)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'кг' },
    { id: '55', name: 'Кетчуп (Ketchup)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'шт' },
    { id: '56', name: 'Масло растительное (O‘simlik yog‘i)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'л' },
    { id: '57', name: 'Сода (Soda)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'шт' },
    { id: '58', name: 'Дрожжи (Xamirturush)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'шт' },
    { id: '59', name: 'Разрыхлитель (Pishirish kukuni)', category: '🥫 Соусы и добавки', quantity: 0, unit: 'шт' },

    // 🥕 Овощи и зелень
    { id: '60', name: 'Картофель (Kartoshka)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '61', name: 'Морковь красная (Qizil sabzi)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '62', name: 'Морковь жёлтая (Sariq sabzi)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '63', name: 'Капуста зелёная (Yashil karam)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '64', name: 'Капуста красная (Qizil karam)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '65', name: 'Капуста квашеная (Tuzlangan karam)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '66', name: 'Помидоры (Pomidor)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '67', name: 'Огурцы (Bodring)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '68', name: 'Солёные огурцы (Tuzlangan bodring)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '69', name: 'Болгарский перец (Bulgar qalampiri)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '70', name: 'Болгарский перец «Светофор» (Rangli qalampir)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '71', name: 'Лук (Piyoz)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '72', name: 'Сельдерей (Selderey)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '73', name: 'Корейская морковь (Koreyscha sabzi)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '74', name: 'Укроп (Shivit)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '75', name: 'Кинза (Kashnich)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '76', name: 'Свекла красная (Qizil lavlagi)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },
    { id: '77', name: 'Редька белая (Oq turup)', category: '🥕 Овощи и зелень', quantity: 0, unit: 'кг' },

    // 🍎 Фрукты
    { id: '78', name: 'Бананы (Banan)', category: '🍎 Фрукты', quantity: 0, unit: 'кг' },
    { id: '79', name: 'Яблоки (Olma)', category: '🍎 Фрукты', quantity: 0, unit: 'кг' },
    { id: '80', name: 'Груша (Nok)', category: '🍎 Фрукты', quantity: 0, unit: 'кг' },
    { id: '81', name: 'Лимоны (Limon)', category: '🍎 Фрукты', quantity: 0, unit: 'кг' } 
];
