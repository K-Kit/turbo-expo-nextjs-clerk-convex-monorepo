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

const IncidentsScreen = ({ navigation }) => {
  const { currentTenantId } = useTenant();
  const tenantId = currentTenantId ? currentTenantId as Id<"tenants"> : null;
  
  const incidents = useQuery(
    api.incidents.listIncidentsByTenant, 
    tenantId ? { tenantId } : "skip"
  ) || [];
  
  const handleReportIncident = () => {
    navigation.navigate('ReportIncident');
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#F57C00';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };
  
  const renderIncidentItem = ({ item }) => (
    <TouchableOpacity style={styles.incidentItem}>
      <View style={styles.incidentHeader}>
        <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
        <Text style={styles.incidentTitle}>{item.title}</Text>
      </View>
      <View style={styles.incidentDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailText}>{item.incidentType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={styles.detailText}>{item.status}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Reported:</Text>
          <Text style={styles.detailText}>
            {new Date(item.reportedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Incidents</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleReportIncident}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {incidents === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No incidents reported</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleReportIncident}
          >
            <Text style={styles.createButtonText}>Report Incident</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incidents}
          renderItem={renderIncidentItem}
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
  incidentItem: {
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
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  incidentTitle: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#333333',
    flex: 1,
  },
  incidentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: RFValue(14),
    fontFamily: 'Medium',
    color: '#666666',
    width: 80,
  },
  detailText: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#333333',
    flex: 1,
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

export default IncidentsScreen; 