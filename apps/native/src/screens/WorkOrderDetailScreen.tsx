import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

// Define type for route params
type WorkOrderDetailRouteParams = {
  workOrderId: Id<"workOrders">;
};

// Status colors mapping
const statusColors = {
  open: '#4CAF50',
  in_progress: '#2196F3',
  completed: '#9E9E9E',
  on_hold: '#FFC107',
  cancelled: '#F44336',
};

// Priority icons mapping
const priorityIcons = {
  low: { name: 'arrow-down', color: '#4CAF50' },
  medium: { name: 'remove', color: '#FFC107' },
  high: { name: 'arrow-up', color: '#F44336' },
  critical: { name: 'alert-circle', color: '#9C27B0' },
};

// Type icons mapping
const typeIcons = {
  maintenance: 'build',
  inspection: 'search',
  repair: 'construct',
  installation: 'hammer',
  other: 'ellipsis-horizontal',
};

const WorkOrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workOrderId } = route.params;
  
  const [updating, setUpdating] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  // Get work order details
  const workOrder = useQuery(api.workorders.getWorkOrder, { id: workOrderId });
  const updateWorkOrder = useMutation(api.workorders.updateWorkOrder);
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not scheduled';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle status update
  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === workOrder.status) {
      setShowStatusPicker(false);
      return;
    }
    
    setUpdating(true);
    
    try {
      await updateWorkOrder({
        id: workOrderId,
        status: newStatus,
        ...(newStatus === 'completed' ? { completedDate: Date.now() } : {}),
      });
      
      Alert.alert('Success', 'Work order status updated successfully');
      setShowStatusPicker(false);
    } catch (error) {
      console.error('Error updating work order:', error);
      Alert.alert('Error', 'Failed to update work order status');
    } finally {
      setUpdating(false);
    }
  };
  
  // Loading state
  if (!workOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Order Details</Text>
          <View style={styles.placeholderButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
          <Text style={styles.loadingText}>Loading work order details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Order Details</Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Work Order Number and Status */}
        <View style={styles.section}>
          <View style={styles.workOrderNumber}>
            <Text style={styles.workOrderNumberText}>{workOrder.number}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.statusBadge, { backgroundColor: statusColors[workOrder.status] || '#9E9E9E' }]}
            onPress={() => {
              setNewStatus(workOrder.status);
              setShowStatusPicker(true);
            }}
          >
            <Text style={styles.statusText}>{workOrder.status.replace('_', ' ').toUpperCase()}</Text>
            <Ionicons name="chevron-down" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Status Update Picker */}
        {showStatusPicker && (
          <View style={styles.statusPickerContainer}>
            <Text style={styles.pickerLabel}>Update Status:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue) => setNewStatus(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Open" value="open" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="On Hold" value="on_hold" />
                <Picker.Item label="Cancelled" value="cancelled" />
              </Picker>
            </View>
            
            <View style={styles.pickerButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowStatusPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.updateButton, updating && styles.disabledButton]}
                onPress={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Title and Description */}
        <View style={styles.section}>
          <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
          {workOrder.description && (
            <Text style={styles.workOrderDescription}>{workOrder.description}</Text>
          )}
        </View>
        
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons 
                name={typeIcons[workOrder.type] || 'ellipsis-horizontal'} 
                size={18} 
                color="#666" 
              />
              <Text style={styles.detailLabel}>Type:</Text>
            </View>
            <Text style={styles.detailValue}>
              {workOrder.type.charAt(0).toUpperCase() + workOrder.type.slice(1)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons 
                name={priorityIcons[workOrder.priority]?.name || 'remove'} 
                size={18} 
                color={priorityIcons[workOrder.priority]?.color || '#9E9E9E'} 
              />
              <Text style={styles.detailLabel}>Priority:</Text>
            </View>
            <Text style={[
              styles.detailValue, 
              { color: priorityIcons[workOrder.priority]?.color || '#9E9E9E' }
            ]}>
              {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="calendar" size={18} color="#666" />
              <Text style={styles.detailLabel}>Created:</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(workOrder.createdAt)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.detailLabel}>Due Date:</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(workOrder.dueDate)}</Text>
          </View>
          
          {workOrder.startDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="play" size={18} color="#666" />
                <Text style={styles.detailLabel}>Started:</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(workOrder.startDate)}</Text>
            </View>
          )}
          
          {workOrder.completedDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.detailLabel}>Completed:</Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(workOrder.completedDate)}</Text>
            </View>
          )}
          
          {workOrder.estimatedHours && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.detailLabel}>Est. Hours:</Text>
              </View>
              <Text style={styles.detailValue}>{workOrder.estimatedHours} hrs</Text>
            </View>
          )}
          
          {workOrder.actualHours && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name="time" size={18} color="#666" />
                <Text style={styles.detailLabel}>Actual Hours:</Text>
              </View>
              <Text style={styles.detailValue}>{workOrder.actualHours} hrs</Text>
            </View>
          )}
        </View>
        
        {/* Location */}
        {workOrder.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color="#0D87E1" />
              <Text style={styles.locationText}>
                {`${workOrder.location.lat.toFixed(5)}, ${workOrder.location.lng.toFixed(5)}`}
              </Text>
              <TouchableOpacity style={styles.mapButton}>
                <Ionicons name="map" size={20} color="#FFF" />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Handle capturing photo or adding attachments
              Alert.alert('Feature Coming Soon', 'The ability to add photos will be available in the next update.');
            }}
          >
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Handle adding notes
              Alert.alert('Feature Coming Soon', 'The ability to add notes will be available in the next update.');
            }}
          >
            <Ionicons name="create" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholderButton: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workOrderNumber: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  workOrderNumberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D87E1',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
    marginRight: 4,
  },
  statusPickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#0D87E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#94BEE6',
  },
  workOrderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationContainer: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'column',
  },
  locationText: {
    marginLeft: 28,
    marginTop: 4,
    color: '#333',
    fontSize: 14,
    marginBottom: 12,
  },
  mapButton: {
    backgroundColor: '#0D87E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  mapButtonText: {
    color: '#FFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: '#0D87E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default WorkOrderDetailScreen; 