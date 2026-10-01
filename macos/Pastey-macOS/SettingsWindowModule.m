#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SettingsWindowModule, NSObject)

RCT_EXTERN_METHOD(open:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
