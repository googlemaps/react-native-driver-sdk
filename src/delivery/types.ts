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

import { type Waypoint } from 'react-native-navigation-sdk';
export enum VehicleStopState {
  UNSPECIFIED = 0,
  NEW = 1,
  ENROUTE = 2,
  ARRIVED = 3,
}

export interface TaskInfo {
  taskId: string;
  taskDurationSeconds: number;
}

export interface VehicleStop {
  waypoint: Waypoint;
  vehicleStopState: VehicleStopState;
  taskInfoList: TaskInfo[];
}

export interface DeliveryVehicle {
  providerId: string;
  vehicleName: string;
  vehicleId: string;
  vehicleStops: VehicleStop[];
}
