/*
 * Cycle Zone — catalog data.
 *
 * To add a motorcycle: copy one object in `bikes`, give it a unique `id`,
 * drop its photo in assets/img/ and set `image`. `price: null` shows
 * "price on request". `category` must be one of the keys in `bikeCategories`.
 *
 * To add a part / accessory: copy one object in `parts`. `icon` is one of the
 * names in ICONS (assets/js/app.js). `image` is optional — when set it
 * replaces the icon. `category` must be a key in `partCategories`.
 */
window.CZ = {
  contact: {
    phoneDisplay: '+961 76 533 092',
    phone: '+96176533092',
    whatsapp: '96176533092',
    instagram: 'https://www.instagram.com/cycle.zone.lb/',
    instagramHandle: '@cycle.zone.lb',
    address: { ar: 'الصرفند، الطريق العام — بين صيدا وصور', en: 'Sarafand, Main Road — between Saida & Tyre' },
    mapQuery: 'Sarafand Main Road, Lebanon'
  },

  bikeCategories: {
    scooter: { ar: 'سكوتر', en: 'Scooter' },
    maxi: { ar: 'ماكسي سكوتر', en: 'Maxi Scooter' },
    electric: { ar: 'كهرباء', en: 'Electric' }
  },

  bikes: [
    {
      id: 'nmax-2026',
      name: 'Nmax',
      year: 2026,
      category: 'maxi',
      image: 'assets/img/nmax-2026.webp',
      price: null,
      featured: true,
      badge: { ar: 'الأقوى', en: 'Flagship' },
      desc: {
        ar: 'ماكسي سكوتر بمحرك 180cc مبرّد بالماء، فرامل ABS أمامية وخلفية، نظام تحكم بالجر TCS وعداد TFT رقمي.',
        en: '180cc water-cooled maxi scooter with front & rear ABS, traction control and a full TFT dash.'
      },
      specs: [
        { ar: 'محرك 180cc بـ 4 صمامات، مبرّد بالماء', en: '180cc 4-valve water cooled' },
        { ar: 'ABS أمامي وخلفي', en: 'ABS front / rear' },
        { ar: 'نظام TCS', en: 'TCS traction control' },
        { ar: 'عداد TFT', en: 'TFT speedometer' },
        { ar: 'Bosch EFI', en: 'Bosch EFI' },
        { ar: 'ممتصات صدمات غاز', en: 'Gas shock absorbers' },
        { ar: 'زجاج أمامي إضافي', en: 'Aftermarket windshield' },
        { ar: 'مسند ظهر خلفي', en: 'Rear back rest' },
        { ar: 'إطارات Timsun', en: 'Timsun tires' }
      ]
    },
    {
      id: 'jlang-2026',
      name: 'J-lang',
      year: 2026,
      category: 'scooter',
      image: 'assets/img/jlang-2026.webp',
      price: 800,
      badge: { ar: 'عرض خاص', en: 'Special offer' },
      desc: {
        ar: 'سكوتر عملي بتصميم 2026 وإضاءة LED كاملة — بسعر عرض خاص.',
        en: 'A practical everyday scooter with 2026 styling and full LED lighting — at a special price.'
      },
      specs: [
        { ar: 'مقعد رياضي', en: 'Aftermarket sport seat' },
        { ar: 'إطارات Timsun', en: 'Timsun tires' },
        { ar: 'إضاءة وإشارات LED 2026', en: '2026 LED lighting & turn signals' }
      ]
    },
    {
      id: 'jonway-2026',
      name: 'JonWay',
      year: 2026,
      category: 'scooter',
      image: 'assets/img/jonway-2026.webp',
      price: null,
      badge: null,
      desc: {
        ar: 'سكوتر أحمر لافت بإضاءة LED حديثة ومقعد رياضي.',
        en: 'A head-turning red scooter with modern LED lighting and a sport seat.'
      },
      specs: [
        { ar: 'مقعد رياضي', en: 'Aftermarket sport seat' },
        { ar: 'إطارات Timsun', en: 'Timsun tires' },
        { ar: 'إضاءة وإشارات LED 2026', en: '2026 LED lighting & turn signals' }
      ]
    },
    {
      id: 'laila-2026',
      name: 'Laila Group',
      year: 2026,
      category: 'scooter',
      image: 'assets/img/laila-2026.webp',
      price: null,
      badge: { ar: 'جديد', en: 'New' },
      desc: {
        ar: 'بنفسجي مطفي مع جنوط فسفورية — سكوتر بشخصية.',
        en: 'Matte purple with neon rims — a scooter with personality.'
      },
      specs: [
        { ar: 'مقعد رياضي', en: 'Aftermarket sport seat' },
        { ar: 'إطارات Timsun', en: 'Timsun tires' },
        { ar: 'إضاءة وإشارات LED 2026', en: '2026 LED lighting & turn signals' }
      ]
    },
    {
      id: 'adventure-maxi',
      name: { ar: 'ماكسي سكوتر أدفنتشر', en: 'Adventure Maxi' },
      year: 2026,
      category: 'maxi',
      image: 'assets/img/maxi-adventure.webp',
      price: null,
      badge: null,
      desc: {
        ar: 'ماكسي سكوتر رمادي مطفي بزجاج أمامي عالي وإضاءة LED حادة — للمشاوير الطويلة.',
        en: 'Matte grey maxi scooter with a tall windshield and sharp LED lights — built for longer rides.'
      },
      specs: [
        { ar: 'زجاج أمامي عالي', en: 'Tall windshield' },
        { ar: 'إضاءة LED', en: 'LED lighting' }
      ]
    },
    {
      id: 'sport-maxi-red',
      name: { ar: 'ماكسي سكوتر رياضي', en: 'Sport Maxi' },
      year: 2026,
      category: 'maxi',
      image: 'assets/img/maxi-red-led.webp',
      price: null,
      badge: null,
      desc: {
        ar: 'أحمر رياضي مع زجاج أمامي وإشارات LED متتابعة.',
        en: 'Sporty red with a windshield and sequential LED turn signals.'
      },
      specs: [
        { ar: 'زجاج أمامي', en: 'Windshield' },
        { ar: 'إشارات LED', en: 'LED turn signals' }
      ]
    },
    {
      id: 'electric-white',
      name: { ar: 'سكوتر كهرباء', en: 'Electric Scooter' },
      year: 2026,
      category: 'electric',
      image: 'assets/img/electric-white.webp',
      price: null,
      badge: { ar: 'كهرباء', en: 'Electric' },
      desc: {
        ar: 'سكوتر كهربائي أبيض — بلا بنزين، بلا صوت، وبمصروف أقل.',
        en: 'White electric scooter — no fuel, no noise, lower running costs.'
      },
      specs: [
        { ar: 'محرك كهربائي', en: 'Electric motor' },
        { ar: 'إشارات LED', en: 'LED turn signals' },
        { ar: 'واقيات يد', en: 'Hand guards' }
      ]
    },
    {
      id: 'silver-led',
      name: { ar: 'سكوتر فضي LED', en: 'Silver LED Scooter' },
      year: 2026,
      category: 'scooter',
      image: 'assets/img/silver-led.webp',
      price: null,
      badge: null,
      desc: {
        ar: 'فضي أنيق مع شريط إضاءة LED أزرق وواقيات يد.',
        en: 'Sleek silver with a blue LED light strip and hand guards.'
      },
      specs: [
        { ar: 'شريط LED', en: 'LED light strip' },
        { ar: 'واقيات يد', en: 'Hand guards' }
      ]
    }
  ],

  partCategories: {
    gear: { ar: 'عُدّة السائق', en: 'Rider gear' },
    comfort: { ar: 'راحة وستايل', en: 'Comfort & style' },
    lighting: { ar: 'إضاءة', en: 'Lighting' },
    performance: { ar: 'أداء وقطع', en: 'Performance & parts' },
    care: { ar: 'صيانة وزيوت', en: 'Care & fluids' }
  },

  parts: [
    { id: 'helmets', category: 'gear', icon: 'helmet', price: null,
      name: { ar: 'خوذ', en: 'Helmets' },
      desc: { ar: 'تشكيلة خوذ كاملة ونصف وجه بألوان وقياسات مختلفة.', en: 'Full-face and open-face helmets in many colours and sizes.' } },
    { id: 'handguards', category: 'gear', icon: 'mirror', price: null,
      name: { ar: 'مرايا وواقيات يد', en: 'Mirrors & hand guards' },
      desc: { ar: 'مرايا رياضية وواقيات يد مع إشارات مدمجة.', en: 'Sport mirrors and hand guards with built-in indicators.' } },
    { id: 'windshield', category: 'comfort', icon: 'windshield', price: null,
      name: { ar: 'زجاج أمامي', en: 'Windshields' },
      desc: { ar: 'زجاج أمامي إضافي يحميك من الهوا على الأوتوستراد.', en: 'Aftermarket windshields that keep the wind off on the highway.' } },
    { id: 'sport-seat', category: 'comfort', icon: 'seat', price: null,
      name: { ar: 'مقاعد رياضية', en: 'Sport seats' },
      desc: { ar: 'مقاعد رياضية مريحة بخياطة مميزة.', en: 'Comfortable aftermarket sport seats with signature stitching.' } },
    { id: 'backrest', category: 'comfort', icon: 'backrest', price: null,
      name: { ar: 'مسند ظهر خلفي', en: 'Rear back rests' },
      desc: { ar: 'راحة أكبر للراكب الخلفي.', en: 'More comfort for your passenger.' } },
    { id: 'body-panels', category: 'comfort', icon: 'panel', price: null,
      name: { ar: 'قطع هيكل وفيرينغ', en: 'Body panels & fairings' },
      desc: { ar: 'قطع هيكل بألوان متعددة لتجديد شكل الموتسيكل.', en: 'Coloured body panels to refresh your bike’s look.' } },
    { id: 'led', category: 'lighting', icon: 'bulb', price: null,
      name: { ar: 'إضاءة وإشارات LED', en: 'LED lights & turn signals' },
      desc: { ar: 'إضاءة LED 2026 وإشارات متتابعة.', en: '2026 LED lighting and sequential turn signals.' } },
    { id: 'tires', category: 'performance', icon: 'tire', price: null,
      name: { ar: 'إطارات Timsun', en: 'Timsun tires' },
      desc: { ar: 'إطارات بثبات عالي على الطريق، مع التركيب.', en: 'High-grip tires, fitted in the workshop.' } },
    { id: 'rims', category: 'performance', icon: 'rim', price: null,
      name: { ar: 'جنوط ملونة', en: 'Coloured rims' },
      desc: { ar: 'جنوط بألوان فسفورية وكلاسيكية.', en: 'Rims in neon and classic finishes.' } },
    { id: 'shocks', category: 'performance', icon: 'shock', price: null,
      name: { ar: 'ممتصات صدمات غاز', en: 'Gas shock absorbers' },
      desc: { ar: 'ممتصات صدمات غاز لقيادة أنعم.', en: 'Gas shocks for a smoother ride.' } },
    { id: 'oil', category: 'care', icon: 'oil', price: null,
      name: { ar: 'زيوت Repsol', en: 'Repsol oils' },
      desc: { ar: 'زيوت محرك وسوائل صيانة أصلية.', en: 'Genuine engine oils and service fluids.' } },
    { id: 'service-parts', category: 'care', icon: 'wrench', price: null,
      name: { ar: 'قطع صيانة', en: 'Service parts' },
      desc: { ar: 'فرامل، فلاتر، بطاريات وقطع الصيانة الدورية.', en: 'Brakes, filters, batteries and routine service parts.' } }
  ]
};
