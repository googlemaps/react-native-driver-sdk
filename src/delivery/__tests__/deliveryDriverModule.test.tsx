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

import { DeliveryDriverApi } from '../deliveryDriverApi';

const deliveryDriver = new DeliveryDriverApi();

describe('LMFS', () => {
  test('initialize', () => {
    expect(
      deliveryDriver.initialize(
        'mobility-partner-lmfs',
        'vehicle_3_1689729828602',
        () => Promise.resolve(''),
        () => {}
      )
    ).toHaveBeenCalled();
  });

  test('setLocationTrackingEnabled', () => {
    expect(
      deliveryDriver
        .getDeliveryVehicleReporter()
        .setLocationTrackingEnabled(true)
    ).toBe(true);
  });

  test('setLocationReportingInterval', () => {
    expect(
      deliveryDriver
        .getDeliveryVehicleReporter()
        .setLocationReportingInterval(20)
    ).toHaveBeenCalled();
  });

  test('clearInstance', () => {
    expect(deliveryDriver.clearInstance()).toHaveBeenCalled();
  });

  test('setAbnormalTerminationReporting', () => {
    expect(deliveryDriver.setAbnormalTerminationReportingEnabled(true)).toBe(
      true
    );
  });

  it('async/await', async () => {
    expect.assertions(1);
    const datagetRidesharingDriverSDKVersion =
      await deliveryDriver.getDriverSdkVersion();
    expect(datagetRidesharingDriverSDKVersion).toBe('3.1.1');
  });
});
