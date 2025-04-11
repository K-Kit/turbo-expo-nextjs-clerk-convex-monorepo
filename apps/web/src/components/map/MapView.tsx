"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../../../packages/backend/convex/_generated/api";
import { useTenantId } from "@/hooks/useTenantId";
import { AlertTriangle, ShieldCheck, Truck, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
// import { MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { mapViewSettingsAtom, useWorksite, useWorksites } from "@/lib/atoms";
import { useWorksiteId } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false },
);

// This is a placeholder component - in a real implementation, you would use a proper map library
// like react-leaflet, Mapbox, or Google Maps
const MapPlaceholder = ({
  items,
  onItemClick,
  height = 500,
  zoom = 12,
  center,
  className,
}: {
  items: any[];
  onItemClick: (item: any) => void;
  height?: number;
  zoom?: number;
  center?: { lat: number; lng: number };
  className?: string;
}) => {
  const [lat, lng] = [37.771365, -122.417225];
  const position = { lat: center?.lat || lat, lng: center?.lng || lng };
  // return <div className={cn("w-full h-full", className)}>Map</div>;

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={false}
      className={cn("w-full h-full", className)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
      </Marker>
    </MapContainer>
  );
};

export function MapView({
  poiFilter,
  assetFilter,
  height = 500,
  onItemClick,
  center,
  zoom = 12,
  mapClassName,
}: {
  showPOIs?: boolean;
  showAssets?: boolean;
  poiFilter?: { type?: string; status?: string };
  assetFilter?: { type?: string; status?: string };
  height?: number;
  onItemClick?: (item: any) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  mapClassName?: string;
}) {
  const tenantId = useTenantId();
  const [combinedItems, setCombinedItems] = useState<any[]>([]);
  const { showPOIs, showAssets, showIncidents, showWorksite } =
    useAtomValue(mapViewSettingsAtom);

  // Fetch POIs if enabled
  const pois = useQuery(
    api.pois.getPOIs,
    showPOIs && tenantId
      ? {
          tenantId,
          type: poiFilter?.type,
          status: poiFilter?.status,
        }
      : "skip",
  );

  // Fetch Assets if enabled
  const assets = useQuery(
    api.assets.getAssets,
    showAssets && tenantId
      ? {
          tenantId,
          type: assetFilter?.type,
          status: assetFilter?.status,
        }
      : "skip",
  );
  const incidents = useQuery(
    api.incidents.listIncidentsByTenant,
    showIncidents && tenantId
      ? {
          tenantId,
        }
      : "skip",
  );
  // Combine POIs and Assets for display
  useEffect(() => {
    const items: any[] = [];

    if (pois) {
      items.push(...pois);
    }

    if (assets) {
      items.push(...assets);
    }

    if (incidents) {
      items.push(...incidents);
    }

    setCombinedItems(items);
  }, [pois, assets, incidents]);

  const handleItemClick = (item: any) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  if (!tenantId) {
    return <div>No tenant selected</div>;
  }

  if (!pois && !assets) {
    return <div>Loading map data...</div>;
  }

  return (
    <MapPlaceholder
      items={combinedItems}
      onItemClick={handleItemClick}
      height={height}
      center={center}
      zoom={zoom}
      className={mapClassName}
    />
  );
}

// Export a version specifically for POIs
export function POIMapView({
  filter,
  height,
  onItemClick,
  center,
  zoom,
}: {
  filter?: { type?: string; status?: string };
  height?: number;
  onItemClick?: (item: any) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  return (
    <MapView
      showPOIs={true}
      showAssets={false}
      poiFilter={filter}
      height={height}
      onItemClick={onItemClick}
      center={center}
      zoom={zoom}
    />
  );
}

// Export a version specifically for Assets
export function AssetMapView({
  filter,
  height,
  onItemClick,
  center,
  zoom,
}: {
  filter?: { type?: string; status?: string };
  height?: number;
  onItemClick?: (item: any) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  return (
    <MapView
      showPOIs={false}
      showAssets={true}
      assetFilter={filter}
      height={height}
      onItemClick={onItemClick}
      center={center}
      zoom={zoom}
    />
  );
}
