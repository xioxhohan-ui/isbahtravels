"use client";

import { MapPin, Navigation, ExternalLink, Compass } from "lucide-react";

interface NearbyPlace {
  name: string;
  type: string;
  distance: string;
  lat?: number;
  lng?: number;
}

interface GoogleMapViewProps {
  latitude?: number;
  longitude?: number;
  title?: string;
  address?: string;
  nearby?: NearbyPlace[];
}

export default function GoogleMapView({
  latitude = 21.4172,
  longitude = 91.9804,
  title = "Isbah Partner Resort",
  address,
  nearby = [],
}: GoogleMapViewProps) {
  const mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title} Location & Map</h3>
            {address && <p className="text-xs text-slate-500 font-semibold">{address}</p>}
          </div>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5 text-emerald-700" />
          <span>Get Directions</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Map Display Box with Animated Overlay Markers */}
      <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
        <iframe
          title={title}
          src={mapSrc}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Floating Animated Drop Markers Badge */}
        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Google Places 1km Auto-Collected ({nearby.length} Places)</span>
        </div>
      </div>

      {/* Nearby Places Grid with Animated Drop Effect */}
      {nearby.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-emerald-700" />
              <span>Nearby Landmarks & Attractions</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Live Radius 1 km
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {nearby.map((place, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-200/80 text-xs hover:bg-slate-100 transition-colors shadow-2xs animate-scale-in"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-emerald-700 font-extrabold text-[10px] shadow-2xs">
                    📍
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{place.name}</p>
                    <span className="text-[10px] font-medium text-slate-500">{place.type}</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {place.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
