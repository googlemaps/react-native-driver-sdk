/* eslint-disable react-native/no-inline-styles */
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type ArrivalEvent,
  type RoutingOptions,
  TravelMode,
  RouteStatus,
  type MapViewCallbacks,
  NavigationView,
  useNavigation,
  type NavigationCallbacks,
  NavigationInitErrorCode,
  NavigationProvider,
  type TermsAndConditionsDialogOptions,
} from '@googlemaps/react-native-navigation-sdk';

import { DeliveryDriverApi } from '@googlemaps/react-native-driver-sdk';
import {
  PROJECT_ID as PROVIDER_ID,
  ANDROID_HOST,
  IOS_HOST,
  LMFS_PORT,
  LMFS_VEHICLE_ID,
} from '@env';
import usePermissions from './checkPermissions';

// Update `/example/.env` to change HOSTs AND PORTs.
const BASE_URL =
  Platform.OS === 'android'
    ? `http://${ANDROID_HOST}:${LMFS_PORT}`
    : `http://${IOS_HOST}:${LMFS_PORT}`;

// Update this vehicle id from the response from the /upload-delivery-config.html backend endpoint.
// Can also be set via LMFS_VEHICLE_ID in .env file or as environment variable:
// See README.md for configuration options.
const VEHICLE_ID_DEFAULT = LMFS_VEHICLE_ID || ''; // ADD_VEHICLE_ID_HERE

// New location reporting interval in seconds that is applied via menu action.
const NEW_LOCATION_REPORTING_INTERVAL_SECONDS = 20;

const termsAndConditionsDialogOptions: TermsAndConditionsDialogOptions = {
  title: 'RN LMFS Sample',
  companyName: 'Sample Company',
  showOnlyDisclaimer: true,
};

const deliveryDriverApi = new DeliveryDriverApi();

function LMFSSampleApp() {
  const { arePermissionsApproved } = usePermissions();
  const { navigationController, addListeners, removeListeners } =
    useNavigation();

  const [shouldShowControls, setShouldShowControls] = useState(false);
  const [isAbnormalTerminationEnabled, setAbnormalTerminationEnabled] =
    useState(true);
  const [isLocationTrackingEnabled, setLocationTrackingEnabled] =
    useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driverSdkVersion, setDriverSdkVersion] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>(VEHICLE_ID_DEFAULT);
  const [tempVehicleId, setTempVehicleId] =
    useState<string>(VEHICLE_ID_DEFAULT);

  const clearInstance = useCallback(async () => {
    await deliveryDriverApi.clearInstance();
  }, []);

  const onNavigationReady = useCallback(() => {
    console.log('onNavigationReady');
  }, []);

  const onNavigationInitError = useCallback(
    (errorCode: NavigationInitErrorCode) => {
      console.log(`Failed to initialize navigation errorCode: ${errorCode}`);
    },
    []
  );

  const onArrival = useCallback(
    (arrival: ArrivalEvent) => {
      if (arrival.isFinalDestination) {
        console.log('LMFS Final destination reached');
        navigationController?.stopGuidance();
        navigationController?.clearDestinations();
      } else {
        console.log('LMFS Continuing to the next destination');
        navigationController?.continueToNextDestination();
      }

      console.log('LMFS arrived');
    },
    [navigationController]
  );

  const onRouteStatusResult = useCallback(
    (routeStatus: RouteStatus) => {
      switch (routeStatus) {
        case RouteStatus.OK:
          navigationController?.startGuidance();

          navigationController?.simulator.simulateLocationsAlongExistingRoute({
            speedMultiplier: 2,
          });
          break;
        case RouteStatus.ROUTE_CANCELED:
          console.log('ROUTE_CANCELED');
          break;
        case RouteStatus.NO_ROUTE_FOUND:
          console.log('NO_ROUTE_FOUND');
          break;
        case RouteStatus.NETWORK_ERROR:
          console.log('NETWORK_ERROR');
          break;
        case RouteStatus.LOCATION_DISABLED:
          console.log('LOCATION_DISABLED');
          break;
        case RouteStatus.LOCATION_UNKNOWN:
          console.log('LOCATION_UNKNOWN');
          break;
        default:
          console.log(routeStatus);
          onStartingGuidanceError();
      }
    },
    [navigationController]
  );

  const navigationCallbacks: NavigationCallbacks = useMemo(
    () => ({
      onArrival,
      onNavigationReady,
      onNavigationInitError,
      onRouteStatusResult,
    }),
    [onArrival, onNavigationReady, onNavigationInitError, onRouteStatusResult]
  );

  const fetchAuthToken = useCallback(async () => {
    if (!vehicleId) {
      console.log('Vehicle ID not set, skipping auth token fetch');
      return;
    }
    try {
      console.log('Fetching auth token...');
      const tokenUrl = BASE_URL + '/token/delivery_driver/' + vehicleId;
      const response = await fetch(tokenUrl);
      const { token } = await response.json();
      console.log('Got token:', token);

      setAuthToken(token);
    } catch (error) {
      console.log(
        'There has been a problem connecting to the provider, please make sure it is running. ',
        error
      );
    }
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId) {
      console.log('Vehicle ID not set, skipping initialization');
      return;
    }

    console.log('Init LMFS Example app');
    removeListeners(navigationCallbacks);
    addListeners(navigationCallbacks);
    fetchAuthToken();
    deliveryDriverApi
      .getDriverSdkVersion()
      .then(version => setDriverSdkVersion(version))
      .catch(error => console.warn('Failed to get Driver SDK version', error));

    return () => {
      removeListeners(navigationCallbacks);
      clearInstance();
    };
  }, [
    clearInstance,
    navigationCallbacks,
    addListeners,
    removeListeners,
    vehicleId,
    fetchAuthToken,
  ]);

  const createInstance = async () => {
    try {
      console.log('Creating LMFS instance');
      await deliveryDriverApi.initialize(
        PROVIDER_ID,
        vehicleId,
        _tokenContext => {
          console.log('onGetToken call, return token: ', authToken);
          // Check if the token is expired, in such case request a new one.
          return Promise.resolve(authToken || '');
        },
        (statusLevel, statusCode, message) => {
          console.log(
            'onStatusUpdate: ' + statusLevel + ' ' + statusCode + ' ' + message
          );
        }
      );

      deliveryDriverApi.getDeliveryVehicleReporter().setListener({
        onVehicleUpdateSucceed(vehicleUpdate) {
          console.log('onVehicleUpdateSucceed: ', vehicleUpdate);
        },
        onVehicleUpdateFailed(_vehicleUpdate, error) {
          console.log('onVehicleUpdateFailed: ', error);
        },
      });
    } catch (error) {
      console.log('createInstance ', error);
    }
  };

  const onGetDeliveryVehicleClick = async () => {
    try {
      const vehicle = await deliveryDriverApi
        .getDeliveryVehicleManager()
        .getDeliveryVehicle();
      console.log('Vehicle: ', vehicle);
    } catch (e) {
      console.log(e);
    }
  };

  const onGetDriverSDKVersionClick = async () => {
    try {
      const version = await deliveryDriverApi.getDriverSdkVersion();
      console.log('DriverSDK version: ', version);
    } catch (e) {
      console.error(e);
    }
  };

  const setLocationReportingInterval = async () => {
    try {
      await deliveryDriverApi
        .getDeliveryVehicleReporter()
        .setLocationReportingInterval(NEW_LOCATION_REPORTING_INTERVAL_SECONDS);
      console.log(
        `Location reporting interval set to ${NEW_LOCATION_REPORTING_INTERVAL_SECONDS} seconds`
      );
    } catch (e) {
      console.error(e);
    }
  };

  const closeDialog = () => {
    setShouldShowControls(false);
  };

  const onMapReady = async () => {
    console.log('Map is ready, initializing navigator...');
    try {
      await navigationController.init();
    } catch (error) {
      console.error('Error initializing navigator', error);
    }
  };

  const runNavigation = () => {
    const firstWaypoint = {
      placeId: 'ChIJw____96GhYARCVVwg5cT7c0', // Golden gate, SF
    };

    const secondWaypoint = {
      placeId: 'ChIJkXCsHWSAhYARsGBBQYcj-V0', // 1 Market st, SF
    };

    const routingOptions: RoutingOptions = {
      travelMode: TravelMode.DRIVING,
      avoidFerries: true,
      avoidTolls: false,
    };

    navigationController?.setDestinations(
      [firstWaypoint, secondWaypoint],
      routingOptions
    );
  };

  const onStartingGuidanceError = () => {
    console.log('Error: Starting Guidance Error');
  };

  const mapViewCallbacks: MapViewCallbacks = {
    onMapReady,
  };

  const toggleLocationTrackingEnabled = (value: boolean) => {
    setLocationTrackingEnabled(value);

    if (value) {
      navigationController?.startUpdatingLocation();
    } else {
      navigationController?.stopUpdatingLocation();
    }

    deliveryDriverApi
      .getDeliveryVehicleReporter()
      .setLocationTrackingEnabled(value);
  };

  const toggleAbnormalTerminationReporting = (value: boolean) => {
    setAbnormalTerminationEnabled(value);
    deliveryDriverApi.setAbnormalTerminationReportingEnabled(value);
  };

  const buttonBackgroundColor = '#1976d2';
  const buttonBackgroundColorPressed = '#105090ff';
  const controlsButtonColor = '#d32f2f';
  const controlsButtonColorPressed = '#a12020';

  const handleSetVehicleId = () => {
    if (tempVehicleId.trim()) {
      setVehicleId(tempVehicleId.trim());
    }
  };

  if (!vehicleId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>VEHICLE_ID Not Configured</Text>
          <Text style={styles.alertMessage}>
            Please set the VEHICLE_ID to continue.
          </Text>
          <Text style={styles.alertInstructions}>
            You can configure the vehicle ID in one of three ways:
            {'\n'}
            {'\n'}1. Add it to your .env file:
            {'\n'} LMFS_VEHICLE_ID=your_vehicle_id
            {'\n'}
            {'\n'}2. Enter it directly below:
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Vehicle ID"
              placeholderTextColor="#999"
              value={tempVehicleId}
              onChangeText={setTempVehicleId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.buttonWrapper}>
              <ActionButton
                title="Set Vehicle ID"
                onPress={handleSetVehicleId}
                backgroundColor={buttonBackgroundColor}
                pressedBackgroundColor={buttonBackgroundColorPressed}
              />
            </View>
          </View>
          <Text style={styles.alertInstructions}>
            {'\n'}3. Update VEHICLE_ID_DEFAULT in example/LMFS/src/App.tsx
            {'\n'}
            {'\n'}To create a vehicle:
            {'\n'}• Follow the setup instructions in the README
            {'\n'}• Create a delivery vehicle using the backend
            {'\n'}• Use the vehicle ID from the response
            {'\n'}
            {'\n'}See README.md for detailed instructions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return !arePermissionsApproved ? (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.text}>Permissions not accepted</Text>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.mapContainer}>
        <NavigationView
          style={styles.map}
          mapViewCallbacks={mapViewCallbacks}
          onNavigationViewControllerCreated={() => {}}
          onMapViewControllerCreated={() => {}}
        />
      </View>
      <View style={styles.footerRow}>
        <View style={styles.versionContainer}>
          <Text
            style={styles.versionText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Vehicle ID: {vehicleId || 'Not set'}
          </Text>
          <Text
            style={styles.versionText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Driver SDK: {driverSdkVersion || '...'}
          </Text>
        </View>
        <View style={styles.controlButton}>
          <ActionButton
            title="Show controls"
            onPress={() => setShouldShowControls(true)}
            backgroundColor={controlsButtonColor}
            pressedBackgroundColor={controlsButtonColorPressed}
          />
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={shouldShowControls}
        onRequestClose={closeDialog}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.controlsCard}>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Create Instance"
                  onPress={createInstance}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Clear Instance"
                  onPress={clearInstance}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title={`Set Location Reporting Interval to ${NEW_LOCATION_REPORTING_INTERVAL_SECONDS}s`}
                  onPress={setLocationReportingInterval}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Run navigation"
                  onPress={runNavigation}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Get DriverSDK Version"
                  onPress={onGetDriverSDKVersionClick}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Get delivery vehicle"
                  onPress={onGetDeliveryVehicleClick}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
              <View style={styles.rowContainer}>
                <Text style={styles.text}>Location Tracking</Text>
                {isLocationTrackingEnabled ? (
                  <ActionButton
                    title="Disable"
                    onPress={() => toggleLocationTrackingEnabled(false)}
                    backgroundColor={buttonBackgroundColor}
                    pressedBackgroundColor={buttonBackgroundColorPressed}
                  />
                ) : (
                  <ActionButton
                    title="Enable"
                    onPress={() => toggleLocationTrackingEnabled(true)}
                    backgroundColor={buttonBackgroundColor}
                    pressedBackgroundColor={buttonBackgroundColorPressed}
                  />
                )}
              </View>
              <View style={styles.rowContainer}>
                <Text style={styles.text}>Abnormal Termination Reporting</Text>
                {isAbnormalTerminationEnabled ? (
                  <ActionButton
                    title="Disable"
                    onPress={() => toggleAbnormalTerminationReporting(false)}
                    backgroundColor={buttonBackgroundColor}
                    pressedBackgroundColor={buttonBackgroundColorPressed}
                  />
                ) : (
                  <ActionButton
                    title="Enable"
                    onPress={() => toggleAbnormalTerminationReporting(true)}
                    backgroundColor={buttonBackgroundColor}
                    pressedBackgroundColor={buttonBackgroundColorPressed}
                  />
                )}
              </View>
              <View style={styles.buttonWrapper}>
                <ActionButton
                  title="Close"
                  onPress={closeDialog}
                  backgroundColor={buttonBackgroundColor}
                  pressedBackgroundColor={buttonBackgroundColorPressed}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function App() {
  return (
    <NavigationProvider
      termsAndConditionsDialogOptions={termsAndConditionsDialogOptions}
    >
      <LMFSSampleApp />
    </NavigationProvider>
  );
}

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  pressedBackgroundColor?: string;
};

const ActionButton = ({
  title,
  onPress,
  backgroundColor,
  pressedBackgroundColor: pressedColor,
}: ActionButtonProps) => {
  const resolvedBackground = backgroundColor ?? '#1976d2';
  const resolvedPressed = pressedColor ?? resolvedBackground;
  const resolvedTextColor =
    resolvedBackground.toLowerCase() === '#ffffff' ? '#0b1a2a' : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.15)', foreground: true }}
      style={({ pressed }) => [
        styles.buttonBase,
        { backgroundColor: pressed ? resolvedPressed : resolvedBackground },
        resolvedBackground.toLowerCase() === '#ffffff' &&
          styles.buttonOutlineLight,
      ]}
    >
      <Text style={[styles.buttonText, { color: resolvedTextColor }]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#0b1a2a',
    marginBottom: 24,
    textAlign: 'center',
  },
  alertInstructions: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    textAlign: 'left',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 12,
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginVertical: 4,
    alignSelf: 'stretch',
  },
  controlsCard: {
    backgroundColor: '#f0f4ff',
    padding: 12,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  buttonWrapper: {
    marginVertical: 6,
  },
  controlButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 30,
    marginBottom: 16,
  },
  text: {
    color: '#0b1a2a',
    paddingRight: 10,
    paddingLeft: 10,
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#f2f4f8',
    borderRadius: 12,
    padding: 12,
    maxHeight: '85%',
  },
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonOutlineLight: {
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  versionContainer: {
    flex: 1,
    marginRight: 16,
  },
  versionText: {
    color: '#0b1a2a',
    fontWeight: '600',
  },
  inputContainer: {
    marginVertical: 16,
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0b1a2a',
    marginBottom: 12,
  },
});

export default App;
