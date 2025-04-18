import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@clerk/clerk-expo";
import { useTenant } from "../context/TenantContext";
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from "../screens/LoginScreen";

// Note Screens (existing)
import NotesDashboardScreen from "../screens/NotesDashboardScreen";
import InsideNoteScreen from "../screens/InsideNoteScreen";
import CreateNoteScreen from "../screens/CreateNoteScreen";

// New Screens
import TenantSelectScreen from "../screens/TenantSelectScreen";
import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import WorksitesScreen from "../screens/WorksitesScreen";
import IncidentsScreen from "../screens/IncidentsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import GeoJsonMapScreen from "../screens/GeoJsonMapScreen";
import GeofenceEditorScreen from "../screens/GeofenceEditorScreen";
import WorksiteDetailScreen from '../screens/WorksiteDetailScreen';

// Phase 3 Screens
import ReportIncidentScreen from "../screens/ReportIncidentScreen";
import WorkOrderScreen from "../screens/WorkOrderScreen";
import CreateWorkOrderScreen from "../screens/CreateWorkOrderScreen";
import WorkOrderDetailScreen from "../screens/WorkOrderDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator once logged in and tenant selected
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Worksites') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Incidents') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Work Orders') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0D87E1',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Worksites" component={WorksitesScreen} />
      <Tab.Screen name="Incidents" component={IncidentsScreen} />
      <Tab.Screen name="Work Orders" component={WorkOrderScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Notes navigator (existing functionality)
function NotesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotesDashboard" component={NotesDashboardScreen} />
      <Stack.Screen name="InsideNote" component={InsideNoteScreen} />
      <Stack.Screen name="CreateNote" component={CreateNoteScreen} />
    </Stack.Navigator>
  );
}

// Incidents navigator
function IncidentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IncidentsList" component={IncidentsScreen} />
      <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
    </Stack.Navigator>
  );
}

// Work Orders navigator
function WorkOrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkOrdersList" component={WorkOrderScreen} />
      <Stack.Screen name="CreateWorkOrder" component={CreateWorkOrderScreen} />
      <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
    </Stack.Navigator>
  );
}

const Navigation = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { currentTenantId, isLoading: tenantsLoading } = useTenant();
  
  // Don't render anything until auth and tenants are loaded
  if (!isLoaded || (isSignedIn && tenantsLoading)) {
    return null;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isSignedIn ? (
          // Auth flow
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !currentTenantId ? (
          // Tenant selection flow
          <Stack.Screen name="TenantSelect" component={TenantSelectScreen} />
        ) : (
          // Main app flow
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Notes" component={NotesStack} />
            <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
            <Stack.Screen name="CreateWorkOrder" component={CreateWorkOrderScreen} />
            <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} />
            <Stack.Screen name="GeoJsonMap" component={GeoJsonMapScreen} />
            <Stack.Screen name="WorksiteDetail" component={WorksiteDetailScreen} />
            <Stack.Screen name="GeofenceEditor" component={GeofenceEditorScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
