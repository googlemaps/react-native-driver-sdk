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

#import "RidesharingViewController.h"
#import "AuthTokenFactory.h"
#import <GoogleRidesharingDriver/GoogleRidesharingDriver.h>

@import UserNotifications;

@implementation RidesharingViewController
GMTDVehicleReporter *_ridesharingVehicleReporter;
GMSMapView *_driverView;
AuthTokenFactory *_tokenFactory;
GMTDRidesharingDriverAPI *_rideSharingDriverAPI;
GMTDDriverContext *_rideSharingDriverContext;
DriverEventDispatcher *driverEventDispatch;

// Retrieve the NavigationSDK fragment view
- (void)initializeNavigator:(GMSMapView *)mapView {
  _driverView = mapView;
}

- (void)createRidesharingInstance:(NSString *)providerId
                        vehicleId:(NSString *)vehicleId {
  _tokenFactory = [[AuthTokenFactory alloc] init];

  _rideSharingDriverContext = [[GMTDDriverContext alloc]
      initWithAccessTokenProvider:_tokenFactory
                       providerID:providerId
                        vehicleID:vehicleId
                        navigator:_driverView.navigator];

  _rideSharingDriverAPI = [[GMTDRidesharingDriverAPI alloc]
      initWithDriverContext:_rideSharingDriverContext];
  driverEventDispatch = [DriverEventDispatcher allocWithZone:nil];

  _ridesharingVehicleReporter = _rideSharingDriverAPI.vehicleReporter;
  [_ridesharingVehicleReporter addListener:self];
  [_driverView.roadSnappedLocationProvider
      addListener:_ridesharingVehicleReporter];
}

- (void)setLocationTrackingEnabled:(BOOL)isEnabled {
  [_ridesharingVehicleReporter setLocationTrackingEnabled:isEnabled];
}

- (void)setVehicleState:(BOOL)isOnline {
  if (isOnline) {
    [_ridesharingVehicleReporter updateVehicleState:GMTDVehicleStateOnline];
  } else {
    [_ridesharingVehicleReporter updateVehicleState:GMTDVehicleStateOffline];
  }
}

- (void)setLocationReportingInterval:(double)interval {
  [_ridesharingVehicleReporter setLocationReportingInterval:interval];
}

+ (NSString *)getDriverSdkVersion {
  return GMTDRidesharingDriverAPI.SDKVersion;
}

+ (NSString *)getRidesharingDriverSDKLongVersion {
  return GMTDRidesharingDriverAPI.SDKLongVersion;
}

- (void)clearInstance {
  [_ridesharingVehicleReporter setLocationTrackingEnabled:NO];
  [_ridesharingVehicleReporter removeListener:self];
  [_driverView.roadSnappedLocationProvider
      removeListener:_ridesharingVehicleReporter];
  _ridesharingVehicleReporter = NULL;
  _rideSharingDriverAPI = NULL;
}

+ (void)setAbnormalTerminationReporting:(BOOL)isEnabled {
  [GMTDRidesharingDriverAPI setAbnormalTerminationReportingEnabled:isEnabled];
}

- (void)setAuthToken:(NSString *)authToken {
  [_tokenFactory setAuthToken:authToken];
}

#pragma mark - GMTDVehicleReporterListener

// Vehicle Reporter Listener for when vehicle updates are successful
- (void)vehicleReporter:(GMTDVehicleReporter *)vehicleReporter
    didSucceedVehicleUpdate:(GMTDVehicleUpdate *)vehicleUpdate {

  NSMutableDictionary *eventBody = [[NSMutableDictionary alloc] init];
  if (vehicleUpdate != nil) {
    NSDictionary *dictionary = [RidesharingViewController
        transformVehicleUpdateToDictionary:vehicleUpdate];
    eventBody[@"vehicleUpdate"] = dictionary;
  }

  [driverEventDispatch sendEventName:@"didSucceedVehicleUpdate" body:eventBody];
}

// Vehicle Reporter Listener for when vehicle updates fail
- (void)vehicleReporter:(GMTDVehicleReporter *)vehicleReporter
    didFailVehicleUpdate:(GMTDVehicleUpdate *)vehicleUpdate
               withError:(NSError *)error {
  NSMutableDictionary *eventBody = [[NSMutableDictionary alloc] init];

  if (vehicleUpdate != nil) {
    eventBody[@"vehicleUpdate"] = [RidesharingViewController
        transformVehicleUpdateToDictionary:vehicleUpdate];
  }

  if (error != nil) {
    eventBody[@"error"] = @{
      @"code" : @(error.code),
      @"domain" : error.domain,
      @"message" : error.description,
    };
  }

  [driverEventDispatch sendEventName:@"didFailVehicleUpdate" body:eventBody];
}

- (void)addListener:(NSString *)eventName {
  [driverEventDispatch startObserving];
}

- (void)removeListeners:(NSString *)eventName {
  [driverEventDispatch stopObserving];
}

- (bool)isNavigatorInitialized {
  return _driverView != nil;
}

- (bool)isDriverApiInitialized {
  return _rideSharingDriverAPI != nil;
}

+ (NSDictionary *)transformCoordinateToDictionary:
    (CLLocationCoordinate2D)coordinate {
  return @{
    @"lat" : @(coordinate.latitude),
    @"lng" : @(coordinate.longitude),
  };
}

+ (NSDictionary *)transformCLLocationToDictionary:(CLLocation *)location {
  NSTimeInterval seconds = [location.timestamp timeIntervalSince1970];
  double time = seconds * 1000;

  return @{
    @"lat" : @(location.coordinate.latitude),
    @"lng" : @(location.coordinate.latitude),
    @"time" : @(time),
    @"accuracy" : @(location.horizontalAccuracy),
    @"altitude" : @(location.altitude),
    @"bearing" : @(location.course),
    @"speed" : @(location.speed),
    @"verticalAccuracy" : @(location.verticalAccuracy),
  };
}

+ (NSDictionary *)transformNavigationWaypointToDictionary:
    (GMSNavigationWaypoint *)waypoint {
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];

  dictionary[@"position"] = [RidesharingViewController
      transformCoordinateToDictionary: waypoint.coordinate];
  dictionary[@"preferredHeading"] = @(waypoint.preferredHeading);
  dictionary[@"vehicleStopover"] = @(waypoint.vehicleStopover);
  dictionary[@"preferSameSideOfRoad"] = @(waypoint.preferSameSideOfRoad);

  if (waypoint.title != nil) {
    dictionary[@"title"] = waypoint.title;
  }

  if (waypoint.placeID != nil) {
    dictionary[@"placeId"] = waypoint.placeID;
  }

  return dictionary;
}

+ (NSDictionary *)transformVehicleUpdateToDictionary:
    (GMTDVehicleUpdate *)vehicleUpdate {
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];

  dictionary[@"location"] =
      [self transformCLLocationToDictionary:vehicleUpdate.location];
  dictionary[@"vehicleState"] = @(vehicleUpdate.vehicleState);

  if (vehicleUpdate.destinationWaypoint != nil) {
    dictionary[@"destinationWaypoint"] =
        [self transformNavigationWaypointToDictionary:vehicleUpdate
                                                          .destinationWaypoint];
  }

  if (vehicleUpdate.remainingTimeInSeconds) {
    dictionary[@"remainingTimeInSeconds"] =
        vehicleUpdate.remainingTimeInSeconds;
  }

  if (vehicleUpdate.remainingDistanceInMeters) {
    dictionary[@"remainingDistanceInMeters"] =
        vehicleUpdate.remainingDistanceInMeters;
  }

  if (vehicleUpdate.route != nil) {
    NSMutableArray *routeArray = [[NSMutableArray alloc] init];

    for (int index = 0; index < vehicleUpdate.route.count; index++) {
      CLLocation *indexLocation = vehicleUpdate.route[index];
      [routeArray addObject:[RidesharingViewController
                                transformCLLocationToDictionary:indexLocation]];
    }

    dictionary[@"route"] = routeArray;
  }

  return dictionary;
}

@end
