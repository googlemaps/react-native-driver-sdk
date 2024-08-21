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

#import <UIKit/UIKit.h>
@import GoogleNavigation;
#import <GoogleRidesharingDriver/GoogleRidesharingDriver.h>
#import "DriverEventDispatcher.h"

NS_ASSUME_NONNULL_BEGIN

@interface DeliveryDriverController : UIViewController<GMTDVehicleReporterListener>
@property GMTDVehicleReporter *vehicleReporter;

- (void)initializeWithSession: (GMSNavigationSession *) session;
- (void)createDeliveryDriverInstance: (NSString *) providerId
                           vehicleId: (NSString *) vehicleId;
- (void)setLocationTrackingEnabled: (BOOL) isEnabled;
- (void)setLocationReportingInterval: (double) interval;
+ (NSString *)getDriverSdkVersion;
+ (NSString *)getDeliveryDriverSDKLongVersion;
- (void)clearInstance;
+ (void)setAbnormalTerminationReporting: (BOOL) isEnabled;
- (void)getDeliveryVehicle:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject;
- (void)setAuthToken: (NSString *) authToken;
- (void)addListener:(NSString *)eventName;
- (void)removeListeners:(NSString *)eventName;
- (bool)isNavigatorInitialized;
- (bool)isDriverApiInitialized;
+ (NSDictionary *)transformCLLocationToDictionary:(CLLocation *)location;
+ (NSDictionary *)transformNavigationWaypointToDictionary:(GMSNavigationWaypoint *)waypoint;
+ (NSDictionary *)transformVehicleUpdateToDictionary: (GMTDVehicleUpdate *) vehicleUpdate;
+ (NSDictionary *)transformCoordinateToDictionary:(CLLocationCoordinate2D)coordinate;
@end

NS_ASSUME_NONNULL_END
