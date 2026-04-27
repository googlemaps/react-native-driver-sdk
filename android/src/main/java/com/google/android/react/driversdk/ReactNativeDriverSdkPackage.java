/**
 * Copyright 2023 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.android.react.driversdk;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;
import com.google.android.react.driversdk.lmfs.DeliveryDriverModule;
import com.google.android.react.driversdk.odrd.RidesharingModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@DoNotStrip
public class ReactNativeDriverSdkPackage extends BaseReactPackage {

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return new ArrayList<>();
  }

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    switch (name) {
      case RidesharingModule.REACT_CLASS:
        return new RidesharingModule(reactContext);
      case DeliveryDriverModule.REACT_CLASS:
        return new DeliveryDriverModule(reactContext);
      default:
        return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();

      moduleInfos.put(
          RidesharingModule.REACT_CLASS,
          new ReactModuleInfo(
              RidesharingModule.REACT_CLASS,
              RidesharingModule.REACT_CLASS,
              false, // canOverrideExistingModule
              false, // needsEagerInit
              false, // isCxxModule
              true // isTurboModule
              ));

      moduleInfos.put(
          DeliveryDriverModule.REACT_CLASS,
          new ReactModuleInfo(
              DeliveryDriverModule.REACT_CLASS,
              DeliveryDriverModule.REACT_CLASS,
              false, // canOverrideExistingModule
              false, // needsEagerInit
              false, // isCxxModule
              true // isTurboModule
              ));

      return moduleInfos;
    };
  }
}
