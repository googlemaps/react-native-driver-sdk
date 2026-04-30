/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  const mockDeliveryDriverModule = {
    createDeliveryDriverInstance: jest.fn().mockResolvedValue(true),
    clearInstance: jest.fn().mockResolvedValue(true),
    setLocationTrackingEnabled: jest.fn().mockResolvedValue(true),
    setLocationReportingInterval: jest.fn().mockResolvedValue(undefined),
    getDeliveryVehicle: jest.fn().mockResolvedValue({
      name: 'test-vehicle',
      navigationStatus: 'NO_GUIDANCE',
      remainingDistanceMeters: 0,
      remainingDuration: '0s',
      remainingVehicleJourneySegments: [],
    }),
    getDriverSdkVersion: jest.fn().mockResolvedValue('1.0.0'),
    resolveAuthToken: jest.fn(),
    rejectAuthToken: jest.fn(),
    setAbnormalTerminationReporting: jest.fn(),
    onGetToken: jest.fn(() => ({ remove: jest.fn() })),
    onStatusUpdate: jest.fn(() => ({ remove: jest.fn() })),
    onVehicleUpdateSucceed: jest.fn(() => ({ remove: jest.fn() })),
    onVehicleUpdateFailed: jest.fn(() => ({ remove: jest.fn() })),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  const mockRidesharingModule = {
    createRidesharingInstance: jest.fn().mockResolvedValue(true),
    clearInstance: jest.fn().mockResolvedValue(true),
    setLocationTrackingEnabled: jest.fn().mockResolvedValue(true),
    setLocationReportingInterval: jest.fn().mockResolvedValue(undefined),
    setVehicleState: jest.fn().mockResolvedValue(true),
    getDriverSdkVersion: jest.fn().mockResolvedValue('1.0.0'),
    resolveAuthToken: jest.fn(),
    rejectAuthToken: jest.fn(),
    setAbnormalTerminationReporting: jest.fn(),
    onGetToken: jest.fn(() => ({ remove: jest.fn() })),
    onStatusUpdate: jest.fn(() => ({ remove: jest.fn() })),
    onVehicleUpdateSucceed: jest.fn(() => ({ remove: jest.fn() })),
    onVehicleUpdateFailed: jest.fn(() => ({ remove: jest.fn() })),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  RN.TurboModuleRegistry.getEnforcing = jest.fn(name => {
    if (name === 'DeliveryDriverModule') return mockDeliveryDriverModule;
    if (name === 'RidesharingModule') return mockRidesharingModule;
    return null;
  });

  return RN;
});
