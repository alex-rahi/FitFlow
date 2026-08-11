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
    brand: 'LiftFuel',
    headline: '30g protein in every scoop',
    body: 'Recover faster after heavy sessions with zero-sugar whey.',
    cta: 'Shop now',
    accent: '#E63946',
  },
  {
    id: 'ad-apparel',
    brand: 'IronThread',
    headline: 'Train hard. Look sharper.',
    body: 'Breathable training gear built for PR days and rest days.',
    cta: 'Browse collection',
    accent: '#457B9D',
  },
  {
    id: 'ad-meal',
    brand: 'PrepBox',
    headline: 'High-protein meals delivered',
    body: 'Macro-balanced bowls for lifters who hate meal prep.',
    cta: 'Get 20% off',
    accent: '#2ECC71',
  },
  {
    id: 'ad-gym',
    brand: 'RepRack',
    headline: 'Home gym essentials',
    body: 'Racks, plates, and benches with fast shipping.',
    cta: 'Build your setup',
    accent: '#F39C12',
  },
];

export const SCROLL_AD_INTERVAL = 4;
