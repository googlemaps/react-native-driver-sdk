# LMFS Sample app

## Description

This is a sample application that show cases developers how to integrate with the React Native: DriverSDK library.

## Prerequisites

1. This library depends on the LMFS backend available in https://github.com/googlemaps/last-mile-fleet-solution-samples/tree/main/backend. This package provides docker-compose files to run the backend services at `/example/tools/backend` folder. For more information, please refer to the [README](../tools/backend/README.md) file in the tools/backend folder of the example app.
2. Once the backend is setup, create a delivery vehicle and keep the vehicleId handy. In order to make it easier to create vehicles with tasks, you can use the `/upload-delivery-config.html` endpoint on the backend. [example json](https://raw.githubusercontent.com/googlemaps/last-mile-fleet-solution-samples/main/backend/src/test/resources/test.json)
3. Go to the [App.tsx](/example/LMFS/src/App.tsx) file and update the VEHICLE_ID from the endpoint response.

## Setup

### Android

1. Run `yarn install` in repository root directory.
2. Open the `example/LMFS/android` folder in Android Studio and add your api key in local.properties by adding a line like this:

   - `MAPS_API_KEY=YOUR_API_KEY` - make sure that this key is pointing to a Google Cloud project which had Nav SDK enabled.
   - To enable Nav SDK in your Android project follow this guide: https://developers.google.com/maps/documentation/navigation/android-sdk/set-up-project

### iOS

1. Run `yarn install` in repository root directory.
2. To enable Nav SDK in your iOS project follow this guide: https://developers.google.com/maps/documentation/navigation/ios-sdk/config
3. Go to the [ios](./ios) folder and run `pod install`.
4. Copy the `Keys.plist.sample` file located in `example/LMFS/ios/SampleApp/` to a new file named `Keys.plist`. This file is git ignored and won't be accidentally committed. In your Google cloud console, add the Google API key to the project and add this newly created API key to the `Keys.plist` file.

   ```xml
   <key>API_KEY</key>
   <string>Your API KEY</string>
   ```

## Running the app

Use `yarn run react-native run-android` or `yarn run react-native run-ios` depending the platform.

## Debugging Fleet engine logs

### Fetch fleet engine logs via the console

To make sure that location updates are propagating properly, you can use Fleet Engine logs.

1. Go to https://console.cloud.google.com/ and select the relevant project.
1. Open the "Logs Explorer".
1. Run Query `jsonPayload.request.deliveryVehicleId="vehicle_id"` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.v1.UpdateDeliveryVehicleLog"`.
1. This will show the location updates sent through the library.

### Use fleet tracking at the sample backend

1. Make sure the backend is running by following steps at [README](../tools/backend/README.md).
2. Open Fleet Tracking at http://localhost:8091/fleet_tracking.html (or the port you have configured in your .env file).
3. Enter the vehicleId and see the location updates on the map.
