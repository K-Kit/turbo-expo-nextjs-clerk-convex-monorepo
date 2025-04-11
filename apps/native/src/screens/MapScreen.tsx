import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTenant } from '../context/TenantContext';
import { RFValue } from 'react-native-responsive-fontsize';

const MapScreen = () => {
  const { currentTenantId } = useTenant();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.placeholderText}>
          Map functionality will be implemented in Phase 2
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: RFValue(16),
    fontFamily: 'Regular',
    color: '#666666',
    textAlign: 'center',
  },
});

export default MapScreen; 