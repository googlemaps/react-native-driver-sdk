# Migration Guide

This document covers breaking changes and migration steps between major versions of `@googlemaps/react-native-driver-sdk`.

## Table of Contents

- [Migrating from 0.4.x to 0.5.x](#migrating-from-04x-to-05x)

---

## Migrating from 0.4.x to 0.5.x

Version 0.5.0 introduces React Native's **New Architecture** (TurboModules) as a requirement, dropping support for the legacy architecture. This release upgrades the underlying `@googlemaps/react-native-navigation-sdk` to 0.15.x which also requires the New Architecture.

### Summary of Breaking Changes

| Category       | Change                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- |
| Architecture   | New Architecture required (React Native 0.79+)                                         |
| Navigation SDK | Upgraded to `@googlemaps/react-native-navigation-sdk` 0.15.x (New Architecture)        |
| Native Modules | Migrated from `NativeModules` bridge to TurboModules (JSI)                             |
| Kotlin         | Updated the minimum Kotlin version to 2.2.10. Recommended AGP 8.10.0 and Gradle 8.11.1 |
| React Native   | Support for React Native versions below 0.79.x has been dropped                        |

### Prerequisites

- **React Native 0.79 or higher** is required
- **New Architecture must be enabled** in your project

### Step 1: Enable New Architecture

#### Android

Update `android/gradle.properties`:

```diff
- newArchEnabled=false
+ newArchEnabled=true
```

#### iOS

Update `ios/Podfile`:

```diff
- ENV['RCT_NEW_ARCH_ENABLED'] = '0'
+ ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

Then reinstall pods:

```bash
cd ios && pod install
```

### Step 2: Migrate Navigation SDK Usage

The Driver SDK depends on `@googlemaps/react-native-navigation-sdk`, which has undergone significant breaking changes in its New Architecture upgrade. If your app uses any Navigation SDK APIs directly (e.g., `NavigationView`, `useNavigation`, navigation initialization, event listeners, or view callbacks), you **must** follow the Navigation SDK migration guide:

> **[Navigation SDK Migration Guide (0.13.x to 0.14.x)](https://github.com/googlemaps/react-native-navigation-sdk/blob/main/MIGRATING.md#migrating-from-013x-to-014x)**

> [!NOTE]
> Check the [Navigation SDK release notes](https://github.com/googlemaps/react-native-navigation-sdk/releases) for the full list of breaking changes and new features across versions.

Key changes in the Navigation SDK that may affect your app:

| Category        | Change                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Navigation Init | Terms and Conditions dialog and session initialization are now separate methods                  |
| Navigation Init | `init()` returns `NavigationSessionStatus` instead of throwing errors                            |
| Event Listeners | `addListeners`/`removeListeners` with callback objects replaced with individual setter functions |
| View Callbacks  | `mapViewCallbacks` and `navigationViewCallbacks` replaced with individual callback props         |
| View Props      | UI settings moved from controller methods to declarative view props                              |
| Route Status    | `onRouteStatusResult` removed; use `await setDestination()` / `await setDestinations()` instead  |
| Color API       | All color properties now support React Native's `ColorValue` type                                |

### Step 3: Update Driver SDK Module Imports (If Using Native Modules Directly)

The native modules have been migrated from the React Native bridge (`NativeModules`) to TurboModules. If you only use the TypeScript API (`DeliveryDriverApi`, `RidesharingDriverApi`), no changes are needed — the migration is handled internally.

If you were accessing native modules directly:

#### Before (0.4.x)

```tsx
import { NativeModules, Platform } from 'react-native';

const DeliveryModule = NativeModules.DeliveryDriverModule;

// Ridesharing had platform-specific module names
const RidesharingModule = Platform.OS === 'ios'
  ? NativeModules.RideSharingModule
  : NativeModules.RidesharingModule;
```

#### After (0.5.x)

```tsx
// Native modules are now accessed via TurboModules internally.
// Use the public API classes instead of accessing native modules directly:
import {
  DeliveryDriverApi,
  RidesharingDriverApi,
} from '@googlemaps/react-native-driver-sdk';
```

> [!NOTE]
> The platform-specific module name difference for Ridesharing (`RideSharingModule` on iOS vs `RidesharingModule` on Android) has been unified under the TurboModule system.

### Step 4: Update Build Configuration

#### Android

Ensure your `android/build.gradle` uses compatible versions:

- **Kotlin**: 2.2.10 or higher
- **Android Gradle Plugin (AGP)**: 8.10.0 (recommended)
- **Gradle**: 8.11.1 (recommended)
- **compileSdk**: 36 or higher
- **targetSdk**: 36 or higher
- **minSdk**: 26 or higher

#### iOS

Ensure your `Podfile` specifies iOS 16.0+ as the deployment target:

```ruby
platform :ios, '16.0'
```

### Need Help?

If you encounter issues during migration:

1. Check the [example apps](./example) for complete working examples
2. Review the [Navigation SDK Migration Guide](https://github.com/googlemaps/react-native-navigation-sdk/blob/main/MIGRATING.md) for navigation-related changes
3. [File an issue](https://github.com/googlemaps/react-native-driver-sdk/issues) on GitHub
