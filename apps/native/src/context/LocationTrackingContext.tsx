import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Alert, Platform, AppState } from 'react-native';
import { useTenant } from './TenantContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';

// Define task name
const LOCATION_TRACKING = 'location-tracking';
const LOCATION_FETCH = 'background-fetch';

// Define context types
type LocationTrackingContextType = {
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  lastLocation: Location.LocationObject | null;
  errorMsg: string | null;
};

// Create context
const LocationTrackingContext = createContext<LocationTrackingContextType | undefined>(undefined);

// Define background task handler
TaskManager.defineTask(LOCATION_TRACKING, async ({ data, error }) => {
  if (error) {
    console.error('LOCATION_TRACKING task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      // Store the location data locally
      try {
        // This would be used to store location data locally
        // We'll implement this with Convex directly for now
      } catch (err) {
        console.error('Error storing location data:', err);
      }
    }
  }
});

// Define background fetch task
TaskManager.defineTask(LOCATION_FETCH, async () => {
  try {
    // TODO: Implement syncing location data when network is available
    // For now we're doing real-time updates
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Background fetch task error:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Create provider component
export const LocationTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const { currentTenantId } = useTenant();
  
  // Convex mutations for recording location
  const recordLocation = useMutation(api.userLocations.recordLocation);
  const toggleTracking = useMutation(api.userLocations.toggleTracking);
  
  // Get tracking status from backend
  const trackingStatus = useQuery(api.userLocations.getTrackingStatus, 
    currentTenantId ? { tenantId: currentTenantId as Id<"tenants"> } : "skip"
  );
  
  // Initialize tracking status from backend
  useEffect(() => {
    if (trackingStatus && trackingStatus.isTracking !== undefined) {
      setIsTracking(trackingStatus.isTracking);
      
      // If backend says we're tracking but we're not actively tracking, restart it
      if (trackingStatus.isTracking && !isTracking) {
        startTrackingInternal();
      }
    }
  }, [trackingStatus]);
  
  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active' && isTracking) {
        // App came back to foreground, check location and update
        getCurrentPosition();
      }
      setAppState(nextAppState);
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [appState, isTracking]);
  
  // Get permissions and initial location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        
        // For background tracking, also request background permissions
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            setErrorMsg('Background location permission denied');
            Alert.alert(
              'Background Location Access Required',
              'WorkSafeMaps needs access to your location in the background to track your position during field work. This helps ensure your safety.',
              [{ text: 'OK' }]
            );
          }
        }
        
        await getCurrentPosition();
      } catch (error) {
        setErrorMsg('Error getting location permissions');
        console.error('Error setting up location:', error);
      }
    })();
  }, []);
  
  // Get current position
  const getCurrentPosition = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLastLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting current position:', error);
      throw error;
    }
  };
  
  // Start tracking internal function
  const startTrackingInternal = async () => {
    try {
      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Update every 1 minute
        distanceInterval: 100, // Or every 100 meters
        foregroundService: {
          notificationTitle: 'WorkSafeMaps Tracking',
          notificationBody: 'Your location is being tracked for safety',
          notificationColor: '#0D87E1',
        },
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
      });
      
      // Set up background fetch
      await BackgroundFetch.registerTaskAsync(LOCATION_FETCH, {
        minimumInterval: 60, // 1 minute minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      setIsTracking(true);
      
      // Get initial location and record it
      const location = await getCurrentPosition();
      if (location && currentTenantId) {
        await recordLocation({
          tenantId: currentTenantId as Id<"tenants">,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
          },
          isTracking: true,
          deviceInfo: `${Platform.OS} ${Platform.Version}`,
        });
      }
    } catch (error) {
      setErrorMsg('Failed to start location tracking');
      console.error('Error starting location tracking:', error);
    }
  };
  
  // Public API: Start tracking
  const startTracking = async () => {
    try {
      if (currentTenantId) {
        // Update tracking status in backend
        await toggleTracking({
          tenantId: currentTenantId as Id<"tenants">,
          isTracking: true,
        });
        
        // Start actual tracking
        await startTrackingInternal();
      } else {
        setErrorMsg('No tenant selected');
      }
    } catch (error) {
      setErrorMsg('Failed to start tracking');
      console.error('Error starting tracking:', error);
    }
  };
  
  // Public API: Stop tracking
  const stopTracking = async () => {
    try {
      // Stop tracking in backend
      if (currentTenantId) {
        await toggleTracking({
          tenantId: currentTenantId as Id<"tenants">,
          isTracking: false,
        });
      }
      
      // Stop location updates
      const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING);
      }
      
      // Stop background fetch
      const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_FETCH);
      if (isFetchRegistered) {
        await BackgroundFetch.unregisterTaskAsync(LOCATION_FETCH);
      }
      
      setIsTracking(false);
    } catch (error) {
      setErrorMsg('Failed to stop location tracking');
      console.error('Error stopping location tracking:', error);
    }
  };
  
  // Send location update manually
  useEffect(() => {
    const locationUpdateInterval = setInterval(async () => {
      if (isTracking && currentTenantId) {
        try {
          const location = await getCurrentPosition();
          if (location) {
            await recordLocation({
              tenantId: currentTenantId as Id<"tenants">,
              coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                speed: location.coords.speed,
                heading: location.coords.heading,
              },
              isTracking: true,
              deviceInfo: `${Platform.OS} ${Platform.Version}`,
            });
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(locationUpdateInterval);
  }, [isTracking, currentTenantId]);
  
  return (
    <LocationTrackingContext.Provider
      value={{
        isTracking,
        startTracking,
        stopTracking,
        lastLocation,
        errorMsg,
      }}
    >
      {children}
    </LocationTrackingContext.Provider>
  );
};

// Custom hook for using the context
export const useLocationTracking = () => {
  const context = useContext(LocationTrackingContext);
  if (context === undefined) {
    throw new Error('useLocationTracking must be used within a LocationTrackingProvider');
  }
  return context;
}; 