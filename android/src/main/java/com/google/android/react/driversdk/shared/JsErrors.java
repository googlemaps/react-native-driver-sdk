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

public class JsErrors {
  public static final String NO_DRIVER_CONTEXT_CODE = "NO_DRIVER_CONTEXT_CODE";
  public static final String NO_DRIVER_CONTEXT_MESSAGE = "DriverContext is not initialized.";

  public static final String NO_NAVIGATOR_CODE = "NO_NAVIGATOR_CODE";
  public static final String NO_NAVIGATOR_MESSAGE = "Navigator is not initialized.";

  public static final String NO_AUTHENTICATION_CODE = "NO_AUTHENTICATION_CODE";
  public static final String NO_AUTHENTICATION_MESSAGE = "AuthTokenFactory is not initialized.";

  public static final String NAVIGATION_NOT_AUTHORIZED_CODE = "NAVIGATION_NOT_AUTHORIZED_CODE";
  public static final String NAVIGATION_NOT_AUTHORIZED_MESSAGE =
      "Error loading Navigation API: Your API key is invalid or not authorized to use Navigation.";

  public static final String TERMS_NOT_ACCEPTED_CODE = "TERMS_NOT_ACCEPTED_CODE";
  public static final String TERMS_NOT_ACCEPTED_MESSAGE =
      "Error loading Navigation API: User did not accept the Navigation Terms of Use.";

  public static final String NAVIGATION_DEFAULT_ERROR_CODE = "NAVIGATION_DEFAULT_ERROR_CODE";
  public static final String NAVIGATION_DEFAULT_ERROR_MESSAGE = "Error loading Navigation API.";

  public static final String NO_VEHICLE_REPORTER_CODE = "NO_VEHICLE_REPORTER_CODE";
  public static final String NO_VEHICLE_REPORTER_MESSAGE = "Vehicle reporter is not initialized";

  public static final String DRIVER_API_ALREADY_EXISTS_CODE = "DRIVER_API_ALREADY_EXISTS";
  public static final String DRIVER_API_ALREADY_EXISTS_MESSAGE = "Driver API already exists.";

  public static final String DRIVER_API_NOT_INITIALIZED_CODE = "DRIVER_API_NOT_INITIALIZED_CODE";
  public static final String DRIVER_API_NOT_INITIALIZED_MESSAGE =
      "Driver API has not been initialized.";
}
