#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AutoPasteModule, NSObject)

RCT_EXTERN_METHOD(isTrusted:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(paste:(nonnull NSNumber *)delayMs
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end