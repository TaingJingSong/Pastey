#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PasteySQLite, NSObject)

RCT_EXTERN_METHOD(open:(NSString *)name
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(execute:(NSString *)sql
                  params:(NSArray *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end