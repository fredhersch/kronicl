'use client';
import { MapPin } from 'lucide-react';
import Image from 'next/image';

interface MapProps {
  latitude: number;
  longitude: number;
}

export function Map({ latitude, longitude }: MapProps) {
  // A Google Maps API key with Maps Static API enabled is required for this to work.
  // It should be stored in NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // If no API key is available, we'll fall back to a placeholder.
  const mapImageUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=14&size=600x400&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`
    : `https://placehold.co/600x400.png`;

  return (
    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border">
      <Image
        src={mapImageUrl}
        data-ai-hint="street map"
        alt={`Map centered at ${latitude}, ${longitude}`}
        layout="fill"
        objectFit="cover"
        className={!apiKey ? 'opacity-50' : ''}
      />
      {!apiKey && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <MapPin className="w-8 h-8 text-primary" />
          <p className="text-xs text-muted-foreground mt-2">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file to display the map.
          </p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-background/80 p-1 px-2 rounded-md text-xs">
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
      </div>
    </div>
  );
}
