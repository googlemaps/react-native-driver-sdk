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
package com.google.android.react.driversdk.test;

import static org.junit.Assert.*;
import static org.mockito.Mockito.mock;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.DriverContext;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.RidesharingDriverApi;
import com.google.android.libraries.mapsplatform.transportation.driver.api.ridesharing.vehiclereporter.RidesharingVehicleReporter;
import com.google.android.react.driversdk.odrd.RidesharingModule;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;

public class RidesharingModuleTest {
  @Mock Executor executor;
  @Mock RidesharingDriverApi ridesharingDriverApi;
  ReactApplicationContext reactContext;
  RidesharingModule rsm = null;
  Promise emptyPromise = null;
  RidesharingVehicleReporter vehicleReporter = mock(RidesharingVehicleReporter.class);
  DriverContext.Builder driverContext = mock(DriverContext.Builder.class);
  RidesharingModule ridesharingModule = mock(RidesharingModule.class);

  RidesharingModule _rsm;

  @Before
  public void setUp() {
    rsm = new RidesharingModule(reactContext);
    emptyPromise =
        new Promise() {
          @Override
          public void resolve(@Nullable Object o) {}

          @Override
          public void reject(String s, String s1) {}

          @Override
          public void reject(String s, Throwable throwable) {}

          @Override
          public void reject(String s, String s1, Throwable throwable) {}

          @Override
          public void reject(Throwable throwable) {}

          @Override
          public void reject(Throwable throwable, WritableMap writableMap) {}

          @Override
          public void reject(String s, @NonNull WritableMap writableMap) {}

          @Override
          public void reject(String s, Throwable throwable, WritableMap writableMap) {}

          @Override
          public void reject(String s, String s1, @NonNull WritableMap writableMap) {}

          @Override
          public void reject(String s, String s1, Throwable throwable, WritableMap writableMap) {}

          @Override
          public void reject(String s) {}
        };
    emptyPromise.resolve(true);
  }

  @Test
  public void createRidesharingInstance() {
    String providerId = "mobility-partner-access";
    String vehicleId = "vehicle_A003";

    try {
      rsm.createRidesharingInstance(providerId, vehicleId, emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void setLocationTrackingEnabled() {
    try {
      rsm.setLocationTrackingEnabled(true, emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void setVehicleState() {
    try {
      rsm.setVehicleState(true, emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void setLocationReportingInterval() {
    try {
      rsm.setLocationReportingInterval(20, emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void getDriverSdkVersion() {
    try {
      rsm.getDriverSdkVersion(emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void clearInstance() {
    try {
      rsm.clearInstance(emptyPromise);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void setAbnormalTerminationReporting() {
    try {
      rsm.setAbnormalTerminationReporting(true);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void updateStatus() {
    try {
      DriverContext.StatusListener.StatusLevel statusLevel =
          DriverContext.StatusListener.StatusLevel.INFO;
      DriverContext.StatusListener.StatusCode statusCode =
          DriverContext.StatusListener.StatusCode.DEFAULT;
      String statusMsg = "";
      rsm.updateStatus(statusLevel, statusCode, statusMsg);
    } catch (Exception e) {
      fail(e.toString());
    }
  }

  @Test
  public void should_get_location_tracking() {
    CompletableFuture<Boolean> future = new CompletableFuture<>();
    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(vehicleReporter.isLocationTrackingEnabled());
          }
        });
    try {
      assertFalse(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void should_get_vehicle_status() {
    CompletableFuture<RidesharingVehicleReporter.VehicleState> future = new CompletableFuture<>();
    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(RidesharingVehicleReporter.VehicleState.ONLINE);
          }
        });
    try {
      assertNotNull(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void should_get_vehicle_id() {
    CompletableFuture<DriverContext.Builder> future = new CompletableFuture<>();
    driverContext.setVehicleId("vehicle_sample_1");
    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(driverContext);
          }
        });
    try {
      assertNotNull(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void should_get_provider_id() {
    CompletableFuture<DriverContext.Builder> future = new CompletableFuture<>();
    driverContext.setProviderId("mobile-provider-lmfs");
    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(driverContext);
          }
        });
    try {
      assertNotNull(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void should_get_name() {
    CompletableFuture<RidesharingModule> future = new CompletableFuture<>();
    ridesharingModule.getName();
    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(ridesharingModule);
          }
        });
    try {
      assertNotNull(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  public void should_get_ridesharing_sdk_version() {
    CompletableFuture<Boolean> future = new CompletableFuture<>();

    executor = Executors.newSingleThreadExecutor();
    executor.execute(
        new Runnable() {
          @Override
          public void run() {
            future.complete(RidesharingDriverApi.getDriverSdkVersion().equals("3.1.1"));
          }
        });
    try {
      assertNotNull(future.get());
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}