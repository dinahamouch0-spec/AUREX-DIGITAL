// Catalog: categories, products, customization fields and pricing — all data.
// Part 2 §2: the customizer and pricing engine read this shape and never branch
// on a product slug. Part 3 §13-17 replaces this file with Admin-managed rows;
// the shape is the contract, so nothing downstream changes.

export const categories = [
  {
    id: 'cat_stories', slug: 'stories', status: 'active', sortOrder: 1,
    asset: 'stories',
    t: {
      ar: { name: 'قصص مخصّصة', desc: 'قصة يكون فيها طفلك هو البطل، بصورته وباسمه وبالعالم الذي يحبّه.' },
      en: { name: 'Personalized Stories', desc: 'A story where your child is the hero — their photo, their name, the world they love.' },
    },
  },
  {
    id: 'cat_stickers', slug: 'stickers', status: 'active', sortOrder: 2,
    asset: 'stickers',
    t: {
      ar: { name: 'ستيكرات مخصّصة', desc: 'ستيكرات باسم طفلك وصورته لدفاتره وكتبه وأغراضه المدرسية.' },
      en: { name: 'Personalized Stickers', desc: 'Stickers with your child’s name and photo for notebooks, books and school things.' },
    },
  },
  {
    id: 'cat_notebooks', slug: 'notebooks', status: 'active', sortOrder: 3,
    asset: 'notebooks',
    t: {
      ar: { name: 'أغلفة دفاتر مخصّصة', desc: 'غلاف دفتر بصورة طفلك وشخصيته المفضّلة، يميّز دفاتره بين كل الصف.' },
      en: { name: 'Personalized Notebook Covers', desc: 'A notebook cover with your child’s photo and favourite character — theirs alone.' },
    },
  },
];

// --- shared field builders (keeps seeds readable, output is still plain data) --
const childName = (order, required = true) => ({
  key: 'child_name', type: 'short_text', required, active: true, order,
  t: {
    ar: { label: 'اسم الطفل', help: 'كما تحبّون أن يظهر تمامًا.', placeholder: 'مثال: آدم' },
    en: { label: "Child’s name", help: 'Exactly as you’d like it to appear.', placeholder: 'e.g. Adam' },
  },
});

const childPhoto = (order) => ({
  key: 'child_photo', type: 'image_upload', required: true, active: true, order,
  accept: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxSizeMb: 12,
  t: {
    ar: { label: 'صورة الطفل', help: 'صورة واضحة، وجه ظاهر وإضاءة جيدة تعطي أجمل نتيجة.', placeholder: '' },
    en: { label: "Child’s photo", help: 'A clear, well-lit photo with the face visible gives the best result.', placeholder: '' },
  },
});

const theme = (order) => ({
  key: 'theme', type: 'short_text', required: true, active: true, order,
  t: {
    ar: { label: 'الشخصية أو العالم المفضّل', help: 'اكتبوا ما يحبّه طفلك: أميرة، فضاء، كرة قدم، شخصية كرتونية…', placeholder: 'مثال: مغامرة في الفضاء' },
    en: { label: 'Favourite character or world', help: 'Tell us what they love: a princess, space, football, a cartoon character…', placeholder: 'e.g. Space adventure' },
  },
});

const notes = (order) => ({
  key: 'notes', type: 'long_text', required: false, active: true, order,
  t: {
    ar: { label: 'ملاحظات إضافية', help: 'أي تفصيل تحبّون إضافته (اختياري).', placeholder: 'اختياري' },
    en: { label: 'Additional notes', help: 'Anything else you’d like us to know (optional).', placeholder: 'Optional' },
  },
});

export const products = [
  // ---------------------------------------------------------------- STORIES --
  {
    id: 'prd_story', slug: 'personalized-story', categoryId: 'cat_stories',
    status: 'active', featured: true, asset: 'stories',
    pricing: { type: 'option_override', driverField: 'age_group', basePrice: null },
    quantity: { min: 1, max: 20, step: 1, t: { ar: 'نسخة', en: 'copy' } },
    t: {
      ar: {
        name: 'قصة مخصّصة',
        short: 'قصة مطبوعة يكون طفلك بطلها، بصورته واسمه.',
        desc: 'نصمّم قصة كاملة يكون فيها طفلك هو البطل: صورته داخل الرسومات، اسمه في السرد، والعالم أو الشخصية التي يحبّها. تُطبع بجودة عالية لتبقى ذكرى تُحفظ، لا مجرّد كتاب يُقرأ مرة.',
      },
      en: {
        name: 'Personalized Story',
        short: 'A printed story where your child is the hero — their photo, their name.',
        desc: 'We design a complete story with your child as its hero: their photo inside the artwork, their name in the telling, and the world or character they love. Printed to a high standard so it stays a keepsake, not a book read once.',
      },
    },
    fields: [
      {
        key: 'age_group', type: 'radio', required: true, active: true, order: 1,
        pricing: { behavior: 'override' },
        t: {
          ar: { label: 'عمر الطفل', help: 'العمر يحدّد طول القصة وأسلوبها، ويؤثّر على السعر.', placeholder: '' },
          en: { label: "Child’s age", help: 'Age shapes the length and style of the story, and affects the price.', placeholder: '' },
        },
        options: [
          { key: 'age_1_5',  sortOrder: 1, active: true, priceOverride: 20, t: { ar: 'من ١ إلى ٥ سنوات', en: '1–5 years' } },
          { key: 'age_6_12', sortOrder: 2, active: true, priceOverride: 25, t: { ar: 'من ٦ إلى ١٢ سنة',  en: '6–12 years' } },
        ],
      },
      childName(2), childPhoto(3), theme(4), notes(5),
    ],
  },

  // --------------------------------------------------------------- STICKERS --
  {
    id: 'prd_stickers', slug: 'personalized-stickers', categoryId: 'cat_stickers',
    status: 'active', featured: true, asset: 'stickers',
    pricing: { type: 'option_override', driverField: 'design_mode', basePrice: null },
    // One unit = one pack of 10 stickers. §11: packs and design mode stay distinct.
    quantity: { min: 1, max: 30, step: 1, t: { ar: 'باقة (١٠ ستيكرات)', en: 'pack of 10' } },
    t: {
      ar: {
        name: 'ستيكرات مخصّصة',
        short: 'ستيكرات باسم طفلك وصورته، تُلصق على كل ما يخصّه.',
        desc: 'ستيكرات تحمل اسم طفلك وصفّه وصورته مع الشخصية التي يحبّها — للدفاتر والكتب والأغراض المدرسية. تُباع بباقات من ١٠ ستيكرات، ويمكنكم اختيار تصميمَين اثنين للباقة أو تصميم مختلف لكل ستيكر.',
      },
      en: {
        name: 'Personalized Stickers',
        short: 'Stickers with their name and photo, for everything that belongs to them.',
        desc: 'Stickers carrying your child’s name, class and photo alongside the character they love — for notebooks, books and school belongings. Sold in packs of 10, with either two designs across the pack or a different design on every sticker.',
      },
    },
    fields: [
      {
        key: 'design_mode', type: 'radio', required: true, active: true, order: 1,
        pricing: { behavior: 'override' },
        t: {
          ar: { label: 'نمط التصميم', help: 'يحدّد عدد التصاميم المختلفة داخل الباقة الواحدة.', placeholder: '' },
          en: { label: 'Design mode', help: 'How many different designs appear within one pack.', placeholder: '' },
        },
        options: [
          { key: 'two_designs', sortOrder: 1, active: true, priceOverride: 3, t: { ar: 'تصميمان اثنان للباقة', en: '2 designs per pack' } },
          { key: 'individual',  sortOrder: 2, active: true, priceOverride: 5, t: { ar: 'تصميم مختلف لكل ستيكر', en: 'Every sticker individually designed' } },
        ],
      },
      childName(2), childPhoto(3), theme(4), notes(5),
    ],
  },

  // -------------------------------------------------------------- NOTEBOOKS --
  {
    id: 'prd_notebook', slug: 'personalized-notebook-cover', categoryId: 'cat_notebooks',
    status: 'active', featured: true, asset: 'notebooks',
    pricing: { type: 'unit', basePrice: 2.5 },
    quantity: { min: 1, max: 60, step: 1, t: { ar: 'دفتر', en: 'notebook' } },
    t: {
      ar: {
        name: 'غلاف دفتر مخصّص',
        short: 'غلاف بصورة طفلك وشخصيته المفضّلة، لكل دفتر.',
        desc: 'نصمّم ونغلّف دفتر طفلك بغلاف يحمل صورته والشخصية أو العالم الذي يحبّه، مع مساحة للاسم والصف والمادة. السعر لكل دفتر، فاختاروا العدد الذي يناسب سنته الدراسية.',
      },
      en: {
        name: 'Personalized Notebook Cover',
        short: 'A cover with their photo and favourite character, on every notebook.',
        desc: 'We design and cover your child’s notebook with their photo and the character or world they love, with space for name, class and subject. Priced per notebook, so choose the number that suits their school year.',
      },
    },
    fields: [childName(1), childPhoto(2), theme(3), notes(4)],
  },
];

// --------------------------------------------------------------- selectors --
export const activeCategories = () =>
  categories.filter((c) => c.status === 'active').sort((a, b) => a.sortOrder - b.sortOrder);

export const activeProducts = () => products.filter((p) => p.status === 'active');

export const productsInCategory = (categoryId) =>
  activeProducts().filter((p) => p.categoryId === categoryId);

export const featuredProducts = () => activeProducts().filter((p) => p.featured);

export const categoryBySlug = (slug) => categories.find((c) => c.slug === slug);
export const productBySlug = (slug) => products.find((p) => p.slug === slug);
