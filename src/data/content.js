// Editorial content: FAQ, portfolio showcase, reviews, policy pages.
// Part 3 §22/§24/§25 hands these to Admin later; the shapes are the contract.

// ---------------------------------------------------------------------- FAQ --
export const faqs = [
  {
    id: 'how-personalization-works', published: true, sortOrder: 1,
    ar: { q: 'كيف يتم التخصيص؟', a: 'تختارون المنتج، ثم تملأون المعلومات التي يحتاجها: اسم الطفل، وعمره إن لزم، والشخصية أو العالم الذي يحبّه، وترفعون صورته. بعدها نصمّم العمل يدويًا حول طفلك ونرسله لكم للمراجعة قبل الطباعة.' },
    en: { q: 'How does personalization work?', a: 'You choose the product, then fill in what it needs: your child’s name, their age where relevant, the character or world they love, and their photo. We then design the piece by hand around your child and send it to you for review before printing.' },
  },
  {
    id: 'what-photo', published: true, sortOrder: 2,
    ar: { q: 'ما نوع الصورة التي يجب أن أرفعها؟', a: 'صورة واضحة، الوجه ظاهر فيها بالكامل وبإضاءة جيدة، ويفضّل ألّا تكون بعيدة أو ضبابية. لا حاجة لصورة احترافية — صورة الهاتف تكفي تمامًا إن كانت واضحة.' },
    en: { q: 'What photo should I upload?', a: 'A clear photo with the whole face visible and good lighting, not too distant or blurry. It doesn’t need to be professional — a phone photo is perfectly fine as long as it’s sharp.' },
  },
  {
    id: 'choose-character', published: true, sortOrder: 3,
    ar: { q: 'هل يمكنني اختيار شخصية أو ثيم معيّن؟', a: 'نعم. اكتبوا لنا ما يحبّه طفلك — رياضة، أميرات، فضاء، حيوانات، شخصية كرتونية معيّنة — وسنعمل عليه. إن كان هناك طلب خاص، اذكروه في الملاحظات ونناقشه معكم.' },
    en: { q: 'Can I choose a specific character or theme?', a: 'Yes. Tell us what your child loves — sport, princesses, space, animals, a particular cartoon character — and we’ll work with it. If you have a special request, add it in the notes and we’ll discuss it with you.' },
  },
  {
    id: 'production-time', published: true, sortOrder: 4,
    ar: { q: 'كم تستغرق مدة التنفيذ؟', a: 'التنفيذ عادةً من ٢ إلى ٥ أيام. هذه مدة التصميم والتحضير والطباعة فقط — مدة التوصيل منفصلة وتُنسَّق معكم حسب موقعكم.' },
    en: { q: 'How long does production take?', a: 'Production usually takes 2–5 days. That covers designing, preparing and printing only — delivery time is separate and is arranged with you based on your location.' },
  },
  {
    id: 'delivery', published: true, sortOrder: 5,
    ar: { q: 'كيف يتم التوصيل؟', a: 'ننسّق التوصيل معكم مباشرةً بعد تأكيد الطلب. تكلفة التوصيل ومدّته تعتمدان على موقعكم، ونتفق عليهما معكم قبل الإرسال.' },
    en: { q: 'How is delivery handled?', a: 'We arrange delivery with you directly once the order is confirmed. Cost and timing depend on your location, and we agree both with you before sending.' },
  },
  {
    id: 'payment', published: true, sortOrder: 6,
    ar: { q: 'كيف يمكنني الدفع؟', a: 'الدفع متاح عند الاستلام، أو عبر Whish Money. ننسّق تفاصيل الدفع معكم مباشرةً بعد استلام الطلب.' },
    en: { q: 'How do I pay?', a: 'You can pay cash on delivery, or through Whish Money. We coordinate the payment details with you directly once we receive your order.' },
  },
  {
    id: 'photo-retention', published: true, sortOrder: 7,
    ar: { q: 'هل تحتفظون بصورة طفلي؟', a: 'نستخدم صورة طفلك لتجهيز طلبكم فقط. لا ننشرها ولا نستخدمها لأي غرض تسويقي دون موافقتكم الصريحة، وتُحذف من أنظمتنا بعد اكتمال الطلب.' },
    en: { q: 'Will my child’s photo be kept?', a: 'We use your child’s photo only to prepare your order. We never publish it or use it for any marketing purpose without your explicit permission, and it is deleted from our systems after your order is complete.' },
  },
  {
    id: 'changes-before-print', published: true, sortOrder: 8,
    ar: { q: 'هل يمكنني طلب تعديلات قبل الطباعة؟', a: 'نعم. نرسل لكم التصميم عبر واتساب قبل الطباعة، ويمكنكم طلب التعديلات حينها. لا نطبع قبل موافقتكم.' },
    en: { q: 'Can I request changes before printing?', a: 'Yes. We send you the design on WhatsApp before printing, and you can request changes at that point. Nothing is printed before you approve it.' },
  },
];

export const publishedFaqs = () => faqs.filter((f) => f.published).sort((a, b) => a.sortOrder - b.sortOrder);

// ------------------------------------------------------ PREVIOUS CREATIONS --
// Part 1 §17 / Part 3 §22-23: approved marketing assets ONLY. A customer's
// fulfilment upload is never marketing consent and must never appear here.
export const creations = [
  {
    id: 'crt_stories', asset: 'stories', published: true, sortOrder: 1,
    ar: { caption: 'قصص مخصّصة', note: 'نماذج من قصص صُمّمت لأطفال، كل غلاف بطله طفل مختلف.' },
    en: { caption: 'Personalized stories', note: 'Stories designed for real children — a different child on every cover.' },
  },
  {
    id: 'crt_stickers', asset: 'stickers', published: true, sortOrder: 2,
    ar: { caption: 'ستيكرات مخصّصة', note: 'ثيمات متنوّعة: رياضة، شخصيات، حيوانات، وأميرات.' },
    en: { caption: 'Personalized stickers', note: 'A range of themes: sport, characters, animals and princesses.' },
  },
  {
    id: 'crt_notebooks', asset: 'notebooks', published: true, sortOrder: 3,
    ar: { caption: 'أغلفة دفاتر مخصّصة', note: 'الطفل نفسه في عوالم مختلفة، على كل دفتر.' },
    en: { caption: 'Personalized notebook covers', note: 'The same child, different worlds, on every notebook.' },
  },
];

export const publishedCreations = () => creations.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);

// ------------------------------------------------------------------ REVIEWS --
// Part 1 §20 / Part 3 §24: never invent reviews. Empty until real ones are
// supplied; the section renders its empty state rather than fake social proof.
export const reviews = [];
export const publishedReviews = () => reviews.filter((r) => r.published);

// ----------------------------------------------------------------- POLICIES --
// Part 3 §39: real structure, ready for the owner's legal review. No claims of
// regulatory compliance are made, because none have been verified.
const REVIEW_NOTE = {
  ar: 'هذه صيغة أولية جاهزة للمراجعة القانونية من صاحبة العمل قبل الإطلاق.',
  en: 'This is a working draft prepared for the owner’s legal review before launch.',
};

export const policies = {
  privacy: {
    reviewNote: REVIEW_NOTE,
    ar: [
      { h: 'ما الذي نجمعه', p: ['نجمع الاسم ورقم الهاتف والعنوان اللازمة لتنفيذ الطلب وتوصيله، إضافةً إلى المعلومات التي تدخلونها لتخصيص المنتج مثل اسم الطفل وعمره والشخصية المطلوبة، وصورة الطفل التي ترفعونها.'] },
      { h: 'لماذا نجمع صورة الطفل', p: ['نستخدم صورة الطفل لغرض واحد فقط: تصميم المنتج الذي طلبتموه. لا تُستخدم لأي غرض آخر.'] },
      { h: 'كيف تُحفظ الصورة ومن يصل إليها', p: ['تُحفظ صور الأطفال في مساحة تخزين خاصة غير متاحة للعامة، ولا يمكن الوصول إليها إلا من قِبل فريق يا حكايتي لتنفيذ الطلب.'] },
      { h: 'متى تُحذف', p: ['تُحذف صورة الطفل من أنظمتنا بعد اكتمال الطلب. أما الصور التي تُرفع دون إتمام طلب، فتُحذف تلقائيًا بعد مدة قصيرة.'] },
      { h: 'التسويق منفصل تمامًا', p: ['رفع صورة طفلكم لتنفيذ الطلب لا يُعدّ موافقةً على نشرها. لا ننشر أي صورة لطفل في موقعنا أو حساباتنا دون إذن منفصل وصريح منكم.'] },
      { h: 'للاستفسار عن خصوصيتكم', p: ['يمكنكم التواصل معنا عبر قنوات التواصل المذكورة في صفحة «تواصلوا معنا» لأي سؤال يتعلق ببياناتكم أو لطلب حذفها.'] },
    ],
    en: [
      { h: 'What we collect', p: ['We collect the name, phone number and address needed to fulfil and deliver your order, along with the details you enter to personalize the product — such as your child’s name, age and requested character — and the child’s photo you upload.'] },
      { h: 'Why we collect your child’s photo', p: ['We use the photo for one purpose only: designing the product you ordered. It is not used for anything else.'] },
      { h: 'How it is stored and who can access it', p: ['Children’s photos are held in private storage that is not publicly accessible, and can be reached only by the Ya 7kayti team in order to fulfil the order.'] },
      { h: 'When it is deleted', p: ['Your child’s photo is deleted from our systems after the order is complete. Photos uploaded without an order being placed are deleted automatically after a short period.'] },
      { h: 'Marketing is entirely separate', p: ['Uploading your child’s photo to fulfil an order is not consent to publish it. We never publish a child’s photo on our site or accounts without separate, explicit permission from you.'] },
      { h: 'Privacy questions', p: ['You can reach us through the channels listed on our Contact page with any question about your data, or to request its deletion.'] },
    ],
  },
  terms: {
    reviewNote: REVIEW_NOTE,
    ar: [
      { h: 'طبيعة المنتجات', p: ['جميع منتجات يا حكايتي تُصنع خصيصًا حسب الطلب، بناءً على المعلومات والصورة التي تزوّدوننا بها.'] },
      { h: 'دقة المعلومات', p: ['نعتمد على المعلومات التي تدخلونها كما هي. يرجى التأكد من صحة اسم الطفل والتفاصيل قبل تأكيد الطلب.'] },
      { h: 'مراجعة التصميم', p: ['نرسل التصميم للمراجعة قبل الطباعة. الطباعة تبدأ بعد موافقتكم.'] },
      { h: 'التعديلات والإلغاء', p: ['يمكن طلب التعديلات قبل مرحلة الطباعة. بعد بدء الطباعة يصعب التراجع لأن المنتج مخصّص ولا يمكن إعادة بيعه.'] },
      { h: 'الأسعار والدفع', p: ['الأسعار المعروضة بالدولار الأمريكي. تكلفة التوصيل تُحدَّد وتُتفق عليها معكم بشكل منفصل.'] },
      { h: 'حقوق التصاميم', p: ['التصاميم التي نُنتجها تخصّ طلبكم. لا نعيد استخدام صورة طفلكم في أعمال أخرى.'] },
    ],
    en: [
      { h: 'Nature of the products', p: ['All Ya 7kayti products are made to order, based on the information and photo you provide.'] },
      { h: 'Accuracy of information', p: ['We work from the details you enter exactly as given. Please check your child’s name and the details are correct before confirming.'] },
      { h: 'Design review', p: ['We send the design for review before printing. Printing begins once you approve it.'] },
      { h: 'Changes and cancellation', p: ['Changes can be requested before printing begins. Once printing has started, cancellation is difficult because the product is personalized and cannot be resold.'] },
      { h: 'Prices and payment', p: ['Prices are shown in US dollars. Delivery cost is determined and agreed with you separately.'] },
      { h: 'Design rights', p: ['The designs we produce belong to your order. We do not reuse your child’s photo in other work.'] },
    ],
  },
  shipping: {
    reviewNote: REVIEW_NOTE,
    ar: [
      { h: 'مدة التنفيذ', p: ['التنفيذ عادةً من ٢ إلى ٥ أيام. هذه مدة التصميم والتحضير والطباعة، وليست مدة وصول الطلب إليكم.'] },
      { h: 'مدة التوصيل', p: ['مدة التوصيل منفصلة عن مدة التنفيذ، وتعتمد على موقعكم وطريقة الإرسال المتفق عليها.'] },
      { h: 'تكلفة التوصيل', p: ['تكلفة التوصيل تُحدَّد حسب الموقع، ويتم الاتفاق عليها معكم مباشرةً بعد تأكيد الطلب. لا تُحتسب تلقائيًا عند الطلب.'] },
      { h: 'تأكيد العنوان', p: ['نتواصل معكم لتأكيد العنوان وتفاصيل التسليم قبل الإرسال.'] },
    ],
    en: [
      { h: 'Production time', p: ['Production usually takes 2–5 days. That is the time to design, prepare and print — it is not the time for the order to reach you.'] },
      { h: 'Delivery time', p: ['Delivery time is separate from production time and depends on your location and the shipping method agreed.'] },
      { h: 'Delivery cost', p: ['Delivery cost depends on location and is agreed with you directly after your order is confirmed. It is not calculated automatically at ordering.'] },
      { h: 'Address confirmation', p: ['We contact you to confirm the address and delivery details before sending.'] },
    ],
  },
};
