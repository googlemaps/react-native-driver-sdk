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

import static java.util.Objects.requireNonNull;

import android.app.Application;
import android.util.Log;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext.DriverStatusListener.StatusCode;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext.DriverStatusListener.StatusLevel;
import com.google.android.libraries.mapsplatform.transportation.driver.api.delivery.DeliveryDriverApi;
import com.google.android.libraries.mapsplatform.transportation.driver.api.delivery.data.DeliveryVehicle;
import com.google.android.libraries.mapsplatform.transportation.driver.api.delivery.vehiclereporter.DeliveryVehicleReporter;
import com.google.android.libraries.navigation.NavigationApi;
import com.google.android.libraries.navigation.Navigator;
import com.google.android.react.driversdk.shared.DriverAuthTokenFactory;
import com.google.android.react.driversdk.shared.JsErrors;
import com.google.android.react.navsdk.NavModule;
import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.concurrent.TimeUnit;

public class DeliveryDriverModule extends ReactContextBaseJavaModule {

  public static final String TAG = "DeliveryDriverAPI";

  private DeliveryVehicleReporter vehicleReporter = null;
  private DriverAuthTokenFactory tokenFactory = new DriverAuthTokenFactory();

  ReactApplicationContext reactContext;
  private int listenerCount = 0;

  public DeliveryDriverModule(ReactApplicationContext context) {
    super(context);
    this.reactContext = context;
  }

  @Override
  public String getName() {
    return "DeliveryDriverModule";
  }

  /** Creates an instance of the DeliveryDriverApi */
  @ReactMethod
  public void createDeliveryDriverInstance(String providerId, String vehicleId, Promise promise)
      throws InterruptedException {
    if (DeliveryDriverApi.getInstance() != null) {
      promise.reject(
          JsErrors.DRIVER_API_ALREADY_EXISTS_CODE, JsErrors.DRIVER_API_ALREADY_EXISTS_MESSAGE);
      return;
    }

    UiThreadUtil.runOnUiThread(
        () -> {
          Navigator navigator = NavModule.getInstance().getNavigator();

          if (navigator == null) {
            promise.reject(JsErrors.NO_NAVIGATOR_CODE, JsErrors.NO_NAVIGATOR_MESSAGE);
            return;
          }

          Application application = getCurrentActivity().getApplication();
          DriverContext driverContext =
              DriverContext.builder(application)
                  .setNavigator(requireNonNull(navigator))
                  .setProviderId(providerId)
                  .setVehicleId(vehicleId)
                  .setAuthTokenFactory(tokenFactory)
                  .setRoadSnappedLocationProvider(
                      NavigationApi.getRoadSnappedLocationProvider(application))
                  .setDriverStatusListener(
                      (statusLevel, statusCode, statusMsg, error) -> {
                        updateStatus(statusLevel, statusCode, statusMsg);
                      })
                  .build();

          vehicleReporter =
              DeliveryDriverApi.createInstance(driverContext).getDeliveryVehicleReporter();

          promise.resolve(true);
        });
  }

  /** Enables fleet engine to track the vehicle if parameter is true, else it disables tracking */
  @ReactMethod
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

  /**
   * Sets the interval in seconds for the location updates
   *
   * @param interval number in seconds
   */
  @ReactMethod
  public void setLocationReportingInterval(int interval, Promise promise) {
    try {
      if (vehicleReporter == null) {
        promise.reject(
            JsErrors.DRIVER_API_NOT_INITIALIZED_CODE, JsErrors.DRIVER_API_NOT_INITIALIZED_MESSAGE);
        return;
      }

      vehicleReporter.setLocationReportingInterval(Long.valueOf(interval), TimeUnit.SECONDS);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /** Gets the current sdk version used */
  @ReactMethod
  public void getDriverSdkVersion(Promise promise) {
    try {
      String version = DeliveryDriverApi.getDriverSdkVersion();
      promise.resolve(version);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /** Clears the instance of the DeliveryDriverApi */
  @ReactMethod
  public void clearInstance(Promise promise) {
    try {
      vehicleReporter = null;
      DeliveryDriverApi.clearInstance();

      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e.toString(), e.getMessage(), e);
    }
  }

  /**
   * This method return DeliveryVehicle object and this is where you can access the destination
   * waypoints, remaining vehicle stops, vehicle name, etc.
   *
   * @param promise
   */
  @ReactMethod
  public void getDeliveryVehicle(Promise promise) {
    DeliveryDriverApi apiInstance = DeliveryDriverApi.getInstance();

    if (apiInstance == null || apiInstance.getDeliveryVehicleManager() == null) {
      promise.reject(
          JsErrors.DRIVER_API_NOT_INITIALIZED_CODE, JsErrors.DRIVER_API_NOT_INITIALIZED_MESSAGE);
      return;
    }

    ListenableFuture<DeliveryVehicle> future = apiInstance.getDeliveryVehicleManager().getVehicle();

    Futures.addCallback(
        future,
        new FutureCallback<DeliveryVehicle>() {
          public void onSuccess(DeliveryVehicle deliveryVehicle) {
            promise.resolve(ObjectTranslationUtil.getMapFromDeliveryVehicle(deliveryVehicle));
          }

          public void onFailure(@NonNull Throwable thrown) {
            promise.reject(
                JsErrors.GET_DELIVERY_VEHICLE_ERROR_CODE,
                JsErrors.GET_DELIVERY_VEHICLE_ERROR_MESSAGE,
                thrown);
          }
        },
        // causes the callbacks to be executed on the main (UI) thread
        reactContext.getMainExecutor());
  }

  /** Enables/disables abnormal termination reporting */
  @ReactMethod
  public void setAbnormalTerminationReporting(boolean isEnabled) {
    DeliveryDriverApi.setAbnormalTerminationReportingEnabled(isEnabled);
  }

  private void showToast(String errorMessage) {
    Log.d(TAG, "showToast: " + errorMessage);
  }

  /**
   * The function that accepts update codes from the driverContext listener
   *
   * @param statusLevel
   * @param statusCode
   * @param statusMsg
   */
  public void updateStatus(StatusLevel statusLevel, StatusCode statusCode, String statusMsg) {
    if (reactContext != null) {
      WritableMap map = Arguments.createMap();
      map.putString("statusLevel", statusLevel.toString());
      map.putString("statusCode", statusCode.toString());
      map.putString("statusMsg", statusMsg);

      this.reactContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("updateStatus", map);
    }
  }

  /**
   * Create an AuthTokenFactory to be used by DriverContext when creating a RideSharingInstance.
   *
   * @param token jwt token from an authentication service
   * @param promise
   */
  @ReactMethod
  public void setAuthToken(String token, String vehicleId, Promise promise) {
    try {
      tokenFactory.setToken(token);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e.getMessage());
    }
  }
}
