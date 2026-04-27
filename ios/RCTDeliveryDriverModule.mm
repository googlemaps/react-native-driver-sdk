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

#import "RCTDeliveryDriverModule.h"
#import <React/RCTUIManager.h>
#import <ReactNativeGoogleMapsNavigation/NavModule.h>

@implementation RCTDeliveryDriverModule

RCT_EXPORT_MODULE(DeliveryDriverModule);

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeDeliveryDriverModuleSpecJSI>(params);
}

+ (id)allocWithZone:(NSZone *)zone {
  static RCTDeliveryDriverModule *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [super allocWithZone:zone];
  });
  return sharedInstance;
}

- (void)createDeliveryDriverInstance:(NSString *)providerId
                           vehicleId:(NSString *)vehicleId
                             resolve:(RCTPromiseResolveBlock)resolve
                              reject:(RCTPromiseRejectBlock)reject {
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

    self->_driverController = [[DeliveryDriverController alloc] init];
    [self->_driverController initializeWithSession:session];
    [self->_driverController createDeliveryDriverInstance:providerId vehicleId:vehicleId];
    resolve(@(YES));
  });
}

- (void)setLocationTrackingEnabled:(BOOL)isEnabled
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController setLocationTrackingEnabled:isEnabled];
    resolve(@(YES));
  });
}

- (void)setAbnormalTerminationReporting:(BOOL)isEnabled {
  dispatch_async(dispatch_get_main_queue(), ^{
    [DeliveryDriverController setAbnormalTerminationReporting:isEnabled];
  });
}

- (void)setLocationReportingInterval:(double)intervalSeconds
                             resolve:(RCTPromiseResolveBlock)resolve
                              reject:(RCTPromiseRejectBlock)reject {
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

- (void)getDriverSdkVersion:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve([DeliveryDriverController getDriverSdkVersion]);
  });
}

- (void)getDeliveryVehicle:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_driverController == nil ||
        [self->_driverController isDriverApiInitialized] == false) {
      reject(kDriverApiNotInitializedErrorCode, kDriverApiNotInitializedErrorMessage, nil);
      return;
    }

    [self->_driverController getDeliveryVehicle:resolve rejecter:reject];
  });
}

- (void)clearInstance:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController clearInstance];
    resolve(@(YES));
  });
}

- (void)setAuthToken:(NSString *)authToken
           vehicleId:(NSString *)vehicleId
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {
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

- (void)addListener:(NSString *)eventName {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController addListener:eventName];
  });
}

- (void)removeListeners:(double)count {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_driverController removeListeners:[NSString stringWithFormat:@"%d", (int)count]];
  });
}

@end
