import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { currentTenantId } = useTenant();
  
  // Use the Id type from Convex to ensure type safety
  const tenantId = currentTenantId ? currentTenantId as Id<"tenants"> : null;
  
  const tenant = useQuery(
    api.tenants.get, 
    tenantId ? { tenantId } : "skip"
  );
  
  const worksites = useQuery(
    api.worksites.listByTenant, 
    tenantId ? { tenantId } : "skip"
  ) || [];
  
  const incidents = useQuery(
    api.incidents.listIncidentsByTenant, 
    tenantId ? { tenantId } : "skip"
  ) || [];
  
  const projects = useQuery(
    api.projects.getProjects, 
    tenantId ? { tenantId } : "skip"
  ) || [];
  
  if (!tenant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D87E1" />
      </View>
    );
  }
  
  const StatCard = ({ icon, title, count, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statCount}>{count}</Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tenant.name}</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName || 'User'}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statGrid}>
            <StatCard
              icon="business"
              title="Worksites"
              count={worksites.length}
              color="#0D87E1"
              onPress={() => navigation.navigate('Worksites')}
            />
            <StatCard
              icon="warning"
              title="Incidents"
              count={incidents.length}
              color="#E53935"
              onPress={() => navigation.navigate('Incidents')}
            />
            <StatCard
              icon="document-text"
              title="Projects"
              count={projects.length}
              color="#43A047"
              onPress={() => {}} // Add project navigation
            />
            <StatCard
              icon="construct"
              title="Work Orders"
              count="N/A"
              color="#FF9800"
              onPress={() => {}} // Add work orders navigation
            />
          </View>
        </View>
        
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Notes')}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Create Note</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Report Incident</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  welcomeText: {
    fontSize: RFValue(18),
    fontFamily: 'SemiBold',
    color: '#333333',
  },
  dateText: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#333333',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  statCount: {
    fontSize: RFValue(20),
    fontFamily: 'Bold',
    color: '#333333',
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#0D87E1',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
});

export default HomeScreen; 