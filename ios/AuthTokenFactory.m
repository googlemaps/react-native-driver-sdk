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

#import "AuthTokenFactory.h"
#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>

static NSString *const kGRSDErrorDomain = @"GRSDErrorDomain";
static const int kProviderErrorCode = 1000;
static const NSTimeInterval kTokenTimeoutSeconds = 30.0;

@implementation AuthTokenFactory {
  NSMutableDictionary<NSString *, dispatch_semaphore_t> *_pendingSemaphores;
  NSMutableDictionary<NSString *, NSString *> *_pendingTokens;
  NSMutableDictionary<NSString *, NSString *> *_pendingErrors;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _pendingSemaphores = [NSMutableDictionary new];
    _pendingTokens = [NSMutableDictionary new];
    _pendingErrors = [NSMutableDictionary new];
  }
  return self;
}

#pragma mark - GMTDAuthorization

- (void)fetchTokenWithContext:(nullable GMTDAuthorizationContext *)authorizationContext
                   completion:(nonnull GMTDAuthTokenFetchCompletionHandler)completion {
  if (!self.tokenRequestCallback) {
    NSError *error =
        [NSError errorWithDomain:kGRSDErrorDomain
                            code:kProviderErrorCode
                        userInfo:@{NSLocalizedDescriptionKey : @"Token request callback not set."}];
    completion(nil, error);
    return;
  }

  NSString *requestId = [[NSUUID UUID] UUIDString];
  NSString *vehicleId = authorizationContext.vehicleID ?: @"";
  NSString *taskId = authorizationContext.taskID ?: @"";

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

  @synchronized(self) {
    _pendingSemaphores[requestId] = semaphore;
  }

  // Request token from JS
  self.tokenRequestCallback(requestId, vehicleId, taskId);

  // Block until JS responds (on a background queue — this is called by the Driver SDK
  // on a dedicated thread, so blocking is expected and safe).
  dispatch_time_t timeout =
      dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kTokenTimeoutSeconds * NSEC_PER_SEC));
  long result = dispatch_semaphore_wait(semaphore, timeout);

  NSString *token = nil;
  NSString *errorMessage = nil;

  @synchronized(self) {
    token = _pendingTokens[requestId];
    errorMessage = _pendingErrors[requestId];
    [_pendingSemaphores removeObjectForKey:requestId];
    [_pendingTokens removeObjectForKey:requestId];
    [_pendingErrors removeObjectForKey:requestId];
  }

  if (result != 0) {
    NSError *error =
        [NSError errorWithDomain:kGRSDErrorDomain
                            code:kProviderErrorCode
                        userInfo:@{NSLocalizedDescriptionKey : @"Auth token request timed out."}];
    completion(nil, error);
    return;
  }

  if (errorMessage) {
    NSError *error = [NSError errorWithDomain:kGRSDErrorDomain
                                         code:kProviderErrorCode
                                     userInfo:@{NSLocalizedDescriptionKey : errorMessage}];
    completion(nil, error);
    return;
  }

  completion(token, nil);
}

#pragma mark - Token Resolution

- (void)resolveToken:(NSString *)requestId token:(NSString *)token {
  @synchronized(self) {
    dispatch_semaphore_t semaphore = _pendingSemaphores[requestId];
    if (semaphore) {
      _pendingTokens[requestId] = token;
      dispatch_semaphore_signal(semaphore);
    }
  }
}

- (void)rejectToken:(NSString *)requestId error:(NSString *)error {
  @synchronized(self) {
    dispatch_semaphore_t semaphore = _pendingSemaphores[requestId];
    if (semaphore) {
      _pendingErrors[requestId] = error;
      dispatch_semaphore_signal(semaphore);
    }
  }
}

@end
