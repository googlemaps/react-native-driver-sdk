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
  Platform,
  Dimensions,
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
} from '@googlemaps/react-native-navigation-sdk';
import {
  RidesharingDriverApi,
  VehicleState,
} from '@googlemaps/react-native-driver-sdk';
import {
  PROJECT_ID as PROVIDER_ID,
  ANDROID_HOST,
  IOS_HOST,
  ODRD_PORT,
} from '@env';
import usePermissions from './checkPermissions';

// Update `/example/.env` to change HOSTs AND PORTs.
const BASE_URL =
  Platform.OS === 'android'
    ? `http://${ANDROID_HOST}:${ODRD_PORT}`
    : `http://${IOS_HOST}:${ODRD_PORT}`;

// Update this with according your configuration sent to the backend/provider.
const VEHICLE_ID = 'ADD_VEHICLE_ID_HERE';

const termsAndConditionsDialogOptions: TermsAndConditionsDialogOptions = {
  title: 'RN ODRD Sample',
  companyName: 'Sample Company',
  showOnlyDisclaimer: true,
};

const ridesharingDriverApi = new RidesharingDriverApi();

function ODRDSampleApp(): JSX.Element {
  const { arePermissionsApproved } = usePermissions();
  const [_navigationViewController, setNavigationViewController] =
    useState<NavigationViewController | null>(null);
  const { navigationController, addListeners, removeListeners } =
    useNavigation();

  const [shouldShowControls, setShouldShowControls] = useState(false);
  const [isAbnormalTerminationEnabled, setIsAbnormalTerminationEnabled] =
    useState(true);
  const [isVehicleStateOnline, setIsVehicleStateOnline] = useState(false);
  const [isLocationTrackingEnabled, setIsLocationTrackingEnabled] =
    useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const clearInstance = useCallback(async () => {
    await ridesharingDriverApi.clearInstance();
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
        console.log('ODRD Final destination reached');
        navigationController?.stopGuidance();
        navigationController?.clearDestinations();
      } else {
        console.log('ODRD Continuing to the next destination');
        navigationController?.continueToNextDestination();
      }

      console.log('ODRD arrived');
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
    console.log('Init ODRD Example app');
    removeListeners(navigationCallbacks);
    addListeners(navigationCallbacks);
    fetchAuthToken();

    return () => {
      removeListeners(navigationCallbacks);
      clearInstance();
    };
  }, [clearInstance, navigationCallbacks, addListeners, removeListeners]);

  const fetchAuthToken = async () => {
    try {
      console.log('Fetching auth token...');
      const tokenUrl = BASE_URL + '/token/driver/' + VEHICLE_ID;
      const response = await fetch(tokenUrl);
      const token = await response.json();
      console.log('Got token:', token);

      setAuthToken(token.jwt);
    } catch (error) {
      console.log(
        'There has been a problem connecting to the provider, please make sure it is running. ',
        error
      );
    }
  };

  const createInstance = async () => {
    try {
      console.log('Creating ODRD instance');
      await ridesharingDriverApi.initialize(
        PROVIDER_ID,
        VEHICLE_ID,
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

      ridesharingDriverApi.getRidesharingVehicleReporter().setListener({
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

  const onGetDriverSDKVersionClick = async () => {
    try {
      const version = await ridesharingDriverApi.getDriverSdkVersion();
      console.log('DriverSDK version: ', version);
    } catch (e) {
      console.error(e);
    }
  };

  const setUpdateInterval = async () => {
    try {
      await ridesharingDriverApi
        .getRidesharingVehicleReporter()
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

    ridesharingDriverApi
      .getRidesharingVehicleReporter()
      .setLocationTrackingEnabled(updatedValue);
  };

  const toggleVehicleState = () => {
    const updatedValue = !isVehicleStateOnline;
    setIsVehicleStateOnline(updatedValue);

    ridesharingDriverApi
      .getRidesharingVehicleReporter()
      .setVehicleState(
        updatedValue ? VehicleState.ONLINE : VehicleState.OFFLINE
      );
  };

  const toggleAbnormalTerminationReporting = () => {
    const updatedValue = !isAbnormalTerminationEnabled;
    setIsAbnormalTerminationEnabled(updatedValue);

    ridesharingDriverApi.setAbnormalTerminationReportingEnabled(updatedValue);
  };

  const buttonColor = Platform.OS === 'android' ? '#2196f3' : 'white';
  const controlsButtonColor = Platform.OS === 'android' ? 'red' : 'white';

  return !arePermissionsApproved ? (
    <View style={[styles.container]}>
      <Text style={styles.text}>Permissions not accepted</Text>
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
        <NavigationView
          style={{ height: Dimensions.get('window').height }}
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
      <View style={{ flex: 2, margin: 20 }}>
        {shouldShowControls ? (
          <View style={{ backgroundColor: '#2196f3' }}>
            <Button
              title="Create Instance"
              onPress={createInstance}
              color={buttonColor}
            />
            <Button
              title="Clear Instance"
              onPress={clearInstance}
              color={buttonColor}
            />
            <Button
              title="Update time interval"
              onPress={setUpdateInterval}
              color={buttonColor}
            />
            <Button
              title="Run navigation"
              onPress={runNavigation}
              color={buttonColor}
            />
            <Button
              title="Get DriverSDK Version"
              onPress={onGetDriverSDKVersionClick}
              color={buttonColor}
            />
            <View style={styles.rowContainer}>
              <Text style={styles.text}>Location Tracking</Text>
              <Switch
                value={isLocationTrackingEnabled}
                onValueChange={() => {
                  toggleLocationTrackingEnabled();
                }}
              />
            </View>
            <View style={styles.rowContainer}>
              <Text style={styles.text}>Vehicle Online State</Text>
              <Switch
                value={isVehicleStateOnline}
                onValueChange={() => {
                  toggleVehicleState();
                }}
              />
            </View>
            <View style={styles.rowContainer}>
              <Text style={styles.text}>Abnormal Termination Reporting</Text>
              <Switch
                value={isAbnormalTerminationEnabled}
                onValueChange={() => {
                  toggleAbnormalTerminationReporting();
                }}
              />
            </View>
            <Button title="Close" onPress={closeDialog} color={buttonColor} />
          </View>
        ) : null}
      </View>
      <View style={styles.controlButton}>
        <Button
          title="Show controls"
          onPress={() => setShouldShowControls(!shouldShowControls)}
          color={controlsButtonColor}
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
      <ODRDSampleApp />
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
    alignItems: 'center',
    paddingBottom: 5,
    paddingTop: 5,
    paddingRight: 20,
  },
  controlButton: {
    backgroundColor: 'red',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 30,
  },
  text: {
    color: 'white',
    paddingRight: 10,
    paddingLeft: 10,
  },
});
