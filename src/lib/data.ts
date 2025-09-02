import type { Memory } from './types';

// This file is now a backup and not actively used in the application.
// Data is fetched from Firebase Firestore.
export const memories: Memory[] = [
  {
    id: '1',
    userId: 'mock-user-id',
    title: 'Sunny Day at the Beach',
    summary: 'A wonderful day spent at the beach with family, building sandcastles and enjoying the waves.',
    date: '2023-07-22T14:30:00.000Z',
    location: 'Santa Monica, CA',
    latitude: 34.0195,
    longitude: -118.4912,
    media: [
      {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'beach sunset',
      },
      {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'sandcastle beach',
      },
    ],
    audioUrl: '/audio/placeholder-audio.mp3',
    transcription:
      "The sun was so warm today. We got to the beach around noon and the kids immediately ran towards the water. We built a huge sandcastle, and I think it's the best one we've ever made. The sound of the waves is so relaxing. I wish we could do this every weekend. A perfect day.",
    tags: ['beach', 'family', 'vacation', 'sunny'],
    sentiment: 'positive',
    createdAt: new Date('2023-07-22T14:30:00.000Z'),
    clientCreatedAt: '2023-07-22T14:30:00.000Z',
  },
];
