#import "AppDelegate.h"
#import <Cocoa/Cocoa.h>
#import <React/RCTBundleURLProvider.h>
#import "Pastey-Swift.h"

@interface AppDelegate ()

@property(nonatomic, strong) NSStatusItem *pasteyStatusItem;
@property(nonatomic, strong) NSMenu *pasteyStatusMenu;
@property(nonatomic, strong) NSView *pasteyRootViewInstance;

@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"Pastey";
  self.initialProps = @{@"mode": @"popover"};

  [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

  NSString *savedTheme = [[NSUserDefaults standardUserDefaults] stringForKey:@"theme"];
  if ([savedTheme isEqualToString:@"light"]) {
    NSApp.appearance = [NSAppearance appearanceNamed:NSAppearanceNameAqua];
  } else if ([savedTheme isEqualToString:@"dark"]) {
    NSApp.appearance = [NSAppearance appearanceNamed:NSAppearanceNameDarkAqua];
  } else {
    CFStringRef style = (CFStringRef)CFPreferencesCopyAppValue(CFSTR("AppleInterfaceStyle"), kCFPreferencesAnyApplication);
    BOOL isDark = NO;
    if (style != NULL) {
      if ([(__bridge NSString *)style isEqualToString:@"Dark"]) {
        isDark = YES;
      }
      CFRelease(style);
    }
    if (!isDark && @available(macOS 10.14, *)) {
      NSAppearanceName matched = [[NSApp effectiveAppearance] bestMatchFromAppearancesWithNames:@[NSAppearanceNameAqua, NSAppearanceNameDarkAqua]];
      if ([matched isEqualToString:NSAppearanceNameDarkAqua]) {
        isDark = YES;
      }
    }
    NSApp.appearance = [NSAppearance appearanceNamed:(isDark ? NSAppearanceNameDarkAqua : NSAppearanceNameAqua)];
  }

  // Prevent default standard window from opening
  self.automaticallyLoadReactNativeWindow = NO;

  [super applicationDidFinishLaunching:notification];

  [self setupMainMenu];

  // Preload React Native root view so clipboard monitoring and hotkeys activate immediately
  self.pasteyRootViewInstance = [self.rootViewFactory viewWithModuleName:self.moduleName
                                                       initialProperties:self.initialProps
                                                           launchOptions:nil];
  self.pasteyRootViewInstance.frame = NSMakeRect(0, 0, 420, 520);
  self.pasteyRootViewInstance.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;

  [self setupStatusItem];
}

// A menu bar item's key equivalent only fires while that menu is open, so the
// status menu alone cannot deliver an app-wide Cmd+,. This app runs as an
// accessory, so the main menu stays hidden until a window activates it.
- (void)setupMainMenu
{
  NSMenu *mainMenu = [[NSMenu alloc] init];

  NSMenuItem *appMenuItem = [[NSMenuItem alloc] init];
  NSMenu *appMenu = [[NSMenu alloc] init];

  NSMenuItem *preferences =
      [[NSMenuItem alloc] initWithTitle:@"Preferences…"
                                 action:@selector(openSettings:)
                          keyEquivalent:@","];
  preferences.target = self;
  [appMenu addItem:preferences];

  [appMenu addItem:[NSMenuItem separatorItem]];

  NSMenuItem *quit = [[NSMenuItem alloc] initWithTitle:@"Quit Pastey"
                                                action:@selector(quitApp:)
                                         keyEquivalent:@"q"];
  quit.target = self;
  [appMenu addItem:quit];

  appMenuItem.submenu = appMenu;
  [mainMenu addItem:appMenuItem];

  NSApp.mainMenu = mainMenu;
}

- (NSStatusBarButton *)statusItemButton
{
  return self.pasteyStatusItem.button;
}

- (NSView *)pasteyRootView
{
  if (self.pasteyRootViewInstance == nil) {
    self.pasteyRootViewInstance = [self.rootViewFactory viewWithModuleName:self.moduleName
                                                         initialProperties:self.initialProps
                                                             launchOptions:nil];
    self.pasteyRootViewInstance.frame = NSMakeRect(0, 0, 420, 520);
    self.pasteyRootViewInstance.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  }
  return self.pasteyRootViewInstance;
}

- (NSView *)rootViewForModuleName:(NSString *)moduleName
                      initialProps:(NSDictionary *)initialProps
{
  return [self.rootViewFactory viewWithModuleName:moduleName
                                 initialProperties:initialProps
                                     launchOptions:nil];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:
    (NSApplication *)sender
{
  return NO;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender
                    hasVisibleWindows:(BOOL)flag
{
  [PopoverModule togglePopover];
  return YES;
}

- (void)setupStatusItem
{
  self.pasteyStatusItem =
      [[NSStatusBar systemStatusBar]
          statusItemWithLength:NSSquareStatusItemLength];

  NSStatusBarButton *button = self.pasteyStatusItem.button;
  button.toolTip = @"Pastey";

  NSImage *icon = [NSImage imageNamed:NSImageNameApplicationIcon];
  if (icon == nil) {
    icon = [NSImage imageNamed:@"AppIcon"];
  }

  if (icon != nil) {
    NSImage *statusBarIcon = [icon copy];
    statusBarIcon.size = NSMakeSize(18, 18);
    [statusBarIcon setTemplate:YES];
    button.image = statusBarIcon;
  } else if (@available(macOS 11.0, *)) {
    icon = [NSImage imageWithSystemSymbolName:@"doc.on.clipboard"
                    accessibilityDescription:@"Pastey"];
    [icon setTemplate:YES];
    button.image = icon;
  } else {
    button.title = @"P";
  }

  button.target = self;
  button.action = @selector(handleStatusItemClick:);

  [button sendActionOn:
      (NSEventMaskLeftMouseUp | NSEventMaskRightMouseUp)];

  // Guarantee that right clicks on the status button always present the menu
  [NSEvent addLocalMonitorForEventsMatchingMask:(NSEventMaskRightMouseDown | NSEventMaskRightMouseUp)
                                       handler:^NSEvent *(NSEvent *event) {
    NSStatusBarButton *statusButton = self.pasteyStatusItem.button;
    if (statusButton != nil && event.window == statusButton.window) {
      NSPoint mouseLoc = [statusButton convertPoint:event.locationInWindow fromView:nil];
      if (NSPointInRect(mouseLoc, statusButton.bounds)) {
        if (event.type == NSEventTypeRightMouseDown) {
          [self showStatusMenu];
        }
        return nil;
      }
    }
    return event;
  }];

  NSMenu *menu = [[NSMenu alloc] initWithTitle:@"Pastey"];
  menu.autoenablesItems = NO;

  NSMenuItem *toggleItem =
      [[NSMenuItem alloc] initWithTitle:@"Toggle Pastey"
                                action:@selector(togglePopoverAction:)
                         keyEquivalent:@""];
  toggleItem.target = self;
  [menu addItem:toggleItem];

  [menu addItem:[NSMenuItem separatorItem]];

  NSMenuItem *preferencesItem =
      [[NSMenuItem alloc] initWithTitle:@"Preferences…"
                                action:@selector(openSettings:)
                         keyEquivalent:@","];
  preferencesItem.target = self;
  [menu addItem:preferencesItem];

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
       event.type == NSEventTypeRightMouseDown ||
       (event.modifierFlags & NSEventModifierFlagControl) != 0);

  if (isRightClick) {
    [self showStatusMenu];
  } else {
    [PopoverModule togglePopover];
  }
}

- (void)togglePopoverAction:(id)sender
{
  [PopoverModule togglePopover];
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

- (void)openSettings:(id)sender
{
  [SettingsWindowModule openSettings];
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