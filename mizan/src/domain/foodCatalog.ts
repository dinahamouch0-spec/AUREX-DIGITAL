/**
 * Built-in food reference table.
 *
 * Source: USDA FoodData Central, SR Legacy / Foundation entries (public domain),
 * values per 100 g of the food as described (raw vs cooked matters), rounded to
 * one decimal. Real foods vary by brand, variety and preparation, so logged values
 * are marked as estimates and the user can always edit them.
 *
 * Deliberately excluded: branded products (protein powders, bars, soft drinks by brand)
 * and dishes without a reliable public reference, rather than inventing numbers.
 */

export type FoodCategory = 'protein' | 'dairy' | 'grains' | 'legumes' | 'vegetables' | 'fruits' | 'nuts' | 'fats' | 'drinks' | 'sweets' | 'prepared';
export const FOOD_CATEGORIES: FoodCategory[] = ['protein', 'dairy', 'grains', 'legumes', 'vegetables', 'fruits', 'nuts', 'fats', 'drinks', 'sweets', 'prepared'];

export interface FoodServing {
  label: string;
  label_ar: string;
  grams: number;
}

export interface CatalogFood {
  id: string;
  name: string;
  name_ar: string;
  category: FoodCategory;
  /** per 100 g */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  servings: FoodServing[];
}

export const FOOD_SOURCE = 'USDA FoodData Central (SR Legacy)';

const g100: FoodServing = { label: '100 g', label_ar: '١٠٠ غ', grams: 100 };
const s = (label: string, label_ar: string, grams: number): FoodServing => ({ label, label_ar, grams });
const tbsp = (grams: number) => s('1 tbsp', 'ملعقة كبيرة', grams);
const cup = (grams: number) => s('1 cup', 'كوب', grams);

type Row = [id: string, name: string, name_ar: string, category: FoodCategory, kcal: number, protein: number, carbs: number, fat: number, fiber: number | null, servings: FoodServing[]];

const ROWS: Row[] = [
  // protein
  ['chicken_breast_cooked', 'Chicken breast, cooked (skinless)', 'صدر دجاج مطبوخ (بدون جلد)', 'protein', 165, 31, 0, 3.6, 0, [s('1 breast', 'صدر واحد', 172), s('1 palm portion', 'حصة بحجم الكف', 120)]],
  ['chicken_breast_raw', 'Chicken breast, raw (skinless)', 'صدر دجاج نيء (بدون جلد)', 'protein', 120, 22.5, 0, 2.6, 0, [s('1 breast', 'صدر واحد', 200)]],
  ['chicken_thigh_cooked', 'Chicken thigh, roasted (skinless)', 'فخذ دجاج مشوي (بدون جلد)', 'protein', 209, 26, 0, 10.9, 0, [s('1 thigh', 'فخذ واحد', 52)]],
  ['beef_ground_85_cooked', 'Ground beef 85% lean, cooked', 'لحم بقر مفروم ٨٥٪ مطبوخ', 'protein', 250, 25.9, 0, 15.4, 0, [s('1 patty', 'قرص واحد', 85)]],
  ['lamb_ground_cooked', 'Ground lamb, cooked', 'لحم غنم مفروم مطبوخ', 'protein', 283, 24.8, 0, 19.7, 0, [s('1 portion', 'حصة', 85)]],
  ['salmon_cooked', 'Salmon (Atlantic, farmed), cooked', 'سلمون مطبوخ', 'protein', 206, 22.1, 0, 12.4, 0, [s('1 fillet', 'شريحة', 150)]],
  ['tuna_canned_water', 'Tuna, canned in water, drained', 'تونة معلبة بالماء (مصفّاة)', 'protein', 116, 25.5, 0, 0.8, 0, [s('1 can (drained)', 'علبة (مصفّاة)', 120)]],
  ['tilapia_cooked', 'Tilapia, cooked', 'سمك بلطي مطبوخ', 'protein', 128, 26.2, 0, 2.7, 0, [s('1 fillet', 'شريحة', 87)]],
  ['shrimp_cooked', 'Shrimp, cooked', 'قريدس (جمبري) مطبوخ', 'protein', 99, 24, 0.2, 0.3, 0, [s('1 portion', 'حصة', 85)]],
  ['egg_whole', 'Egg, whole, raw', 'بيضة كاملة نيئة', 'protein', 143, 12.6, 0.7, 9.5, 0, [s('1 large egg', 'بيضة كبيرة', 50)]],
  ['egg_boiled', 'Egg, hard-boiled', 'بيضة مسلوقة', 'protein', 155, 12.6, 1.1, 10.6, 0, [s('1 large egg', 'بيضة كبيرة', 50)]],
  ['egg_white', 'Egg white, raw', 'بياض بيض نيء', 'protein', 52, 10.9, 0.7, 0.2, 0, [s('1 large white', 'بياض بيضة كبيرة', 33)]],
  ['tofu_firm', 'Tofu, firm', 'توفو صلب', 'protein', 144, 17.3, 2.8, 8.7, 2.3, [s('1/2 cup', 'نصف كوب', 126)]],
  ['turkey_breast_roasted', 'Turkey breast, roasted', 'صدر ديك رومي مشوي', 'protein', 135, 30.1, 0, 0.7, 0, [s('1 portion', 'حصة', 85)]],

  // dairy
  ['milk_whole', 'Milk, whole (3.25%)', 'حليب كامل الدسم', 'dairy', 61, 3.2, 4.8, 3.3, 0, [cup(244)]],
  ['milk_low_fat', 'Milk, low-fat (1%)', 'حليب قليل الدسم (١٪)', 'dairy', 42, 3.4, 5, 1, 0, [cup(244)]],
  ['milk_skim', 'Milk, skim', 'حليب خالي الدسم', 'dairy', 34, 3.4, 5, 0.1, 0, [cup(245)]],
  ['greek_yogurt_nonfat', 'Greek yogurt, plain, nonfat', 'لبن يوناني خالي الدسم', 'dairy', 59, 10.2, 3.6, 0.4, 0, [s('1 container', 'علبة', 170)]],
  ['greek_yogurt_whole', 'Greek yogurt, plain, whole milk', 'لبن يوناني كامل الدسم', 'dairy', 97, 9, 4, 5, 0, [s('1 container', 'علبة', 170)]],
  ['yogurt_plain_whole', 'Yogurt, plain, whole milk', 'لبن (زبادي) كامل الدسم', 'dairy', 61, 3.5, 4.7, 3.3, 0, [cup(245)]],
  ['cheddar', 'Cheddar cheese', 'جبنة شيدر', 'dairy', 403, 24.9, 1.3, 33.1, 0, [s('1 slice', 'شريحة', 28)]],
  ['mozzarella_part_skim', 'Mozzarella, part-skim', 'جبنة موزاريلا قليلة الدسم', 'dairy', 254, 24.3, 2.8, 15.9, 0, [s('1 slice', 'شريحة', 28)]],
  ['feta', 'Feta cheese', 'جبنة فيتا', 'dairy', 264, 14.2, 4.1, 21.3, 0, [s('1 cube portion', 'قطعة', 28)]],
  ['cottage_cheese_2', 'Cottage cheese, 2% fat', 'جبنة قريش ٢٪', 'dairy', 81, 10.5, 4.8, 2.3, 0, [s('1/2 cup', 'نصف كوب', 113)]],
  ['butter', 'Butter', 'زبدة', 'dairy', 717, 0.9, 0.1, 81.1, 0, [tbsp(14)]],

  // grains
  ['rice_white_cooked', 'White rice, cooked', 'أرز أبيض مطبوخ', 'grains', 130, 2.7, 28.2, 0.3, 0.4, [cup(158), s('1 plate portion', 'صحن', 200)]],
  ['rice_brown_cooked', 'Brown rice, cooked', 'أرز بني مطبوخ', 'grains', 123, 2.7, 25.6, 1, 1.6, [cup(195)]],
  ['pasta_cooked', 'Pasta, cooked', 'معكرونة مطبوخة', 'grains', 158, 5.8, 30.9, 0.9, 1.8, [cup(140)]],
  ['bulgur_cooked', 'Bulgur, cooked', 'برغل مطبوخ', 'grains', 83, 3.1, 18.6, 0.2, 4.5, [cup(182)]],
  ['couscous_cooked', 'Couscous, cooked', 'كسكس مطبوخ', 'grains', 112, 3.8, 23.2, 0.2, 1.4, [cup(157)]],
  ['quinoa_cooked', 'Quinoa, cooked', 'كينوا مطبوخة', 'grains', 120, 4.4, 21.3, 1.9, 2.8, [cup(185)]],
  ['oats_dry', 'Oats, rolled (dry)', 'شوفان (جاف)', 'grains', 389, 16.9, 66.3, 6.9, 10.6, [s('1/2 cup', 'نصف كوب', 40)]],
  ['bread_white', 'White bread', 'خبز أبيض (توست)', 'grains', 266, 8.9, 49.4, 3.3, 2.4, [s('1 slice', 'شريحة', 25)]],
  ['bread_whole_wheat', 'Whole-wheat bread', 'خبز قمح كامل', 'grains', 252, 12.4, 42.7, 3.5, 6, [s('1 slice', 'شريحة', 32)]],
  ['pita_white', 'Pita bread, white', 'خبز عربي أبيض', 'grains', 275, 9.1, 55.7, 1.2, 2.2, [s('1 large pita', 'رغيف كبير', 60)]],
  ['pita_whole_wheat', 'Pita bread, whole-wheat', 'خبز عربي أسمر', 'grains', 266, 9.8, 55, 2.6, 7.4, [s('1 large pita', 'رغيف كبير', 64)]],
  ['corn_flakes', 'Corn flakes', 'رقائق الذرة', 'grains', 357, 7.5, 84.1, 0.4, 3.3, [cup(28)]],
  ['potato_baked', 'Potato, baked (with skin)', 'بطاطا مخبوزة بقشرها', 'grains', 93, 2.5, 21.2, 0.1, 2.2, [s('1 medium', 'حبة متوسطة', 173)]],
  ['sweet_potato_baked', 'Sweet potato, baked', 'بطاطا حلوة مخبوزة', 'grains', 90, 2, 20.7, 0.2, 3.3, [s('1 medium', 'حبة متوسطة', 114)]],
  ['french_fries', 'French fries (fast food)', 'بطاطا مقلية', 'grains', 312, 3.4, 41.4, 14.7, 3.8, [s('1 medium serving', 'حصة متوسطة', 117)]],

  // legumes
  ['lentils_cooked', 'Lentils, cooked', 'عدس مطبوخ', 'legumes', 116, 9, 20.1, 0.4, 7.9, [cup(198)]],
  ['chickpeas_cooked', 'Chickpeas, cooked', 'حمص حب مطبوخ', 'legumes', 164, 8.9, 27.4, 2.6, 7.6, [cup(164)]],
  ['hummus', 'Hummus', 'حمص بطحينة', 'legumes', 166, 7.9, 14.3, 9.6, 6, [tbsp(15), s('1 small plate', 'صحن صغير', 100)]],
  ['fava_beans_cooked', 'Fava beans (ful), cooked', 'فول مدمس', 'legumes', 110, 7.6, 19.7, 0.4, 5.4, [cup(170)]],
  ['kidney_beans_cooked', 'Kidney beans, cooked', 'فاصوليا حمراء مطبوخة', 'legumes', 127, 8.7, 22.8, 0.5, 6.4, [cup(177)]],
  ['black_beans_cooked', 'Black beans, cooked', 'فاصوليا سوداء مطبوخة', 'legumes', 132, 8.9, 23.7, 0.5, 8.7, [cup(172)]],
  ['falafel', 'Falafel', 'فلافل', 'legumes', 333, 13.3, 31.8, 17.8, null, [s('1 patty', 'قرص', 17)]],
  ['peanut_butter', 'Peanut butter, smooth', 'زبدة الفول السوداني', 'legumes', 588, 25.1, 19.6, 50.4, 6, [tbsp(16)]],

  // vegetables
  ['tomato', 'Tomato, raw', 'بندورة (طماطم)', 'vegetables', 18, 0.9, 3.9, 0.2, 1.2, [s('1 medium', 'حبة متوسطة', 123)]],
  ['cucumber', 'Cucumber, with peel', 'خيار', 'vegetables', 15, 0.7, 3.6, 0.1, 0.5, [s('1 medium', 'حبة متوسطة', 201)]],
  ['lettuce_romaine', 'Lettuce, romaine', 'خس روماني', 'vegetables', 17, 1.2, 3.3, 0.3, 2.1, [cup(47)]],
  ['spinach_raw', 'Spinach, raw', 'سبانخ نيئة', 'vegetables', 23, 2.9, 3.6, 0.4, 2.2, [cup(30)]],
  ['broccoli_cooked', 'Broccoli, cooked', 'بروكلي مطبوخ', 'vegetables', 35, 2.4, 7.2, 0.4, 3.3, [cup(156)]],
  ['carrot', 'Carrot, raw', 'جزر', 'vegetables', 41, 0.9, 9.6, 0.2, 2.8, [s('1 medium', 'حبة متوسطة', 61)]],
  ['onion', 'Onion, raw', 'بصل', 'vegetables', 40, 1.1, 9.3, 0.1, 1.7, [s('1 medium', 'حبة متوسطة', 110)]],
  ['bell_pepper_red', 'Bell pepper, red, raw', 'فليفلة حمراء حلوة', 'vegetables', 31, 1, 6, 0.3, 2.1, [s('1 medium', 'حبة متوسطة', 119)]],
  ['zucchini', 'Zucchini, raw', 'كوسا', 'vegetables', 17, 1.2, 3.1, 0.3, 1, [s('1 medium', 'حبة متوسطة', 196)]],
  ['eggplant', 'Eggplant, raw', 'باذنجان', 'vegetables', 25, 1, 5.9, 0.2, 3, [cup(82)]],
  ['cauliflower', 'Cauliflower, raw', 'قرنبيط', 'vegetables', 25, 1.9, 5, 0.3, 2, [cup(107)]],
  ['mushrooms', 'Mushrooms, white, raw', 'فطر أبيض', 'vegetables', 22, 3.1, 3.3, 0.3, 1, [cup(70)]],
  ['parsley', 'Parsley, fresh', 'بقدونس', 'vegetables', 36, 3, 6.3, 0.8, 3.3, [cup(60)]],

  // fruits
  ['apple', 'Apple, with skin', 'تفاح', 'fruits', 52, 0.3, 13.8, 0.2, 2.4, [s('1 medium', 'حبة متوسطة', 182)]],
  ['banana', 'Banana', 'موز', 'fruits', 89, 1.1, 22.8, 0.3, 2.6, [s('1 medium', 'حبة متوسطة', 118)]],
  ['orange', 'Orange', 'برتقال', 'fruits', 47, 0.9, 11.8, 0.1, 2.4, [s('1 medium', 'حبة متوسطة', 131)]],
  ['strawberries', 'Strawberries', 'فراولة', 'fruits', 32, 0.7, 7.7, 0.3, 2, [cup(152)]],
  ['grapes', 'Grapes', 'عنب', 'fruits', 69, 0.7, 18.1, 0.2, 0.9, [cup(151)]],
  ['watermelon', 'Watermelon', 'بطيخ أحمر', 'fruits', 30, 0.6, 7.6, 0.2, 0.4, [cup(152)]],
  ['dates_medjool', 'Dates, Medjool', 'تمر مجهول', 'fruits', 277, 1.8, 75, 0.2, 6.7, [s('1 date', 'تمرة', 24)]],
  ['mango', 'Mango', 'مانجو', 'fruits', 60, 0.8, 15, 0.4, 1.6, [cup(165)]],
  ['avocado', 'Avocado', 'أفوكادو', 'fruits', 160, 2, 8.5, 14.7, 6.7, [s('1/2 fruit', 'نصف حبة', 100)]],
  ['pomegranate', 'Pomegranate seeds', 'رمان (حبوب)', 'fruits', 83, 1.7, 18.7, 1.2, 4, [cup(174)]],
  ['blueberries', 'Blueberries', 'توت أزرق', 'fruits', 57, 0.7, 14.5, 0.3, 2.4, [cup(148)]],
  ['pear', 'Pear', 'إجاص', 'fruits', 57, 0.4, 15.2, 0.1, 3.1, [s('1 medium', 'حبة متوسطة', 178)]],
  ['peach', 'Peach', 'دراق (خوخ)', 'fruits', 39, 0.9, 9.5, 0.3, 1.5, [s('1 medium', 'حبة متوسطة', 150)]],
  ['kiwi', 'Kiwi', 'كيوي', 'fruits', 61, 1.1, 14.7, 0.5, 3, [s('1 fruit', 'حبة', 69)]],
  ['figs_dried', 'Figs, dried', 'تين مجفف', 'fruits', 249, 3.3, 63.9, 0.9, 9.8, [s('1 fig', 'حبة', 8)]],
  ['raisins', 'Raisins', 'زبيب', 'fruits', 299, 3.1, 79.2, 0.5, 3.7, [s('1 small box', 'علبة صغيرة', 43)]],

  // nuts & seeds
  ['almonds', 'Almonds', 'لوز', 'nuts', 579, 21.2, 21.6, 49.9, 12.5, [s('1 handful (23 nuts)', 'حفنة (٢٣ حبة)', 28)]],
  ['walnuts', 'Walnuts', 'جوز', 'nuts', 654, 15.2, 13.7, 65.2, 6.7, [s('1 handful', 'حفنة', 28)]],
  ['cashews', 'Cashews', 'كاجو', 'nuts', 553, 18.2, 30.2, 43.9, 3.3, [s('1 handful', 'حفنة', 28)]],
  ['pistachios', 'Pistachios', 'فستق حلبي', 'nuts', 560, 20.2, 27.2, 45.3, 10.6, [s('1 handful', 'حفنة', 28)]],
  ['peanuts', 'Peanuts', 'فول سوداني', 'nuts', 567, 25.8, 16.1, 49.2, 8.5, [s('1 handful', 'حفنة', 28)]],
  ['sunflower_seeds', 'Sunflower seeds (kernels)', 'بذور دوار الشمس (مقشرة)', 'nuts', 584, 20.8, 20, 51.5, 8.6, [s('1/4 cup', 'ربع كوب', 35)]],
  ['chia_seeds', 'Chia seeds', 'بذور الشيا', 'nuts', 486, 16.5, 42.1, 30.7, 34.4, [tbsp(12)]],
  ['tahini', 'Tahini', 'طحينة', 'nuts', 595, 17, 21.2, 53.8, 9.3, [tbsp(15)]],

  // fats
  ['olive_oil', 'Olive oil', 'زيت زيتون', 'fats', 884, 0, 0, 100, 0, [tbsp(13.5), s('1 tsp', 'ملعقة صغيرة', 4.5)]],
  ['vegetable_oil', 'Vegetable oil', 'زيت نباتي', 'fats', 884, 0, 0, 100, 0, [tbsp(13.6)]],
  ['mayonnaise', 'Mayonnaise', 'مايونيز', 'fats', 680, 1, 0.6, 74.9, 0, [tbsp(13.8)]],

  // drinks
  ['orange_juice', 'Orange juice', 'عصير برتقال', 'drinks', 45, 0.7, 10.4, 0.2, 0.2, [cup(248)]],
  ['coffee_black', 'Coffee, brewed (black)', 'قهوة سوداء', 'drinks', 1, 0.1, 0, 0, 0, [cup(237)]],
  ['tea_black', 'Tea, brewed (unsweetened)', 'شاي بدون سكر', 'drinks', 1, 0, 0.3, 0, 0, [cup(237)]],
  ['cola', 'Cola (regular)', 'مشروب غازي (كولا عادي)', 'drinks', 42, 0, 10.6, 0, 0, [s('1 can (330 ml)', 'علبة ٣٣٠ مل', 340)]],

  // sweets & snacks
  ['dark_chocolate', 'Dark chocolate 70–85%', 'شوكولاتة داكنة ٧٠–٨٥٪', 'sweets', 598, 7.8, 45.9, 42.6, 10.9, [s('1 square row', 'صف مربعات', 20)]],
  ['milk_chocolate', 'Milk chocolate', 'شوكولاتة بالحليب', 'sweets', 535, 7.6, 59.4, 29.7, 3.4, [s('1 bar', 'لوح', 44)]],
  ['honey', 'Honey', 'عسل', 'sweets', 304, 0.3, 82.4, 0, 0.2, [tbsp(21)]],
  ['sugar', 'Sugar, white', 'سكر أبيض', 'sweets', 387, 0, 100, 0, 0, [s('1 tsp', 'ملعقة صغيرة', 4)]],
  ['baklava', 'Baklava', 'بقلاوة', 'sweets', 428, 6.7, 37.6, 29, 2.5, [s('1 piece', 'قطعة', 30)]],
  ['potato_chips', 'Potato chips', 'شيبس بطاطا', 'sweets', 536, 6.6, 53, 34.6, 4.4, [s('1 small bag', 'كيس صغير', 28)]],
  ['ice_cream_vanilla', 'Ice cream, vanilla', 'بوظة فانيلا', 'sweets', 207, 3.5, 23.6, 11, 0.7, [s('1/2 cup', 'نصف كوب', 66)]],

  // prepared
  ['pizza_cheese', 'Pizza, cheese', 'بيتزا بالجبنة', 'prepared', 266, 11.4, 33.3, 9.7, 2.3, [s('1 slice', 'شريحة', 107)]],
  ['ketchup', 'Ketchup', 'كاتشب', 'prepared', 101, 1, 27.4, 0.1, 0.3, [tbsp(17)]],
  ['soy_sauce', 'Soy sauce', 'صلصة الصويا', 'prepared', 53, 8.1, 4.9, 0.6, 0.8, [tbsp(16)]],
];

export const FOOD_CATALOG: CatalogFood[] = ROWS.map(([id, name, name_ar, category, kcal, protein, carbs, fat, fiber, servings]) => ({
  id: `food:${id}`,
  name,
  name_ar,
  category,
  kcal,
  protein,
  carbs,
  fat,
  fiber: fiber ?? undefined,
  servings: [g100, ...servings],
}));

export const FOOD_BY_ID: ReadonlyMap<string, CatalogFood> = new Map(FOOD_CATALOG.map((f) => [f.id, f]));
