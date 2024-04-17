# React Native: DriverSDK Library

## Description

This repository contains a library to support cross platform development for the DriverSDK using React Native.


## Prerequisites

1. This library requires the usage of the Navigation SDK (either manually or via library)

   https://github.com/googlemaps/react-native-navigation-sdk

2)  The provider server connected to your fleet engine should be prepared and running.

      For DeliveryDriverAPI clone and download the sample provider server in repository:
        https://github.com/googlemaps/last-mile-fleet-solution-samples

      For RideSharingAPI clone and download the sample provider server in repository:
        https://github.com/googlemaps/java-on-demand-rides-deliveries-stub-provider


      Make sure the following endpoints exist for the JWT AuthToken

         /token/delivery_driver/{vehicle_id} - for DeliveryDriverAPI
         /token/driver/{vehicle_id} - for RideSharingAPI

3)  Create a vehicle, vehicle is required to be created for both DeliveryDriverAPI and RideSharingAPI.

  <details>
    <summary>DeliveryDriverAPI</summary>
    
    The setup for creating a vehicle for DeliveryDriverAPI may not be sufficient to contain in a single readme file. Please visit https://github.com/googlemaps/last-mile-fleet-solution-samples for more information.

  </details>

  <details>
    <summary>RideSharingAPI</summary>
    URL: http://localhost:8080/vehicle/new
    
    Body:

        {
          "vehicleId": "vehicle_3342",
          "supportedTripTypes": ["EXCLUSIVE"],
          "backToBackEnabled": false,
          "maximumCapacity": 4
        }

  Reponse:

        {
          "name": "providers/mobility-partner-access/vehicles/vehicle_3342",
          "vehicleState": "ONLINE",
          "waypoints": [],
          "currentTripsIds": [],
          "backToBackEnabled": false,
          "maximumCapacity": 4,
          "supportedTripTypes": [
              "EXCLUSIVE"
          ],
          "lastLocation": {
              "point": {
                  "latitude": 37.419645,
                  "longitude": -122.073884
              },
              "heading": 0
          },
          "vehicleAttributes": [],
          "vehicleType": {
              "category_": 1,
              "memoizedIsInitialized": -1,
              "unknownFields": {
                  "fields": {},
                  "fieldsDescending": {}
              },
              "memoizedSize": -1,
              "memoizedHashCode": 0
          },
          "etaToFirstWaypoint": {
              "seconds_": 0,
              "nanos_": 0,
              "memoizedIsInitialized": -1,
              "unknownFields": {
                  "fields": {},
                  "fieldsDescending": {}
              },
              "memoizedSize": -1,
              "memoizedHashCode": 0
          }
        }

  </details>

## How to install/setup

#### Please perform the following, in order, before proceeding to next section (How to implement RideSharingAPI)

1.  Run this in your project root directory:

    `npm install --save https://github.com/googlemaps/react-native-driver-sdk.git`

2.  In your react native project, open the generated android folder in Android Studio. Open app module level build.gradle and add the following line below:

        plugins {
            id "com.google.cloud.artifactregistry.gradle-plugin" version "2.1.5"
        }

        repositories {
            maven {
                url "artifactregistry://us-west2-maven.pkg.dev/gmp-artifacts/transportation"
            }
        }

3.  In your Google cloud console, add the Google API key to the project. Add this newly created API key to the local.properties file.

          MAPS_API_KEY=<place your map api key here>

## How to implement RideSharingAPI

### Initializing the API

First step, In your react-native component, import and instantiate the RideSharingModule and reference it through variable.

        import RideSharingModule from "react-native-driver-sdk/components/RideSharingAPI/RidesharingModule";

        const _rideSharingModule = new RideSharingModule();

Second step is to add listener to capture the updateStatus result. The code snippet below should apply in useEffect() method.

       useEffect(() => {
            _rideSharingModule.addListener(updateStatus);
            return async () => {
                // component did unmount
                await _rideSharingModule.clearInstance();
                _rideSharingModule.removeListeners();
             }
          }, []);


For example, in a newly built RN project via cli (npm i -g create-react-native-app) with the navigation sdk implemented via react-native-nav-sdk, in the function App of App.tsx:
Observe how the code snippets above are inserted in the code below.

       function App(): JSX.Element {
           const _rideSharingModule = new RideSharingModule();
           let navViewRef: NavigationView = {};

           useEffect(() => {
             const height = Dimensions.get('window').height - 0.1 * Dimensions.get('window').height;
             const width = Dimensions.get('window').width;
             navViewRef.init(width, height);
             _rideSharingModule.addListener(updateStatus);
             return async () => {
                await _rideSharingModule.clearInstance();
                _rideSharingModule.removeListeners();
            }
           }, []);

           return (
             <SafeAreaView>
               <NavigationView
                 ref={
                   child => {
                     navViewRef = child
                   }
                 }
                 onArrivalResult={opt => console.log('onArrivalResult: ', opt)}
               />
             </SafeAreaView>
           );
       }

### Authentication token

Retrieve your JWT from the authentication service before creating any instances.

        const getToken = async () => {
          const baseUrl = "http://127.0.0.1:8080";
          const tokenUrl = baseUrl + "/token/driver/vehicle_A003";
          const response = await fetch(tokenUrl);
          const token = await response.json();
          const authTokenRes = await rideSharingModule.setAuthToken(
            token.jwt,
            "vehicle_A003"
          );
        };

### Create RideSharingAPI Instance


You can create the instance of RidesharingDriverApi using the **createRideSharingInstance** method. This is where you define the provider Id, host URL for the provider server, the vehicle Id.

        try {
            await rideSharingModule.createRidesharingInstance("<YOUR PROJECT ID>",url,"vehicle_A003",navViewRef.state.viewId)
            .then(async () => {
                const vehicleReporter = await rideSharingModule.createRidesharingVehicleReporter();
            });
        } catch (e) {
            console.error(e);
        }

### Create RidesharingVehicleReporter

You can create the RidesharingVehicleReporter using the **createRidesharingVehicleReporter** method. An instance of RidesharingDriverApi must be created before running this function.

         rideSharingModule.createRidesharingVehicleReporter();

## How to implement DeliveryDriverAPI

### Initializing the API

First step, In your react-native component, import and instantiate the DeliveryDriverModule and reference it through variable.

          import DeliveryDriverModule from "react-native-driver-sdk/components/DeliveryDriverAPI/DeliveryDriverModule";

          const deliveryDriverModule = new DeliveryDriverModule();

Second step is to add listener to capture the updateStatus result. The code snippet below should apply in useEffect() method.

        useEffect(() => {
            const height = Dimensions.get("window").height - 0.1 * Dimensions.get("window").height;
            const width = Dimensions.get("window").width;
            navViewRef.init(width, height);
            deliveryDriverModule.addListener(updateStatus);
            return () => {};
        }, []);


For example, in a newly built RN project via cli (npm i -g create-react-native-app) with the navigation sdk implemented via react-native-nav-sdk, in the function App of App.tsx:
Observe how the code snippets above are inserted in the code below.

       function App(): JSX.Element {
           const deliveryDriverModule = new DeliveryDriverModule();
           let navViewRef: NavigationView = {};

           useEffect(() => {
                const height = Dimensions.get("window").height - 0.1 * Dimensions.get("window").height;
                const width = Dimensions.get("window").width;
                navViewRef.init(width, height);
                deliveryDriverModule.addListener(updateStatus);
                return () => {};
           }, []);

           return (
             <SafeAreaView>
               <NavigationView
                 ref={
                   child => {
                     navViewRef = child
                   }
                 }
                 onArrivalResult={opt => console.log('onArrivalResult: ', opt)}
               />
             </SafeAreaView>
           );
       }

### Create DeliveryDriverAPI Instance
You can create the instance of DeliveryDriverAPI using the **createDeliveryDriverInstance** method. This is where you define the provider Id, host URL for the provider server, the vehicle Id, and the view id of the NavSDK fragment.

        let url: string = "http://localhost:8080";

        try {
            deliveryDriverModule.createDeliveryDriverInstance("<YOUR PROJECT ID>", url, "vehicle_A003");
        } catch (error) {
            console.log(error);
        }

## OTHER FUNCTIONS

### Set vehicle status (offline/online) - RideSharingAPI only:

To set the status of your vehicle to offline or online, you can use the **setVehicleState** method. Pass TRUE as parameter to set the status to online, else FALSE to set the status to offline. See the sample code below:

         driverRef.setVehicleState(true);

### Enable/disable location tracking - RideSharingAPI & DeliveryDriverAPI:

To enable/disable location updates passed to the fleet engine, you can use the **setLocationTrackingEnabled** method. Pass TRUE as parameter to enable location updates, else FALSE to disable updates. See the sample code below:

         driverRef.setLocationTrackingEnabled(isOn);

### Set update interval status (seconds) - RideSharingAPI & DeliveryDriverAPI:

To set the time interval of your vehicle updates, you can use the **setLocationReportingInterval** method. Pass the value in seconds of your preferred interval. See the sample code below where location will be updated every 20 seconds:

         driverRef.setLocationReportingInterval(20);

### Get the Driver SDK version: - RideSharingAPI & DeliveryDriverAPI:

To get the DriverSDK version being used, you can call the **getRidesharingDriverSDKVersion** or **getDriverSdkVersion** method. See the sample code below:

        const version = await deliveryDriverModule.getDriverSdkVersion();
        console.log("version ", version);

        const version = await rideSharingModule.getRidesharingDriverSDKVersion();
        console.log("version ", version);

### Get the Provider ID and Vehicle ID: - RideSharingAPI & DeliveryDriverAPI:

To get the vehicle ID of the DriverContext, you can call the **getVehicleId** method. <br />
To get the provider ID of the DriverContext, you can call the **getProviderId** method. <br />
See the sample code below:

        const vehicleId = await deliveryDriverModule.getVehicleId();
        console.log("vehicleId ", vehicleId);

        const providerId = await deliveryDriverModule.getProviderId();
        console.log("providerId ", providerId);

### Get the Vehicle Name, Destination Waypoint, and Remaining Vehicle Stops: - DeliveryDriverAPI:

To get the vehicle's name, destination waypoints, remaining vehicle, you can call **getDeliveryVehicle** method
See the sample code below:

         const deliveryVehicle = await deliveryDriverModule.getDeliveryVehicle();
         console.log(deliveryVehicle) // will return the DeliveryVehicle object



### List of sample functions in ODRD

| Function                                                                | Description                                                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `createRidesharingInstance`                                      | create the instance of RidesharingAPI.        |
| `createRidesharingVehicleReporter`                                         | Vehicle reporter for a delivery vehicle that reports location and stop information. An app is allowed only one vehicle reporter.                                                                              |
| `setLocationTrackingEnabled(boolean)`                                           | Enable/disabled location tracking(logs).                                                                                        |
| `setVehicleState(VehicleState)`                                           | Online/Offline of vehicle status.                                                                                        |
| `setLocationReportingInterval(number)`                                           | Set the log interval(seconds).                                                                                            |                                                                             
| `getDriverSdkVersion()`                                              | get ridesharing driversdk version.                             |
| `clearInstance()`                                                     | async clear instance.                              |
| `setAbnormalTerminationReporting(boolean)`                                                        | enable/disable abnormal termination reporting. |


### List of sample functions in LMFS

| Function                                                                | Description                                                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `createDeliveryDriverInstance`                                      | create the instance of DeliveryDriverAPI.        |
| `createDeliveryDriverReporter`                                         | Vehicle reporter for a delivery vehicle that reports location and stop information. An app is allowed only one vehicle reporter.                                                                              |
| `setLocationTrackingEnabled(boolean)`                                           | Enable/disabled location tracking(logs).                                                                                 |
| `setLocationReportingInterval(number)`                                           | Set the log interval(seconds).                                                                                            |                                                                
| `getDriverSdkVersion()`                                              | get delivery driversdk version.                             |
| `getVehicleId()`                                               | get vehicle id.                                               |
| `getProviderId()`                                           | get provider id.                    |
| `getDeliveryVehicle()`                                                     |  get delivery vehicle.|
| `clearInstance()`                                                     |  clear instance.                              |
| `setAbnormalTerminationReporting(boolean)`                                                        | enable/disable abnormal termination reporting. |




### Running the app:

Assuming that you followed the tutorial to setup your react native environment (https://reactnative.dev/docs/environment-setup). You can run your project through npx command. This will start the metro development server. Through terminal, go to your project folder and run the following command:

         npx react-native run-android

Make sure the location permission is granted for the navigation sdk to work enabling it to give updates to the driversdk.

### How to run the Sample App

## Android:

1. Download example/(choose between ODRD or LMFS)
2. Run this command `npm install react-native` from the root of (ODRD/LMFS) folder. This will generate the `node_modules` from this sample app.
3. Open the (ODRD/LMFS)/android folder in Android Studio and add your api key in local.properties.
4. run `npx react-native run-android` command from the root of (ODRD/LMFS) folder.
5. Make sure to run this command `adb reverse tcp:8080 tcp:8080` when using emulator. This will allow the emulator to connect with port 8080.

## IOS:
1. Download example/(choose between ODRD or LMFS)
2. Run this command `npm install react-native` from the root of (ODRD/LMFS) folder. This will generate the `node_modules` from this sample app.
3. Open the (ODRD/LMFS)/ios/SampleApp folder in Xcode and add your api key in info.plist
4. Run this command `pod install` and `pod update` from the folder (ODRD/LMFS)/ios. This will install and update the library for ios. 
5. in Xcode open the SampleApp.xcworkspace. From the tab Product select Build. Select the desired device and then click run.

### How to check the vehicle logs using the Sample App:
## ODRD
  ### Android and IOS:
  1. From the SampleApp/App.tsx:
      a.) Make sure the value of `baseUrl`, `vehicleId` and `providerId` are correct.
      b.) If needed, update the waypoints from the function of `runMultipleDestination`.
      const runMultipleDestination = () => {
        let wp1 = new Waypoint("ChIJl95qsG9_qTMRM3LemyzW7Tc"); // goforless
        let wp2 = new Waypoint("ChIJDcQvDiV5qTMR8k9QVLLrcp8"); // chef

        if (Platform.OS == "ios") {
          wp1 = new Waypoint("ChIJSyQBrq55qTMRNDWEPZDs4nM"); // bonch
          wp2 = new Waypoint("ChIJkZi9vD15qTMRke-N_gL0qq4"); // fam minis
        }

        const map = [wp1, wp2];

        const routingOptions = new RoutingOptions(TravelMode.DRIVING);
        routingOptions.avoidFerries = true;
        routingOptions.avoidTolls = false;
        mapViewRef.setRoutingOptions(routingOptions);
        mapViewRef.setDestinations(map);
        setShouldShowControls(false);
      };
  2. Run the SampleApp.
  3. From the SampleApp, Click `Show controls`, select `Create Instance` and `Run`. To create instance and run the simulation.
  4. To create a logs, From the `Show controls`, Switched on the `Location Tracking`.
  5. Change the vehicle status by switch on (ONLINE) or switch off (OFFLINE) the `Vehicle Status`.
  6. Check Logs in https://console.cloud.google.com/, select the project/provider. Open the Logs Explorer. 
  7. Run Query `jsonPayload.request.vehicleId="vehicle_id"` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.v1.GetVehicleLog"`. This will show the logs created from the SampleApp.

## LMFS
   ### Android and IOS:
   1. From the SampleApp/App.tsx:
      a.) Make sure the value of `baseUrl`, `vehicleId` and `providerId` are correct.
      b.) If needed, update the waypoints from the function of `initWaypoints`.
      const initWaypoints = () => {
        let wp1 = new Waypoint("ChIJq9YxEFB5qTMR0EFNc3VlgJc"); // anganas
        let wp2 = new Waypoint("ChIJDcQvDiV5qTMR8k9QVLLrcp8"); // chef

        if (Platform.OS == "ios") {
          wp1 = new Waypoint("ChIJSyQBrq55qTMRNDWEPZDs4nM"); // bonch
          wp2 = new Waypoint("ChIJkZi9vD15qTMRke-N_gL0qq4"); // fam minis
        }

        const map = [wp1, wp2];

        const routingOptions = new RoutingOptions(TravelMode.DRIVING);
        routingOptions.avoidFerries = true;
        routingOptions.avoidTolls = false;
        mapViewRef.setRoutingOptions(routingOptions);
        mapViewRef.setDestinations(map);
        setShouldShowControls(false);
      };
  2. Run the SampleApp.
  3. From the SampleApp, Click `Show controls`, select `Create Instance` and `Run`. To create instance and run the simulation.
  4. To create a logs, From the `Show controls`, Switched on the `Location Tracking`.
  5. Check Logs in https://console.cloud.google.com/, select the project/provider. Open the Logs Explorer. 
  6. Run Query `jsonPayload.request.deliveryVehicleId="vehicle_id""` and `jsonPayload.@type="type.googleapis.com/maps.fleetengine.delivery.log.v1.GetDeliveryVehicleLog"`. This will show the logs created from the SampleApp.


