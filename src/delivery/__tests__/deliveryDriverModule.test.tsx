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
  test('initialize', async () => {
    await expect(
      deliveryDriver.initialize(
        'mobility-partner-lmfs',
        'vehicle_3_1689729828602',
        () => Promise.resolve(''),
        () => {}
      )
    ).resolves.toBeUndefined();
  });

  test('setLocationTrackingEnabled', async () => {
    await expect(
      deliveryDriver
        .getDeliveryVehicleReporter()
        .setLocationTrackingEnabled(true)
    ).resolves.toBeUndefined();
  });

  test('setLocationReportingInterval', async () => {
    await expect(
      deliveryDriver
        .getDeliveryVehicleReporter()
        .setLocationReportingInterval(20)
    ).resolves.toBeUndefined();
  });

  test('clearInstance', async () => {
    await expect(deliveryDriver.clearInstance()).resolves.toBeUndefined();
  });

  test('setAbnormalTerminationReporting', () => {
    expect(() =>
      deliveryDriver.setAbnormalTerminationReportingEnabled(true)
    ).not.toThrow();
  });

  it('async/await', async () => {
    expect.assertions(1);
    const version = await deliveryDriver.getDriverSdkVersion();
    expect(version).toBe('1.0.0');
  });
});
