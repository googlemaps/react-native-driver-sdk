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
import { NativeModules, NativeEventEmitter } from "react-native";

import {
  OnStatusUpdateCallback,
  VehicleReporterListener,
  OnGetTokenCallback,
} from "../shared/types";

export const STATUS_UPDATE_EVENT_TYPE = "updateStatus";
export const VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE = "didSucceedVehicleUpdate";
export const VEHICLE_REPORTER_FAILED_UPDATE_TYPE = "didFailVehicleUpdate";

const TOKEN_UPDATE_INTERVAL_SECONDS = 10;

export abstract class DriverApi {
  nativeModule: typeof NativeModules;
  onGetTokenCallback?: OnGetTokenCallback;
  vehicleId?: string;
  isLocationTrackingEnabled: boolean = false;
  fetchTokenTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(nativeModule: typeof NativeModules) {
    this.nativeModule = nativeModule;
  }

  /**
   * Creates an Api instance. This can be used to retrieve a vehicle reporter that allows enabling location reporting to FleetEngine.
   * @param providerId - Unique identifier for the server provider.
   * @param vehicleId - Unique identifier for this vehicle for this provider.
   * @param viewId - React ViewId given to the NavigationView component set up for the application. Can be retrieved using the {@link findNodeHandle()} API.
   * @returns Promise that resolves once the Api instance has been created.
   * @throws This rejects the promise in case there's an Api instance already created.
   */
  abstract initialize(
    providerId: string,
    vehicleId: string,
    viewId: number,
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): Promise<void>;

  protected initializeEventEmitter = (
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ) => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.DriverEventDispatcher
    );

    // Allow a single active listener.
    eventEmitter.removeAllListeners(STATUS_UPDATE_EVENT_TYPE);

    if (onStatusUpdate) {
      eventEmitter.addListener(STATUS_UPDATE_EVENT_TYPE, (event) => {
        if (!!event) {
          const { statusLevel, statusCode, statusMsg } = event;
          onStatusUpdate(statusLevel, statusCode, statusMsg);
        }
      });
    }
  };

  /**
   * Clears up the Api instance. This should be done once the Api is no longer required to prevent memory leaks.
   * @returns Promise that resolves once the Api has been cleared.
   */
  clearInstance = (): Promise<void> => {
    clearTimeout(this.fetchTokenTimeoutId);

    const eventEmitter = new NativeEventEmitter(
      NativeModules.DriverEventDispatcher
    );

    // Allow a single active listener.
    eventEmitter.removeAllListeners(STATUS_UPDATE_EVENT_TYPE);
    eventEmitter.removeAllListeners(VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE);
    eventEmitter.removeAllListeners(VEHICLE_REPORTER_FAILED_UPDATE_TYPE);

    return this.nativeModule.clearInstance();
  };

  /**
   * Enables/disables reporting abnormal SDK terminations such as the app crashes while the SDK is still running.
   *
   * @param enabled - whether abnormal SDK terminations should be reported.
   */
  setAbnormalTerminationReportingEnabled = (isEnabled: boolean) => {
    return this.nativeModule.setAbnormalTerminationReporting(isEnabled);
  };

  /**
   * Returns a promise that resolves to the version associated to the native SDK.
   */
  getDriverSdkVersion = (): Promise<string> => {
    return this.nativeModule.getDriverSdkVersion();
  };

  protected setLocationTrackingEnabled = async (isEnabled: boolean) => {
    this.isLocationTrackingEnabled = isEnabled;

    if (isEnabled) {
      await this.fetchAndSetToken();
    } else {
      clearTimeout(this.fetchTokenTimeoutId);
    }

    await this.nativeModule.setLocationTrackingEnabled(isEnabled);
  };

  protected pollAuthToken = () => {
    this.fetchTokenTimeoutId = setTimeout(async () => {
      await this.fetchAndSetToken();

      if (this.isLocationTrackingEnabled) {
        this.pollAuthToken();
      }
    }, TOKEN_UPDATE_INTERVAL_SECONDS);
  };

  protected setVehicleReporterListener = (
    listener: VehicleReporterListener
  ) => {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.DriverEventDispatcher
    );

    eventEmitter.removeAllListeners(VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE);
    eventEmitter.removeAllListeners(VEHICLE_REPORTER_FAILED_UPDATE_TYPE);

    eventEmitter.addListener(VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE, (event) => {
      if (event && listener.onVehicleUpdateSucceed) {
        listener.onVehicleUpdateSucceed(event.vehicleUpdate);
      }
    });

    eventEmitter.addListener(VEHICLE_REPORTER_FAILED_UPDATE_TYPE, (event) => {
      if (event && listener.onVehicleUpdateFailed) {
        listener.onVehicleUpdateFailed(event.vehicleUpdate, event.error);
      }
    });
  };

  protected fetchAndSetToken = async () => {
    if (this.onGetTokenCallback == null) {
      return;
    }

    if (!this.vehicleId) {
      return;
    }

    const token = await this.onGetTokenCallback({
      vehicleId: this.vehicleId,
    });

    await this.nativeModule.setAuthToken(token, this.vehicleId);
  };
}
