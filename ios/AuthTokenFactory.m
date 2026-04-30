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

@implementation AuthTokenFactory {
  NSMutableDictionary<NSString *, GMTDAuthTokenFetchCompletionHandler> *_pendingCompletions;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _pendingCompletions = [NSMutableDictionary new];
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

  @synchronized(self) {
    _pendingCompletions[requestId] = [completion copy];
  }

  // Request token from JS
  self.tokenRequestCallback(requestId, vehicleId, taskId);
}

#pragma mark - Token Resolution

- (void)resolveToken:(NSString *)requestId token:(NSString *)token {
  GMTDAuthTokenFetchCompletionHandler completion;
  @synchronized(self) {
    completion = _pendingCompletions[requestId];
    [_pendingCompletions removeObjectForKey:requestId];
  }
  if (completion) {
    completion(token, nil);
  }
}

- (void)rejectToken:(NSString *)requestId error:(NSString *)errorMessage {
  GMTDAuthTokenFetchCompletionHandler completion;
  @synchronized(self) {
    completion = _pendingCompletions[requestId];
    [_pendingCompletions removeObjectForKey:requestId];
  }
  if (completion) {
    NSError *error = [NSError errorWithDomain:kGRSDErrorDomain
                                         code:kProviderErrorCode
                                     userInfo:@{NSLocalizedDescriptionKey : errorMessage}];
    completion(nil, error);
  }
}

- (void)cancelAllPendingRequests {
  NSDictionary<NSString *, GMTDAuthTokenFetchCompletionHandler> *completions;
  @synchronized(self) {
    completions = [_pendingCompletions copy];
    [_pendingCompletions removeAllObjects];
  }
  NSError *error =
      [NSError errorWithDomain:kGRSDErrorDomain
                          code:kProviderErrorCode
                      userInfo:@{NSLocalizedDescriptionKey : @"Driver instance cleared"}];
  for (GMTDAuthTokenFetchCompletionHandler completion in completions.allValues) {
    completion(nil, error);
  }
}

@end
