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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      
      {/* Header with full responsive flex */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-outfit font-black text-slate-900 text-base leading-tight truncate">
              Location & Map
            </h3>
            <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
              {title}
            </p>
            {address && (
              <p className="text-[11px] font-medium text-slate-400 line-clamp-2 mt-0.5">
                {address}
              </p>
            )}
          </div>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0 shadow-xs active:scale-[0.98]"
        >
          <Navigation className="h-4 w-4 text-emerald-700" />
          <span>Get Directions</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Map Frame Container */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-slate-100">
        <iframe
          title={title}
          src={mapSrc}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Live Status Badge */}
        <div className="absolute top-3 left-3 right-3 sm:left-auto max-w-full bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-700/80 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-1.5 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">Google Places 1km Radius</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 text-[9px] font-extrabold shrink-0">
            {nearby.length} Places
          </span>
        </div>
      </div>

      {/* Nearby Landmarks & Attractions List */}
      {nearby.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-emerald-700" />
              <span>Nearby Landmarks & Attractions</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
              Radius 1 km
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {nearby.map((place, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 border border-slate-200/80 text-xs hover:bg-slate-100/80 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-base shadow-2xs group-hover:scale-105 transition-transform">
                    📍
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight">{place.name}</p>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{place.type}</span>
                  </div>
                </div>

                <span className="text-[10px] font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 ml-2">
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
