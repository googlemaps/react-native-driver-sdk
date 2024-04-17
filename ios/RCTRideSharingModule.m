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

#import "RCTRideSharingModule.h"
#import <React/RCTUIManager.h>

@implementation RCTRideSharingModule

RCT_EXPORT_MODULE(RCTRideSharingModule);

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue {
  return self.bridge.uiManager.methodQueue;
}

+ (id)allocWithZone:(NSZone *)zone {
  static RCTRideSharingModule *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

RCT_EXPORT_METHOD(createRidesharingInstance
                  : (NSString *)providerId vehicleId
                  : (NSString *)vehicleId viewId
                  : (nonnull NSNumber *)viewId resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_viewController != nil &&
            [self->_viewController isDriverApiInitialized]) {
      reject(kDriverApiAlreadyExistsErrorCode,
             kDriverApiAlreadyExistsErrorMessage, nil);
      return;
    }

    RCTUIManager *uiManager = [self.bridge moduleForClass:[RCTUIManager class]];
    UIView *topView = [uiManager viewForReactTag:viewId];
    GMSMapView *dView = (GMSMapView *)topView.subviews[0];

    if (dView == nil) {
      reject(kNavigatorNotInitializedErrorCode,
             kNavigatorNotInitializedErrorMessage, nil);
      return;
    }

    self->_viewController = [[RidesharingViewController alloc] init];
    [self->_viewController initializeNavigator:dView];
    [self->_viewController createRidesharingInstance:providerId
                                           vehicleId:vehicleId];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setLocationTrackingEnabled
                  : (BOOL)isEnabled resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_viewController == nil ||
        [self->_viewController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode,
             kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_viewController setLocationTrackingEnabled:isEnabled];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setVehicleState
                  : (BOOL)isEnabled resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_viewController == nil ||
        [self->_viewController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode,
             kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_viewController setVehicleState:isEnabled];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setAbnormalTerminationReporting : (BOOL)isEnabled) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [RidesharingViewController setAbnormalTerminationReporting:isEnabled];
  });
}

RCT_EXPORT_METHOD(setLocationReportingInterval
                  : (double)intervalSeconds resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_viewController == nil ||
        [self->_viewController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode,
             kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_viewController setLocationReportingInterval:intervalSeconds];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(getDriverSdkVersion
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve([RidesharingViewController getDriverSdkVersion]);
  });
}

RCT_EXPORT_METHOD(clearInstance) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_viewController clearInstance];
  });
}

RCT_EXPORT_METHOD(setAuthToken
                  : (NSString *)authToken vehicleId
                  : (NSString *)vehicleId resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_viewController == nil ||
        [self->_viewController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode,
             kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_viewController setAuthToken:authToken];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(addListener : (NSString *)eventName) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_viewController addListener:eventName];
  });
}

RCT_EXPORT_METHOD(removeListeners : (NSString *)eventName) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_viewController removeListeners:eventName];
  });
}

@end
