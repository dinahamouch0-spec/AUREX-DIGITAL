import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ya 7kayti...");

  // ---------- Business settings ----------
  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      businessName: "Ya 7kayti",
      whishNumber: "009613566434",
      productionDays: "2-5",
      photoRetentionHours: 24,
      tempUploadRetentionHours: 48,
      // whatsappNumber / instagramUrl / businessEmail intentionally left
      // blank — not supplied yet. Configure in Admin > Settings.
    },
    update: {
      whishNumber: "009613566434",
      productionDays: "2-5",
    },
  });

  // ---------- Admin user ----------
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@ya7kayti.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash, name: "Ya 7kayti Admin" },
    update: { passwordHash },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // ---------- Categories ----------
  const categoriesData = [
    {
      slug: "stories",
      sortOrder: 1,
      ar: { name: "قصص شخصية", description: "قصص مطبوعة يكون فيها طفلك البطل." },
      en: { name: "Personalized Stories", description: "Printed storybooks starring your child." },
    },
    {
      slug: "stickers",
      sortOrder: 2,
      ar: { name: "ستيكرات شخصية", description: "ستيكرات بصورة طفلك واسمه." },
      en: { name: "Personalized Stickers", description: "Stickers with your child's name and photo." },
    },
    {
      slug: "notebooks",
      sortOrder: 3,
      ar: { name: "أغلفة دفاتر شخصية", description: "غلاف دفتر بصورة طفلك." },
      en: { name: "Personalized Notebook Covers", description: "A notebook cover made with your child's photo." },
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        sortOrder: c.sortOrder,
        status: "active",
        translations: {
          create: [
            { locale: "ar", name: c.ar.name, description: c.ar.description },
            { locale: "en", name: c.en.name, description: c.en.description },
          ],
        },
      },
      update: { sortOrder: c.sortOrder },
    });
    categories[c.slug] = category.id;
  }
  console.log("Categories ready");

  // ---------- Products ----------

  // 1) Personalized Story — price driven entirely by the age-group field's
  //    price_override (1-5 -> $20, 6-12 -> $25). Quantity is always 1.
  await upsertProduct({
    slug: "personalized-story",
    categoryId: categories["stories"],
    pricingMode: "fixed",
    basePriceCents: 2000,
    unitPriceCents: null,
    images: ["/images/showcase/stories.png"],
    ar: {
      name: "قصة شخصية",
      shortDescription: "طفلك بطل قصته الخاصة، بصورته الحقيقية.",
      description:
        "نصمم قصة مطبوعة بجودة عالية يكون فيها طفلك البطل، باسمه وصورته والعالم الذي يحبه.",
    },
    en: {
      name: "Personalized Story",
      shortDescription: "Your child, the hero of their own printed story.",
      description:
        "A beautifully printed storybook starring your child — their name, their photo, and a world they love.",
    },
    fields: [
      {
        key: "child_name",
        type: "short_text",
        required: true,
        sortOrder: 1,
        pricingRole: "none",
        ar: { label: "اسم الطفل", placeholder: "مثال: آدم" },
        en: { label: "Child's Name", placeholder: "e.g. Adam" },
      },
      {
        key: "age_group",
        type: "select",
        required: true,
        sortOrder: 2,
        pricingRole: "price_override",
        ar: { label: "الفئة العمرية" },
        en: { label: "Age Group" },
        options: [
          {
            key: "age_1_5",
            sortOrder: 1,
            priceOverrideCents: 2000,
            ar: "1 – 5 سنوات",
            en: "1–5 years",
          },
          {
            key: "age_6_12",
            sortOrder: 2,
            priceOverrideCents: 2500,
            ar: "6 – 12 سنة",
            en: "6–12 years",
          },
        ],
      },
      {
        key: "child_photo",
        type: "image_upload",
        required: true,
        sortOrder: 3,
        pricingRole: "none",
        ar: { label: "صورة الطفل" },
        en: { label: "Child's Photo" },
      },
      {
        key: "theme_request",
        type: "short_text",
        required: true,
        sortOrder: 4,
        pricingRole: "none",
        ar: { label: "العالم أو الشخصية المفضلة", placeholder: "مثال: الفضاء، الأميرات، كرة القدم" },
        en: { label: "Favorite World or Character", placeholder: "e.g. space, princesses, football" },
      },
      {
        key: "notes",
        type: "long_text",
        required: false,
        sortOrder: 5,
        pricingRole: "none",
        ar: { label: "ملاحظات إضافية" },
        en: { label: "Additional Notes" },
      },
    ],
  });

  // 2) Personalized Stickers — quantity is the number of 10-sticker packs;
  //    the design-type option sets the per-pack unit price ($3 or $5).
  await upsertProduct({
    slug: "personalized-stickers",
    categoryId: categories["stickers"],
    pricingMode: "unit",
    basePriceCents: null,
    unitPriceCents: 300,
    images: ["/images/showcase/stickers.png"],
    ar: {
      name: "ستيكرات شخصية",
      shortDescription: "اسمه، صورته، وعالمه المفضل — في كل مكان.",
      description: "ستيكرات مخصصة لدفاتر المدرسة والكتب والأغراض الشخصية، بتصميم فريد لكل طفل.",
    },
    en: {
      name: "Personalized Stickers",
      shortDescription: "Their name, their photo, their favorite world — everywhere.",
      description:
        "Custom stickers for school notebooks, books, and belongings — a unique design for every child.",
    },
    fields: [
      {
        key: "child_name",
        type: "short_text",
        required: true,
        sortOrder: 1,
        pricingRole: "none",
        ar: { label: "اسم الطفل", placeholder: "مثال: سارة" },
        en: { label: "Child's Name", placeholder: "e.g. Sara" },
      },
      {
        key: "pack_quantity",
        type: "number",
        required: true,
        sortOrder: 2,
        pricingRole: "quantity",
        defaultValue: "1",
        ar: { label: "عدد الحزم (كل حزمة = 10 ستيكرات)", helpText: "سعر كل حزمة يعتمد على نوع التصميم أدناه." },
        en: { label: "Number of Packs (each pack = 10 stickers)", helpText: "Price per pack depends on the design type below." },
      },
      {
        key: "design_type",
        type: "select",
        required: true,
        sortOrder: 3,
        pricingRole: "price_unit",
        ar: { label: "نوع التصميم" },
        en: { label: "Design Type" },
        options: [
          {
            key: "two_designs",
            sortOrder: 1,
            priceOverrideCents: 300,
            ar: "تصميمان لكل 10 ستيكرات",
            en: "2 Designs / 10 stickers",
          },
          {
            key: "individual_designs",
            sortOrder: 2,
            priceOverrideCents: 500,
            ar: "تصميم فردي لكل ستيكر",
            en: "Every Sticker Individually Designed",
          },
        ],
      },
      {
        key: "child_photo",
        type: "image_upload",
        required: true,
        sortOrder: 4,
        pricingRole: "none",
        ar: { label: "صورة الطفل" },
        en: { label: "Child's Photo" },
      },
      {
        key: "theme_request",
        type: "short_text",
        required: true,
        sortOrder: 5,
        pricingRole: "none",
        ar: { label: "العالم أو الشخصية المفضلة", placeholder: "مثال: كرة القدم، الأميرات" },
        en: { label: "Favorite World or Character", placeholder: "e.g. football, princesses" },
      },
      {
        key: "notes",
        type: "long_text",
        required: false,
        sortOrder: 6,
        pricingRole: "none",
        ar: { label: "ملاحظات إضافية" },
        en: { label: "Additional Notes" },
      },
    ],
  });

  // 3) Personalized Notebook Covers — simple unit price × quantity.
  await upsertProduct({
    slug: "personalized-notebook-cover",
    categoryId: categories["notebooks"],
    pricingMode: "unit",
    basePriceCents: null,
    unitPriceCents: 250,
    images: ["/images/showcase/notebooks.png"],
    ar: {
      name: "غلاف دفتر شخصي",
      shortDescription: "دفتر مدرسي يحمل صورته وعالمه.",
      description: "غلاف دفتر مخصص بصورة طفلك الحقيقية، لكل دفتر من دفاتره المدرسية.",
    },
    en: {
      name: "Personalized Notebook Cover",
      shortDescription: "A school notebook that carries their photo and their world.",
      description: "A custom notebook cover made with your child's real photo, for every notebook they carry.",
    },
    fields: [
      {
        key: "child_name",
        type: "short_text",
        required: true,
        sortOrder: 1,
        pricingRole: "none",
        ar: { label: "اسم الطفل", placeholder: "مثال: ليان" },
        en: { label: "Child's Name", placeholder: "e.g. Layan" },
      },
      {
        key: "quantity",
        type: "number",
        required: true,
        sortOrder: 2,
        pricingRole: "quantity",
        defaultValue: "1",
        ar: { label: "الكمية (عدد الدفاتر)" },
        en: { label: "Quantity (number of notebooks)" },
      },
      {
        key: "child_photo",
        type: "image_upload",
        required: true,
        sortOrder: 3,
        pricingRole: "none",
        ar: { label: "صورة الطفل" },
        en: { label: "Child's Photo" },
      },
      {
        key: "theme_request",
        type: "short_text",
        required: true,
        sortOrder: 4,
        pricingRole: "none",
        ar: { label: "العالم أو الشخصية المفضلة", placeholder: "مثال: يونيكورن، السنافر" },
        en: { label: "Favorite World or Character", placeholder: "e.g. unicorns, smurfs" },
      },
      {
        key: "notes",
        type: "long_text",
        required: false,
        sortOrder: 5,
        pricingRole: "none",
        ar: { label: "ملاحظات إضافية" },
        en: { label: "Additional Notes" },
      },
    ],
  });

  console.log("Products ready");

  // ---------- Portfolio (approved showcase assets only) ----------
  const portfolioSeed = [
    {
      imageUrl: "/images/showcase/stories.png",
      sortOrder: 1,
      ar: "قصص شخصية — نماذج معتمدة",
      en: "Personalized Stories — approved examples",
    },
    {
      imageUrl: "/images/showcase/stickers.png",
      sortOrder: 2,
      ar: "ستيكرات شخصية — نماذج معتمدة",
      en: "Personalized Stickers — approved examples",
    },
    {
      imageUrl: "/images/showcase/notebooks.png",
      sortOrder: 3,
      ar: "أغلفة دفاتر شخصية — نماذج معتمدة",
      en: "Personalized Notebook Covers — approved examples",
    },
  ];

  for (const p of portfolioSeed) {
    const existing = await prisma.portfolioItem.findFirst({ where: { imageUrl: p.imageUrl } });
    if (existing) continue;
    await prisma.portfolioItem.create({
      data: {
        imageUrl: p.imageUrl,
        sortOrder: p.sortOrder,
        published: true,
        translations: {
          create: [
            { locale: "ar", caption: p.ar },
            { locale: "en", caption: p.en },
          ],
        },
      },
    });
  }
  console.log("Portfolio ready");

  // ---------- FAQ ----------
  const faqSeed = [
    {
      ar: { q: "كيف يعمل التخصيص؟", a: "تختارين المنتج، تدخلين معلومات طفلك، ترفعين صورته، وتختارين العالم أو الشخصية المفضلة لديه. نقوم بتصميم المنتج بناءً على اختياراتك." },
      en: { q: "How does personalization work?", a: "You choose a product, enter your child's details, upload their photo, and choose their favorite world or character. We design the product based on your choices." },
    },
    {
      ar: { q: "ما هي الصورة المناسبة للرفع؟", a: "صورة واضحة وحديثة لوجه طفلك، بإضاءة جيدة قدر الإمكان." },
      en: { q: "What photo should I upload?", a: "A clear, recent photo of your child's face, with good lighting where possible." },
    },
    {
      ar: { q: "هل يمكنني اختيار شخصية أو عالم معين؟", a: "نعم، لكل منتج خيارات تخصيص خاصة به، وقد تتوفر خيارات إضافية عند الطلب." },
      en: { q: "Can I choose a character or theme?", a: "Yes — each product has its own customization options, and additional requests may be available." },
    },
    {
      ar: { q: "كم تستغرق مدة التصميم والتحضير؟", a: "عادةً بين 2 و5 أيام لتصميم المنتج وتجهيزه للطباعة. هذه مدة التحضير فقط، ولا تشمل مدة التوصيل." },
      en: { q: "How long does production take?", a: "Usually 2-5 days to design and prepare the product for print. This is production time only, not delivery time." },
    },
    {
      ar: { q: "كيف يتم التوصيل؟", a: "نتواصل معك بعد الطلب لتنسيق تفاصيل الشحن والتوصيل بحسب موقعك." },
      en: { q: "How is delivery handled?", a: "We reach out after your order to coordinate shipping and delivery details based on your location." },
    },
    {
      ar: { q: "كيف أدفع؟", a: "يمكنك الدفع عند الاستلام أو عبر Whish Money، وسيتم تأكيد التفاصيل معك مباشرةً." },
      en: { q: "How do I pay?", a: "You can pay Cash on Delivery or via Whish Money — details are confirmed with you directly." },
    },
    {
      ar: { q: "هل تحتفظون بصورة طفلي؟", a: "نستخدم الصورة فقط لتجهيز طلبك، ويتم حذفها بعد إتمام الطلب وفق سياسة الخصوصية لدينا." },
      en: { q: "Will my child's photo be kept?", a: "We use the photo only to prepare your order, and it is deleted after the order is completed, per our privacy policy." },
    },
    {
      ar: { q: "هل يمكنني طلب تعديلات قبل الطباعة؟", a: "نعم، نراجع التصميم معك عبر واتساب قبل الطباعة النهائية." },
      en: { q: "Can I request changes before printing?", a: "Yes — we review the design with you over WhatsApp before final printing." },
    },
  ];

  const existingFaqCount = await prisma.faqItem.count();
  if (existingFaqCount === 0) {
    for (let i = 0; i < faqSeed.length; i++) {
      const f = faqSeed[i];
      await prisma.faqItem.create({
        data: {
          sortOrder: i + 1,
          published: true,
          translations: {
            create: [
              { locale: "ar", question: f.ar.q, answer: f.ar.a },
              { locale: "en", question: f.en.q, answer: f.en.a },
            ],
          },
        },
      });
    }
  }
  console.log("FAQ ready");

  console.log("Seed complete.");
}

interface FieldOptionSeed {
  key: string;
  sortOrder: number;
  priceOverrideCents?: number;
  priceModifierCents?: number;
  ar: string;
  en: string;
}

interface FieldSeed {
  key: string;
  type: "short_text" | "long_text" | "number" | "select" | "radio" | "checkbox" | "image_upload";
  required: boolean;
  sortOrder: number;
  pricingRole: "none" | "quantity" | "price_override" | "price_unit" | "price_modifier";
  defaultValue?: string;
  ar: { label: string; helpText?: string; placeholder?: string };
  en: { label: string; helpText?: string; placeholder?: string };
  options?: FieldOptionSeed[];
}

async function upsertProduct(input: {
  slug: string;
  categoryId: string;
  pricingMode: "fixed" | "unit";
  basePriceCents: number | null;
  unitPriceCents: number | null;
  images: string[];
  ar: { name: string; shortDescription: string; description: string };
  en: { name: string; shortDescription: string; description: string };
  fields: FieldSeed[];
}) {
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      categoryId: input.categoryId,
      status: "active",
      featured: true,
      pricingMode: input.pricingMode,
      basePriceCents: input.basePriceCents,
      unitPriceCents: input.unitPriceCents,
      productionDays: "2-5",
      images: { create: input.images.map((url, i) => ({ url, sortOrder: i })) },
      translations: {
        create: [
          { locale: "ar", name: input.ar.name, shortDescription: input.ar.shortDescription, description: input.ar.description },
          { locale: "en", name: input.en.name, shortDescription: input.en.shortDescription, description: input.en.description },
        ],
      },
    },
    update: {
      categoryId: input.categoryId,
      status: "active",
      featured: true,
      pricingMode: input.pricingMode,
      basePriceCents: input.basePriceCents,
      unitPriceCents: input.unitPriceCents,
    },
  });

  for (const field of input.fields) {
    const existingField = await prisma.customizationField.findUnique({
      where: { productId_key: { productId: product.id, key: field.key } },
    });

    const savedField = existingField
      ? await prisma.customizationField.update({
          where: { id: existingField.id },
          data: {
            type: field.type,
            required: field.required,
            sortOrder: field.sortOrder,
            pricingRole: field.pricingRole,
            defaultValue: field.defaultValue,
            active: true,
          },
        })
      : await prisma.customizationField.create({
          data: {
            productId: product.id,
            key: field.key,
            type: field.type,
            required: field.required,
            sortOrder: field.sortOrder,
            pricingRole: field.pricingRole,
            defaultValue: field.defaultValue,
            translations: {
              create: [
                { locale: "ar", label: field.ar.label, helpText: field.ar.helpText, placeholder: field.ar.placeholder },
                { locale: "en", label: field.en.label, helpText: field.en.helpText, placeholder: field.en.placeholder },
              ],
            },
          },
        });

    if (existingField) {
      await prisma.customizationFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: savedField.id, locale: "ar" } },
        create: { fieldId: savedField.id, locale: "ar", label: field.ar.label, helpText: field.ar.helpText, placeholder: field.ar.placeholder },
        update: { label: field.ar.label, helpText: field.ar.helpText, placeholder: field.ar.placeholder },
      });
      await prisma.customizationFieldTranslation.upsert({
        where: { fieldId_locale: { fieldId: savedField.id, locale: "en" } },
        create: { fieldId: savedField.id, locale: "en", label: field.en.label, helpText: field.en.helpText, placeholder: field.en.placeholder },
        update: { label: field.en.label, helpText: field.en.helpText, placeholder: field.en.placeholder },
      });
    }

    for (const opt of field.options ?? []) {
      const existingOption = await prisma.customizationOption.findUnique({
        where: { fieldId_key: { fieldId: savedField.id, key: opt.key } },
      });

      const savedOption = existingOption
        ? await prisma.customizationOption.update({
            where: { id: existingOption.id },
            data: {
              sortOrder: opt.sortOrder,
              priceOverrideCents: opt.priceOverrideCents ?? null,
              priceModifierCents: opt.priceModifierCents ?? null,
              active: true,
            },
          })
        : await prisma.customizationOption.create({
            data: {
              fieldId: savedField.id,
              key: opt.key,
              sortOrder: opt.sortOrder,
              priceOverrideCents: opt.priceOverrideCents ?? null,
              priceModifierCents: opt.priceModifierCents ?? null,
            },
          });

      await prisma.customizationOptionTranslation.upsert({
        where: { optionId_locale: { optionId: savedOption.id, locale: "ar" } },
        create: { optionId: savedOption.id, locale: "ar", label: opt.ar },
        update: { label: opt.ar },
      });
      await prisma.customizationOptionTranslation.upsert({
        where: { optionId_locale: { optionId: savedOption.id, locale: "en" } },
        create: { optionId: savedOption.id, locale: "en", label: opt.en },
        update: { label: opt.en },
      });
    }
  }

  return product;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
