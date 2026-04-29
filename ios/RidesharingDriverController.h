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

#import <GoogleNavigation/GoogleNavigation.h>
#import <GoogleRidesharingDriver/GoogleRidesharingDriver.h>
#import <UIKit/UIKit.h>
#import "AuthTokenFactory.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^VehicleUpdateSuccessBlock)(GMTDVehicleUpdate *vehicleUpdate);
typedef void (^VehicleUpdateFailureBlock)(GMTDVehicleUpdate *vehicleUpdate, NSError *error);

@interface RidesharingDriverController : UIViewController <GMTDVehicleReporterListener>

@property GMTDVehicleReporter *vReporter;
@property(nonatomic, copy, nullable) VehicleUpdateSuccessBlock onVehicleUpdateSucceed;
@property(nonatomic, copy, nullable) VehicleUpdateFailureBlock onVehicleUpdateFailed;

// Retrieve the NavigationSDK navigation session
- (void)initializeWithSession:(GMSNavigationSession *)session;
- (void)createRidesharingInstance:(NSString *)providerId
                        vehicleId:(NSString *)vehicleId
             tokenRequestCallback:(TokenRequestCallback)callback;
- (void)setLocationTrackingEnabled:(BOOL)isEnabled;
- (void)setVehicleState:(BOOL)isOnline;
- (void)setLocationReportingInterval:(double)interval;
+ (NSString *)getDriverSdkVersion;
+ (NSString *)getRidesharingDriverSDKLongVersion;
- (void)clearInstance;
+ (void)setAbnormalTerminationReporting:(BOOL)isEnabled;
- (void)resolveAuthToken:(NSString *)requestId token:(NSString *)token;
- (void)rejectAuthToken:(NSString *)requestId error:(NSString *)error;
- (bool)isNavigatorInitialized;
- (bool)isDriverApiInitialized;
+ (NSDictionary *)transformCLLocationToDictionary:(CLLocation *)location;
+ (NSDictionary *)transformNavigationWaypointToDictionary:(GMSNavigationWaypoint *)waypoint;
+ (NSDictionary *)transformVehicleUpdateToDictionary:(GMTDVehicleUpdate *)vehicleUpdate;
+ (NSDictionary *)transformCoordinateToDictionary:(CLLocationCoordinate2D)coordinate;
@end

NS_ASSUME_NONNULL_END
