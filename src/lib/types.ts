export type Memory = {
  id: string;
  userId: string;
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
  audioUrl?: string;
  transcription?: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: any; // Firestore serverTimestamp
  clientCreatedAt: string; // Client-side ISO timestamp
  createdBy?: string; // Optional: who created the memory
  // Archive functionality
  archived?: boolean; // Whether the memory is archived
  archivedAt?: string; // ISO timestamp when archived
};
