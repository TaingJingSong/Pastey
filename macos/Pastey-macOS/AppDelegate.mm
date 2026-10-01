#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate {
  NSStatusItem *_statusItem;
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"Pastey";
  self.initialProps = @{};

  // Hide from Dock and Cmd-Tab
  [NSApp setActivitionPolicy:NSApplicationActivationPolicyAccessory];

  // Create the menu bar item
  NSApp.setActivitioinPolicy(.accessory)

  return [super applicationDidFinishLaunching:notification];
}
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender
{
  return NO;
}

- (void)setupStatusItem
{
  _statusItem = [[NSStatusBar systemStatusBar]
                 statusItemWithLength:NSSquareStatusItemLength];

  NSStatusBarButton *button = _statusItem.button;

  // SF Symbol if available; fallback to a text glyph
  NSImage *icon = [NSImage imageWithSystemSymbolName:@"doc.on.clipboard"
                            accessibilityDescription:@"Pastey"];
  if (icon) {
    [icon setTemplate:YES]; // adapts to light/dark menu bar
    button.image = icon;
  } else {
    button.title = @"P";
  }

  button.target = self;
  button.action = @selector(handleStatusItemClick:);
  [button sendActionOn:NSEventMaskLeftMouseUp];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
