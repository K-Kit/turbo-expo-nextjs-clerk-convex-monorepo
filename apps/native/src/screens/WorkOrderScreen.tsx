import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView } from 'react-native';
import { useQuery } from "convex/react";

import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '../context/TenantContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const WorkOrderScreen = () => {
  const navigation = useNavigation();
  const { currentTenantId } = useTenant();
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Convert filters to API parameters
  const apiParams = {
    tenantId: currentTenantId,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    ...(typeFilter !== 'all' && { type: typeFilter }),
  };

  // Query work orders with filters
  const workOrders = useQuery(
    api.workorders.getWorkOrders,
    currentTenantId ? apiParams : 'skip'
  );

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // The query will automatically refresh when dependencies change
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not scheduled';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Navigate to work order details
  const handleWorkOrderPress = (workOrder) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder._id });
  };

  // Navigate to create work order screen
  const handleCreateWorkOrder = () => {
    navigation.navigate('CreateWorkOrder');
  };

  // Render each work order item
  const renderWorkOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workOrderItem}
      onPress={() => handleWorkOrderPress(item)}
    >
      <View style={styles.workOrderHeader}>
        <View style={styles.workOrderNumber}>
          <Text style={styles.workOrderNumberText}>{item.number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#9E9E9E' }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.workOrderTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.workOrderDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.workOrderDetails}>
        <View style={styles.detailItem}>
          <Ionicons 
            name={priorityIcons[item.priority]?.name || 'remove'} 
            size={16} 
            color={priorityIcons[item.priority]?.color || '#9E9E9E'} 
          />
          <Text style={styles.detailText}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons 
            name={typeIcons[item.type] || 'ellipsis-horizontal'} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.detailText}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Due: {formatDate(item.dueDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render filter options
  const renderFilterOptions = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Status Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterOptions}>
            {['all', 'open', 'in_progress', 'completed', 'on_hold', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={`status-${status}`}
                style={[
                  styles.filterOption,
                  statusFilter === status && styles.filterOptionSelected,
                  statusFilter === status && status !== 'all' && { backgroundColor: statusColors[status] + '33' }
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text 
                  style={[
                    styles.filterOptionText,
                    statusFilter === status && styles.filterOptionTextSelected
                  ]}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Priority:</Text>
          <View style={styles.filterOptions}>
            {['all', 'low', 'medium', 'high', 'critical'].map((priority) => (
              <TouchableOpacity
                key={`priority-${priority}`}
                style={[
                  styles.filterOption,
                  priorityFilter === priority && styles.filterOptionSelected,
                  priorityFilter === priority && priority !== 'all' && { 
                    backgroundColor: (priorityIcons[priority]?.color || '#9E9E9E') + '33' 
                  }
                ]}
                onPress={() => setPriorityFilter(priority)}
              >
                {priority !== 'all' && (
                  <Ionicons 
                    name={priorityIcons[priority]?.name || 'remove'} 
                    size={14} 
                    color={priorityFilter === priority ? 
                      priorityIcons[priority]?.color || '#9E9E9E' : '#666'} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text 
                  style={[
                    styles.filterOptionText,
                    priorityFilter === priority && styles.filterOptionTextSelected
                  ]}
                >
                  {priority === 'all' ? 'All' : priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Type Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type:</Text>
          <View style={styles.filterOptions}>
            {['all', 'maintenance', 'inspection', 'repair', 'installation', 'other'].map((type) => (
              <TouchableOpacity
                key={`type-${type}`}
                style={[
                  styles.filterOption,
                  typeFilter === type && styles.filterOptionSelected
                ]}
                onPress={() => setTypeFilter(type)}
              >
                {type !== 'all' && (
                  <Ionicons 
                    name={typeIcons[type] || 'ellipsis-horizontal'} 
                    size={14} 
                    color={typeFilter === type ? '#0D87E1' : '#666'} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text 
                  style={[
                    styles.filterOptionText,
                    typeFilter === type && styles.filterOptionTextSelected
                  ]}
                >
                  {type === 'all' ? 'All' : type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Work Orders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateWorkOrder}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {renderFilterOptions()}

      {!currentTenantId ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Please select a tenant to view work orders.</Text>
        </View>
      ) : workOrders === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D87E1" />
        </View>
      ) : workOrders.length === 0 ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No work orders found.</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateWorkOrder}
          >
            <Text style={styles.createButtonText}>Create Work Order</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workOrders}
          renderItem={renderWorkOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0D87E1']}
            />
          }
        />
      )}
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
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#0D87E1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterGroup: {
    marginRight: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#E1F5FE',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#0D87E1',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  workOrderItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  workOrderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#0D87E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
});

export default WorkOrderScreen; 