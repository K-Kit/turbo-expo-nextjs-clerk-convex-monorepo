import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { GeoJsonLayer } from '../components';
import { GeoJsonObject } from '../components/GeoJsonLayer';

const generateExampleGeoJson = (): GeoJsonObject => {
  return {
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
};

const GeoJsonMapScreen = () => {
  const [showGeoJson, setShowGeoJson] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject>(generateExampleGeoJson());
  const mapRef = useRef(null);

  const toggleGeoJson = () => {
    setShowGeoJson(!showGeoJson);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GeoJSON Map</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleGeoJson}
          >
            <Ionicons 
              name={showGeoJson ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
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
              geojson={geoJsonData} 
              visible={true}
              onPress={(feature) => {
                console.log('Feature pressed:', feature.properties?.name);
              }}
            />
          )}
        </MapView>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          GeoJSON Layer Demo - Showing various geometry types
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0D87E1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 10,
    padding: 5,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

export default GeoJsonMapScreen; 