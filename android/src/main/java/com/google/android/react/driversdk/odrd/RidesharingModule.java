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
package com.google.android.react.driversdk.odrd;

import static java.util.Objects.requireNonNull;

import android.app.Application;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext.DriverStatusListener.StatusCode;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext.DriverStatusListener.StatusLevel;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.RidesharingDriverApi;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.vehiclereporter.RidesharingVehicleReporter;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.vehiclereporter.RidesharingVehicleReporter.VehicleState;
import com.google.android.libraries.navigation.NavigationApi;
import com.google.android.libraries.navigation.Navigator;
import com.google.android.react.driversdk.NativeRidesharingModuleSpec;
import com.google.android.react.driversdk.shared.DriverAuthTokenFactory;
import com.google.android.react.driversdk.shared.JsErrors;
import com.google.android.react.navsdk.NavModule;
import java.util.concurrent.TimeUnit;

public class RidesharingModule extends NativeRidesharingModuleSpec {

  public static final String TAG = "RidesharingAPI";
  public static final String REACT_CLASS = NAME;

  private Navigator mNavigator = null;
  private RidesharingVehicleReporter vehicleReporter = null;
  private DriverContext driverContext = null;

  private final DriverAuthTokenFactory tokenFactory = new DriverAuthTokenFactory();

  ReactApplicationContext reactContext;

  public RidesharingModule(ReactApplicationContext context) {
    super(context);
    this.reactContext = context;

    // Wire up the token factory to emit events to JS when a token is needed.
    tokenFactory.setTokenRequestCallback(
        (requestId, vehicleId, taskId) -> {
          UiThreadUtil.runOnUiThread(
              () -> {
                WritableMap map = Arguments.createMap();
                map.putString("requestId", requestId);
                map.putString("vehicleId", vehicleId);
                map.putString("taskId", taskId);
                emitOnGetToken(map);
              });
        });
  }

  @Override
  public String getName() {
    return NAME;
  }

  /** Creates an instance of the RidesharingDriverAPI */
  @Override
  public void createRidesharingInstance(String providerId, String vehicleId, Promise promise) {
    if (RidesharingDriverApi.getInstance() != null) {
      promise.reject(
          JsErrors.DRIVER_API_ALREADY_EXISTS_CODE, JsErrors.DRIVER_API_ALREADY_EXISTS_MESSAGE);
      return;
    }

    UiThreadUtil.runOnUiThread(
        () -> {
          mNavigator = NavModule.getInstance().getNavigator();

          if (mNavigator == null) {
            promise.reject(JsErrors.NO_NAVIGATOR_CODE, JsErrors.NO_NAVIGATOR_MESSAGE);
            return;
          }

          try {
            Application application = getCurrentActivity().getApplication();
            driverContext =
                DriverContext.builder(application)
                    .setNavigator(requireNonNull(mNavigator))
                    .setProviderId(providerId)
                    .setVehicleId(vehicleId)
                    .setAuthTokenFactory(tokenFactory)
                    .setRoadSnappedLocationProvider(
                        NavigationApi.getRoadSnappedLocationProvider(application))
                    .setDriverStatusListener(
                        (statusLevel, statusCode, statusMsg, error) -> {
                          emitStatusUpdate(statusLevel, statusCode, statusMsg);
                        })
                    .build();

            vehicleReporter =
                RidesharingDriverApi.createInstance(driverContext).getRidesharingVehicleReporter();
            promise.resolve(true);
          } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage(), e);
          }
        });
  }

  /** Enables fleet engine to track the vehicle if parameter is true, else it disables tracking */
  @Override
  public void setLocationTrackingEnabled(boolean isTrackingEnabled, Promise promise) {
    try {
      if (vehicleReporter == null) {
        promise.reject(
            JsErrors.DRIVER_API_NOT_INITIALIZED_CODE, JsErrors.DRIVER_API_NOT_INITIALIZED_MESSAGE);
        return;
      }

      if (isTrackingEnabled) {
        vehicleReporter.enableLocationTracking();
      } else {
        vehicleReporter.disableLocationTracking();
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /** Sets vehicle to online if parameter sent is true, else vehicle is set to offline. */
  @Override
  public void setVehicleState(boolean isVehicleOnline, Promise promise) {
    try {
      if (vehicleReporter == null) {
        promise.reject(
            JsErrors.DRIVER_API_NOT_INITIALIZED_CODE, JsErrors.DRIVER_API_NOT_INITIALIZED_MESSAGE);
        return;
      }
      if (isVehicleOnline) {
        vehicleReporter.setVehicleState(VehicleState.ONLINE);
      } else {
        vehicleReporter.setVehicleState(VehicleState.OFFLINE);
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /**
   * Sets the interval in seconds for the location updates
   *
   * @param intervalSeconds number in seconds
   */
  @Override
  public void setLocationReportingInterval(double intervalSeconds, Promise promise) {
    try {
      if (vehicleReporter == null) {
        promise.reject(
            JsErrors.DRIVER_API_NOT_INITIALIZED_CODE, JsErrors.DRIVER_API_NOT_INITIALIZED_MESSAGE);
        return;
      }

      vehicleReporter.setLocationReportingInterval((long) intervalSeconds, TimeUnit.SECONDS);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /** Gets the current sdk version used */
  @Override
  public void getDriverSdkVersion(Promise promise) {
    try {
      String version = RidesharingDriverApi.getDriverSdkVersion();
      promise.resolve(version);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /** Clears the instance of the RideSharingAPI */
  @Override
  public void clearInstance(Promise promise) {
    UiThreadUtil.runOnUiThread(
        () -> {
          try {
            RidesharingDriverApi.clearInstance();
            vehicleReporter = null;

            promise.resolve(true);
          } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage(), e);
          }
        });
  }

  /** Enables/disables abnormal termination reporting */
  @Override
  public void setAbnormalTerminationReporting(boolean isEnabled) {
    RidesharingDriverApi.setAbnormalTerminationReportingEnabled(isEnabled);
  }

  /** Called from JS to resolve a pending auth token request. */
  @Override
  public void resolveAuthToken(String requestId, String token) {
    tokenFactory.resolveToken(requestId, token);
  }

  /** Called from JS to reject a pending auth token request. */
  @Override
  public void rejectAuthToken(String requestId, String error) {
    tokenFactory.rejectToken(requestId, error);
  }

  private void emitStatusUpdate(StatusLevel statusLevel, StatusCode statusCode, String statusMsg) {
    if (reactContext != null) {
      WritableMap map = Arguments.createMap();
      map.putString("statusLevel", statusLevel.toString());
      map.putString("statusCode", statusCode.toString());
      map.putString("statusMsg", statusMsg);
      emitOnStatusUpdate(map);
    }
  }
}
