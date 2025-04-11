# WorkSafeMaps Native App

Mobile application component of the WorkSafeMaps platform, built with React Native and Expo.

## Features

### Phase 1: Foundation
- Multi-tenant support with tenant selection
- Authentication with Clerk (email, Google, Apple)
- Real-time data synchronization with Convex backend
- Tab-based navigation with Home, Map, Worksites, Incidents, and Profile views

### Phase 2: Map Integration
- Interactive maps using react-native-maps
- Location tracking and permissions handling
- Multi-layer visualization:
  - Worksites shown with blue markers
  - Incidents shown with color-coded markers by severity (red=critical, orange=high, etc.)
  - Layer visibility toggling
- Custom layer control UI

## Implementation Details

### Map Integration

The map integration uses react-native-maps to display worksites and incidents. Key implementation details:

1. **Location Services**
   - Uses expo-location for requesting permissions and accessing device location
   - Falls back to a default location (San Francisco) if permissions are denied

```javascript
// Request location permissions
let { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  setErrorMsg('Permission to access location was denied');
  return;
}

// Get current position
let location = await Location.getCurrentPositionAsync({});
setLocation(location);
```

2. **Map Configuration**
   - Initializes map with user location or default coordinates
   - Shows user location dot with `showsUserLocation` prop
   - Uses `initialRegion` to set starting view

```javascript
<MapView
  style={styles.map}
  initialRegion={initialRegion}
  showsUserLocation={true}
  onLayout={() => setMapReady(true)}
>
  {/* Markers go here */}
</MapView>
```

3. **Worksite and Incident Markers**
   - Displays markers based on coordinates from Convex backend
   - Color-codes incident markers based on severity level
   - Filters out any locations with missing coordinate data

```javascript
// Display worksite markers
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
```

4. **Layer Controls**
   - Custom UI for toggling visibility of different map layers
   - State management for layer visibility
   - Visual feedback for active/inactive layers

## Setup & Running

1. Install dependencies:
```
npm install
```

2. Set up environment variables in `.env`:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_CONVEX_URL=your_convex_url
```

3. Start the development server:
```
npm run dev
```

4. Open the app in Expo Go on your device or in a simulator.

## Next Steps

- Implement custom marker components for better visual distinction
- Add geofencing capabilities for worksite boundaries
- Implement search and filtering functionality
- Add clustering for markers to improve performance with large datasets
- Add offline map support for field use 