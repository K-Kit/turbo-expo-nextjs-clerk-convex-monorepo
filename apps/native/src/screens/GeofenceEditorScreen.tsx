import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import GeofenceEditor from '../components/GeofenceEditor';

interface RouteParams {
  worksiteId: string;
  geofenceId?: string;
}

const GeofenceEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { worksiteId, geofenceId } = route.params as RouteParams;
  
  // Convert string IDs to Convex IDs
  const convexWorksiteId = worksiteId as unknown as Id<"worksites">;
  
  const handleSave = (geofence: any) => {
    // Notify parent screen (if needed)
    Alert.alert('Success', 'Geofence saved successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };
  
  const handleCancel = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GeofenceEditor
        worksiteId={convexWorksiteId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GeofenceEditorScreen; 