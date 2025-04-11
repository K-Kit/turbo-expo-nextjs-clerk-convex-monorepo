import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';

const WorksitesScreen = ({ navigation }) => {
  const { currentTenantId } = useTenant();
  const tenantId = currentTenantId ? currentTenantId as Id<"tenants"> : null;
  
  const worksites = useQuery(
    api.worksites.listByTenant, 
    tenantId ? { tenantId } : "skip"
  ) || [];
  
  const renderWorksiteItem = ({ item }) => (
    <TouchableOpacity style={styles.worksiteItem}>
      <View style={styles.worksiteHeader}>
        <Text style={styles.worksiteName}>{item.name}</Text>
        {item.userRole && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.userRole}</Text>
          </View>
        )}
      </View>
      {item.address && <Text style={styles.addressText}>{item.address}</Text>}
    </TouchableOpacity>
  );
  
  if (!tenantId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No tenant selected</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worksites</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {worksites === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
        </View>
      ) : worksites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No worksites found</Text>
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Worksite</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={worksites}
          renderItem={renderWorksiteItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  worksiteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  worksiteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  worksiteName: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#333333',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    fontSize: RFValue(12),
    fontFamily: 'Regular',
    color: '#0D87E1',
  },
  addressText: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: RFValue(16),
    fontFamily: 'Regular',
    color: '#666666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#0D87E1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
  },
});

export default WorksitesScreen; 