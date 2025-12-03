/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
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

import { NativeModules } from 'react-native';
import {
  DriverApi,
  type OnGetTokenCallback,
  type OnStatusUpdateCallback,
  type VehicleReporter,
} from '../shared';
import type { DeliveryVehicle } from './types';

type DeliveryVehicleReporter = VehicleReporter;

interface DeliveryVehicleManager {
  /**
   * This method return DeliveryVehicle object and this is where you can access the
   * destination waypoints, remaining vehicle stops, vehicle name, etc.
   *
   * @returns DeliveryVehicle object
   */
  getDeliveryVehicle(): Promise<DeliveryVehicle>;
}

/** Entry point into the DriverApi for the delivery vertical. */
export class DeliveryDriverApi extends DriverApi {
  constructor() {
    super(NativeModules.DeliveryDriverModule);
  }

  async initialize(
    providerId: string,
    vehicleId: string,
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): Promise<void> {
    this.onGetTokenCallback = onGetToken;
    this.vehicleId = vehicleId;

    await this.nativeModule.createDeliveryDriverInstance(providerId, vehicleId);

    await this.fetchAndSetToken();

    this.initializeEventEmitter(onGetToken, onStatusUpdate);
  }

  /**
   * Returns the {@link DeliveryVehicleReporter} associated to this instance.
   * You must initialize the Api prior to calling this method.
   */
  getDeliveryVehicleReporter(): DeliveryVehicleReporter {
    return {
      setLocationTrackingEnabled: this.setLocationTrackingEnabled,
      setLocationReportingInterval: intervalSeconds =>
        this.nativeModule.setLocationReportingInterval(intervalSeconds),
      setListener: this.setVehicleReporterListener,
    };
  }

  /**
   * Returns the {@link DeliveryVehicleManager} associated to this instance.
   * You must initialize the Api prior to calling this method.
   */
  getDeliveryVehicleManager(): DeliveryVehicleManager {
    return {
      getDeliveryVehicle: () => this.nativeModule.getDeliveryVehicle(),
    };
  }
}
export default DeliveryDriverApi;
