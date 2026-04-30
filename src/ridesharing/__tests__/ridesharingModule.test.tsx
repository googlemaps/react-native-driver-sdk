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

import { VehicleState } from '../../shared/types';
import { RidesharingDriverApi } from '../ridesharingDriverApi';

const ridesharing = new RidesharingDriverApi();

describe('ODRD', () => {
  test('createRidesharingInstance', async () => {
    await expect(
      ridesharing.initialize(
        'mobility-partner-lmfs',
        'vehicleId',
        () => Promise.resolve(''),
        () => {}
      )
    ).resolves.toBeUndefined();
  });

  test('setLocationTrackingEnabled', async () => {
    await expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setLocationTrackingEnabled(true)
    ).resolves.toBeUndefined();
  });

  test('setVehicleState', async () => {
    await expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setVehicleState(VehicleState.ONLINE)
    ).resolves.toBeUndefined();
  });

  test('setLocationReportingInterval', async () => {
    await expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setLocationReportingInterval(20)
    ).resolves.toBeUndefined();
  });

  test('clearInstance', async () => {
    await expect(ridesharing.clearInstance()).resolves.toBeUndefined();
  });

  test('setAbnormalTerminationReporting', () => {
    expect(() =>
      ridesharing.setAbnormalTerminationReportingEnabled(true)
    ).not.toThrow();
  });

  it('async/await', async () => {
    expect.assertions(1);
    const version = await ridesharing.getDriverSdkVersion();
    expect(version).toBe('1.0.0');
  });
});
