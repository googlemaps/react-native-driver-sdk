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

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Switch,
  Dimensions,
  Platform,
  NativeModules,
  findNodeHandle,
} from "react-native";

import {
  MapViewCallbacks,
  MapViewController,
} from 'react-native-navigation-sdk/components/maps/mapView/types';

import NavigationView from 'react-native-navigation-sdk/components/navigation/navigationView/index';
import {RouteStatus, TravelMode, Waypoint} from 'react-native-navigation-sdk/components/navigation/types';

import {
  ArrivalEvent,
  NavigationViewCallbacks,
  NavigationViewController,
  RoutingOptions,
} from 'react-native-navigation-sdk/components/navigation/navigationView/types';
import RidesharingDriverApi from "react-native-driver-sdk/components/ridesharing/ridesharingDriverApi";
import { VehicleState } from "react-native-driver-sdk/components/shared/types";

const BASE_URL = Platform.OS == "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
const VEHICLE_ID = "Vehicle1";
const PROVIDER_ID = "cabrio-1501793433270";

function App(): JSX.Element {
  const ridesharingDriverApi = new RidesharingDriverApi();

  const [navigationViewController, setNavigationViewController] = useState<NavigationViewController | null>(null);

  const [shouldShowControls, setShouldShowControls] = useState(false);
  const [isAbnormalTerminationEnabled, setIsAbnormalTerminationEnabled] = useState(true);
  const [isVehicleStateOnline, setIsVehicleStateOnline] = useState(false);
  const [isLocationTrackingEnabled, setIsLocationTrackingEnabled] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [navigationViewId, setNavigationViewId] = useState<number | null>(null);

  useEffect(() => {
    fetchAuthToken();

    return () => {
      clearInstance();
    };
  }, []);


  const height =
        Dimensions.get("window").height - 0.1 * Dimensions.get("window").height;
  const width = Dimensions.get("window").width;

  const fetchAuthToken = async () => {
    try {
      console.log('getToken');
      const tokenUrl = BASE_URL + "/token/driver/" + VEHICLE_ID;
      const response = await fetch(tokenUrl);
      const token = await response.json();

      setAuthToken(token.jwt);
      console.log("AuthToken: ", token.jwt);
    } catch (error) {
      console.log("There has been a problem connecting to the provider, please make sure it is running. ", error);
    }
  };

  const createInstance = async () => {
    try {
      await ridesharingDriverApi
        .initialize(
          PROVIDER_ID,
          VEHICLE_ID,
          navigationViewId || 0,
          (tokenContext) => {
            console.log("onGetToken call");
            console.log(authToken);
            // Check if the token is expired, in such case request a new one.
            return Promise.resolve(authToken || "");
          },
          (statusLevel, statusCode, message) => {
            console.log("onStatusUpdate: " + statusLevel + " " + statusCode + " " + message);
          }
        );
      
      ridesharingDriverApi.getRidesharingVehicleReporter().setListener(
        {
          onVehicleUpdateSucceed(vehicleUpdate) {
            console.log("onVehicleUpdateSucceed: ", vehicleUpdate);
          },
          onVehicleUpdateFailed(vehicleUpdate, error) {
            console.log("onVehicleUpdateFailed: ", error);
          },
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const clearInstance = async () => {
    await ridesharingDriverApi.clearInstance();
  };

  const onArrival = (arrival: ArrivalEvent) => {
    if (arrival.isFinalDestination) {
      console.log("odrd Final destination reached");
      navigationViewController?.stopGuidance();
      navigationViewController?.clearDestinations();
    } else {
      console.log("odrd Continuing to the next destination");
      navigationViewController?.continueToNextDestination();
    }
    console.log("odrd arrived");
  };

  const onGetDriverSDKVersionClick = async () => {
    try {
      const version = await ridesharingDriverApi.getDriverSdkVersion();
      console.log("DriverSDK version: ", version);
    } catch (e) {
      console.error(e);
    }
  };

  const setUpdateInterval = async () => {
    try {
      await ridesharingDriverApi.getRidesharingVehicleReporter().setLocationReportingInterval(20);
    } catch (e) {
      console.error(e);
    }
  };

  const closeDialog = () => {
    setShouldShowControls(false);
  };

  const onMapReady = () => {
    console.log("onMapReady");
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

    navigationViewController?.setDestinations([firstWaypoint, secondWaypoint], routingOptions);
  };

  const onStartingGuidanceError = () => {
    console.log("Error: Starting Guidance Error");
  };

  const onRouteStatusResult = (routeStatus: RouteStatus) => {
    switch (routeStatus) {
      case RouteStatus.OK:
        navigationViewController?.startGuidance();
    
        navigationViewController?.simulator.simulateLocationsAlongExistingRoute({
          speedMultiplier: 2 
        });
        break;
      case RouteStatus.ROUTE_CANCELED:
        console.log("ROUTE_CANCELED");
        break;
      case RouteStatus.NO_ROUTE_FOUND:
        console.log("NO_ROUTE_FOUND");
        break;
      case RouteStatus.NETWORK_ERROR:
        console.log("NETWORK_ERROR");
        break;
      case RouteStatus.LOCATION_DISABLED:
        console.log("LOCATION_DISABLED");
        break;
      case RouteStatus.LOCATION_UNKNOWN:
        console.log("LOCATION_UNKNOWN");
        break;
      default:
        onStartingGuidanceError();
    }
  };

  const mapViewCallbacks: MapViewCallbacks = {
    onMapReady,
  };

  const navigationViewCallbacks: NavigationViewCallbacks = {
    onArrival,
    onRouteStatusResult,
  };

  const toggleLocationTrackingEnabled = () => {
    const updatedValue = !isLocationTrackingEnabled;
    setIsLocationTrackingEnabled(updatedValue);

    if (updatedValue) {
      navigationViewController?.startUpdatingLocation();
    } else {
      navigationViewController?.stopUpdatingLocation();
    }

    ridesharingDriverApi.getRidesharingVehicleReporter().setLocationTrackingEnabled(updatedValue);
  }

  const toggleVehicleState = () => {
    const updatedValue = !isVehicleStateOnline;
    setIsVehicleStateOnline(updatedValue);

    ridesharingDriverApi.getRidesharingVehicleReporter().setVehicleState(
      updatedValue ? VehicleState.ONLINE : VehicleState.OFFLINE
    );
  };

  const toggleAbnormalTerminationReporting = () => {
    const updatedValue = !isAbnormalTerminationEnabled;
    setIsAbnormalTerminationEnabled(updatedValue);

    ridesharingDriverApi.setAbnormalTerminationReportingEnabled(updatedValue);
  };

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: "column",
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View>
          <NavigationView
            width={width}
            height={height}
            navigationViewCallbacks={navigationViewCallbacks}
            mapViewCallbacks={mapViewCallbacks}
            onNavigationViewControllerCreated={setNavigationViewController}
            onMapViewControllerCreated={() => {}}
            termsAndConditionsDialogOptions={{}}
            androidStylingOptions={{
              primaryDayModeThemeColor: '#34eba8',
              headerDistanceValueTextColor: '#76b5c5',
              headerInstructionsFirstRowTextSize: '20f',
            }}
            iOSStylingOptions={{
              navigationHeaderPrimaryBackgroundColor: '#34eba8',
              navigationHeaderDistanceValueTextColor: '#76b5c5',
            }}
            ref={
              element => {
                setNavigationViewId(findNodeHandle(element) || 0);
              }
            }
          />
        </View>
      </View>
      <View style={{ flex: 2, margin: 20 }}>
        {shouldShowControls ? (
          <View style={{ backgroundColor: "#2196f3" }}>
            <Button title="Create Instance" onPress={createInstance} />
            <Button title="Clear Instance" onPress={clearInstance} />
            <Button
              title="Update time interval"
              onPress={setUpdateInterval}
            />
            <Button
              title="Run navigation"
              onPress={runNavigation}
            />
            <Button
              title="Get DriverSDK Version"
              onPress={onGetDriverSDKVersionClick}
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
              <Text>Vehicle State</Text>
              <Switch
                value={isVehicleStateOnline}
                onValueChange={() => {
                  toggleVehicleState();
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

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    alignSelf: "flex-end",
  },
  controlButton: {
    backgroundColor: "red",
    alignSelf: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
