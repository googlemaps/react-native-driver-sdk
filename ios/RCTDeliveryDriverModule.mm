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

    // Wire up vehicle reporter event callbacks to TurboModule EventEmitter.
    __weak RCTDeliveryDriverModule *weakSelf = self;
    self->_driverController.onVehicleUpdateSucceed = ^(GMTDVehicleUpdate *vehicleUpdate) {
      RCTDeliveryDriverModule *strongSelf = weakSelf;
      if (strongSelf) {
        NSDictionary *updateDict =
            [DeliveryDriverController transformVehicleUpdateToDictionary:vehicleUpdate];
        NSMutableDictionary *map = [NSMutableDictionary dictionary];
        map[@"vehicleUpdate"] = updateDict;
        [strongSelf emitOnVehicleUpdateSucceed:map];
      }
    };
    self->_driverController.onVehicleUpdateFailed =
        ^(GMTDVehicleUpdate *vehicleUpdate, NSError *error) {
          RCTDeliveryDriverModule *strongSelf = weakSelf;
          if (strongSelf) {
            NSMutableDictionary *map = [NSMutableDictionary dictionary];
            map[@"vehicleUpdate"] =
                [DeliveryDriverController transformVehicleUpdateToDictionary:vehicleUpdate];
            if (error != nil) {
              map[@"error"] = @{
                @"code" : @(error.code),
                @"domain" : error.domain,
                @"message" : error.description,
              };
            }
            [strongSelf emitOnVehicleUpdateFailed:map];
          }
        };

    [self->_driverController
        createDeliveryDriverInstance:providerId
                           vehicleId:vehicleId
                tokenRequestCallback:^(NSString *requestId, NSString *vehicleId, NSString *taskId) {
                  RCTDeliveryDriverModule *strongSelf = weakSelf;
                  if (strongSelf) {
                    NSMutableDictionary *map = [NSMutableDictionary dictionary];
                    map[@"requestId"] = requestId;
                    map[@"vehicleId"] = vehicleId;
                    map[@"taskId"] = taskId;
                    [strongSelf emitOnGetToken:map];
                  }
                }];
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
  [DeliveryDriverController setAbnormalTerminationReporting:isEnabled];
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
  resolve([DeliveryDriverController getDriverSdkVersion]);
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

- (void)resolveAuthToken:(NSString *)requestId token:(NSString *)token {
  [self->_driverController resolveAuthToken:requestId token:token];
}

- (void)rejectAuthToken:(NSString *)requestId error:(NSString *)error {
  [self->_driverController rejectAuthToken:requestId error:error];
}

@end
