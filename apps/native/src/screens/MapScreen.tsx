import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import * as Location from 'expo-location';

const MapScreen = () => {
  const { currentTenantId } = useTenant();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    worksites: true,
    incidents: true,
    assets: true,
    pois: true,
  });

  const tenantId = currentTenantId ? currentTenantId as Id<"tenants"> : null;
  
  // Query data from Convex
  const worksites = useQuery(
    api.worksites.listForUser, 
    {}
  ) || [];
  
  const incidents = useQuery(
    api.incidents.listIncidentsByTenant, 
    tenantId ? { tenantId } : "skip"
  ) || [];

  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Default to San Francisco if no user location is available
  const initialRegion = {
    latitude: location ? location.coords.latitude : 37.7749,
    longitude: location ? location.coords.longitude : -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Toggle layer visibility
  const toggleLayer = (layer) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  if (!tenantId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No tenant selected</Text>
      </View>
    );
  }

  // Get marker color based on incident severity
  const getIncidentMarkerColor = (severity) => {
    switch (severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <TouchableOpacity>
          <Ionicons name="layers-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0D87E1" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          onLayout={() => setMapReady(true)}
        >
          {/* Worksite markers */}
          {visibleLayers.worksites && worksites.filter(worksite => worksite.coordinates).map(worksite => (
            <Marker
              key={`worksite-${worksite._id}`}
              coordinate={{
                latitude: worksite.coordinates.latitude,
                longitude: worksite.coordinates.longitude,
              }}
              title={worksite.name}
              description={worksite.address || ''}
              pinColor="#0D87E1"
            />
          ))}
          
          {/* Incident markers */}
          {visibleLayers.incidents && incidents.filter(incident => incident.location).map(incident => (
            <Marker
              key={`incident-${incident._id}`}
              coordinate={{
                latitude: incident.location.latitude,
                longitude: incident.location.longitude,
              }}
              title={incident.title}
              description={`${incident.severity} incident`}
              pinColor={getIncidentMarkerColor(incident.severity)}
            />
          ))}
        </MapView>
      </View>

      {/* Layer controls */}
      <View style={styles.layerControls}>
        <TouchableOpacity 
          style={[styles.layerButton, visibleLayers.worksites ? styles.activeLayer : {}]}
          onPress={() => toggleLayer('worksites')}
        >
          <Ionicons 
            name="business" 
            size={20} 
            color={visibleLayers.worksites ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.layerButton, visibleLayers.incidents ? styles.activeLayer : {}]}
          onPress={() => toggleLayer('incidents')}
        >
          <Ionicons 
            name="warning" 
            size={20} 
            color={visibleLayers.incidents ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.layerButton, visibleLayers.assets ? styles.activeLayer : {}]}
          onPress={() => toggleLayer('assets')}
        >
          <Ionicons 
            name="cube" 
            size={20} 
            color={visibleLayers.assets ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.layerButton, visibleLayers.pois ? styles.activeLayer : {}]}
          onPress={() => toggleLayer('pois')}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={visibleLayers.pois ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#0D87E1',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: 'SemiBold',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: RFValue(14),
    fontFamily: 'Medium',
    color: '#333333',
  },
  layerControls: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  layerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  activeLayer: {
    backgroundColor: '#0D87E1',
  },
});

export default MapScreen; 