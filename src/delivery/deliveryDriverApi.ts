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

import { DeliveryDriverModule, type DeliveryDriverModuleSpec } from '../native';
import {
  DriverApi,
  type OnGetTokenCallback,
  type OnStatusUpdateCallback,
  type VehicleReporter,
} from '../shared';
import { VehicleStopState, type DeliveryVehicle } from './types';

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
export class DeliveryDriverApi extends DriverApi<DeliveryDriverModuleSpec> {
  constructor() {
    super(DeliveryDriverModule);
  }

  async initialize(
    providerId: string,
    vehicleId: string,
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): Promise<void> {
    this.onGetTokenCallback = onGetToken;
    this.vehicleId = vehicleId;

    // Set up event listeners first so the native token request can be handled
    this.initializeEventListeners(onGetToken, onStatusUpdate);

    await this.nativeModule.createDeliveryDriverInstance(providerId, vehicleId);
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
      setOnVehicleUpdateSucceed: this.setOnVehicleUpdateSucceed,
      setOnVehicleUpdateFailed: this.setOnVehicleUpdateFailed,
    };
  }

  /**
   * Returns the {@link DeliveryVehicleManager} associated to this instance.
   * You must initialize the Api prior to calling this method.
   */
  getDeliveryVehicleManager(): DeliveryVehicleManager {
    return {
      getDeliveryVehicle: async (): Promise<DeliveryVehicle> => {
        const spec = await this.nativeModule.getDeliveryVehicle();
        return {
          providerId: spec.providerId,
          vehicleName: spec.vehicleName,
          vehicleId: spec.vehicleId,
          vehicleStops: spec.vehicleStops.map(stop => ({
            vehicleStopState: toVehicleStopState(stop.vehicleStopState),
            waypoint: stop.waypoint
              ? {
                  position: stop.waypoint.position,
                  title: stop.waypoint.title,
                  placeId: stop.waypoint.placeId,
                  preferredHeading: stop.waypoint.preferredHeading,
                  vehicleStopover: stop.waypoint.vehicleStopover,
                  preferSameSideOfRoad: stop.waypoint.preferSameSideOfRoad,
                }
              : undefined,
            taskInfoList: stop.taskInfoList.map(task => ({
              taskId: task.taskId,
              taskDurationSeconds: task.taskDurationSeconds,
            })),
          })),
        };
      },
    };
  }
}

function toVehicleStopState(value: number): VehicleStopState {
  switch (value) {
    case 1:
      return VehicleStopState.NEW;
    case 2:
      return VehicleStopState.ENROUTE;
    case 3:
      return VehicleStopState.ARRIVED;
    default:
      return VehicleStopState.UNSPECIFIED;
  }
}

export default DeliveryDriverApi;
