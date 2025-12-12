export const DOHA_AREAS = [
  'The Pearl-Qatar',
  'West Bay',
  'Al Dafna',
  'Onaiza',
  'Katara',
  'Msheireb Downtown Doha',
  'Souq Waqif',
  'Al Bidda',
  'Al Sadd',
  'Bin Mahmoud',
  'Education City',
  'Aspire Zone',
  'Lusail',
  'Al Thumama',
  'Al Wakrah',
  'Mesaieed',
] as const;

export type DohaArea = (typeof DOHA_AREAS)[number];

