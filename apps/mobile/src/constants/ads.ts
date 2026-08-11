export interface PlaceholderAd {
  id: string;
  brand: string;
  headline: string;
  body: string;
  cta: string;
  accent: string;
}

export const PLACEHOLDER_ADS: PlaceholderAd[] = [
  {
    id: 'ad-protein',
    brand: 'ProteinPantry',
    headline: '30g protein in every scoop',
    body: 'Clean whey for smoothies, oats, and post-workout shakes.',
    cta: 'Shop now',
    accent: '#E63946',
  },
  {
    id: 'ad-prep',
    brand: 'PrepBox',
    headline: 'Macro-balanced meals delivered',
    body: 'High-protein bowls for busy weeknights — no cooking required.',
    cta: 'Get 20% off',
    accent: '#2ECC71',
  },
  {
    id: 'ad-spices',
    brand: 'SavoryLeaf',
    headline: 'Elevate every dish',
    body: 'Small-batch spice blends for meal prep and weeknight dinners.',
    cta: 'Browse blends',
    accent: '#457B9D',
  },
  {
    id: 'ad-apron',
    brand: 'KitchenCraft',
    headline: 'Tools for home cooks',
    body: 'Sheet pans, prep containers, and knives that last.',
    cta: 'Shop kitchen',
    accent: '#F39C12',
  },
];

export const SCROLL_AD_INTERVAL = 4;
