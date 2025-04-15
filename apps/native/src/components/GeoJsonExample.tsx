import React, { useState } from 'react';
import { View, StyleSheet, Button, Text, Alert } from 'react-native';
import MapView from 'react-native-maps';
import GeoJsonLayer, { GeoJsonFeature, GeoJsonObject } from './GeoJsonLayer';

const exampleGeoJson: GeoJsonObject = {
  type: 'FeatureCollection',
  features: [
    // Polygon example (a triangle)
    {
      type: 'Feature',
      id: 'polygon-1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.410, 37.782],
            [-122.415, 37.778],
            [-122.405, 37.775],
            [-122.410, 37.782], // Closing the polygon by repeating first point
          ]
        ]
      },
      properties: {
        name: 'Construction Zone',
        description: 'Active construction area',
        strokeColor: 'rgba(255, 0, 0, 0.8)',
        strokeWidth: 2,
        fillColor: 'rgba(255, 0, 0, 0.2)',
      }
    },
    // Line example
    {
      type: 'Feature',
      id: 'line-1',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.425, 37.785],
          [-122.422, 37.787],
          [-122.418, 37.787],
          [-122.415, 37.785],
        ]
      },
      properties: {
        name: 'Pipeline',
        description: 'Underground water pipeline',
        strokeColor: 'rgba(0, 0, 255, 0.8)',
        strokeWidth: 4,
      }
    },
    // Point example
    {
      type: 'Feature',
      id: 'point-1',
      geometry: {
        type: 'Point',
        coordinates: [-122.420, 37.790]
      },
      properties: {
        name: 'Equipment Storage',
        description: 'Location of equipment storage',
        color: '#8E44AD',
      }
    },
    // Circle example
    {
      type: 'Feature',
      id: 'circle-1',
      geometry: {
        type: 'Circle',
        coordinates: [-122.415, 37.795],
        radius: 200, // 200 meters
      },
      properties: {
        name: 'Safety Zone',
        description: 'Keep clear of this area',
        strokeColor: 'rgba(255, 165, 0, 0.8)',
        strokeWidth: 2,
        fillColor: 'rgba(255, 165, 0, 0.2)',
      }
    },
  ]
};

const GeoJsonExample = () => {
  const [showGeoJson, setShowGeoJson] = useState(true);
  
  const handleFeaturePress = (feature: GeoJsonFeature) => {
    const { properties } = feature;
    const title = properties?.name || 'Feature';
    const message = properties?.description || 'No description';
    
    Alert.alert(title, message);
  };
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.785,
          longitude: -122.415,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {showGeoJson && (
          <GeoJsonLayer 
            geojson={exampleGeoJson} 
            onPress={handleFeaturePress}
          />
        )}
      </MapView>
      
      <View style={styles.controls}>
        <Text style={styles.title}>GeoJSON Layer Example</Text>
        <Button
          title={showGeoJson ? 'Hide GeoJSON' : 'Show GeoJSON'}
          onPress={() => setShowGeoJson(!showGeoJson)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default GeoJsonExample; 