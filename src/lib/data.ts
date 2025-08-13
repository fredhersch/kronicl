import type { Memory } from './types';

export const memories: Memory[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    title: 'Mountain Hike Adventure',
    summary: 'An exhilarating hike through the mountains, witnessing breathtaking views from the summit.',
    date: '2023-09-10T10:00:00.000Z',
    location: 'Yosemite National Park, CA',
    latitude: 37.8651,
    longitude: -119.5383,
    media: [
      {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'mountain summit',
      },
      {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'forest trail',
      },
       {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'mountain lake',
      },
    ],
    audioUrl: '/audio/placeholder-audio.mp3',
    transcription:
      "Woke up super early for this hike but it was totally worth it. The air is so fresh up here. The climb was tough, especially the last mile, but the view from the top... wow. You can see the entire valley. It feels like being on top of the world. So peaceful.",
    tags: ['hiking', 'mountains', 'nature', 'adventure'],
    sentiment: 'positive',
  },
  {
    id: '3',
    title: 'First Day in Tokyo',
    summary: 'Exploring the vibrant streets of Shibuya and trying authentic ramen for the first time.',
    date: '2024-04-05T19:00:00.000Z',
    location: 'Tokyo, Japan',
    latitude: 35.6895,
    longitude: 139.6917,
    media: [
       {
        type: 'video',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'shibuya crossing',
      },
    ],
    audioUrl: '/audio/placeholder-audio.mp3',
    transcription:
      "Tokyo is incredible. The Shibuya Crossing is just as chaotic and amazing as I imagined. So many people. We found this tiny ramen shop in a side alley and it was the best ramen I've ever had. My feet are killing me, but I can't wait to explore more tomorrow.",
    tags: ['travel', 'japan', 'tokyo', 'food'],
    sentiment: 'positive',
  },
  {
    id: '4',
    title: 'Cozy Rainy Afternoon',
    summary: 'A quiet afternoon spent indoors with a good book and a cup of tea as rain pattered against the window.',
    date: '2023-11-18T15:00:00.000Z',
    location: 'Portland, OR',
    latitude: 45.5051,
    longitude: -122.6750,
    media: [
      {
        type: 'image',
        url: 'https://placehold.co/600x400.png',
        dataAiHint: 'rainy window',
      },
    ],
    audioUrl: '/audio/placeholder-audio.mp3',
    transcription: "It's been raining all day, which is the perfect excuse to just stay in and relax. I'm curled up on the couch with a new book and a hot cup of chai. The sound of the rain is so calming. I should do this more often. It's so nice to have a slow, quiet day.",
    tags: ['cozy', 'rainy', 'relaxing', 'reading'],
    sentiment: 'neutral',
  },
];
