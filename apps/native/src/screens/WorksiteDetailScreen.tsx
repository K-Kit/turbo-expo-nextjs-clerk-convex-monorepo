import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RFValue } from 'react-native-responsive-fontsize';

interface RouteParams {
  worksiteId: string;
}

const WorksiteDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { worksiteId } = route.params as RouteParams;
  
  // Convert string ID to Convex ID
  const convexWorksiteId = worksiteId as unknown as Id<"worksites">;
  
  // Fetch worksite details
  const worksite = useQuery(api.worksites.get, { worksiteId: convexWorksiteId });
  
  // Fetch geofences for this worksite
  const geofences = useQuery(api.geofences.listByWorksite, { worksiteId: convexWorksiteId }) || [];
  
  const handleAddGeofence = () => {
    navigation.navigate('GeofenceEditor', { worksiteId });
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };
  
  if (worksite === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Worksite Details</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!worksite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Worksite Details</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Worksite not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worksite Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{worksite.name}</Text>
          </View>
          
          {worksite.description && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{worksite.description}</Text>
            </View>
          )}
          
          {worksite.address && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{worksite.address}</Text>
            </View>
          )}
          
          {worksite.coordinates && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Coordinates</Text>
              <Text style={styles.infoValue}>
                {worksite.coordinates.latitude.toFixed(6)}, {worksite.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Geofences</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddGeofence}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {geofences.length === 0 ? (
            <View style={styles.emptySubContainer}>
              <Text style={styles.emptySubText}>No geofences defined</Text>
              <Text style={styles.emptySubDescription}>
                Add a geofence to define the boundaries of this worksite.
              </Text>
            </View>
          ) : (
            geofences.map((geofence) => (
              <View key={geofence._id} style={styles.geofenceItem}>
                <View style={styles.geofenceHeader}>
                  <Text style={styles.geofenceName}>{geofence.name}</Text>
                  <View style={[
                    styles.typeBadge, 
                    { backgroundColor: geofence.type === 'polygon' ? '#E3F2FD' : '#FFF3E0' }
                  ]}>
                    <Text style={[
                      styles.typeText,
                      { color: geofence.type === 'polygon' ? '#0D87E1' : '#F57C00' }
                    ]}>
                      {geofence.type.charAt(0).toUpperCase() + geofence.type.slice(1)}
                    </Text>
                  </View>
                </View>
                
                {geofence.description && (
                  <Text style={styles.geofenceDescription}>{geofence.description}</Text>
                )}
                
                <View style={styles.geofenceActions}>
                  <TouchableOpacity 
                    style={styles.geofenceAction}
                    onPress={() => navigation.navigate('GeofenceEditor', { 
                      worksiteId, 
                      geofenceId: geofence._id 
                    })}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#0D87E1" />
                    <Text style={styles.geofenceActionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.geofenceAction}>
                    <Ionicons name="eye-outline" size={16} color="#0D87E1" />
                    <Text style={styles.geofenceActionText}>View on Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: RFValue(16),
    color: '#666666',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: RFValue(12),
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: RFValue(14),
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#0D87E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: RFValue(12),
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptySubContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  emptySubText: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubDescription: {
    fontSize: RFValue(12),
    color: '#999999',
    textAlign: 'center',
  },
  geofenceItem: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  geofenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  geofenceName: {
    fontSize: RFValue(14),
    fontWeight: 'bold',
    color: '#333333',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: RFValue(10),
    fontWeight: 'bold',
  },
  geofenceDescription: {
    fontSize: RFValue(12),
    color: '#666666',
    marginBottom: 8,
  },
  geofenceActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
    marginTop: 4,
  },
  geofenceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  geofenceActionText: {
    fontSize: RFValue(12),
    color: '#0D87E1',
    marginLeft: 4,
  },
});

export default WorksiteDetailScreen; 