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

import { VehicleState } from '../../shared/types';
import RidesharingDriverApi from '../ridesharingDriverApi';

const ridesharing = new RidesharingDriverApi();

describe('ODRD', () => {
  test('createRidesharingInstance', () => {
    expect(
      ridesharing.initialize(
        'mobility-partner-lmfs',
        'vehicleId',
        123,
        () => Promise.resolve(''),
        () => {}
      )
    ).toHaveBeenCalled();
  });

  test('setLocationTrackingEnabled', () => {
    expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setLocationTrackingEnabled(true)
    ).toBe(true);
  });

  test('setVehicleState', () => {
    expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setVehicleState(VehicleState.ONLINE)
    ).toBe(true);
  });

  test('setLocationReportingInterval', () => {
    expect(
      ridesharing
        .getRidesharingVehicleReporter()
        .setLocationReportingInterval(20)
    ).toHaveBeenCalled();
  });

  test('clearInstance', () => {
    expect(ridesharing.clearInstance()).toHaveBeenCalled();
  });

  test('setAbnormalTerminationReporting', () => {
    expect(ridesharing.setAbnormalTerminationReportingEnabled(true)).toBe(true);
  });

  it('async/await', async () => {
    expect.assertions(1);
    const datagetRidesharingDriverSDKVersion =
      await ridesharing.getDriverSdkVersion();
    expect(datagetRidesharingDriverSDKVersion).toBe('3.1.1');
  });
});
