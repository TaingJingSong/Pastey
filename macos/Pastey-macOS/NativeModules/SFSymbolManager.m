#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(SFSymbolManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(symbolName, NSString)
RCT_EXPORT_VIEW_PROPERTY(symbolSize, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(symbolWeight, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(symbolColor, NSString)

@end
