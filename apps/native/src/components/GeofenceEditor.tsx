import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import MapView, { Marker, Polygon, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// Define shape types
type ShapeType = 'polygon' | 'circle';

// Define geofence data interface
interface GeofenceData {
  id?: string;
  worksiteId: Id<"worksites">;
  type: ShapeType;
  name: string;
  description?: string;
  // Polygon data
  coordinates?: [number, number][];
  // Circle data
  center?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  // Styling
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
}

interface GeofenceEditorProps {
  worksiteId: Id<"worksites">;
  initialGeofence?: GeofenceData;
  onSave?: (geofence: GeofenceData) => void;
  onCancel?: () => void;
}

const DEFAULT_STROKE_COLOR = 'rgba(0, 150, 255, 0.8)';
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_FILL_COLOR = 'rgba(0, 150, 255, 0.2)';

const GeofenceEditor: React.FC<GeofenceEditorProps> = ({
  worksiteId,
  initialGeofence,
  onSave,
  onCancel
}) => {
  // Map reference for controlling the map
  const mapRef = useRef<MapView>(null);
  
  // Editor state
  const [editorMode, setEditorMode] = useState<'view' | 'draw' | 'edit'>('view');
  const [shapeType, setShapeType] = useState<ShapeType>(initialGeofence?.type || 'polygon');
  const [currentGeofence, setCurrentGeofence] = useState<GeofenceData>(initialGeofence || {
    worksiteId,
    type: 'polygon',
    name: 'New Geofence',
    description: '',
    coordinates: [],
    strokeColor: DEFAULT_STROKE_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    fillColor: DEFAULT_FILL_COLOR,
  });
  
  // Temporary drawing state
  const [drawingPoints, setDrawingPoints] = useState<{latitude: number, longitude: number}[]>([]);
  const [circleDraft, setCircleDraft] = useState<{
    center: {latitude: number, longitude: number};
    radius: number;
  } | null>(null);
  
  // Input state for name and description
  const [nameInput, setNameInput] = useState(initialGeofence?.name || 'New Geofence');
  const [descriptionInput, setDescriptionInput] = useState(initialGeofence?.description || '');
  
  // Convex mutation for saving geofence
  const createGeofence = useMutation(api.geofences.create);
  
  // Initial user location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  // Feedback state
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  // Add a new state variable for the most recently added point index
  const [lastAddedPointIndex, setLastAddedPointIndex] = useState<number | null>(null);
  
  // Add opacity state for fade effect
  const [feedbackOpacity, setFeedbackOpacity] = useState(1);
  
  // Add animation state for the latest point
  const [markerScale, setMarkerScale] = useState(1);
  
  // Add animation effect when a new point is added
  useEffect(() => {
    if (lastAddedPointIndex !== null) {
      // Create a pulsing effect
      let growing = true;
      const pulseInterval = setInterval(() => {
        setMarkerScale(prev => {
          if (growing) {
            const newScale = prev + 0.1;
            if (newScale >= 1.5) {
              growing = false;
              return 1.5;
            }
            return newScale;
          } else {
            const newScale = prev - 0.1;
            if (newScale <= 1) {
              growing = true;
              return 1;
            }
            return newScale;
          }
        });
      }, 50);
      
      // Stop pulsing after 2 seconds
      const stopTimer = setTimeout(() => {
        clearInterval(pulseInterval);
        setMarkerScale(1);
      }, 2000);
      
      return () => {
        clearInterval(pulseInterval);
        clearTimeout(stopTimer);
      };
    }
  }, [lastAddedPointIndex]);
  
  // Update the feedback message timer to include a fade effect
  useEffect(() => {
    if (feedbackMessage) {
      // Reset opacity when new message appears
      setFeedbackOpacity(1);
      
      // Set a longer display time (3 seconds)
      const displayTimer = setTimeout(() => {
        // Start fade out
        const fadeInterval = setInterval(() => {
          setFeedbackOpacity((prev) => {
            const newOpacity = prev - 0.1;
            if (newOpacity <= 0) {
              clearInterval(fadeInterval);
              // Clear the message after fade completes
              setFeedbackMessage(null);
              return 0;
            }
            return newOpacity;
          });
        }, 50);
      }, 3000);
      
      return () => {
        clearTimeout(displayTimer);
      };
    }
  }, [feedbackMessage]);
  
  // Initialize with user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location permission is required to create geofences');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        // If we have an initial geofence, focus the map on it
        if (initialGeofence?.center) {
          mapRef.current?.animateToRegion({
            latitude: initialGeofence.center.latitude,
            longitude: initialGeofence.center.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else if (initialGeofence?.coordinates?.length) {
          // Calculate center of polygon
          const lats = initialGeofence.coordinates.map(coord => coord[0]);
          const lngs = initialGeofence.coordinates.map(coord => coord[1]);
          const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
          const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
          mapRef.current?.animateToRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else if (userLocation) {
          // Otherwise focus on user location
          mapRef.current?.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error getting location');
      }
    })();
  }, [initialGeofence]);
  
  // Start drawing mode
  const startDrawing = (type: ShapeType) => {
    setShapeType(type);
    setEditorMode('draw');
    setDrawingPoints([]);
    setCircleDraft(null);
  };
  
  // Handle map press for drawing
  const handleMapPress = (event: any) => {
    if (editorMode !== 'draw') return;
    
    const { coordinate } = event.nativeEvent;
    
    if (shapeType === 'polygon') {
      // Add point to polygon
      const newPoints = [...drawingPoints, coordinate];
      setDrawingPoints(newPoints);
      setLastAddedPointIndex(newPoints.length - 1);
      
      // Show prominent feedback without interrupting flow
      setFeedbackMessage(`Point ${newPoints.length} added at ${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`);
    } else if (shapeType === 'circle') {
      // Start or update circle
      if (!circleDraft) {
        setCircleDraft({
          center: coordinate,
          radius: 100, // Default radius in meters
        });
        
        // Show feedback
        setFeedbackMessage(`Center set at ${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`);
      } else {
        // Calculate radius based on distance from center
        const dx = coordinate.latitude - circleDraft.center.latitude;
        const dy = coordinate.longitude - circleDraft.center.longitude;
        const distance = Math.sqrt(dx * dx + dy * dy) * 111000; // Rough conversion to meters
        setCircleDraft({
          ...circleDraft,
          radius: distance,
        });
        
        // Show feedback
        setFeedbackMessage(`Radius set to ${Math.round(distance)} meters`);
      }
    }
  };
  
  // Complete drawing
  const completeDrawing = () => {
    if (shapeType === 'polygon' && drawingPoints.length < 3) {
      Alert.alert('Error', 'Polygon must have at least 3 points');
      return;
    }
    
    if (shapeType === 'circle' && !circleDraft) {
      Alert.alert('Error', 'Circle not properly defined');
      return;
    }
    
    // Update current geofence based on shape type
    if (shapeType === 'polygon') {
      setCurrentGeofence({
        ...currentGeofence,
        type: 'polygon',
        coordinates: drawingPoints.map(point => [point.latitude, point.longitude]),
        center: undefined,
        radius: undefined,
      });
      // Note: We're keeping drawingPoints as is instead of clearing them
      // This ensures the points stay visible when switching to edit mode
    } else if (shapeType === 'circle') {
      setCurrentGeofence({
        ...currentGeofence,
        type: 'circle',
        center: circleDraft!.center,
        radius: circleDraft!.radius,
        coordinates: [],
      });
      // Note: We're keeping circleDraft as is instead of clearing it
      // This ensures the circle stays visible when switching to edit mode
    }
    
    setEditorMode('edit');
    
    // Provide feedback about mode change
    setFeedbackMessage('Now editing geofence details - add a name and description');
  };
  
  // Cancel drawing
  const cancelDrawing = () => {
    setDrawingPoints([]);
    setCircleDraft(null);
    setEditorMode('view');
  };
  
  // Reset all points
  const resetPoints = () => {
    setDrawingPoints([]);
    setCircleDraft(null);
  };
  
  // Save geofence to Convex
  const saveGeofence = async () => {
    try {
      // Validate inputs
      if (!nameInput.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }
      
      // Prepare the data based on shape type
      const geofenceData: any = {
        worksiteId,
        type: currentGeofence.type,
        name: nameInput,
        description: descriptionInput,
        strokeColor: currentGeofence.strokeColor,
        strokeWidth: currentGeofence.strokeWidth,
        fillColor: currentGeofence.fillColor,
      };
      
      if (currentGeofence.type === 'polygon') {
        geofenceData.coordinates = currentGeofence.coordinates;
      } else if (currentGeofence.type === 'circle') {
        geofenceData.center = currentGeofence.center;
        geofenceData.radius = currentGeofence.radius;
      }
      
      // Save to Convex
      await createGeofence(geofenceData);
      
      Alert.alert('Success', 'Geofence saved successfully');
      
      // Notify parent if needed
      if (onSave) {
        onSave({
          ...currentGeofence,
          name: nameInput,
          description: descriptionInput,
        });
      }
    } catch (error) {
      console.error('Error saving geofence:', error);
      Alert.alert('Error', 'Failed to save geofence');
    }
  };
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          } : undefined
        }
        onPress={handleMapPress}
      >
        {/* Show user location */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}
        
        {/* Always show polygon points and lines when they exist */}
        {shapeType === 'polygon' && drawingPoints.length > 0 && (
          <>
            {/* Show lines connecting points */}
            <Polygon
              coordinates={drawingPoints}
              strokeColor={DEFAULT_STROKE_COLOR}
              strokeWidth={DEFAULT_STROKE_WIDTH}
              fillColor={DEFAULT_FILL_COLOR}
            />
            
            {/* Show markers for each point */}
            {drawingPoints.map((point, index) => (
              <Marker
                key={`drawing-point-${index}`}
                coordinate={point}
                pinColor={lastAddedPointIndex === index ? "#FF00FF" : "red"}
                title={`Point ${index + 1}${lastAddedPointIndex === index ? ' (LATEST)' : ''}`}
              >
                <View style={{
                  width: lastAddedPointIndex === index ? 20 * markerScale : 16,
                  height: lastAddedPointIndex === index ? 20 * markerScale : 16,
                  borderRadius: lastAddedPointIndex === index ? 10 * markerScale : 8,
                  backgroundColor: lastAddedPointIndex === index ? '#FF00FF' : '#FF5555',
                  borderWidth: 3,
                  borderColor: 'white',
                  transform: lastAddedPointIndex === index ? [
                    { translateX: -10 * (markerScale - 1) },
                    { translateY: -10 * (markerScale - 1) }
                  ] : []
                }} />
              </Marker>
            ))}
          </>
        )}
        
        {/* Show circle being drawn or edited */}
        {shapeType === 'circle' && circleDraft && (
          <>
            <Circle
              center={circleDraft.center}
              radius={circleDraft.radius}
              strokeColor={DEFAULT_STROKE_COLOR}
              strokeWidth={DEFAULT_STROKE_WIDTH}
              fillColor={DEFAULT_FILL_COLOR}
            />
            <Marker
              coordinate={circleDraft.center}
              pinColor="#FF00FF"
              title="Circle Center"
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#FF00FF',
                borderWidth: 3,
                borderColor: 'white',
              }} />
            </Marker>
          </>
        )}
        
        {/* Show current geofence in edit/view mode when not directly drawing */}
        {editorMode !== 'draw' && currentGeofence.type === 'polygon' && currentGeofence.coordinates?.length > 0 && !drawingPoints.length && (
          <Polygon
            coordinates={currentGeofence.coordinates.map(coord => ({
              latitude: coord[0],
              longitude: coord[1]
            }))}
            strokeColor={currentGeofence.strokeColor}
            strokeWidth={currentGeofence.strokeWidth}
            fillColor={currentGeofence.fillColor}
          />
        )}
        
        {editorMode !== 'draw' && currentGeofence.type === 'circle' && currentGeofence.center && !circleDraft && (
          <>
            <Circle
              center={currentGeofence.center}
              radius={currentGeofence.radius || 100}
              strokeColor={currentGeofence.strokeColor}
              strokeWidth={currentGeofence.strokeWidth}
              fillColor={currentGeofence.fillColor}
            />
            <Marker
              coordinate={currentGeofence.center}
              pinColor="#0D87E1"
              title="Circle Center"
            >
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#0D87E1',
                borderWidth: 3,
                borderColor: 'white',
              }} />
            </Marker>
          </>
        )}
      </MapView>
      
      {/* Control panel */}
      <View style={styles.controlPanel}>
        {editorMode === 'view' && (
          <>
            <Text style={styles.title}>Geofence Editor</Text>
            <Text style={styles.subtitle}>Select shape type to start drawing:</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => startDrawing('polygon')}
              >
                <Ionicons name="git-branch-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Polygon</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => startDrawing('circle')}
              >
                <Ionicons name="ellipse-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Circle</Text>
              </TouchableOpacity>
            </View>
            
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {editorMode === 'draw' && (
          <>
            <Text style={styles.title}>
              Drawing {shapeType === 'polygon' ? 'Polygon' : 'Circle'}
            </Text>
            
            {shapeType === 'polygon' && (
              <Text style={styles.subtitle}>
                Tap the map to add points. (Points: {drawingPoints.length})
              </Text>
            )}
            
            {shapeType === 'circle' && (
              <Text style={styles.subtitle}>
                {!circleDraft 
                  ? 'Tap the map to set circle center.' 
                  : 'Tap again to set radius.'}
              </Text>
            )}
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={completeDrawing}
                disabled={(shapeType === 'polygon' && drawingPoints.length < 3) || 
                         (shapeType === 'circle' && !circleDraft)}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetPoints}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={cancelDrawing}
              >
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {editorMode === 'edit' && (
          <>
            <Text style={styles.title}>Edit Geofence Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter geofence name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={descriptionInput}
                onChangeText={setDescriptionInput}
                placeholder="Enter description (optional)"
                multiline
              />
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={saveGeofence}
              >
                <Ionicons name="save" size={24} color="#fff" />
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => startDrawing(shapeType)}
              >
                <Ionicons name="pencil" size={24} color="#fff" />
                <Text style={styles.buttonText}>Redraw</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Feedback message */}
        {feedbackMessage && (
          <View style={[styles.feedbackContainer, { opacity: feedbackOpacity }]}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}
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
  controlPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0D87E1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  resetButton: {
    backgroundColor: '#F57C00',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FF00FF',
  },
  feedbackText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default GeofenceEditor; 