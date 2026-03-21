import React from 'react';
import { Navigation } from 'lucide-react';
import { useUserLocation, haversineMeters, metersToWalkMinutes, formatWalkTime } from '@/hooks/use-user-location';

interface WalkTimeProps {
  storeLat?: number | null;
  storeLng?: number | null;
  className?: string;
  variant?: 'badge' | 'inline' | 'pill';
}

export function WalkTime({ storeLat, storeLng, className = '', variant = 'badge' }: WalkTimeProps) {
  const { coords, loading } = useUserLocation();

  if (!storeLat || !storeLng) return null;

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 animate-pulse ${className}`}>
        <span className="w-12 h-3.5 bg-muted rounded" />
      </span>
    );
  }

  if (!coords) return null;

  const meters  = haversineMeters(coords.lat, coords.lng, storeLat, storeLng);
  const minutes = metersToWalkMinutes(meters);
  const label   = formatWalkTime(minutes);

  const urgencyColor =
    minutes <= 5  ? 'text-green-600 bg-green-50 border-green-200' :
    minutes <= 15 ? 'text-orange-600 bg-orange-50 border-orange-200' :
                   'text-muted-foreground bg-secondary border-border';

  if (variant === 'pill') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${urgencyColor} ${className}`}>
        <Navigation className="w-3 h-3" />
        {label}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground ${className}`}>
        <Navigation className="w-3 h-3 text-primary" />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold text-primary ${className}`}>
      <Navigation className="w-3 h-3" />
      {label}
    </span>
  );
}
