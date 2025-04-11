"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../../../packages/backend/convex/_generated/api";
import { useTenantId } from "@/hooks/useTenantId";
import { mapViewSettingsAtom, useWorksite, useWorksites } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { cn } from "@/lib/utils";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Memoized Google Map component to prevent unnecessary re-renders
const GoogleMapComponent = memo(({
  items,
  onItemClick,
  zoom = 12,
  center,
  className,
}: {
  items: any[];
  onItemClick: (item: any) => void;
  zoom?: number;
  center?: { lat: number; lng: number };
  className?: string;
}) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const defaultCenter = { lat: 37.771365, lng: -122.417225 }; // San Francisco as default
  const mapCenter = center || defaultCenter;

  // Load the Google Maps JavaScript API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Handle map load event
  const onLoad = useCallback((map: google.maps.Map) => {
    // You can perform additional setup here if needed
  }, []);

  // Handle map unmount event
  const onUnmount = useCallback((map: google.maps.Map) => {
    // Cleanup if needed
  }, []);

  // Handle marker click
  const handleMarkerClick = (item: any) => {
    setSelectedItem(item);
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Close info window
  const handleInfoWindowClose = () => {
    setSelectedItem(null);
  };

  // Get marker icon based on item type
  const getMarkerIcon = (item: any) => {
    if (item._type === 'poi') {
      return {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      };
    } else if (item._type === 'asset') {
      return {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      };
    } else if (item._type === 'incident') {
      return {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      };
    }
    return undefined;
  };

  if (!isLoaded) {
    return <div className={cn("w-full h-full flex items-center justify-center", className)}>Loading Map...</div>;
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {items.map((item, index) => (
          <Marker
            key={item._id || index}
            position={{ 
              lat: item.location?.latitude || item.location?.lat || 0, 
              lng: item.location?.longitude || item.location?.lng || 0 
            }}
            onClick={() => handleMarkerClick(item)}
            icon={getMarkerIcon(item)}
            title={item.name || item.title || `Item ${index}`}
          />
        ))}

        {selectedItem && (
          <InfoWindow
            position={{
              lat: selectedItem.location?.latitude || selectedItem.location?.lat || 0,
              lng: selectedItem.location?.longitude || selectedItem.location?.lng || 0
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold">{selectedItem.name || selectedItem.title}</h3>
              {selectedItem.description && <p className="text-sm mt-1">{selectedItem.description}</p>}
              {selectedItem.status && <p className="text-xs mt-1">Status: {selectedItem.status}</p>}
              {selectedItem.type && <p className="text-xs">Type: {selectedItem.type}</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
});

GoogleMapComponent.displayName = 'GoogleMapComponent';

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
      items.push(...pois.map(poi => ({ ...poi, _type: 'poi' })));
    }

    if (assets) {
      items.push(...assets.map(asset => ({ ...asset, _type: 'asset' })));
    }

    if (incidents) {
      items.push(...incidents.map(incident => ({ ...incident, _type: 'incident' })));
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
    <div style={{ height: `${height}px` }} className={mapClassName}>
      <GoogleMapComponent
        items={combinedItems}
        onItemClick={handleItemClick}
        center={center}
        zoom={zoom}
        className={mapClassName}
      />
    </div>
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
