# LMFS Sample app

## Description

This is a sample application that show cases developers how to integrate with the React Native: DriverSDK library.

## Prerequisites

1. This library depends on the LMFS backend available in https://github.com/googlemaps/last-mile-fleet-solution-samples/tree/main/backend.
Please make sure to set this up before proceeding.

1. Once the backend is setup, create a delivery vehicle and keep the vehicleId handy. In order to make it easier to create vehicles with tasks, you can use the `/upload-delivery-config.html` endpoint on the backend.

1. Go to the [App.tsx](/example/LMFS/SampleApp/App.tsx) file and update the BASE_URL, PROVIDER_ID, and VEHICLE_ID according to your configuration.

## How to run application

1. Run `npm i` from the current directory.

1. Go to the [ios](./ios) folder and run `pod install`.

1. Come back to the current directory.

1. Then you can use `npx react-native run-android` or `npx react-native run-ios` depending the platform.

## Debugging Fleet engine logs

To make sure that location updates are propagating properly, you can use Fleet Engine logs.

1. Go to https://console.cloud.google.com/ and select the relevant project.
1. Open the "Logs Explorer".
1. Run Query `jsonPayload.request.deliveryVehicleId="vehicle_id"` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.v1.UpdateDeliveryVehicleLog"`.
1. This will show the location updates sent through the library.