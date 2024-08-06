# ODRD Sample app

## Description

This is a sample application that showcases developers how to integrate with the React Native: DriverSDK library.

## Prerequisites

1. This library depends on the ODRD backend available in https://github.com/googlemaps/java-on-demand-rides-deliveries-stub-provider. Please make sure to set this up before proceeding.

1. Once the backend is setup, create a vehicle and keep the vehicleId handy. To create a vehicle, you can trigger POST request with the desired fields. Example:

```URL: http://localhost:8080/vehicle/new
    
    Body:

        {
          "vehicleId": "vehicle_3342",
          "supportedTripTypes": ["EXCLUSIVE"],
          "backToBackEnabled": false,
          "maximumCapacity": 4
        }
```

1. Go to the [App.tsx](/example/ODRD/App.tsx) file and update the BASE_URL, PROVIDER_ID, and VEHICLE_ID according to your configuration. 

## How to run application

1. Run `npm i` from the current directory.

1. Go to the [ios](./ios) folder and run `pod install`.

1. Come back to the current directory.

1. Then you can use `npx react-native run-android` or `npx react-native run-ios` depending the platform.

## Debugging Fleet engine logs

To make sure that location updates are propagating properly, you can use Fleet Engine logs.

1. Go to https://console.cloud.google.com/ and select the relevant project.
1. Open the "Logs Explorer".
1. Run Query `jsonPayload.request.vehicleId="vehicle_id"` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.v1.UpdateVehicleLog"`.
1. This will show the location updates sent through the library.