#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PasteyModule, NSObject)

RCT_EXTERN_METHOD(hello:(NSString *)name
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
