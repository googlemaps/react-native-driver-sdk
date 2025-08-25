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
#import <react-native-navigation-sdk/NavModule.h>

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
                  : (NSString *)vehicleId resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController != nil && [self->_driverController isDriverApiInitialized]) {
      reject(kDriverApiAlreadyExistsErrorCode, kDriverApiAlreadyExistsErrorMessage, nil);
      return;
    }

    GMSNavigationSession *session = [NavModule.sharedInstance getSession];

    if (session == nil || session.navigator == nil) {
      reject(kNavigatorNotInitializedErrorCode, kNavigatorNotInitializedErrorMessage, nil);
      return;
    }

    self->_driverController = [[RidesharingDriverController alloc] init];
    [self->_driverController initializeWithSession:session];
    [self->_driverController createRidesharingInstance:providerId vehicleId:vehicleId];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setLocationTrackingEnabled
                  : (BOOL)isEnabled resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController setLocationTrackingEnabled:isEnabled];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setVehicleState
                  : (BOOL)isEnabled resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController setVehicleState:isEnabled];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(setAbnormalTerminationReporting : (BOOL)isEnabled) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [RidesharingDriverController setAbnormalTerminationReporting:isEnabled];
  });
}

RCT_EXPORT_METHOD(setLocationReportingInterval
                  : (double)intervalSeconds resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController setLocationReportingInterval:intervalSeconds];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(getDriverSdkVersion
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve([RidesharingDriverController getDriverSdkVersion]);
  });
}

RCT_EXPORT_METHOD(clearInstance) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController clearInstance];
  });
}

RCT_EXPORT_METHOD(setAuthToken
                  : (NSString *)authToken vehicleId
                  : (NSString *)vehicleId resolve
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController setAuthToken:authToken];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(addListener : (NSString *)eventName) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController addListener:eventName];
  });
}

RCT_EXPORT_METHOD(removeListeners : (NSString *)eventName) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController removeListeners:eventName];
  });
}

@end
