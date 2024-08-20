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

export type OnStatusUpdateCallback = (
  statusLevel: string,
  statusCode: string,
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
   * Allows setting a listener for reporting updates. This is only
   * available for iOS. For Android, please use {@code UpdateStatusListener}.
   * @param listener
   */
  setListener(listener: VehicleReporterListener): void;
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

export interface VehicleReporterListener {
  onVehicleUpdateSucceed(vehicleUpdate: VehicleUpdate): void;
  onVehicleUpdateFailed(
    vehicleUpdate: VehicleUpdate,
    error: VehicleUpdateError
  ): void;
}
