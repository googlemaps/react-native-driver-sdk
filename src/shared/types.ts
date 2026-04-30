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

import type {
  Location,
  Waypoint,
} from '@googlemaps/react-native-navigation-sdk';

/**
 * Severity level of a driver status update from Fleet Engine.
 *
 * **Android only.** No status updates are delivered on iOS;
 * use the vehicle reporter's `setOnVehicleUpdateSucceed` / `setOnVehicleUpdateFailed` instead.
 */
export enum DriverStatusLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Status code describing the type of driver status update.
 *
 * **Android only.** No status updates are delivered on iOS;
 * use the vehicle reporter's `setOnVehicleUpdateSucceed` / `setOnVehicleUpdateFailed` instead.
 */
export enum DriverStatusCode {
  DEFAULT = 'DEFAULT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VEHICLE_NOT_FOUND = 'VEHICLE_NOT_FOUND',
  BACKEND_CONNECTIVITY_ERROR = 'BACKEND_CONNECTIVITY_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SERVICE_ERROR = 'SERVICE_ERROR',
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',
  TRAVELED_ROUTE_ERROR = 'TRAVELED_ROUTE_ERROR',
}

/**
 * Callback for driver status updates from Fleet Engine.
 *
 * **Android only.** No status updates are delivered on iOS;
 * use the vehicle reporter's `setOnVehicleUpdateSucceed` / `setOnVehicleUpdateFailed` for iOS vehicle update callbacks.
 */
export type OnStatusUpdateCallback = (
  statusLevel: DriverStatusLevel,
  statusCode: DriverStatusCode,
  statusMsg: string
) => void;

export interface AuthTokenContext {
  vehicleId?: string;
  taskId?: string;
}

export type OnGetTokenCallback = (context: AuthTokenContext) => Promise<string>;

export enum VehicleState {
  OFFLINE = 0,
  ONLINE,
}

export interface VehicleReporter {
  /**
   * Enables/disables location tracking
   * @param isEnabled
   * @returns
   */
  setLocationTrackingEnabled(enabled: boolean): Promise<void>;
  /**
   * Sets the interval in seconds for the location updates
   * @param intervalSeconds
   * @returns
   */
  setLocationReportingInterval(intervalSeconds: number): Promise<void>;

  /**
   * Sets a callback for successful vehicle updates.
   *
   * **iOS only.** No vehicle reporter updates are delivered on Android;
   * use {@link OnStatusUpdateCallback} (passed to `initialize`) instead.
   */
  setOnVehicleUpdateSucceed(
    callback: (vehicleUpdate: VehicleUpdate) => void
  ): void;

  /**
   * Sets a callback for failed vehicle updates.
   *
   * **iOS only.** No vehicle reporter updates are delivered on Android;
   * use {@link OnStatusUpdateCallback} (passed to `initialize`) instead.
   */
  setOnVehicleUpdateFailed(
    callback: (vehicleUpdate: VehicleUpdate, error: VehicleUpdateError) => void
  ): void;
}

export interface VehicleUpdate {
  location: Location;
  destinationWaypoint?: Waypoint;
  remainingTimeInSeconds?: number;
  remainingDistanceInMeters?: number;
  route?: Location[];
  vehicleState: VehicleState;
}

export interface VehicleUpdateError {
  code: number;
  domain: string;
  message: string;
}
