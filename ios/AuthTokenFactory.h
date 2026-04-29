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

#import <Foundation/Foundation.h>
#import <GoogleRidesharingDriver/GoogleRidesharingDriver.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Callback block invoked when the native Driver SDK needs an auth token.
 * The implementation should emit an event to JS to request the token.
 *
 * @param requestId Unique identifier for this token request.
 * @param vehicleId The vehicle ID from the authorization context.
 * @param taskId The task ID from the authorization context (may be empty).
 */
typedef void (^TokenRequestCallback)(NSString *requestId, NSString *vehicleId, NSString *taskId);

/**
 * Auth token factory that requests tokens from JS via the React Native bridge.
 *
 * When the native Driver SDK needs a token (on each location update), this factory:
 * 1. Generates a unique requestId
 * 2. Invokes the callback to emit an event to JS
 * 3. Blocks until JS resolves or rejects the request via resolveToken:/rejectToken:
 *
 * This mirrors the pattern used in the Flutter Driver SDK's AccessTokenProvider.
 */
@interface AuthTokenFactory : NSObject <GMTDAuthorization>

@property(nonatomic, copy, nullable) TokenRequestCallback tokenRequestCallback;

- (void)resolveToken:(NSString *)requestId token:(NSString *)token;
- (void)rejectToken:(NSString *)requestId error:(NSString *)error;

@end

NS_ASSUME_NONNULL_END
