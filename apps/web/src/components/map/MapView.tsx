"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { AlertTriangle, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { Card } from "@/components/ui/card";

// This is a placeholder component - in a real implementation, you would use a proper map library
// like react-leaflet, Mapbox, or Google Maps
const MapPlaceholder = ({ 
  items, 
  onItemClick, 
  height = 500,
  zoom = 12,
  center,
}: { 
  items: any[]; 
  onItemClick: (item: any) => void;
  height?: number;
  zoom?: number;
  center?: { lat: number; lng: number };
}) => {
  return (
    <Card className="relative overflow-hidden" style={{ height }}>
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-100">
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-4">
            <p className="text-gray-500 mb-4">Map Component Placeholder</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-auto">
              {items.map((item) => (
                <div 
                  key={item._id} 
                  className="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                  onClick={() => onItemClick(item)}
                >
                  <div className="flex items-center">
                    {item.type === "hazard" ? (
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    ) : item.type === "safety_equipment" ? (
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                    ) : item.type === "vehicle" ? (
                      <Truck className="h-4 w-4 mr-2 text-blue-500" />
                    ) : (
                      <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                    )}
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-400 mt-4">
              In a real application, this would be a proper map component displaying the items with markers
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export function MapView({ 
  showPOIs = true, 
  showAssets = true,
  poiFilter,
  assetFilter,
  height = 500,
  onItemClick,
  center,
  zoom = 12,
}: { 
  showPOIs?: boolean; 
  showAssets?: boolean;
  poiFilter?: { type?: string; status?: string };
  assetFilter?: { type?: string; status?: string };
  height?: number;
  onItemClick?: (item: any) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}) {
  const tenantId = useTenantId();
  const [combinedItems, setCombinedItems] = useState<any[]>([]);
  
  // Fetch POIs if enabled
  const pois = useQuery(
    api.pois.getPOIs, 
    showPOIs && tenantId ? {
      tenantId,
      type: poiFilter?.type,
      status: poiFilter?.status,
    } : "skip"
  );
  
  // Fetch Assets if enabled
  const assets = useQuery(
    api.assets.getAssets, 
    showAssets && tenantId ? {
      tenantId,
      type: assetFilter?.type,
      status: assetFilter?.status,
    } : "skip"
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
    
    setCombinedItems(items);
  }, [pois, assets]);
  
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