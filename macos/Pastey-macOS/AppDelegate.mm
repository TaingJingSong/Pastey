#import "AppDelegate.h"
#import <Cocoa/Cocoa.h>
#import <React/RCTBundleURLProvider.h>

@interface AppDelegate () <NSWindowDelegate>

@property(nonatomic, strong) NSStatusItem *pasteyStatusItem;
@property(nonatomic, strong) NSWindow *pasteyMainWindow;
@property(nonatomic, strong) NSMenu *pasteyStatusMenu;

@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"Pastey";
  self.initialProps = @{};

  [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

  // React Native creates its window here.
  [super applicationDidFinishLaunching:notification];

  self.pasteyMainWindow = self.window;

  if (self.pasteyMainWindow != nil) {
    self.pasteyMainWindow.releasedWhenClosed = NO;
    self.pasteyMainWindow.delegate = self;
  }

  [self setupStatusItem];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:
    (NSApplication *)sender
{
  return NO;
}

- (BOOL)windowShouldClose:(NSWindow *)sender
{
  if (sender == self.pasteyMainWindow) {
    // Hide the window while keeping React Native mounted.
    [sender orderOut:nil];
    return NO;
  }

  return YES;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender
                   hasVisibleWindows:(BOOL)flag
{
  [self showMainWindow:nil];
  return YES;
}

- (void)setupStatusItem
{
  self.pasteyStatusItem =
      [[NSStatusBar systemStatusBar]
          statusItemWithLength:NSSquareStatusItemLength];

  NSStatusBarButton *button = self.pasteyStatusItem.button;
  button.toolTip = @"Pastey";

  NSImage *icon = nil;

  if (@available(macOS 11.0, *)) {
    icon = [NSImage imageWithSystemSymbolName:@"doc.on.clipboard"
                    accessibilityDescription:@"Pastey"];
  }

  if (icon != nil) {
    [icon setTemplate:YES];
    button.image = icon;
  } else {
    button.title = @"P";
  }

  button.target = self;
  button.action = @selector(handleStatusItemClick:);

  [button sendActionOn:
      (NSEventMaskLeftMouseUp | NSEventMaskRightMouseUp)];

  NSMenu *menu = [[NSMenu alloc] initWithTitle:@"Pastey"];
  menu.autoenablesItems = NO;

  NSMenuItem *showItem =
      [[NSMenuItem alloc] initWithTitle:@"Show Pastey"
                                action:@selector(showMainWindow:)
                         keyEquivalent:@""];
  showItem.target = self;
  [menu addItem:showItem];

  [menu addItem:[NSMenuItem separatorItem]];

  NSMenuItem *quitItem =
      [[NSMenuItem alloc] initWithTitle:@"Quit Pastey"
                                action:@selector(quitApp:)
                         keyEquivalent:@"q"];
  quitItem.target = self;
  [menu addItem:quitItem];

  self.pasteyStatusMenu = menu;
}

- (void)handleStatusItemClick:(id)sender
{
  NSEvent *event = NSApp.currentEvent;

  BOOL isRightClick =
      event != nil &&
      (event.type == NSEventTypeRightMouseUp ||
       (event.modifierFlags & NSEventModifierFlagControl) != 0);

  if (isRightClick) {
    [self showStatusMenu];
  } else {
    [self showMainWindow:sender];
  }
}

- (void)showMainWindow:(id)sender
{
  NSWindow *window = self.pasteyMainWindow;

  if (window == nil) {
    return;
  }

  [NSApp unhideWithoutActivation];

  if (window.isMiniaturized) {
    [window deminiaturize:nil];
  }

  [window makeKeyAndOrderFront:nil];
  [NSApp activateIgnoringOtherApps:YES];
}

- (void)showStatusMenu
{
  NSStatusBarButton *button = self.pasteyStatusItem.button;

  if (button == nil) {
    return;
  }

  // Show the menu directly instead of triggering another button action.
  [self.pasteyStatusMenu
      popUpMenuPositioningItem:nil
                    atLocation:NSMakePoint(NSMinX(button.bounds),
                                           NSMinY(button.bounds))
                        inView:button];
}

- (void)quitApp:(id)sender
{
  [NSApp terminate:nil];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings]
      jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle]
      URLForResource:@"main"
       withExtension:@"jsbundle"];
#endif
}

- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return YES;
#else
  return NO;
#endif
}

@end