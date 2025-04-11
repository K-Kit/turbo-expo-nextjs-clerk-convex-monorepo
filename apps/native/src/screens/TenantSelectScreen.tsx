import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';

const TenantSelectScreen = () => {
  const { user } = useUser();
  const { tenants, setCurrentTenantId, isLoading } = useTenant();
  
  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
  };
  
  const renderTenantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => handleSelectTenant(item._id)}
    >
      <View style={styles.tenantCardContent}>
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.tenantLogo} />
        ) : (
          <View style={styles.tenantInitials}>
            <Text style={styles.initialsText}>
              {item.name.substr(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.tenantDetails}>
          <Text style={styles.tenantName}>{item.name}</Text>
          <Text style={styles.tenantRole}>Your role: {item.role}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Organization</Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'User'}</Text>
        <Text style={styles.subtitleText}>
          Select an organization to continue
        </Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0D87E1" />
      ) : tenants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            You don't have access to any organizations yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tenants}
          renderItem={renderTenantItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.tenantList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#0D87E1',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: 'SemiBold',
    color: '#FFFFFF',
  },
  userInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  welcomeText: {
    fontSize: RFValue(18),
    fontFamily: 'SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  tenantList: {
    padding: 16,
  },
  tenantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tenantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tenantLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  tenantInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D87E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: RFValue(16),
    fontFamily: 'Bold',
  },
  tenantDetails: {
    flex: 1,
  },
  tenantName: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  tenantRole: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: RFValue(16),
    fontFamily: 'Regular',
    color: '#666666',
    textAlign: 'center',
  },
});

export default TenantSelectScreen; 