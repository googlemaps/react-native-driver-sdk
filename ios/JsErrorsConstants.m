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

#import "JsErrorsConstants.h"

// Make sure these are in sync with the Android JsErrors.
NSString* const kDriverApiNotInitializedErrorCode = @"DRIVER_API_NOT_INITIALIZED_CODE";
NSString* const kDriverApiNotInitializedErrorMessage = @"Driver API has not been initialized.";
NSString* const kDriverApiAlreadyExistsErrorCode = @"DRIVER_API_ALREADY_EXISTS_CODE";
NSString* const kDriverApiAlreadyExistsErrorMessage = @"Driver API already exists.";
NSString* const kNavigatorNotInitializedErrorCode = @"NO_NAVIGATOR_CODE";
NSString* const kNavigatorNotInitializedErrorMessage = @"Navigator is not initialized.";
NSString* const kDriverApiFailedToGetDeliveryVehicleCode = @"DRIVER_API_FAILED_TO_GET_DELIVERY_VEHICLE";
NSString* const kDriverApiFailedToGetDeliveryVehicleMessage = @"There was an error retrieving the delivery vehicle";
