/**
 * Copyright 2023 Google LLC
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
import { DeliveryVehicle } from "./types";
import {
  VehicleReporter,
  OnStatusUpdateCallback,
  OnGetTokenCallback,
} from "../shared/types";
import {
  NativeModules,
  Platform,
} from "react-native";
import { DriverApi } from "../shared/driverApi";

interface DeliveryVehicleReporter extends VehicleReporter {}

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
export default class DeliveryDriverApi extends DriverApi {
  constructor() {
    super(NativeModules.DeliveryDriverModule);
  }

  async initialize(
    providerId: string,
    vehicleId: string,
    viewId: number,
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ) {
    this.onGetTokenCallback = onGetToken;
    this.vehicleId = vehicleId;

    if (Platform.OS == "ios") {
      await this.nativeModule.createDeliveryDriverInstance(
        providerId,
        vehicleId,
        viewId
      );
    } else {
      await this.nativeModule.createDeliveryDriverInstance(
        providerId,
        vehicleId
      );
    }

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
      setLocationReportingInterval: (intervalSeconds) =>
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
