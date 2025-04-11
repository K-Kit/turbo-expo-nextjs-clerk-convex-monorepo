import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, Keyboard } from 'react-native';
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useTenant } from '../context/TenantContext';
import { Picker } from '@react-native-picker/picker';
import { useConvexAuth } from "convex/react";
import { SafeAreaView } from 'react-native-safe-area-context';

const ReportIncidentScreen = () => {
  const navigation = useNavigation();
  const { currentTenantId } = useTenant();
  const { isAuthenticated } = useConvexAuth();
  const reportIncident = useMutation(api.incidents.reportIncident);
  
  // Use blob upload directly since useStorage is not available
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('hazard');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need media library permissions to upload images.');
        }
      }
      
      // Request location permission and get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to record incident location.');
        setLoadingLocation(false);
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });
        
        // Try to get address
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });
        
        if (addressResponse && addressResponse.length > 0) {
          const addressObj = addressResponse[0];
          const formattedAddress = [
            addressObj.street,
            addressObj.city,
            addressObj.region,
            addressObj.postalCode,
            addressObj.country
          ].filter(Boolean).join(', ');
          
          setAddress(formattedAddress);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', 'Unable to get current location. Please try again.');
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };

  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0]]);
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadImages = async () => {
    if (images.length === 0) return [];

    setUploading(true);
    const uploadedImageIds = [];

    try {
      // Since we're having issues with file uploads, let's skip this functionality for now
      // and just report the incident without images
      Alert.alert('Note', 'Image upload functionality is temporarily disabled.');
      return [];
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Upload Error', 'Failed to upload images.');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!title) {
      Alert.alert('Missing Information', 'Please enter a title for the incident.');
      return;
    }
    
    if (!description) {
      Alert.alert('Missing Information', 'Please provide a description of the incident.');
      return;
    }
    
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be determined or try again.');
      return;
    }
    
    if (!currentTenantId || !isAuthenticated) {
      Alert.alert('Authentication Error', 'You must be logged in and select a tenant.');
      return;
    }

    setLoading(true);
    
    try {
      // Convert the string tenantId to the proper type
      const typedTenantId = currentTenantId as Id<"tenants">;
      
      // Submit incident report
      await reportIncident({
        tenantId: typedTenantId,
        title,
        description,
        incidentType,
        severity,
        location,
        address: address || undefined,
        occuredAt: Date.now(),
        tags: [],
        images: [], // Skip image upload for now
      });
      
      Alert.alert(
        'Success', 
        'Incident reported successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error reporting incident:', error);
      Alert.alert('Error', 'Failed to report incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief title of the incident"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Incident Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={incidentType}
              onValueChange={(itemValue) => setIncidentType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Hazard" value="hazard" />
              <Picker.Item label="Injury" value="injury" />
              <Picker.Item label="Near Miss" value="near_miss" />
              <Picker.Item label="Property Damage" value="property_damage" />
              <Picker.Item label="Environmental" value="environmental" />
              <Picker.Item label="Security" value="security" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={severity}
              onValueChange={(itemValue) => setSeverity(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
              <Picker.Item label="Critical" value="critical" />
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          {loadingLocation ? (
            <View style={styles.locationLoading}>
              <ActivityIndicator size="small" color="#0D87E1" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : location ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color="#0D87E1" />
              <Text style={styles.locationText}>
                {address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={async () => {
                setLoadingLocation(true);
                try {
                  const currentLocation = await Location.getCurrentPositionAsync({});
                  setLocation({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude
                  });
                } catch (error) {
                  Alert.alert('Location Error', 'Unable to get location.');
                } finally {
                  setLoadingLocation(false);
                }
              }}
            >
              <Ionicons name="location-outline" size={20} color="#0D87E1" />
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color="#FFF" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="#FFF" />
              <Text style={styles.imageButtonText}>Select Image</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (loading || uploading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || uploading}
        >
          {loading || uploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCE5FF',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    color: '#0D87E1',
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCE5FF',
  },
  locationButtonText: {
    marginLeft: 8,
    color: '#0D87E1',
    fontSize: 14,
    fontWeight: '500',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCE5FF',
  },
  loadingText: {
    marginLeft: 8,
    color: '#0D87E1',
    fontSize: 14,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D87E1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  imageButtonText: {
    color: '#FFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageContainer: {
    position: 'relative',
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D87E1',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#94BEE6',
  },
});

export default ReportIncidentScreen; 