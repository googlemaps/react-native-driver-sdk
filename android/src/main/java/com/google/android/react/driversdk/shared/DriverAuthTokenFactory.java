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
package com.google.android.react.driversdk.shared;

import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.AuthTokenContext;
import com.google.android.libraries.mapsplatform.transportation.driver.api.base.data.AuthTokenContext.AuthTokenFactory;
import com.google.common.util.concurrent.SettableFuture;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Auth token factory that requests tokens from JS via the React Native bridge.
 *
 * <p>When the native Driver SDK needs a token (on each location update), this factory: 1. Generates
 * a unique requestId. 2. Emits an event to JS via the provided callback. 3. Blocks until JS
 * resolves or rejects the request.
 *
 * <p>This mirrors the pattern used in the Flutter Driver SDK's AccessTokenProvider.
 */
public class DriverAuthTokenFactory implements AuthTokenFactory {

  /** Callback interface for requesting tokens from JS. */
  public interface TokenRequestCallback {
    void onTokenRequested(String requestId, String vehicleId, String taskId);
  }

  private static final long TOKEN_TIMEOUT_SECONDS = 30;

  private final ConcurrentHashMap<String, SettableFuture<String>> pendingRequests =
      new ConcurrentHashMap<>();

  private TokenRequestCallback tokenRequestCallback;

  public void setTokenRequestCallback(TokenRequestCallback callback) {
    this.tokenRequestCallback = callback;
  }

  @Override
  public String getToken(AuthTokenContext context) {
    if (tokenRequestCallback == null) {
      throw new RuntimeException(
          "Token request callback not set. Ensure the module is initialized.");
    }

    String requestId = UUID.randomUUID().toString();
    SettableFuture<String> future = SettableFuture.create();
    pendingRequests.put(requestId, future);

    try {
      String vehicleId = context.getVehicleId() != null ? context.getVehicleId() : "";
      String taskId = context.getTaskId() != null ? context.getTaskId() : "";
      tokenRequestCallback.onTokenRequested(requestId, vehicleId, taskId);
      return future.get(TOKEN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    } catch (Exception e) {
      throw new RuntimeException("Failed to get auth token from JS", e);
    } finally {
      pendingRequests.remove(requestId);
    }
  }

  /** Called from JS when a token request is resolved successfully. */
  public void resolveToken(String requestId, String token) {
    SettableFuture<String> future = pendingRequests.get(requestId);
    if (future != null) {
      future.set(token);
    }
  }

  /** Called from JS when a token request fails. */
  public void rejectToken(String requestId, String error) {
    SettableFuture<String> future = pendingRequests.get(requestId);
    if (future != null) {
      future.setException(new RuntimeException(error));
    }
  }

  /** Cancels all pending token requests. Called when the driver instance is cleared. */
  public void cancelAllPendingRequests() {
    for (SettableFuture<String> future : pendingRequests.values()) {
      future.setException(new RuntimeException("Driver instance cleared"));
    }
    pendingRequests.clear();
  }
}
