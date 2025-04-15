import { GeoJsonFeature, GeoJsonObject } from "./GeoJsonLayer";

/**
 * Converts coordinates from [lat, lng] Convex format to GeoJSON's [lng, lat] format
 */
export const convertToGeoJsonCoordinates = (coords: number[][]): number[][] => {
  return coords.map(coord => [coord[1], coord[0]]);
};

/**
 * Converts a circular geofence (center point + radius) to GeoJSON Circle feature
 */
export const circleToGeoJson = (
  id: string,
  center: { latitude: number; longitude: number },
  radius: number,
  properties: Record<string, any> = {}
): GeoJsonFeature => {
  return {
    type: 'Feature',
    id,
    geometry: {
      type: 'Circle',
      coordinates: [center.longitude, center.latitude],
      radius,
    },
    properties: {
      ...properties,
    },
  };
};

/**
 * Converts a polygon geofence to GeoJSON Polygon feature
 */
export const polygonToGeoJson = (
  id: string,
  coordinates: number[][],
  properties: Record<string, any> = {}
): GeoJsonFeature => {
  // Convert from backend format [lat, lng] to GeoJSON format [lng, lat]
  const geoJsonCoords = convertToGeoJsonCoordinates(coordinates);
  
  // Ensure polygon is closed (first and last point match)
  const firstPoint = geoJsonCoords[0];
  const lastPoint = geoJsonCoords[geoJsonCoords.length - 1];
  
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    geoJsonCoords.push([...firstPoint]);
  }
  
  return {
    type: 'Feature',
    id,
    geometry: {
      type: 'Polygon',
      coordinates: [geoJsonCoords],
    },
    properties: {
      ...properties,
    },
  };
};

/**
 * Converts an array of geofences from the backend to a GeoJSON FeatureCollection
 */
export const geofencesToGeoJson = (
  geofences: any[],
  options: {
    polygonStyle?: {
      strokeColor?: string;
      strokeWidth?: number;
      fillColor?: string;
    };
    circleStyle?: {
      strokeColor?: string;
      strokeWidth?: number;
      fillColor?: string;
    };
  } = {}
): GeoJsonObject => {
  const features: GeoJsonFeature[] = [];
  
  geofences.forEach(geofence => {
    const commonProps = {
      name: geofence.name,
      description: geofence.description,
      isActive: geofence.isActive,
      ...(geofence.type === 'polygon' ? options.polygonStyle : options.circleStyle),
    };
    
    if (geofence.type === 'circle' && geofence.center && geofence.radius) {
      features.push(
        circleToGeoJson(
          geofence._id,
          geofence.center,
          geofence.radius,
          commonProps
        )
      );
    } else if (geofence.coordinates && geofence.coordinates.length >= 3) {
      features.push(
        polygonToGeoJson(
          geofence._id,
          geofence.coordinates,
          commonProps
        )
      );
    }
  });
  
  return {
    type: 'FeatureCollection',
    features,
  };
};

/**
 * Converts worksites with circular geofences to GeoJSON
 */
export const worksitesToGeoJson = (
  worksites: any[],
  options: {
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
  } = {}
): GeoJsonObject => {
  const features: GeoJsonFeature[] = [];
  
  worksites.forEach(worksite => {
    if (
      worksite?.coordinates?.latitude && 
      worksite?.coordinates?.longitude && 
      worksite?.radius
    ) {
      features.push(
        circleToGeoJson(
          worksite._id,
          {
            latitude: worksite.coordinates.latitude,
            longitude: worksite.coordinates.longitude,
          },
          worksite.radius,
          {
            name: worksite.name,
            description: worksite.description || `Radius: ${worksite.radius}m`,
            strokeColor: options.strokeColor || 'rgba(13, 135, 225, 0.5)',
            strokeWidth: options.strokeWidth || 1,
            fillColor: options.fillColor || 'rgba(13, 135, 225, 0.1)',
          }
        )
      );
    }
  });
  
  return {
    type: 'FeatureCollection',
    features,
  };
}; 