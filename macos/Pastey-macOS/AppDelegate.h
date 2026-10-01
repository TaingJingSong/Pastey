#import <RCTAppDelegate.h>
#import <Cocoa/Cocoa.h>

@interface AppDelegate : RCTAppDelegate

- (NSStatusBarButton *)statusItemButton;
- (NSView *)pasteyRootView;

// Creates a root view for an arbitrary registered component, sharing this
// app's bridge and JS runtime.
- (NSView *)rootViewForModuleName:(NSString *)moduleName
                      initialProps:(NSDictionary *)initialProps;

@end
