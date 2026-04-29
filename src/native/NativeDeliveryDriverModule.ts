/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypesNamespace';

// Note: Using Double instead of Int32 as codegen for TurboModules currently
// fails to unbox values to Integer on iOS.

type TaskInfoSpec = Readonly<{
  taskId: string;
  taskDurationSeconds: number;
}>;

type VehicleStopSpec = Readonly<{
  vehicleStopState: number;
  waypoint?: Readonly<{
    position?: Readonly<{ lat: number; lng: number }>;
    title?: string;
    placeId?: string;
    preferredHeading?: number;
    vehicleStopover?: boolean;
    preferSameSideOfRoad?: boolean;
  }>;
  taskInfoList: ReadonlyArray<TaskInfoSpec>;
}>;

type DeliveryVehicleSpec = Readonly<{
  providerId: string;
  vehicleName: string;
  vehicleId: string;
  vehicleStops: ReadonlyArray<VehicleStopSpec>;
}>;

type VehicleUpdateSpec = Readonly<{
  location: Readonly<{
    lat: number;
    lng: number;
    time: number;
    accuracy?: number;
    altitude?: number;
    bearing?: number;
    speed: number;
    verticalAccuracy?: number;
  }>;
  vehicleState: number;
  destinationWaypoint?: Readonly<{
    position: Readonly<{ lat: number; lng: number }>;
    title?: string;
    placeId?: string;
    preferredHeading?: number;
    vehicleStopover?: boolean;
    preferSameSideOfRoad?: boolean;
  }>;
  remainingTimeInSeconds?: number;
  remainingDistanceInMeters?: number;
}>;

type VehicleUpdateErrorSpec = Readonly<{
  code: number;
  domain: string;
  message: string;
}>;

type AuthTokenRequestSpec = Readonly<{
  requestId: string;
  vehicleId: string;
  taskId: string;
}>;

export interface Spec extends TurboModule {
  // Instance management
  createDeliveryDriverInstance(
    providerId: string,
    vehicleId: string
  ): Promise<boolean>;
  clearInstance(): Promise<boolean>;

  // Location tracking
  setLocationTrackingEnabled(isEnabled: boolean): Promise<boolean>;
  setLocationReportingInterval(intervalSeconds: number): Promise<void>;

  // Vehicle management
  getDeliveryVehicle(): Promise<DeliveryVehicleSpec>;

  // SDK info
  getDriverSdkVersion(): Promise<string>;

  // Auth token - JS resolves a pending native token request
  resolveAuthToken(requestId: string, token: string): void;
  rejectAuthToken(requestId: string, error: string): void;

  // Abnormal termination
  setAbnormalTerminationReporting(isEnabled: boolean): void;

  // Events emitted by native when auth token is needed
  onGetToken: EventEmitter<AuthTokenRequestSpec>;

  // Status & vehicle reporter events
  onStatusUpdate: EventEmitter<
    Readonly<{
      statusLevel: string;
      statusCode: string;
      statusMsg: string;
    }>
  >;
  onVehicleUpdateSucceed: EventEmitter<
    Readonly<{ vehicleUpdate: VehicleUpdateSpec }>
  >;
  onVehicleUpdateFailed: EventEmitter<
    Readonly<{
      vehicleUpdate: VehicleUpdateSpec;
      error: VehicleUpdateErrorSpec;
    }>
  >;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DeliveryDriverModule');
export type { Spec as DeliveryDriverModuleSpec };
