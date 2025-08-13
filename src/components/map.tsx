import { MapPin } from 'lucide-react';
import Image from 'next/image';

interface MapProps {
  latitude: number;
  longitude: number;
}

export function Map({ latitude, longitude }: MapProps) {
  // In a real application, this would use a library like @vis.gl/react-google-maps
  // to show an interactive map. For this scaffold, we're using a static placeholder.
  return (
    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border">
      <Image
        src="https://placehold.co/600x400.png"
        data-ai-hint="street map"
        alt="Map placeholder"
        layout="fill"
        objectFit="cover"
        className="opacity-50"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div className="absolute bottom-2 left-2 bg-background/80 p-1 px-2 rounded-md text-xs">
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
      </div>
    </div>
  );
}
