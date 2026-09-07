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
};

/* Motion budget. Every animated surface reads these so the whole site can be
   retimed from one place — and so `prefers-reduced-motion` has one switch. */
export const motion = {
  loaderMs: 2500,      // the brief: the loader holds for 2.5s
  revealMs: 900,
  stageSpinSec: 34,    // one full turn of the hero carousel
};
