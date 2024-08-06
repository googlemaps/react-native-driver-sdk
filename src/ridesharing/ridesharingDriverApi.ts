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
import { NativeModules, Platform } from 'react-native';
const { RideSharingModule, RidesharingModule } = NativeModules;
import {
  type VehicleReporter,
  VehicleState,
  DriverApi,
  type OnGetTokenCallback,
  type OnStatusUpdateCallback,
} from '../shared';

/**
 * Vehicle reporter for ridesharing that reports location updates and vehicle online/offline state.
 * An app is allowed only one vehicle reporter.
 */
interface RidesharingVehicleReporter extends VehicleReporter {
  setVehicleState(state: VehicleState): Promise<void>;
}

/** Entry point into the DriverApi for the ridesharing vertical. */
export class RidesharingDriverApi extends DriverApi {
  constructor() {
    super(Platform.OS === 'ios' ? RideSharingModule : RidesharingModule);
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

    if (Platform.OS === 'ios') {
      await this.nativeModule.createRidesharingInstance(
        providerId,
        vehicleId,
        viewId
      );
    } else {
      await this.nativeModule.createRidesharingInstance(providerId, vehicleId);
    }

    await this.fetchAndSetToken();

    this.initializeEventEmitter(onGetToken, onStatusUpdate);
  }

  /**
   * Returns the {@link RidesharingVehicleReporter} associated to this instance.
   * You must initialize the Api prior to calling this method.
   */
  getRidesharingVehicleReporter = (): RidesharingVehicleReporter => {
    return {
      setVehicleState: async state => {
        await this.fetchAndSetToken();
        await this.nativeModule.setVehicleState(state === VehicleState.ONLINE);
      },
      setLocationTrackingEnabled: this.setLocationTrackingEnabled,
      setLocationReportingInterval: (intervalSeconds: number) =>
        this.nativeModule.setLocationReportingInterval(intervalSeconds),
      setListener: this.setVehicleReporterListener,
    };
  };
}
export default RidesharingDriverApi;
