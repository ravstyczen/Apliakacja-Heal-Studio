import { Instructor } from './types';

export const DEFAULT_INSTRUCTORS: Instructor[] = [
  {
    id: 'agnieszka-puchalska',
    name: 'Agnieszka Puchalska',
    email: 'puchalskaagi@gmail.com',
    color: '#D4A843',
    colorName: 'żółty',
    role: 'owner',
    pricing: {
      solo: { price: 260, share: 260 },
      duo: { price: 360, share: 360 },
      trio: { price: 450, share: 450 },
    },
  },
  {
    id: 'rafal-styczen',
    name: 'Rafał Styczeń',
    email: 'rafal.styczen@gmail.com',
    color: '#1A1A1A',
    colorName: 'czarny',
    role: 'admin',
    pricing: {
      solo: { price: 0, share: 0 },
      duo: { price: 0, share: 0 },
      trio: { price: 0, share: 0 },
    },
  },
  {
    id: 'ola-scibor',
    name: 'Ola Ścibor',
    email: 'aleksscibor@gmail.com',
    color: '#4A90D9',
    colorName: 'niebieski',
    role: 'instructor',
    pricing: {
      solo: { price: 260, share: 120 },
      duo: { price: 360, share: 150 },
      trio: { price: 450, share: 190 },
    },
  },
  {
    id: 'ania-konieczny',
    name: 'Ania Konieczny',
    email: 'aniakonieczny01@gmail.com',
    color: '#D94A4A',
    colorName: 'czerwony',
    role: 'instructor',
    pricing: {
      solo: { price: 260, share: 160 },
      duo: { price: 360, share: 210 },
      trio: { price: 450, share: 250 },
    },
  },
];

export function getInstructorByEmail(email: string): Instructor | undefined {
  return DEFAULT_INSTRUCTORS.find((i) => i.email === email);
}

export function getInstructorById(id: string): Instructor | undefined {
  return DEFAULT_INSTRUCTORS.find((i) => i.id === id);
}
