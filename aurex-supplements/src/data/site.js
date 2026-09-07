export const site = {
  name: 'AUREX',
  legalName: 'AUREX Supplements',
  tagline: 'Engineered supplementation',
  description:
    'Whey, creatine, pre-workout and clinical-grade vitamins from 109 brands — '
    + 'sourced, priced and shipped across Lebanon.',
  locale: 'en',
  currency: 'USD',
  country: 'LB',
  url: process.env.URL || 'https://aurex-supplements.netlify.app',
  builtBy: { name: 'AUREX DIGITAL', url: 'https://aurexdigital.com' },

  /* One number, written once. `dial` is what a phone dials, `wa` is the
     digits-only form wa.me needs, `display` is what a person reads. */
  contact: {
    display: '+961 76 906 738',
    dial: '+96176906738',
    wa: '96176906738',
  },
};

/* A WhatsApp link carrying what the customer is looking at, so the shop does
   not have to ask "which one?" as its first message. Plain text by house
   convention — no emoji in prefilled messages. */
export const whatsapp = (text) =>
  `https://wa.me/${site.contact.wa}` + (text ? `?text=${encodeURIComponent(text)}` : '');

/* Motion budget. Every animated surface reads these so the whole site can be
   retimed from one place — and so `prefers-reduced-motion` has one switch. */
export const motion = {
  loaderMs: 2500,      // the brief: the loader holds for 2.5s
  revealMs: 900,
  stageSpinSec: 34,    // one full turn of the hero carousel
};
