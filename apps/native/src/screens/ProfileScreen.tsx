import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { currentTenantId, tenants, setCurrentTenantId } = useTenant();
  
  const currentTenant = tenants.find(tenant => tenant._id === currentTenantId) || null;
  
  const handleLogout = async () => {
    await signOut();
  };
  
  const handleSwitchTenant = () => {
    setCurrentTenantId(null);
  };
  
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading user profile...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image 
            source={user.imageUrl ? { uri: user.imageUrl } : require('../assets/icons/user-placeholder.png')}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.primaryEmailAddress?.emailAddress}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="business-outline" size={20} color="#0D87E1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Current Organization</Text>
              <Text style={styles.infoValue}>{currentTenant?.name || 'None'}</Text>
            </View>
            <TouchableOpacity onPress={handleSwitchTenant}>
              <Text style={styles.actionText}>Switch</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-outline" size={20} color="#0D87E1" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{currentTenant?.role || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#333333" />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#333333" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
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
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: RFValue(20),
    fontFamily: 'SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: RFValue(16),
    fontFamily: 'SemiBold',
    color: '#333333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: RFValue(14),
    fontFamily: 'Regular',
    color: '#666666',
  },
  infoValue: {
    fontSize: RFValue(16),
    fontFamily: 'Medium',
    color: '#333333',
  },
  actionText: {
    fontSize: RFValue(14),
    fontFamily: 'SemiBold',
    color: '#0D87E1',
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  actionButtonText: {
    fontSize: RFValue(16),
    fontFamily: 'Medium',
    color: '#333333',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#D32F2F',
  },
});

export default ProfileScreen; 