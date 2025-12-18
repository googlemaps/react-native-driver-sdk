# React Native: DriverSDK Library

**European Economic Area (EEA) developers**

If your billing address is in the European Economic Area, effective on 8 July 2025, the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea) will apply to your use of the Services. Functionality varies by region. [Learn more](https://developers.google.com/maps/comms/eea/faq).

## Description

This is the beta release of the Google Driver SDK package for React Native. It is an early look at the package and is intended for testing and feedback collection. The functionalities and APIs in this version are subject to change.

> [!NOTE]
> This package is in Beta until it reaches version 1.0. According to [semantic versioning](https://semver.org/#spec-item-4), breaking changes may be introduced before 1.0.

## Requirements

|                                 | Android | iOS       |
| ------------------------------- | ------- | --------- |
| **Minimum mobile OS supported** | SDK 26+ | iOS 16.0+ |
| **Compile/Target SDK**          | SDK 36+ | -         |

* A React Native project
* A Google Cloud project
  *  If you are a Mobility Services developer, you must contact Sales as described in [Mobility services documentation](https://developers.google.com/maps/documentation/transportation-logistics/mobility).
  *  If you are not a Mobility Services developer, refer to [Setup Google Cloud Project](https://developers.google.com/maps/documentation/navigation/android-sdk/cloud-setup) for instructions.
* An [API key](https://console.cloud.google.com/google/maps-apis/credentials) from the project above
  * The API key must be configured for both Android and iOS. Refer to [Android Using Api Keys](https://developers.google.com/maps/documentation/navigation/android-sdk/get-api-key) and [iOS Using Api Keys](https://developers.google.com/maps/documentation/navigation/ios-sdk/get-api-key) respectively for instructions.
* If targeting Android, [Google Play Services](https://developers.google.com/android/guides/overview) installed and enabled
* [Attributions and licensing text](https://developers.google.com/maps/documentation/navigation/android-sdk/set-up-project#include_the_required_attributions_in_your_app) added to your app

> [!IMPORTANT]
> [Apply API restrictions](https://developers.google.com/maps/api-security-best-practices#api-restriction) to the API key to limit usage to "Navigation SDK, "Maps SDK for Android", and "Maps SDK for iOS" for enhanced security and cost management. This helps guard against unauthorized use of your API key.

## React Native Compatibility

> [!IMPORTANT]
> This package does not yet support React Native's new architecture. Make sure the new architecture is disabled in your project configuration as shown in the [Installation](#installation) section.

## Installation

1. This repository is currently private. In order to install the library, you must authenticate with SSH first. See [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) for instructions on how to provide SSH keys.

1. To install the library run the following command from your project root: 

    ```bash
    npm install --save https://github.com/googlemaps/react-native-driver-sdk#{version_tag}
    ```
    or
    ```bash
    yarn add @googlemaps/react-native-driver-sdk@https://github.com/googlemaps/react-native-driver-sdk#{version_tag}
    ```

1. Install the `@googlemaps/react-native-navigation-sdk` dependency:

    ```bash
    npm install --save @googlemaps/react-native-navigation-sdk
    ```
    or
    ```bash
    yarn add @googlemaps/react-native-navigation-sdk
    ```

### Android


#### Disable new architecture

This package does not yet support new architecture. Make sure new architecture is disabled in your `android/gradle.properties` file:

```groovy
newArchEnabled=false
```

#### Enable Jetifier

To ensure compatibility with AndroidX, enable Jetifier in your `android/gradle.properties` file:

```groovy
# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true
```

#### Enable Core Library Desugaring

Core library desugaring **must be enabled** for your Android project, regardless of your minSdkVersion.

To enable desugaring, update your `android/app/build.gradle` file:

```groovy
android {
    ...
    compileOptions {
        coreLibraryDesugaringEnabled true
        ...
    }
}

dependencies {
    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.0.4'
}
```

#### Minimum SDK Requirements for Android

The `minSdkVersion` for your Android project must be set to 26 or higher in `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        minSdkVersion 26
    }
}
```

The `compileSdkVersion` and `targetSdkVersion` should be set to 36 or higher.

#### Set Google Maps API Key

To securely store your API key, it is recommended to use the [Google Maps Secrets Gradle Plugin](https://developers.google.com/maps/documentation/android-sdk/secrets-gradle-plugin). This plugin helps manage API keys without exposing them in your app's source code.

See example configuration for secrets plugin at example applications [build.gradle](./example/android/app/build.gradle) file.

### iOS

#### Disable new architecture

This package does not yet support new architecture. Make sure new architecture is disabled in your `ios/Podfile`:

```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '0'
```

#### Set Google Maps API Key

To set up, specify your API key in the application delegate `ios/Runner/AppDelegate.m`:

```objective-c
#import <GoogleMaps/GoogleMaps.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"API_KEY"];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

```

## Usage

### Ridesharing
#### Initializing the API

1. As mentioned above, this library depends on the React Native: NavigationSDK library. Specifically, it depends on the existence of a `NavigationView` component in the application. 

1. In your react-native component, import and instantiate the RidesharingDriverapi and reference it through variable.

    ```typescript
            import RidesharingDriverApi from "@googlemaps/react-native-driver-sdk";

            const ridesharing = new RidesharingDriverapi();
    ```

2. Start navigation. Please refer to the Navigation SDK [Sample app](https://github.com/googlemaps/react-native-navigation-sdk/tree/main/example) for all details on how to set up the navigation component and its listeners.
     
      ```typescript
          const { navigationController } = useNavigation();
          ...
          await navigationController.init();
      ```

3. Second step is to initialize the Api. Navigation must be initialized before the Driver SDK is initialized.

    ```typescript
        await ridesharingDriverApi
            .initialize(
              PROVIDER_ID,
              VEHICLE_ID,
              (tokenContext) => {
                // Check if the token is expired, in such case request a new one.
                return Promise.resolve(authToken || "");
              },
              (statusLevel, statusCode, message) => {
                console.log("onStatusUpdate: " + statusLevel + " " + statusCode + " " + message);
              }
            );
    ```

Note: The `initialize` method takes a `onGetTokenCallback` field as parameter. This will be called periodically to ensure the token stays refresh while there's requests to Fleet Engine. Please make sure to check that the token is valid (e.g. checking expiration time) before setting it.


#### Getting a `RidesharingVehicleReporter`

The vehicle reporter allows developers to enable/disable location reporting to Fleet Engine, as well as to report changes in the vehicle state (E.g. Online or Offline).

```typescript
  const vehicleReporter = ridesharingDriverApi.getRidesharingVehicleReporter()
  await vehicleReporter.setLocationTrackingEnabled(true);
  await vehicleReporter.setVehicleState(VehicleState.ONLINE);
```

### Delivery
#### Initializing the API

1. As mentioned above, this library depends on the React Native: NavigationSDK library. Specifically, it depends on the existence of a `NavigationView` component in the application. Please refer to the Navigation SDK [Sample app](https://github.com/googlemaps/react-native-navigation-sdk/tree/main/SampleApp) for all details on how to set up the navigation component.

1. In your react-native component, import and instantiate the RidesharingDriverapi and reference it through variable.

    ```typescript
            import DeliveryDriverApi from "@googlemaps/react-native-driver-sdk";

            const deliveryApi = new DeliveryDriverapi();
    ```

2. Second step is to initialize the Api.

    ```typescript
        await deliveryApi
            .initialize(
              PROVIDER_ID,
              DELIVERY_VEHICLE_ID,
              (tokenContext) => {
                // Check if the token is expired, in such case request a new one.
                return Promise.resolve(authToken || "");
              },
              (statusLevel, statusCode, message) => {
                console.log("onStatusUpdate: " + statusLevel + " " + statusCode + " " + message);
              }
            );
    ```

Note: The `initialize` method takes a `onGetTokenCallback` field as parameter. This will be called periodically to ensure the token stays refresh while there's requests to Fleet Engine. Please make sure to check that the token is valid (e.g. checking expiration time) before setting it.


#### Getting a `DeliveryVehicleReporter`

The vehicle reporter allows developers to enable/disable location reporting to Fleet Engine.

```typescript
  const vehicleReporter = deliveryApi.getDeliveryVehicleReporter()
  await vehicleReporter.setLocationTrackingEnabled(true);
```

#### Getting a `DeliveryVehicleManager`

The vehicle managers allows developers to fetch the `DeliveryVehicle` linked to the Driver Api from Fleet Engine.

```typescript
  const vehicleManager = deliveryApi.getDeliveryVehicleManager()
  const deliveryVehicle = await vehicleManager.getDeliveryVehicle();
```

### Other APIs

#### Set update interval status (seconds) - RideSharingAPI & DeliveryDriverAPI:

To set the time interval of your vehicle updates, you can use the **setLocationReportingInterval** method of the Driver Api's. Pass the value in seconds of your preferred interval. See the sample code below where location will be updated every 20 seconds:

```typescript
  await driverApi.setLocationReportingInterval(20);
```

#### Get the Driver SDK version: - RideSharingAPI & DeliveryDriverAPI:

To get the DriverSDK version being used, you can call the **getDriverSdkVersion** method. See the sample code below:

```typescript
  const sdkVersion = await driverApi.getDriverSdkVersion();
```

### List of functions in ODRD

| Function                                                          | Description                                                                                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `RidesharingDriverApi.initialize`                                 | Create the instance of RidesharingAPI.                                                                                                 |
| `RidesharingDriverApi.getRidesharingVehicleReporter`              | Vehicle reporter for the vehicle that reports location and vehicle state to Fleet Engine. An app is allowed only one vehicle reporter. |
| `RidesharingVehicleReporter.setLocationTrackingEnabled(boolean)`  | Enable/disabled location tracking(logs).                                                                                               |
| `RidesharingVehicleReporter.setVehicleState(VehicleState)`        | Set vehicle state to Online/Offline to Fleet Engine.                                                                                   |
| `RidesharingVehicleReporter.setLocationReportingInterval(number)` | Set the reporting interval(seconds).                                                                                                   |
| `RidesharingDriverApi.getDriverSdkVersion()`                      | Get native driversdk version.                                                                                                          |
| `RidesharingDriverApi.clearInstance()`                            | Clear the api instance.                                                                                                                |
| `RidesharingDriverApi.setAbnormalTerminationReporting(boolean)`   | Enable/disable abnormal termination reporting.                                                                                         |


### List of functions in LMFS

| Function                                                           | Description                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `DeliveryDriverApi.initialize`                                     | Create the instance of DeliveryDriverAPI.                                                                                        |
| `DeliveryDriverApi.getDeliveryVehicleReporter`                     | Vehicle reporter for a delivery vehicle that reports location and stop information. An app is allowed only one vehicle reporter. |
| `DeliveryDriverApi.getDeliveryVehicleManager`                      | Returns a vehicle manager that can be used to fetch the delivery vehicle from Fleet Engine                                       |
| `DeliveryVehicleReporter.setLocationTrackingEnabled(boolean)`      | Enable/disabled location tracking(logs).                                                                                         |
| `DeliveryVehicleReporter.setLocationReportingInterval(number)`     | Set the log interval(seconds).                                                                                                   |
| `DeliveryVehicleReporter.getDriverSdkVersion()`                    | Get delivery driversdk version.                                                                                                  |  |
| `DeliveryVehicleManager.getDeliveryVehicle()`                      | Fetch the delivery vehicle from Fleet Engine                                                                                     |
| `DeliveryVehicleReporter.clearInstance()`                          | Clear instance.                                                                                                                  |
| `DeliveryVehicleReporter.setAbnormalTerminationReporting(boolean)` | Enable/disable abnormal termination reporting.                                                                                   |

### Requesting and handling permissions

The Google Navigation SDK React Native library offers functionalities that necessitate specific permissions from the mobile operating system. These include, but are not limited to, location services, background execution, and receiving background location updates.

> [!NOTE]
> The management of these permissions falls outside the scope of the Navigation SDKs for Android and iOS. As a developer integrating these SDKs into your applications, you are responsible for requesting and obtaining the necessary permissions from the users of your app.

You can see example of handling permissions in the [app.tsx](./SampleApp/src/app.tsx) file of the sample application:

```tsx
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

// ...

// Request permission for accessing the device's location.
const requestPermissions = async () => {
    const result = await request(
        Platform.OS =="android" ? 
            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION : 
            PERMISSIONS.IOS.LOCATION_ALWAYS,
    );

    if (result == RESULTS.GRANTED) {
        setArePermissionsApproved(true);
    } else {
        Snackbar.show({
            text: 'Permissions are needed to proceed with the app. Please re-open and accept.',
            duration: Snackbar.LENGTH_SHORT,
        });
    }
};
```


## Contributing

See the [Contributing guide](./CONTRIBUTING.md).

## Terms of Service

This library uses Google Maps Platform services. Use of Google Maps Platform services through this library is subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms).

This library is not a Google Maps Platform Core Service. Therefore, the Google Maps Platform Terms of Service (e.g. Technical Support Services, Service Level Agreements, and Deprecation Policy) do not apply to the code in this library.

## Support

This package is offered via an open source license. It is not governed by the Google Maps Platform Support [Technical Support Services Guidelines](https://cloud.google.com/maps-platform/terms/tssg), the [SLA](https://cloud.google.com/maps-platform/terms/sla), or the [Deprecation Policy](https://cloud.google.com/maps-platform/terms) (however, any Google Maps Platform services used by the library remain subject to the Google Maps Platform Terms of Service).

This package adheres to [semantic versioning](https://semver.org/) to indicate when backwards-incompatible changes are introduced. Accordingly, while the library is in version 0.x, backwards-incompatible changes may be introduced at any time. 

If you find a bug, or have a feature request, please [file an issue](https://github.com/googlemaps/react-native-navigation-sdk/issues) on GitHub. If you would like to get answers to technical questions from other Google Maps Platform developers, ask through one of our [developer community channels](https://developers.google.com/maps/developer-community). If you'd like to contribute, please check the [Contributing guide](https://github.com/googlemaps/react-native-navigation-sdk/blob/main/CONTRIBUTING.md).
