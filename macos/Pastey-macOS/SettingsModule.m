#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SettingsModule, NSObject)

RCT_EXTERN_METHOD(get:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(set:(NSString *)key
                  value:(id)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(all:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
