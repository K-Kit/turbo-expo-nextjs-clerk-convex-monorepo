# GeoJSON Components for WorkSafeMaps

This directory contains components and utilities for rendering GeoJSON data on maps in the WorkSafeMaps application.

## Components

### GeoJsonLayer

The `GeoJsonLayer` component renders GeoJSON features on a `react-native-maps` MapView. It supports the following GeoJSON feature types:

- Points
- LineStrings
- Polygons
- Circles (custom extension to GeoJSON)

#### Usage

```jsx
import { GeoJsonLayer } from '../components';

// In your component:
<MapView>
  <GeoJsonLayer 
    geojson={geoJsonData} 
    visible={true}
    onPress={(feature) => {
      console.log('Feature pressed:', feature.properties?.name);
    }}
  />
</MapView>
```

#### Props

- `geojson` (required): A GeoJSON FeatureCollection object
- `visible` (optional): Boolean to control visibility (default: true)
- `onPress` (optional): Callback function when a feature is pressed

## Utilities

### GeoJsonUtils

The `GeoJsonUtils` module provides helper functions to convert backend data to GeoJSON format:

- `convertToGeoJsonCoordinates`: Converts coordinates from the backend format ([lat, lng]) to GeoJSON format ([lng, lat])
- `circleToGeoJson`: Converts a circular geofence to a GeoJSON Circle feature
- `polygonToGeoJson`: Converts a polygon geofence to a GeoJSON Polygon feature
- `geofencesToGeoJson`: Converts an array of geofences to a GeoJSON FeatureCollection
- `worksitesToGeoJson`: Converts worksites with circular geofences to GeoJSON

#### Example

```jsx
import { worksitesToGeoJson } from '../components/GeoJsonUtils';

// In your component:
const worksites = [...]; // From Convex backend

const geofencesGeoJson = worksitesToGeoJson(worksites, {
  strokeColor: 'rgba(13, 135, 225, 0.5)',
  strokeWidth: 1,
  fillColor: 'rgba(13, 135, 225, 0.1)',
});

// Now use with GeoJsonLayer
<GeoJsonLayer geojson={geofencesGeoJson} visible={true} />
```

## GeoJSON Format

GeoJSON is a standard format for representing geographic data structures. Our implementation follows the standard with one extension:

```typescript
export type GeoJsonFeature = {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'Circle'; // Circle is our extension
    coordinates: number[] | number[][] | number[][][];
    radius?: number; // For circle type
  };
  properties?: {
    name?: string;
    description?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    [key: string]: any;
  };
};

export type GeoJsonObject = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};
```

## Example Screen

See `GeoJsonMapScreen.tsx` for a complete example of how to use the GeoJSON components. 