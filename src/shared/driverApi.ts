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
import { NativeEventEmitter, NativeModules } from 'react-native';
import type {
  OnGetTokenCallback,
  OnStatusUpdateCallback,
  VehicleReporterListener,
  VehicleUpdate,
  VehicleUpdateError,
} from './types';

export const STATUS_UPDATE_EVENT_TYPE = 'updateStatus';
export const VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE = 'didSucceedVehicleUpdate';
export const VEHICLE_REPORTER_FAILED_UPDATE_TYPE = 'didFailVehicleUpdate';

type StatusUpdateEvent = {
  statusLevel: string;
  statusCode: string;
  statusMsg: string;
};

type VehicleReporterSuccessEvent = {
  vehicleUpdate: VehicleUpdate;
};

type VehicleReporterFailureEvent = {
  vehicleUpdate: VehicleUpdate;
  error: VehicleUpdateError;
};

const TOKEN_UPDATE_INTERVAL_SECONDS = 10;

type DriverEventDispatcherModule = {
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
};

export abstract class DriverApi {
  nativeModule: typeof NativeModules;
  onGetTokenCallback?: OnGetTokenCallback;
  vehicleId?: string;
  isLocationTrackingEnabled: boolean = false;
  fetchTokenTimeoutId?: ReturnType<typeof setTimeout>;

  private createEventEmitter = (): NativeEventEmitter => {
    const driverEventDispatcher = (
      NativeModules as Record<string, DriverEventDispatcherModule | undefined>
    ).DriverEventDispatcher;

    return new NativeEventEmitter(driverEventDispatcher ?? null);
  };

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
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): Promise<void>;

  protected initializeEventEmitter = (
    _onGetToken: OnGetTokenCallback, // TODO(jokerttu): consider removing or implementing this parameter
    onStatusUpdate?: OnStatusUpdateCallback
  ): void => {
    const eventEmitter = this.createEventEmitter();

    // Allow a single active listener.
    eventEmitter.removeAllListeners(STATUS_UPDATE_EVENT_TYPE);

    if (onStatusUpdate) {
      eventEmitter.addListener(STATUS_UPDATE_EVENT_TYPE, event => {
        const payload = event as StatusUpdateEvent | undefined;
        if (!payload) return;
        const { statusLevel, statusCode, statusMsg } = payload;
        onStatusUpdate(statusLevel, statusCode, statusMsg);
      });
    }
  };

  /**
   * Clears up the Api instance. This should be done once the Api is no longer required to prevent memory leaks.
   * @returns Promise that resolves once the Api has been cleared.
   */
  clearInstance = (): Promise<void> => {
    clearTimeout(this.fetchTokenTimeoutId);

    const eventEmitter = this.createEventEmitter();

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
  setAbnormalTerminationReportingEnabled = (
    isEnabled: boolean
  ): Promise<void> => {
    return this.nativeModule.setAbnormalTerminationReporting(
      isEnabled
    ) as Promise<void>;
  };

  /**
   * Returns a promise that resolves to the version associated to the native SDK.
   */
  getDriverSdkVersion = (): Promise<string> => {
    return this.nativeModule.getDriverSdkVersion();
  };

  protected setLocationTrackingEnabled = async (
    isEnabled: boolean
  ): Promise<void> => {
    this.isLocationTrackingEnabled = isEnabled;

    if (isEnabled) {
      await this.fetchAndSetToken();
    } else {
      clearTimeout(this.fetchTokenTimeoutId);
    }

    await this.nativeModule.setLocationTrackingEnabled(isEnabled);
  };

  protected pollAuthToken = (): void => {
    this.fetchTokenTimeoutId = setTimeout(async () => {
      await this.fetchAndSetToken();

      if (this.isLocationTrackingEnabled) {
        this.pollAuthToken();
      }
    }, TOKEN_UPDATE_INTERVAL_SECONDS);
  };

  protected setVehicleReporterListener = (
    listener: VehicleReporterListener
  ): void => {
    const eventEmitter = this.createEventEmitter();

    eventEmitter.removeAllListeners(VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE);
    eventEmitter.removeAllListeners(VEHICLE_REPORTER_FAILED_UPDATE_TYPE);

    eventEmitter.addListener(VEHICLE_REPORTER_SUCCEED_UPDATE_TYPE, event => {
      const payload = event as VehicleReporterSuccessEvent | undefined;
      if (payload && listener.onVehicleUpdateSucceed) {
        listener.onVehicleUpdateSucceed(payload.vehicleUpdate);
      }
    });

    eventEmitter.addListener(VEHICLE_REPORTER_FAILED_UPDATE_TYPE, event => {
      const payload = event as VehicleReporterFailureEvent | undefined;
      if (payload && listener.onVehicleUpdateFailed) {
        listener.onVehicleUpdateFailed(payload.vehicleUpdate, payload.error);
      }
    });
  };

  protected fetchAndSetToken = async (): Promise<void> => {
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
