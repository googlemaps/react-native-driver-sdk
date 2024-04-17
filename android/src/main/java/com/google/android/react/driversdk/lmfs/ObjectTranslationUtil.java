/**
 * Copyright 2023 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.android.react.driversdk.lmfs;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.TaskInfo;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.VehicleStop;
import com.google.android.libraries.mapsplatform.transportation.driver.api.delivery.data.DeliveryVehicle;
import com.google.android.libraries.navigation.Waypoint;
import java.util.List;

class ObjectTranslationUtil {
  public static WritableMap getMapFromDeliveryVehicle(DeliveryVehicle vehicle) {
    WritableMap map = Arguments.createMap();
    map.putString("providerId", vehicle.getProviderId());
    map.putString("vehicleName", vehicle.getVehicleName());
    map.putString("vehicleId", vehicle.getVehicleId());

    List<VehicleStop> vehicleStops = vehicle.getVehicleStops();
    WritableArray vehicleStopList = Arguments.createArray();

    for (VehicleStop vehicleStop : vehicleStops) {
      WritableMap vehicleStopMap = Arguments.createMap();

      // getWaypoint:
      WritableMap waypointMap = Arguments.createMap();
      Waypoint waypoint = vehicleStop.getWaypoint();

      waypointMap.putString("title", waypoint.getTitle());
      waypointMap.putString("placeId", waypoint.getPlaceId());
      WritableMap mapDestWaypointLatLng = Arguments.createMap();
      mapDestWaypointLatLng.putDouble("lat", waypoint.getPosition().latitude);
      mapDestWaypointLatLng.putDouble("lng", waypoint.getPosition().longitude);
      waypointMap.putMap("position", mapDestWaypointLatLng);
      waypointMap.putInt("preferredHeading", waypoint.getPreferredHeading());
      waypointMap.putBoolean("vehicleStopover", waypoint.getVehicleStopover());
      waypointMap.putBoolean("preferSameSideOfRoad", waypoint.getPreferSameSideOfRoad());
      vehicleStopMap.putMap("waypoint", waypointMap);

      // getTaskInfoList():
      WritableArray taskInfoList = Arguments.createArray();
      for (TaskInfo info : vehicleStop.getTaskInfoList()) {
        WritableMap taskInfo = Arguments.createMap();
        taskInfo.putString("taskId", info.getTaskId());
        taskInfo.putDouble("taskDurationSeconds", info.getTaskDurationSeconds());
        taskInfoList.pushMap(taskInfo);
      }
      vehicleStopMap.putArray("taskInfoList", taskInfoList);

      // getVehicleStopState:
      vehicleStopMap.putInt("vehicleStopState", vehicleStop.getVehicleStopState());

      vehicleStopList.pushMap(vehicleStopMap);
    }

    map.putArray("vehicleStops", vehicleStopList);

    return map;
  }
}