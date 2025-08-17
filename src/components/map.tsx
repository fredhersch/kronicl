
'use client';
import { useRef, useEffect, ReactNode } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface MapProps {
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}

function InteractiveMap({ center, zoom }: InteractiveMapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const map = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapId: 'MEMORYLANE_MAP',
        disableDefaultUI: true,
        zoomControl: true,
      });
      new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: center,
      });
    }
  }, [center, zoom]);

  return <div ref={ref} className="w-full h-full rounded-lg" />;
}

const render = (status: Status): ReactNode => {
  switch (status) {
    case Status.LOADING:
      return <Skeleton className="w-full h-full" />;
    case Status.FAILURE:
      return (
         <div className="w-full h-full bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
          <MapPin className="w-8 h-8 text-primary" />
          <p className="text-xs text-muted-foreground mt-2">
            Could not load map. Please check your API key and internet connection.
          </p>
        </div>
      );
    case Status.SUCCESS:
        // This case is handled by the component rendering, we just need to satisfy the switch
        return null;
  }
};

export function Map({ latitude, longitude }: MapProps) {
  const center = { lat: latitude, lng: longitude };
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-48 bg-muted rounded-lg overflow-hidden border flex flex-col items-center justify-center text-center p-4">
        <MapPin className="w-8 h-8 text-primary" />
        <p className="text-xs text-muted-foreground mt-2">
          Google Maps API Key is missing or invalid. Please check your configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border">
       <Wrapper apiKey={apiKey} render={render} libraries={['marker']}>
         <InteractiveMap center={center} zoom={14} />
       </Wrapper>
    </div>
  );
}
