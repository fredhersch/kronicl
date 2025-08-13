export type Memory = {
  id: string;
  title: string;
  summary: string;
  date: string; // ISO format
  location: string;
  latitude: number;
  longitude: number;
  media: {
    type: 'image' | 'video';
    url: string;
    dataAiHint?: string;
  }[];
  audioUrl: string;
  transcription: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
};
