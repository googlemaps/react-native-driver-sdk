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

#import "DeliveryDriverController.h"
#import <GoogleRidesharingDriver/GoogleRidesharingDriver.h>
#import "AuthTokenFactory.h"
#import "JsErrorsConstants.h"

@implementation DeliveryDriverController
GMTDVehicleReporter *_vehicleReporter;
GMSNavigationSession *_deliverySession;
AuthTokenFactory *_lmfsTokenFactory;
GMTDDriverContext *_driverContext;
GMTDDeliveryDriverAPI *_driverAPI;
DriverEventDispatcher *lmfsEventDispatch;

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view.
}

- (void)initializeWithSession:(GMSNavigationSession *)session {
  _deliverySession = session;
}

- (void)createDeliveryDriverInstance:(NSString *)providerId vehicleId:(NSString *)vehicleId {
  _lmfsTokenFactory = [[AuthTokenFactory alloc] init];

  GMTDDriverContext *driverContext =
      [[GMTDDriverContext alloc] initWithAccessTokenProvider:_lmfsTokenFactory
                                                  providerID:providerId
                                                   vehicleID:vehicleId
                                                   navigator:_deliverySession.navigator];
  _driverAPI = [[GMTDDeliveryDriverAPI alloc] initWithDriverContext:driverContext];

  _vehicleReporter = _driverAPI.vehicleReporter;
  [_vehicleReporter addListener:self];
  [_deliverySession.roadSnappedLocationProvider addListener:_vehicleReporter];

  lmfsEventDispatch = [DriverEventDispatcher allocWithZone:nil];
}

- (void)setVehicleState:(BOOL)isOnline {
  if (isOnline) {
    [_vehicleReporter updateVehicleState:GMTDVehicleStateOnline];
  } else {
    [_vehicleReporter updateVehicleState:GMTDVehicleStateOffline];
  }
}

- (void)setLocationTrackingEnabled:(BOOL)isEnabled {
  [_vehicleReporter setLocationTrackingEnabled:isEnabled];
}

- (void)setLocationReportingInterval:(double)interval {
  [_vehicleReporter setLocationReportingInterval:interval];
}

+ (nonnull NSString *)getDeliveryDriverSDKLongVersion {
  return GMTDDeliveryDriverAPI.SDKLongVersion;
}

+ (nonnull NSString *)getDriverSdkVersion {
  return GMTDDeliveryDriverAPI.SDKVersion;
}

- (void)clearInstance {
  [_vehicleReporter setLocationTrackingEnabled:NO];
  [_vehicleReporter removeListener:self];
  [_deliverySession.roadSnappedLocationProvider removeListener:_vehicleReporter];
  _vehicleReporter = NULL;
  _driverAPI = NULL;
}

- (void)getDeliveryVehicle:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
  [_driverAPI.deliveryVehicleManager
      getVehicleWithCompletion:^(GMTDDeliveryVehicle *_Nullable vehicle, NSError *_Nullable error) {
        if (error != nil || vehicle == nil) {
          reject(kDriverApiFailedToGetDeliveryVehicleCode,
                 kDriverApiFailedToGetDeliveryVehicleMessage, nil);
          return;
        }

        NSMutableDictionary *result = [[NSMutableDictionary alloc] init];
        result[@"providerId"] = vehicle.providerID;
        result[@"vehicleName"] = vehicle.vehicleName;
        result[@"vehicleId"] = vehicle.vehicleID;

        NSMutableArray *vehicleStopList = [[NSMutableArray alloc] init];
        for (int i = 0; i < vehicle.vehicleStops.count; i++) {
          NSMutableDictionary *vehicleStop = [[NSMutableDictionary alloc] init];

          if (vehicle.vehicleStops[i].plannedWaypoint != nil) {
            vehicleStop[@"waypoint"] = [DeliveryDriverController
                transformNavigationWaypointToDictionary:vehicle.vehicleStops[i].plannedWaypoint];
          }

          // vehicleStopState:
          switch (vehicle.vehicleStops[i].state) {
            case GMTDVehicleStopStateUnspecified:
              vehicleStop[@"vehicleStopState"] = @(0);
              break;
            case GMTDVehicleStopStateNew:
              vehicleStop[@"vehicleStopState"] = @(1);
              break;
            case GMTDVehicleStopStateEnroute:
              vehicleStop[@"vehicleStopState"] = @(2);
              break;
            case GMTDVehicleStopStateArrived:
              vehicleStop[@"vehicleStopState"] = @(3);
              break;
            default:
              vehicleStop[@"vehicleStopState"] = @(0);
              break;
          }

          NSMutableArray *taskInfoList = [[NSMutableArray alloc] init];

          for (int i = 0; i < vehicle.vehicleStops[i].taskInfoArray.count; i++) {
            [taskInfoList addObject:@{
              @"taskId" : vehicle.vehicleStops[i].taskInfoArray[i].taskID,
              @"taskDurationSeconds" : @(vehicle.vehicleStops[i].taskInfoArray[i].taskDuration),
            }];
          }

          vehicleStop[@"taskInfoList"] = taskInfoList;
          [vehicleStopList addObject:vehicleStop];
        }
        result[@"vehicleStops"] = vehicleStopList;

        resolve(result);
      }];
}

+ (void)setAbnormalTerminationReporting:(BOOL)isEnabled {
  [GMTDDeliveryDriverAPI setAbnormalTerminationReportingEnabled:isEnabled];
}

- (void)setAuthToken:(NSString *)authToken {
  [_lmfsTokenFactory setAuthToken:authToken];
}

#pragma mark - GMTDVehicleReporterListener

// Vehicle Reporter Listener for when vehicle updates are successful
- (void)vehicleReporter:(GMTDVehicleReporter *)vehicleReporter
    didSucceedVehicleUpdate:(GMTDVehicleUpdate *)vehicleUpdate {
  NSMutableDictionary *eventBody = [[NSMutableDictionary alloc] init];
  eventBody[@"vehicleUpdate"] =
      [DeliveryDriverController transformVehicleUpdateToDictionary:vehicleUpdate];

  [lmfsEventDispatch sendEventName:@"didSucceedVehicleUpdate" body:eventBody];
}

// Vehicle Reporter Listener for when vehicle updates fail
- (void)vehicleReporter:(GMTDVehicleReporter *)vehicleReporter
    didFailVehicleUpdate:(GMTDVehicleUpdate *)vehicleUpdate
               withError:(NSError *)error {
  NSMutableDictionary *eventBody = [[NSMutableDictionary alloc] init];
  eventBody[@"vehicleUpdate"] =
      [DeliveryDriverController transformVehicleUpdateToDictionary:vehicleUpdate];

  if (error != nil) {
    eventBody[@"error"] = @{
      @"code" : @(error.code),
      @"domain" : error.domain,
      @"message" : error.description,
    };
  }

  [lmfsEventDispatch sendEventName:@"didFailVehicleUpdate" body:eventBody];
}

- (void)addListener:(NSString *)eventName {
  [lmfsEventDispatch startObserving];
}

- (void)removeListeners:(NSString *)eventName {
  [lmfsEventDispatch stopObserving];
}

- (bool)isNavigatorInitialized {
  return _deliverySession.navigator != nil;
}

- (bool)isDriverApiInitialized {
  return _driverAPI != nil;
}

+ (NSDictionary *)transformCoordinateToDictionary:(CLLocationCoordinate2D)coordinate {
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

+ (NSDictionary *)transformNavigationWaypointToDictionary:(GMSNavigationWaypoint *)waypoint {
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];

  dictionary[@"position"] =
      [DeliveryDriverController transformCoordinateToDictionary:waypoint.coordinate];
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

+ (NSDictionary *)transformVehicleUpdateToDictionary:(GMTDVehicleUpdate *)vehicleUpdate {
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];

  dictionary[@"location"] = [self transformCLLocationToDictionary:vehicleUpdate.location];
  dictionary[@"vehicleState"] = @(vehicleUpdate.vehicleState);

  if (vehicleUpdate.destinationWaypoint != nil) {
    dictionary[@"destinationWaypoint"] =
        [self transformNavigationWaypointToDictionary:vehicleUpdate.destinationWaypoint];
  }

  if (vehicleUpdate.remainingTimeInSeconds) {
    dictionary[@"remainingTimeInSeconds"] = vehicleUpdate.remainingTimeInSeconds;
  }

  if (vehicleUpdate.remainingDistanceInMeters) {
    dictionary[@"remainingDistanceInMeters"] = vehicleUpdate.remainingDistanceInMeters;
  }

  if (vehicleUpdate.route != nil) {
    NSMutableArray *routeArray = [[NSMutableArray alloc] init];

    for (int index = 0; index < vehicleUpdate.route.count; index++) {
      CLLocation *indexLocation = vehicleUpdate.route[index];
      [routeArray
          addObject:[DeliveryDriverController transformCLLocationToDictionary:indexLocation]];
    }

    dictionary[@"route"] = routeArray;
  }

  return dictionary;
}

@end
