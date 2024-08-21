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
import android.util.Log;

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
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.RidesharingDriverApi;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.vehiclereporter.RidesharingVehicleReporter;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.vehiclereporter.RidesharingVehicleReporter.VehicleState;
import com.google.android.libraries.navigation.NavigationApi;
import com.google.android.libraries.navigation.Navigator;
import com.google.android.react.driversdk.shared.DriverAuthTokenFactory;
import com.google.android.react.driversdk.shared.JsErrors;
import com.google.android.react.navsdk.NavModule;

import java.util.concurrent.TimeUnit;

public class RidesharingModule extends ReactContextBaseJavaModule {

    public static final String TAG = "RidesharingAPI";
    private static final String UPDATE_STATUS_EVENT_NAME = "updateStatus";

    private Navigator mNavigator = null;
    private RidesharingVehicleReporter vehicleReporter = null;
    private DriverContext driverContext = null;

    private DriverAuthTokenFactory tokenFactory = new DriverAuthTokenFactory();

    ReactApplicationContext reactContext;
    private int listenerCount = 0;

    public RidesharingModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "RidesharingModule";
    }

    /**
     * Creates an instance of the RidesharingDriverAPI
     */
    @ReactMethod
    public void createRidesharingInstance(String providerId, String vehicleId, Promise promise)
            throws InterruptedException {
        if (RidesharingDriverApi.getInstance() != null) {
            promise.reject(
                    JsErrors.DRIVER_API_ALREADY_EXISTS_CODE, JsErrors.DRIVER_API_ALREADY_EXISTS_MESSAGE);
            return;
        }

        UiThreadUtil.runOnUiThread(
                () -> {

                    mNavigator = NavModule.getInstance().getNavigator();

                    if (mNavigator == null) {
                        promise.reject(
                                JsErrors.NO_NAVIGATOR_CODE,
                                JsErrors.NO_NAVIGATOR_MESSAGE);
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
                                                    updateStatus(statusLevel, statusCode, statusMsg);
                                                })
                                        .build();

                        vehicleReporter =
                                RidesharingDriverApi.createInstance(driverContext)
                                        .getRidesharingVehicleReporter();
                        promise.resolve(true);
                    } catch (Exception e) {
                        promise.reject(e.toString(), e.getMessage(), e);
                    }

                });
    }

    /**
     * Enables fleet engine to track the vehicle if parameter is true, else it disables tracking
     */
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
     * Sets vehicle to online if parameter sent is true, else vehicle is set to offline.
     */
    @ReactMethod
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

            vehicleReporter.setLocationReportingInterval(new Long(interval), TimeUnit.SECONDS);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage(), e);
        }
    }

    /**
     * Gets the current sdk version used
     */
    @ReactMethod
    public void getDriverSdkVersion(Promise promise) {
        try {
            String version = RidesharingDriverApi.getDriverSdkVersion();
            promise.resolve(version);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage(), e);
        }
    }

    /**
     * Clears the instance of the RideSharingAPI
     */
    @ReactMethod
    public void clearInstance(Promise promise) {
        try {
            RidesharingDriverApi.clearInstance();
            vehicleReporter = null;

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject(e.toString(), e.getMessage(), e);
        }
    }

    /**
     * Enables/disables abnormal termination reporting
     */
    @ReactMethod
    public void setAbnormalTerminationReporting(boolean isEnabled) {
        RidesharingDriverApi.setAbnormalTerminationReportingEnabled(isEnabled);
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
                    .emit(UPDATE_STATUS_EVENT_NAME, map);
        }
    }

    /**
     * Adds listeners for the status updates given by fleet engine
     *
     * @param eventName
     */
    @ReactMethod
    public void addListener(String eventName) {
        if (listenerCount == 0) {
            // Set up any upstream listeners or background tasks as necessary
        }

        listenerCount += 1;
    }

    /**
     * Removes all status update listeners
     */
    @ReactMethod
    public void removeListeners(Integer count) {
        listenerCount -= count;
        if (listenerCount == 0) {
            // Remove upstream listeners, stop unnecessary background tasks
        }
    }

    /**
     * Create an AuthTokenFactory to be used by DriverContext when creating a RideSharingInstance.
     *
     * @param token   jwt token from an authentication service
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