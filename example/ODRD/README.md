# ODRD Sample app

## Description

This is a sample application that show cases developers how to integrate with the React Native: DriverSDK library.

## Prerequisites

1. This library depends on the ODRD backend available in https://github.com/googlemaps/java-on-demand-rides-deliveries-stub-provider. Please make sure to set this up before proceeding. This package provides docker-compose files to run the backend services at `/example/tools/backend` folder. For more information, please refer to the [README](../tools/backend/README.md) file in the tools/backend folder of the example app.

1. Once the backend is setup, create a unique vehicle and keep the vehicleId handy. To create a vehicle, you can trigger POST request with the desired fields. Example:

```URL: http://localhost:8092/vehicle/new

    Body:

        {
          "vehicleId": "vehicle_1234",
          "supportedTripTypes": ["EXCLUSIVE"],
          "backToBackEnabled": false,
          "maximumCapacity": 4
        }
```

Curl command:

```bash
curl -X POST http://localhost:8092/vehicle/new \
-H "Content-Type: application/json" \
-d '{
  "vehicleId": "vehicle_1234",
  "supportedTripTypes": ["EXCLUSIVE"],
  "backToBackEnabled": false,
  "maximumCapacity": 4
}'
```

1. Configure the VEHICLE_ID using one of the following methods:
   - **Option 1: .env file (Recommended)** - Add the vehicle ID to your `.env` file in the `example` folder:
     ```
     ODRD_VEHICLE_ID=your_vehicle_id
     ```
   - **Option 2: Direct Input** - When you start the app, you can enter the vehicle ID directly in the "VEHICLE_ID Not Configured" screen.
   - **Option 3: Code Update** - Go to the [App.tsx](/example/ODRD/src/App.tsx) file and update the VEHICLE_ID_DEFAULT constant with your vehicle ID.

## Setup

### Android

1. Run `yarn install` in repository root directory.
2. Open the `example/ODRD/android` folder in Android Studio and add your api key in local.properties by adding a line like this:

   - `MAPS_API_KEY=YOUR_API_KEY` - make sure that this key is pointing to a Google Cloud project which had Nav SDK enabled.
   - To enable Nav SDK in your Android project follow this guide: https://developers.google.com/maps/documentation/navigation/android-sdk/set-up-project

### iOS

1. Run `yarn install` in repository root directory.
2. To enable Nav SDK in your iOS project follow this guide: https://developers.google.com/maps/documentation/navigation/ios-sdk/config
3. Go to the [ios](./ios) folder and run `pod install`.
4. Copy the `Keys.plist.sample` file located in `example/ODRD/ios/SampleApp/` to a new file named `Keys.plist`. This file is git ignored and won't be accidentally committed. In your Google cloud console, add the Google API key to the project and add this newly created API key to the `Keys.plist` file.

   ```xml
   <key>API_KEY</key>
   <string>Your API KEY</string>
   ```

## Running the app

Use `yarn run react-native run-android` or `yarn run react-native run-ios` depending the platform.

## Debugging Fleet engine logs

To make sure that location updates are propagating properly, you can use Fleet Engine logs.

1. Go to https://console.cloud.google.com/ and select the relevant project.
2. Open the "Logs Explorer".
3. Run Query `jsonPayload.request.vehicleId="vehicle_id"` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.v1.UpdateVehicleLog"`.
4. This will show the location updates sent through the library.
