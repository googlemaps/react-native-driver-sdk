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

export interface Spec extends TurboModule {
  // Instance management
  createRidesharingInstance(
    providerId: string,
    vehicleId: string
  ): Promise<boolean>;
  clearInstance(): Promise<boolean>;

  // Location tracking
  setLocationTrackingEnabled(isEnabled: boolean): Promise<boolean>;
  setLocationReportingInterval(intervalSeconds: number): Promise<void>;

  // Vehicle state (online/offline)
  setVehicleState(isOnline: boolean): Promise<boolean>;

  // SDK info
  getDriverSdkVersion(): Promise<string>;

  // Auth token
  setAuthToken(authToken: string, vehicleId: string): Promise<void>;

  // Abnormal termination
  setAbnormalTerminationReporting(isEnabled: boolean): void;

  // Event emitter support
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RidesharingModule');
export type { Spec as RidesharingModuleSpec };
