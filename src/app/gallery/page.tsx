import { Metadata } from 'next';
import { GalleryView } from '@/components/gallery/gallery-view';

export const metadata: Metadata = {
  title: 'Gallery - Memory Lane',
  description: 'Browse and select photos from your gallery to create new memories',
};

export default function GalleryPage() {
  return <GalleryView />;
}
