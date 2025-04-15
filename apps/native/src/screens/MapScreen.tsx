import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Modal, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import * as Location from 'expo-location';
import { useLocationTracking } from '../context/LocationTrackingContext';
import GeoJsonLayer from '../components/GeoJsonLayer';
import { worksitesToGeoJson } from '../components/GeoJsonUtils';
import { useConvex } from "convex/react";

// Define marker types
type MapMarker = {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  type: 'worksite' | 'incident' | 'asset' | 'poi' | 'user';
  severity?: string;
  data: any;
};

// Define search result type
type SearchResult = {
  id: string;
  name: string;
  address: string;
  type: 'worksite' | 'incident' | 'asset' | 'poi';
  coordinate: {
    latitude: number;
    longitude: number;
  };
  severity?: string;
  icon: 'business' | 'warning' | 'cube' | 'location';
};

// Define user location type
type UserLocation = {
  _id: string;
  userId: string;
  tenantId: Id<"tenants">;
  timestamp: number;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  };
  isTracking: boolean;
  deviceInfo?: string;
  batteryLevel?: number;
  user?: {
    name: string;
    email: string;
    profileImageUrl?: string;
  };
};

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
    teamMembers: true,
  });
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const mapRef = useRef(null);

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

  const assets = useQuery(
    api.assets.getAssets,
    tenantId ? { tenantId } : "skip"
  ) || [];

  const pois = useQuery(
    api.pois.getPOIs,
    tenantId ? { tenantId } : "skip"
  ) || [];

  // Get team members locations
  const teamLocations = useQuery(
    api.userLocations.getCurrentUserLocations,
    currentTenantId ? { tenantId: currentTenantId as Id<"tenants"> } : "skip"
  ) || [];

  // Add query to fetch geofences - using the correct function name from the API
  const geofences = useQuery(
    api.geofences.listByWorksite,
    // We need a worksiteId parameter, not tenantId
    worksites && worksites.length > 0 ? { worksiteId: worksites[0]._id } : "skip"
  ) || [];

  // Get all geofences for all worksites
  const [allGeofences, setAllGeofences] = useState<any[]>([]);
  
  // Update all geofences when worksites change
  useEffect(() => {
    const fetchAllGeofences = async () => {
      if (!worksites || worksites.length === 0 || !tenantId) return;
      
      try {
        // Create a local copy to accumulate all geofences
        let geofencesCollection: any[] = [];
        
        // Use Promise.all to fetch geofences for all worksites in parallel
        const convexClient = useConvex();
        const geofencePromises = worksites.map(worksite => 
          convexClient.query(api.geofences.listByWorksite, { worksiteId: worksite._id })
        );
        
        const results = await Promise.all(geofencePromises);
        
        // Combine all results
        results.forEach(result => {
          if (Array.isArray(result)) {
            geofencesCollection = [...geofencesCollection, ...result];
          }
        });
        
        setAllGeofences(geofencesCollection);
      } catch (error) {
        console.error('Error fetching all geofences:', error);
      }
    };
    
    fetchAllGeofences();
  }, [worksites, tenantId]);

  // Check if data is loading
  const isLoading = 
    worksites === undefined || 
    (tenantId && incidents === undefined) ||
    (tenantId && assets === undefined) ||
    (tenantId && pois === undefined);

  // Optimize location updates with a debounce/throttle effect
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          // Still set map ready even without location
          setMapReady(true);
          return;
        }

        // Set map ready first to prevent freezing during location fetch
        setMapReady(true);
        
        // Then get location (this prevents UI freeze while waiting for location)
        setTimeout(async () => {
          try {
            let location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced, // Lower accuracy for better performance
            });
            setLocation(location);
          } catch (locationError) {
            console.error('Error getting location:', locationError);
          }
        }, 500); // Small delay to let map render first
        
      } catch (error) {
        console.error('Error getting location permissions:', error);
        setErrorMsg('Error getting location');
        setMapReady(true);
      }
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

  // Update the useEffect where we load data to also handle geofences
  useEffect(() => {
    if (Array.isArray(worksites) && mapReady) {
      // This is causing a re-render loop
      // setMapReady(true); <-- Remove this line
    }
  }, [worksites, mapReady]);

  // Update the GeoJSON type to match the expected type
  const geofencesGeoJson = useMemo(() => {
    if (!showGeofences || !visibleLayers.worksites) {
      return null;
    }
    
    try {
      // Combine worksite boundaries with actual geofences
      const features = [];
      
      // Add worksite boundaries if available
      if (Array.isArray(worksites) && worksites.length > 0) {
        const worksiteGeoJson = worksitesToGeoJson(worksites, {
          strokeColor: 'rgba(13, 135, 225, 0.5)', 
          strokeWidth: 1,
          fillColor: 'rgba(13, 135, 225, 0.1)',
        });
        
        if (worksiteGeoJson && worksiteGeoJson.features) {
          features.push(...worksiteGeoJson.features);
        }
      }
      
      // Add actual geofences if available
      if (Array.isArray(geofences) && geofences.length > 0) {
        // Process polygon geofences
        const polygonGeofences = geofences.filter(g => g.type === 'polygon' && g.coordinates && g.coordinates.length >= 3);
        for (const geofence of polygonGeofences) {
          features.push({
            type: 'Feature',
            id: geofence._id,
            geometry: {
              type: 'Polygon',
              coordinates: [geofence.coordinates.map(coord => [coord[1], coord[0]])], // Convert [lat,lng] to [lng,lat] for GeoJSON
            },
            properties: {
              name: geofence.name,
              description: geofence.description || '',
              strokeColor: geofence.strokeColor || 'rgba(13, 135, 225, 0.8)',
              strokeWidth: geofence.strokeWidth || 2,
              fillColor: geofence.fillColor || 'rgba(13, 135, 225, 0.2)',
            },
          });
        }
        
        // Process circle geofences
        const circleGeofences = geofences.filter(g => g.type === 'circle' && g.center && g.radius);
        for (const geofence of circleGeofences) {
          features.push({
            type: 'Feature',
            id: geofence._id,
            geometry: {
              type: 'Circle',
              coordinates: [geofence.center.longitude, geofence.center.latitude],
              radius: geofence.radius,
            },
            properties: {
              name: geofence.name,
              description: geofence.description || '',
              strokeColor: geofence.strokeColor || 'rgba(13, 135, 225, 0.8)',
              strokeWidth: geofence.strokeWidth || 2,
              fillColor: geofence.fillColor || 'rgba(13, 135, 225, 0.2)',
            },
          });
        }
      }
      
      // Return combined GeoJSON with explicit type
      return {
        type: 'FeatureCollection' as const,
        features,
      };
    } catch (error) {
      console.error('Error generating geofences GeoJSON:', error);
      return null;
    }
  }, [worksites, geofences, showGeofences, visibleLayers.worksites]);

  // Replace the renderGeofences function with a simple memoized version
  const geofencesLayer = useMemo(() => {
    if (!mapReady || !geofencesGeoJson) {
      return null;
    }
    
    return <GeoJsonLayer geojson={geofencesGeoJson} visible={true} />;
  }, [mapReady, geofencesGeoJson]);

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

  // Prepare all marker data for the map
  const getAllMarkers = (): MapMarker[] => {
    if (isLoading) return [];
    
    const markers: MapMarker[] = [];
    
    // Add worksite markers
    if (visibleLayers.worksites && Array.isArray(worksites)) {
      worksites
        .filter(worksite => worksite && worksite.coordinates && 
          typeof worksite.coordinates.latitude === 'number' && 
          typeof worksite.coordinates.longitude === 'number')
        .forEach(worksite => {
          markers.push({
            id: `worksite-${worksite._id}`,
            coordinate: {
              latitude: worksite.coordinates.latitude,
              longitude: worksite.coordinates.longitude,
            },
            title: worksite.name || 'Unnamed Worksite',
            description: worksite.address || '',
            type: 'worksite',
            data: worksite
          });
        });
    }
    
    // Add incident markers
    if (visibleLayers.incidents && Array.isArray(incidents)) {
      incidents
        .filter(incident => incident && incident.location && 
          typeof incident.location.latitude === 'number' && 
          typeof incident.location.longitude === 'number')
        .forEach(incident => {
          markers.push({
            id: `incident-${incident._id}`,
            coordinate: {
              latitude: incident.location.latitude,
              longitude: incident.location.longitude,
            },
            title: incident.title || 'Unnamed Incident',
            description: `${incident.severity || 'Unknown'} incident`,
            type: 'incident',
            severity: incident.severity,
            data: incident
          });
        });
    }
    
    // Add asset markers
    if (visibleLayers.assets && Array.isArray(assets)) {
      assets
        .filter(asset => asset && asset.location && 
          typeof asset.location.lat === 'number' && 
          typeof asset.location.lng === 'number')
        .forEach(asset => {
          markers.push({
            id: `asset-${asset._id}`,
            coordinate: {
              latitude: asset.location.lat,
              longitude: asset.location.lng,
            },
            title: asset.name || 'Unnamed Asset',
            description: asset.description || '',
            type: 'asset',
            data: asset
          });
        });
    }
    
    // Add POI markers
    if (visibleLayers.pois && Array.isArray(pois)) {
      pois
        .filter(poi => poi && poi.location && 
          typeof poi.location.lat === 'number' && 
          typeof poi.location.lng === 'number')
        .forEach(poi => {
          markers.push({
            id: `poi-${poi._id}`,
            coordinate: {
              latitude: poi.location.lat,
              longitude: poi.location.lng,
            },
            title: poi.name || 'Unnamed POI',
            description: poi.description || '',
            type: 'poi',
            data: poi
          });
        });
    }
    
    // Team member markers
    if (visibleLayers.teamMembers && Array.isArray(teamLocations)) {
      teamLocations.forEach(teamLocation => {
        if (teamLocation?.coordinates?.latitude && teamLocation?.coordinates?.longitude) {
          markers.push({
            id: `user-${teamLocation._id}`,
            coordinate: {
              latitude: teamLocation.coordinates.latitude,
              longitude: teamLocation.coordinates.longitude
            },
            title: teamLocation.user?.name || 'Team Member',
            description: `Last updated: ${new Date(teamLocation.timestamp).toLocaleTimeString()}`,
            type: 'user',
            data: teamLocation
          });
        }
      });
    }
    
    return markers;
  };

  // Memoize the markers to prevent recalculation
  const allMarkers = useMemo(() => getAllMarkers(), [
    visibleLayers,
    worksites,
    incidents,
    assets,
    pois,
    teamLocations,
    isLoading
  ]);

  // Search function
  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (!text.trim() || isLoading) {
      setSearchResults([]);
      return;
    }
    
    const query = text.toLowerCase();
    let results: SearchResult[] = [];
    
    try {
      // Search worksites
      if (Array.isArray(worksites)) {
        const matchingWorksites = worksites
          .filter(worksite => 
            worksite && 
            ((worksite.name && worksite.name.toLowerCase().includes(query)) || 
             (worksite.address && worksite.address.toLowerCase().includes(query)))
          )
          .map(worksite => ({
            id: `worksite-${worksite._id}`,
            name: worksite.name || 'Unnamed Worksite',
            address: worksite.address || '',
            type: 'worksite' as const,
            coordinate: {
              latitude: worksite.coordinates?.latitude || 0,
              longitude: worksite.coordinates?.longitude || 0
            },
            icon: 'business' as const
          }))
          .filter(result => result.coordinate.latitude !== 0 && result.coordinate.longitude !== 0);
        
        results = [...results, ...matchingWorksites];
      }
      
      // Search incidents
      if (Array.isArray(incidents)) {
        const matchingIncidents = incidents
          .filter(incident => 
            incident && 
            ((incident.title && incident.title.toLowerCase().includes(query)) || 
             (incident.description && incident.description.toLowerCase().includes(query)))
          )
          .map(incident => ({
            id: `incident-${incident._id}`,
            name: incident.title || 'Unnamed Incident',
            address: incident.address || '',
            type: 'incident' as const,
            coordinate: {
              latitude: incident.location?.latitude || 0,
              longitude: incident.location?.longitude || 0
            },
            severity: incident.severity,
            icon: 'warning' as const
          }))
          .filter(result => result.coordinate.latitude !== 0 && result.coordinate.longitude !== 0);
        
        results = [...results, ...matchingIncidents];
      }
      
      // Search assets
      if (Array.isArray(assets)) {
        const matchingAssets = assets
          .filter(asset => 
            asset && 
            ((asset.name && asset.name.toLowerCase().includes(query)) || 
             (asset.description && asset.description.toLowerCase().includes(query)))
          )
          .map(asset => ({
            id: `asset-${asset._id}`,
            name: asset.name || 'Unnamed Asset',
            address: asset.description || '',
            type: 'asset' as const,
            coordinate: {
              latitude: asset.location?.lat || 0,
              longitude: asset.location?.lng || 0
            },
            icon: 'cube' as const
          }))
          .filter(result => result.coordinate.latitude !== 0 && result.coordinate.longitude !== 0);
        
        results = [...results, ...matchingAssets];
      }
      
      // Search POIs
      if (Array.isArray(pois)) {
        const matchingPOIs = pois
          .filter(poi => 
            poi && 
            ((poi.name && poi.name.toLowerCase().includes(query)) || 
             (poi.description && poi.description.toLowerCase().includes(query)))
          )
          .map(poi => ({
            id: `poi-${poi._id}`,
            name: poi.name || 'Unnamed POI',
            address: poi.description || '',
            type: 'poi' as const,
            coordinate: {
              latitude: poi.location?.lat || 0,
              longitude: poi.location?.lng || 0
            },
            icon: 'location' as const
          }))
          .filter(result => result.coordinate.latitude !== 0 && result.coordinate.longitude !== 0);
        
        results = [...results, ...matchingPOIs];
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
    
    setSearchResults(results);
  };

  // Handle result selection
  const handleSelectSearchResult = (item: SearchResult) => {
    if (!item) return;

    setShowSearch(false);
    setSearchQuery('');
    
    // Navigate to the item on the map
    if (item.coordinate && 
        typeof item.coordinate.latitude === 'number' && 
        typeof item.coordinate.longitude === 'number' && 
        mapRef.current) {
      
      try {
        mapRef.current.animateToRegion({
          latitude: item.coordinate.latitude,
          longitude: item.coordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 1000);
      } catch (error) {
        console.error('Error animating map:', error);
      }
    }
  };

  // Update the renderMarkers function to also use memoization
  const renderedMarkers = useMemo(() => {
    if (!mapReady || isLoading) return null;
    
    try {
      return allMarkers.map(marker => {
        if (marker.type === 'user') {
          // Special rendering for team members
          return (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor="#FF6B6B" // coral red
            >
              <View style={styles.teamMemberMarker}>
                <View style={styles.teamMemberMarkerDot} />
                {marker.data.user?.name && (
                  <View style={styles.teamMemberNameBubble}>
                    <Text style={styles.teamMemberName}>
                      {marker.data.user.name.split(' ')[0]}
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        } else {
          // Standard marker for other types
          return (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={
                marker.type === 'incident' 
                  ? getIncidentMarkerColor(marker.data.severity)
                  : marker.type === 'worksite' ? '#0D87E1'
                  : marker.type === 'asset' ? '#8E44AD' : '#2ECC71'
              }
            />
          );
        }
      });
    } catch (error) {
      console.error('Error rendering markers:', error);
      return [];
    }
  }, [mapReady, isLoading, allMarkers]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowGeofences(!showGeofences)}
          >
            <Ionicons 
              name="git-branch-outline" 
              size={22} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Location Tracking Controls */}
      <TrackingControls />
      
      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchHeader}>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="arrow-back" size={24} color="#333333" />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations, incidents..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#777777" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <Ionicons 
                    name={item.icon as keyof typeof Ionicons.glyphMap} 
                    size={24} 
                    color={
                      item.type === 'incident' 
                        ? (item.severity === 'critical' ? '#D32F2F' : 
                           item.severity === 'high' ? '#F57C00' :
                           item.severity === 'medium' ? '#FFC107' : '#4CAF50')
                        : item.type === 'worksite' ? '#0D87E1'
                        : item.type === 'asset' ? '#8E44AD' : '#2ECC71'
                    }
                    style={styles.searchResultIcon}
                  />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultTitle}>{item.name}</Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No results found</Text>
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
      
      <View style={styles.mapContainer}>
        {mapReady ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location ? location.coords.latitude : 37.7749,
              longitude: location ? location.coords.longitude : -122.4194,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
          >
            {renderedMarkers}
            {geofencesLayer}
          </MapView>
        ) : (
          <View style={[styles.map, {backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}]}>
            <ActivityIndicator size="large" color="#0D87E1" />
            <Text style={{marginTop: 10}}>Loading map...</Text>
          </View>
        )}
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
        <TouchableOpacity 
          style={[styles.layerButton, visibleLayers.teamMembers ? styles.activeLayer : {}]}
          onPress={() => toggleLayer('teamMembers')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={visibleLayers.teamMembers ? "#FFFFFF" : "#333333"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Location Tracking Controls component
const TrackingControls = () => {
  const { isTracking, startTracking, stopTracking, lastLocation, errorMsg } = useLocationTracking();
  const [expanded, setExpanded] = useState(false);
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <View style={styles.trackingContainer}>
      <TouchableOpacity 
        style={styles.trackingHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.trackingStatusRow}>
          <Ionicons 
            name={isTracking ? "navigate" : "navigate-outline"} 
            size={20} 
            color={isTracking ? "#22c55e" : "#64748b"} 
          />
          <Text style={styles.trackingStatusText}>
            {isTracking ? "Tracking Active" : "Tracking Inactive"}
          </Text>
          {lastLocation && isTracking && (
            <Text style={styles.trackingLastUpdate}>
              Updated: {formatTime(lastLocation.timestamp)}
            </Text>
          )}
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#64748b" 
          />
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.trackingDetails}>
          <View style={styles.trackingDetailRow}>
            <Text style={styles.trackingDetailLabel}>Status:</Text>
            <View style={[
              styles.trackingBadge, 
              {backgroundColor: isTracking ? "#dcfce7" : "#f1f5f9"}
            ]}>
              <Text style={[
                styles.trackingBadgeText,
                {color: isTracking ? "#16a34a" : "#64748b"}
              ]}>
                {isTracking ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
          </View>
          
          {lastLocation && (
            <>
              <View style={styles.trackingDetailRow}>
                <Text style={styles.trackingDetailLabel}>Location:</Text>
                <Text style={styles.trackingDetailValue}>
                  {lastLocation.coords.latitude.toFixed(6)}, {lastLocation.coords.longitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.trackingDetailRow}>
                <Text style={styles.trackingDetailLabel}>Accuracy:</Text>
                <Text style={styles.trackingDetailValue}>
                  {lastLocation.coords.accuracy ? `±${Math.round(lastLocation.coords.accuracy)}m` : 'Unknown'}
                </Text>
              </View>
            </>
          )}
          
          {errorMsg && (
            <View style={styles.trackingError}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.trackingErrorText}>{errorMsg}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.trackingButton,
              {backgroundColor: isTracking ? "#ef4444" : "#22c55e"}
            ]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Ionicons 
              name={isTracking ? "stop-circle" : "play-circle"} 
              size={18} 
              color="#FFFFFF" 
            />
            <Text style={styles.trackingButtonText}>
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 12,
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
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  calloutDesc: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchContainer: {
    height: '80%',
    marginTop: 'auto',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
    height: 40,
    fontSize: RFValue(14),
    fontFamily: 'Regular',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchResultIcon: {
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: RFValue(14),
    fontFamily: 'Medium',
    color: '#333333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: RFValue(12),
    fontFamily: 'Regular',
    color: '#777777',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#777777',
  },
  trackingContainer: {
    margin: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  trackingHeader: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  trackingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingStatusText: {
    fontSize: RFValue(14),
    fontFamily: 'Medium',
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  trackingLastUpdate: {
    fontSize: RFValue(11),
    fontFamily: 'Regular',
    color: '#94a3b8',
    marginRight: 8,
  },
  trackingDetails: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  trackingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingDetailLabel: {
    fontSize: RFValue(12),
    fontFamily: 'Medium',
    color: '#64748b',
    width: 80,
  },
  trackingDetailValue: {
    fontSize: RFValue(12),
    fontFamily: 'Regular',
    color: '#334155',
    flex: 1,
  },
  trackingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  trackingBadgeText: {
    fontSize: RFValue(10),
    fontFamily: 'Bold',
    color: '#64748b',
  },
  trackingError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  trackingErrorText: {
    fontSize: RFValue(12),
    fontFamily: 'Regular',
    color: '#b91c1c',
    marginLeft: 6,
    flex: 1,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  trackingButtonText: {
    fontSize: RFValue(14),
    fontFamily: 'Medium',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  teamMemberMarker: {
    alignItems: 'center',
  },
  teamMemberMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  teamMemberNameBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  teamMemberName: {
    fontSize: RFValue(9),
    fontFamily: 'Medium',
    color: '#333333',
  },
});

export default MapScreen; 