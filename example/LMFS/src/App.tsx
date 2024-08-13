/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Switch,
  Dimensions,
  Platform,
  findNodeHandle,
} from 'react-native';

import {
  type NavigationViewController,
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
} from 'react-native-navigation-sdk';
import { DeliveryDriverApi } from 'react-native-driver-sdk';
import {
  PROJECT_ID as PROVIDER_ID,
  ANDROID_HOST,
  IOS_HOST,
  LMFS_PORT,
} from '@env';
import usePermissions from './checkPermissions';

// Update `/example/.env` to change HOSTs AND PORTs.
const BASE_URL =
  Platform.OS === 'android'
    ? `http://${ANDROID_HOST}:${LMFS_PORT}`
    : `http://${IOS_HOST}:${LMFS_PORT}`;

const VEHICLE_ID = 'Vehicle1';

const termsAndConditionsDialogOptions: TermsAndConditionsDialogOptions = {
  title: 'RN LMFS Sample',
  companyName: 'Sample Company',
  showOnlyDisclaimer: true,
};

const deliveryDriverApi = new DeliveryDriverApi();

function LMFSSampleApp(): JSX.Element {
  const { arePermissionsApproved } = usePermissions();
  const [navigationViewController, setNavigationViewController] =
    useState<NavigationViewController | null>(null);
  const { navigationController, addListeners, removeListeners } =
    useNavigation();

  const [shouldShowControls, setShouldShowControls] = useState(false);
  const [isAbnormalTerminationEnabled, setIsAbnormalTerminationEnabled] =
    useState(true);
  const [isLocationTrackingEnabled, setIsLocationTrackingEnabled] =
    useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

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

  useEffect(() => {
    console.log('Init LMFS Example app');
    removeListeners(navigationCallbacks);
    addListeners(navigationCallbacks);
    fetchAuthToken();

    return () => {
      removeListeners(navigationCallbacks);
      clearInstance();
    };
  }, [clearInstance, navigationCallbacks, addListeners, removeListeners]);

  const height =
    Dimensions.get('window').height - 0.1 * Dimensions.get('window').height;
  const width = Dimensions.get('window').width;

  const fetchAuthToken = async () => {
    try {
      console.log('Fetching auth token...');
      const tokenUrl = BASE_URL + '/token/delivery_driver/' + VEHICLE_ID;
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
  };

  const createInstance = async () => {
    try {
      console.log('Creating LMFS instance');
      await deliveryDriverApi.initialize(
        PROVIDER_ID,
        VEHICLE_ID,
        _tokenContext => {
          console.log('onGetToken call');
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

  const setUpdateInterval = async () => {
    try {
      await deliveryDriverApi
        .getDeliveryVehicleReporter()
        .setLocationReportingInterval(20);
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

  const toggleLocationTrackingEnabled = () => {
    const updatedValue = !isLocationTrackingEnabled;
    setIsLocationTrackingEnabled(updatedValue);

    if (updatedValue) {
      navigationController?.startUpdatingLocation();
    } else {
      navigationController?.stopUpdatingLocation();
    }

    deliveryDriverApi
      .getDeliveryVehicleReporter()
      .setLocationTrackingEnabled(updatedValue);
  };

  const toggleAbnormalTerminationReporting = () => {
    const updatedValue = !isAbnormalTerminationEnabled;
    setIsAbnormalTerminationEnabled(updatedValue);

    deliveryDriverApi.setAbnormalTerminationReportingEnabled(updatedValue);
  };

  return !arePermissionsApproved ? (
    <View style={[styles.container]}>
      <Text>Permissions not accepted</Text>
    </View>
  ) : (
    <View
      style={[
        styles.container,
        {
          flexDirection: 'column',
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View>
          <NavigationView
            width={width}
            height={height}
            mapViewCallbacks={mapViewCallbacks}
            onNavigationViewControllerCreated={setNavigationViewController}
            onMapViewControllerCreated={() => {}}
            androidStylingOptions={{
              primaryDayModeThemeColor: '#34eba8',
              headerDistanceValueTextColor: '#76b5c5',
              headerInstructionsFirstRowTextSize: '20f',
            }}
            iOSStylingOptions={{
              navigationHeaderPrimaryBackgroundColor: '#34eba8',
              navigationHeaderDistanceValueTextColor: '#76b5c5',
            }}
          />
        </View>
      </View>
      <View style={{ flex: 2, margin: 20 }}>
        {shouldShowControls ? (
          <View style={{ backgroundColor: '#2196f3' }}>
            <Button title="Create Instance" onPress={createInstance} />
            <Button title="Clear Instance" onPress={clearInstance} />
            <Button title="Update time interval" onPress={setUpdateInterval} />
            <Button title="Run navigation" onPress={runNavigation} />
            <Button
              title="Get DriverSDK Version"
              onPress={onGetDriverSDKVersionClick}
            />
            <Button
              title="Get delivery vehicle"
              onPress={onGetDeliveryVehicleClick}
            />
            <View style={styles.rowContainer}>
              <Text>Location Tracking</Text>
              <Switch
                value={isLocationTrackingEnabled}
                onValueChange={() => {
                  toggleLocationTrackingEnabled();
                }}
              />
            </View>
            <View style={styles.rowContainer}>
              <Text>Abnormal Termination Reporting</Text>
              <Switch
                value={isAbnormalTerminationEnabled}
                onValueChange={() => {
                  toggleAbnormalTerminationReporting();
                }}
              />
            </View>
            <Button title="Close" onPress={closeDialog} />
          </View>
        ) : null}
      </View>
      <View style={styles.controlButton}>
        <Button
          title="Show controls"
          onPress={() => setShouldShowControls(!shouldShowControls)}
        />
      </View>
    </View>
  );
}

function App(): JSX.Element {
  return (
    <NavigationProvider
      termsAndConditionsDialogOptions={termsAndConditionsDialogOptions}
    >
      <LMFSSampleApp />
    </NavigationProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  controlButton: {
    backgroundColor: 'red',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
