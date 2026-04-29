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
import type { EventSubscription } from 'react-native';
import {
  DriverStatusCode,
  DriverStatusLevel,
  type AuthTokenContext,
  type OnGetTokenCallback,
  type OnStatusUpdateCallback,
  type VehicleUpdate,
  type VehicleUpdateError,
} from './types';

/** A callable that subscribes to an event and returns a removable subscription. */
type EventEmitterFn<T> = (handler: (event: T) => void) => EventSubscription;

/**
 * Interface for the native TurboModule used by DriverApi.
 * Both DeliveryDriverModule and RidesharingModule extend this shape.
 * This keeps codegen spec types internal — event payloads are converted to
 * public types (VehicleUpdate, VehicleUpdateError, AuthTokenContext) at the boundary.
 */
export interface DriverNativeModule {
  clearInstance(): Promise<boolean>;
  setAbnormalTerminationReporting(isEnabled: boolean): void;
  getDriverSdkVersion(): Promise<string>;
  setLocationTrackingEnabled(isEnabled: boolean): Promise<boolean>;
  setLocationReportingInterval(intervalSeconds: number): Promise<void>;
  resolveAuthToken(requestId: string, token: string): void;
  rejectAuthToken(requestId: string, error: string): void;
  onGetToken: EventEmitterFn<
    Readonly<{ requestId: string; vehicleId: string; taskId: string }>
  >;
  onStatusUpdate: EventEmitterFn<
    Readonly<{ statusLevel: string; statusCode: string; statusMsg: string }>
  >;
  onVehicleUpdateSucceed: EventEmitterFn<
    Readonly<{ vehicleUpdate: VehicleUpdate }>
  >;
  onVehicleUpdateFailed: EventEmitterFn<
    Readonly<{ vehicleUpdate: VehicleUpdate; error: VehicleUpdateError }>
  >;
}

export abstract class DriverApi<
  T extends DriverNativeModule = DriverNativeModule,
> {
  nativeModule: T;
  onGetTokenCallback?: OnGetTokenCallback;
  vehicleId?: string;

  private subscriptions: EventSubscription[] = [];

  constructor(nativeModule: T) {
    this.nativeModule = nativeModule;
  }

  /**
   * Creates an Api instance. This can be used to retrieve a vehicle reporter that allows enabling location reporting to FleetEngine.
   * @param providerId - Unique identifier for the server provider.
   * @param vehicleId - Unique identifier for this vehicle for this provider.
   * @param onGetToken - Callback invoked by the native SDK whenever a fresh auth token is needed. This is called on every location update cycle.
   * @param onStatusUpdate - Optional callback for status updates from Fleet Engine. **Android only** — on iOS, use `setOnVehicleUpdateSucceed` / `setOnVehicleUpdateFailed` on the vehicle reporter instead.
   * @returns Promise that resolves once the Api instance has been created.
   * @throws This rejects the promise in case there's an Api instance already created.
   */
  abstract initialize(
    providerId: string,
    vehicleId: string,
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): Promise<void>;

  protected initializeEventListeners = (
    onGetToken: OnGetTokenCallback,
    onStatusUpdate?: OnStatusUpdateCallback
  ): void => {
    // Clear any previous subscriptions to avoid duplicates on re-initialize
    this.removeAllSubscriptions();

    // Subscribe to native token requests — this is the core auth token bridge.
    // When the native Driver SDK needs a token (e.g. on each location update),
    // it emits onGetToken. We call the user's callback and resolve/reject back to native.
    this.addSubscription(
      this.nativeModule.onGetToken(event => {
        onGetToken({
          vehicleId: event.vehicleId ?? undefined,
          taskId: event.taskId ?? undefined,
        } satisfies AuthTokenContext)
          .then(token => {
            this.nativeModule.resolveAuthToken(event.requestId, token);
          })
          .catch(error => {
            this.nativeModule.rejectAuthToken(
              event.requestId,
              error?.message ?? String(error)
            );
          });
      })
    );

    if (onStatusUpdate) {
      this.addSubscription(
        this.nativeModule.onStatusUpdate(event => {
          onStatusUpdate(
            (event.statusLevel as DriverStatusLevel) ?? DriverStatusLevel.INFO,
            (event.statusCode as DriverStatusCode) ?? DriverStatusCode.DEFAULT,
            event.statusMsg
          );
        })
      );
    }
  };

  private addSubscription(subscription: EventSubscription): void {
    this.subscriptions.push(subscription);
  }

  private removeAllSubscriptions(): void {
    for (const sub of this.subscriptions) {
      sub.remove();
    }
    this.subscriptions = [];
  }

  /**
   * Clears up the Api instance. This should be done once the Api is no longer required to prevent memory leaks.
   * @returns Promise that resolves once the Api has been cleared.
   */
  clearInstance = async (): Promise<void> => {
    await this.nativeModule.clearInstance();
    this.removeAllSubscriptions();
  };

  /**
   * Enables/disables reporting abnormal SDK terminations such as the app crashes while the SDK is still running.
   *
   * @param enabled - whether abnormal SDK terminations should be reported.
   */
  setAbnormalTerminationReportingEnabled = (isEnabled: boolean): void => {
    this.nativeModule.setAbnormalTerminationReporting(isEnabled);
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
    await this.nativeModule.setLocationTrackingEnabled(isEnabled);
  };

  protected setOnVehicleUpdateSucceed = (
    callback: (vehicleUpdate: VehicleUpdate) => void
  ): void => {
    this.addSubscription(
      this.nativeModule.onVehicleUpdateSucceed(event => {
        callback(event.vehicleUpdate);
      })
    );
  };

  protected setOnVehicleUpdateFailed = (
    callback: (vehicleUpdate: VehicleUpdate, error: VehicleUpdateError) => void
  ): void => {
    this.addSubscription(
      this.nativeModule.onVehicleUpdateFailed(event => {
        callback(event.vehicleUpdate, event.error);
      })
    );
  };
}
