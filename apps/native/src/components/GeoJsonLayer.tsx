import React, { FC, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Marker, Polygon, Polyline } from 'react-native-maps';

export type GeoJsonFeature = {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'Circle';
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

type GeoJsonLayerProps = {
  geojson: GeoJsonObject;
  visible?: boolean;
  onPress?: (feature: GeoJsonFeature) => void;
};

const defaultStyles = {
  polygon: {
    strokeColor: 'rgba(0, 150, 255, 0.8)',
    strokeWidth: 2,
    fillColor: 'rgba(0, 150, 255, 0.2)',
  },
  polyline: {
    strokeColor: 'rgba(255, 140, 0, 0.8)',
    strokeWidth: 3,
  },
  point: {
    color: '#FF5722',
    size: 6,
  },
  circle: {
    strokeColor: 'rgba(76, 175, 80, 0.8)',
    strokeWidth: 2,
    fillColor: 'rgba(76, 175, 80, 0.2)',
  },
};

/**
 * Component to render GeoJSON features on a react-native-maps MapView
 * Must be used as a child component of MapView
 */
const GeoJsonLayer: FC<GeoJsonLayerProps> = ({ geojson, visible = true, onPress }) => {
  if (!visible || !geojson || !geojson.features || geojson.features.length === 0) {
    return null;
  }

  // Render Points (Markers)
  const renderPoints = () => {
    return geojson.features
      .filter(feature => feature.geometry.type === 'Point')
      .map((feature, index) => {
        const { geometry, properties = {} } = feature;
        const id = feature.id || `point-${index}`;
        const coords = geometry.coordinates as number[];
        
        const handlePress = () => {
          if (onPress) onPress(feature);
        };
        
        return (
          <Marker
            key={`point-${id}`}
            coordinate={{
              latitude: coords[1],
              longitude: coords[0],
            }}
            pinColor={properties.color || defaultStyles.point.color}
            onPress={handlePress}
            title={properties.name}
            description={properties.description}
          />
        );
      });
  };
  
  // Render LineStrings (Polylines)
  const renderLines = () => {
    return geojson.features
      .filter(feature => feature.geometry.type === 'LineString')
      .map((feature, index) => {
        const { geometry, properties = {} } = feature;
        const id = feature.id || `line-${index}`;
        const coords = geometry.coordinates as number[][];
        
        const handlePress = () => {
          if (onPress) onPress(feature);
        };
        
        return (
          <Polyline
            key={`line-${id}`}
            coordinates={coords.map(coord => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            strokeColor={properties.strokeColor || defaultStyles.polyline.strokeColor}
            strokeWidth={properties.strokeWidth || defaultStyles.polyline.strokeWidth}
            onPress={handlePress}
          />
        );
      });
  };
  
  // Render Polygons
  const renderPolygons = () => {
    return geojson.features
      .filter(feature => feature.geometry.type === 'Polygon')
      .map((feature, index) => {
        const { geometry, properties = {} } = feature;
        const id = feature.id || `polygon-${index}`;
        const coords = geometry.coordinates as number[][][];
        const outerRing = coords[0];
        
        const handlePress = () => {
          if (onPress) onPress(feature);
        };
        
        return (
          <Polygon
            key={`polygon-${id}`}
            coordinates={outerRing.map(coord => ({
              latitude: coord[1],
              longitude: coord[0],
            }))}
            strokeColor={properties.strokeColor || defaultStyles.polygon.strokeColor}
            strokeWidth={properties.strokeWidth || defaultStyles.polygon.strokeWidth}
            fillColor={properties.fillColor || defaultStyles.polygon.fillColor}
            onPress={handlePress}
          />
        );
      });
  };
  
  // Render Circles
  const renderCircles = () => {
    return geojson.features
      .filter(feature => feature.geometry.type === 'Circle')
      .map((feature, index) => {
        const { geometry, properties = {} } = feature;
        const id = feature.id || `circle-${index}`;
        const center = geometry.coordinates as number[];
        const radius = geometry.radius || 100;
        
        return (
          <Circle
            key={`circle-${id}`}
            center={{
              latitude: center[1],
              longitude: center[0],
            }}
            radius={radius}
            strokeColor={properties.strokeColor || defaultStyles.circle.strokeColor}
            strokeWidth={properties.strokeWidth || defaultStyles.circle.strokeWidth}
            fillColor={properties.fillColor || defaultStyles.circle.fillColor}
          />
        );
      });
  };

  // Return all the rendered features
  return (
    <>
      {renderPoints()}
      {renderLines()}
      {renderPolygons()}
      {renderCircles()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});

export default GeoJsonLayer; 