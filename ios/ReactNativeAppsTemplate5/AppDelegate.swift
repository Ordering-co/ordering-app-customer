import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps
import AuthenticationServices
import SafariServices
import FBSDKCoreKit
import FirebaseCore
import RNBootSplash

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Explicit local onboarding is available only in a Debug simulator build.
    // Normal and Release launches still initialize their own Firebase registration.
#if DEBUG && targetEnvironment(simulator)
    let orderingLocalSimulator = ProcessInfo.processInfo.environment["ORDERING_LOCAL_SIMULATOR"] == "1"
#else
    let orderingLocalSimulator = false
#endif
    UserDefaults.standard.set(orderingLocalSimulator, forKey: "OrderingLocalSimulatorMode")
    UserDefaults.standard.removeObject(forKey: "OrderingLocalSimulatorConfig")
    if orderingLocalSimulator,
       let encoded = ProcessInfo.processInfo.environment["ORDERING_LOCAL_CONFIG"],
       let data = encoded.data(using: .utf8),
       let configuration = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
      UserDefaults.standard.set(configuration, forKey: "OrderingLocalSimulatorConfig")
    }
    if !orderingLocalSimulator {
      FirebaseApp.configure()
    }
    UserAgent.install()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // Each optional SDK starts only when its keys are set (NativeKeys).
    if !orderingLocalSimulator && NativeKeys.facebook {
      ApplicationDelegate.shared.application(
        application,
        didFinishLaunchingWithOptions: launchOptions
      )
    }

    // Without Google Maps' key the app shows no native map.
    if !orderingLocalSimulator && NativeKeys.googleMaps {
      GMSServices.provideAPIKey(NativeKeys.trimmed(NativeKeys.googleMapsApiKey))
    }

    if !orderingLocalSimulator && NativeKeys.intercom {
      IntercomModule.initialize(
        NativeKeys.trimmed(NativeKeys.intercomApiKey),
        withAppId: NativeKeys.trimmed(NativeKeys.intercomAppId)
      )
    }

    // The window and React Native start in SceneDelegate (UIScene lifecycle,
    // required from iOS 27); the launch options are kept for it.
    self.launchOptions = launchOptions

    return true
  }

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }

  // Manejo de URLs para deep linking y Facebook
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    // Handle Facebook SDK URLs
    if NativeKeys.facebook && ApplicationDelegate.shared.application(app, open: url, options: options) {
      return true
    }

    // Manejar URLs con React Native Linking
    if RCTLinkingManager.application(app, open: url, options: options) {
      return true
    }

    return false
  }
}

/// The app's one scene (UIScene lifecycle): its window hosts React Native, and
/// the URLs it receives (deep links, Facebook login) go to the Facebook SDK
/// and to React Native's Linking.
///
/// Linking has its own entry points for a scene app: the app delegate's ones
/// (`RCTLinkingManager.application(_:open:options:)`,
/// `application(_:continue:restorationHandler:)`) do nothing once the app has
/// a scene manifest, so a link opened while the app runs goes through
/// `RCTLinkingManager.scene(_:openURLContexts:)` / `scene(_:continue:)`, and
/// the one that launched the app is handed to React Native as a launch option
/// (`Linking.getInitialURL()` reads it from there: no JS listens yet).
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "ReactNativeAppsTemplate5",
      in: window,
      initialProperties: ["nativeFeatures": UserDefaults.standard.bool(forKey: "OrderingLocalSimulatorMode")
        ? NativeKeys.forJS.mapValues { _ in false }
        : NativeKeys.forJS],
      launchOptions: SceneDelegate.launchOptions(appDelegate.launchOptions, connectionOptions)
    )

    // A URL that launched the app from scratch: the Facebook SDK sees it too.
    if let context = connectionOptions.urlContexts.first {
      _ = SceneDelegate.facebookHandles(context)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let context = URLContexts.first else { return }
    if SceneDelegate.facebookHandles(context) { return }
    RCTLinkingManager.scene(scene, openURLContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.scene(scene, continue: userActivity)
  }

  /// Whether the URL is the Facebook SDK's (a login coming back). Without
  /// Facebook's keys its SDK was not started (NativeKeys): it is not asked.
  private static func facebookHandles(_ context: UIOpenURLContext) -> Bool {
    NativeKeys.facebook && ApplicationDelegate.shared.application(
      UIApplication.shared,
      open: context.url,
      sourceApplication: context.options.sourceApplication,
      annotation: context.options.annotation
    )
  }

  /// The app's launch options plus what launched the scene: with scenes, the
  /// URL (or the universal link) arrives in the connection options, and the
  /// app delegate's launch options no longer carry it.
  static func launchOptions(
    _ launchOptions: [UIApplication.LaunchOptionsKey: Any]?,
    _ connectionOptions: UIScene.ConnectionOptions
  ) -> [UIApplication.LaunchOptionsKey: Any] {
    var options = launchOptions ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      options[.url] = url
    }
    if let activity = connectionOptions.userActivities.first(where: { $0.activityType == NSUserActivityTypeBrowsingWeb }) {
      options[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity
      ] as [String: Any]
    }
    return options
  }
}

/// The optional keys the Builder writes (base 100's actions replace each
/// placeholder's text): Google Maps' key and Intercom's two below, Facebook's
/// app id and client token and Google Sign-In's reversed client id in
/// Info.plist, Apple Pay's merchant id in the entitlements.
///
/// What is a real value and what switches a key off is decided when the app is
/// built, by ios/native_keys.rb (the build phase `[CP-User] Native keys:
/// Info.plist`): it writes `OrderingNativeFeatures` into the built Info.plist
/// and takes out the URL types of the keys that are off. Here the app only
/// reads it: an SDK is started when its feature is on, and JS gets the same
/// booleans (the root's `nativeFeatures`, src/utils/nativeKeys.ts) to hide
/// what is off.
enum NativeKeys {
  // Replaced by the Builder. ios/native_keys.rb reads these three lines: keep
  // each as `static let <name> = "<value>"`, and never write a placeholder's
  // text anywhere else in this file (the Builder replaces every occurrence).
  static let googleMapsApiKey = "_GOOGLE_MAPS_API_KEY_"
  static let intercomApiKey = "_INTERCOM_API_KEY_"
  static let intercomAppId = "_INTERCOM_APP_ID_"

  /// What ios/native_keys.rb decided; everything off when the build phase did not run.
  static let forJS: [String: Bool] = {
    let names = ["googleMaps", "facebook", "googleSignIn", "applePay", "intercom"]
    let decided = Bundle.main.object(forInfoDictionaryKey: "OrderingNativeFeatures") as? [String: Any]
    if decided == nil {
      NSLog("[NativeKeys] OrderingNativeFeatures is missing from Info.plist: the build phase \"[CP-User] Native keys: Info.plist\" did not run (pod install); every optional feature is off")
    }
    return Dictionary(uniqueKeysWithValues: names.map { ($0, decided?[$0] as? Bool ?? false) })
  }()

  /// The native map (GMSServices has a key).
  static var googleMaps: Bool { forJS["googleMaps"] ?? false }
  /// Facebook's SDK: an app id and a client token.
  static var facebook: Bool { forJS["facebook"] ?? false }
  /// Intercom's SDK: an API key and an app id.
  static var intercom: Bool { forJS["intercom"] ?? false }

  static func trimmed(_ value: String) -> String {
    value.trimmingCharacters(in: .whitespacesAndNewlines)
  }
}

/// The User-Agent of the app's requests (`fetch`, `XMLHttpRequest`, images):
///
/// `<App>/<version> (<bundle id>; build:<build>; iOS <version>; <model>) CFNetwork/<version> Darwin/<version>`
///
/// The system's own is `<App>/<build> CFNetwork/… Darwin/…`: the build number
/// as the version, no OS version nor device. Android sends the same shape
/// (`UserAgent.kt`). A User-Agent the JS sets on a request is kept (a request's
/// header wins over the session's).
///
/// The same session adds the device's id (`X-Device-Id-X`, `DeviceId`).
enum UserAgent {
  static func install() {
    let value = make()
    RCTSetCustomNSURLSessionConfigurationProvider {
      var headers = ["User-Agent": value]
      // Read when React Native opens its session, not at launch: a launch before the
      // first unlock (a push after a restart) cannot read the Keychain yet.
      if let deviceId = DeviceId.read() {
        headers[DeviceId.header] = deviceId
      }
      // React Native's default session (RCTHTTPRequestHandler), plus the headers.
      let configuration = URLSessionConfiguration.default
      if let wifiOnly = Bundle.main.object(forInfoDictionaryKey: "ReactNetworkForceWifiOnly") as? NSNumber {
        configuration.allowsCellularAccess = !wifiOnly.boolValue
      }
      configuration.httpShouldSetCookies = true
      configuration.httpCookieAcceptPolicy = .always
      configuration.httpCookieStorage = HTTPCookieStorage.shared
      configuration.httpAdditionalHeaders = headers
      return configuration
    }
  }

  static func make() -> String {
    let info = Bundle.main.infoDictionary ?? [:]
    let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
    let name = token(info["CFBundleName"] as? String).isEmpty ? token(bundleId) : token(info["CFBundleName"] as? String)
    let version = token(info["CFBundleShortVersionString"] as? String)
    let build = token(info["CFBundleVersion"] as? String)
    let os = ProcessInfo.processInfo.operatingSystemVersion
    let osVersion = os.patchVersion > 0
      ? "\(os.majorVersion).\(os.minorVersion).\(os.patchVersion)"
      : "\(os.majorVersion).\(os.minorVersion)"
    let cfNetwork = Bundle(identifier: "com.apple.CFNetwork")?.infoDictionary?["CFBundleVersion"] as? String ?? "unknown"
    var system = utsname()
    uname(&system)
    let darwin = field(&system.release)
    let model = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] ?? field(&system.machine)
    let product = version.isEmpty ? name : "\(name)/\(version)"
    return "\(product) (\(bundleId); build:\(build); iOS \(osVersion); \(model)) CFNetwork/\(cfNetwork) Darwin/\(darwin)"
  }

  /// An RFC 7231 token (letters, digits and `!#$%&'*+-.^_`|~`).
  private static func token(_ value: String?) -> String {
    let allowed = Set("!#$%&'*+-.^_`|~")
    return String((value ?? "").filter { $0.isASCII && ($0.isLetter || $0.isNumber || allowed.contains($0)) })
  }

  private static func field<T>(_ value: inout T) -> String {
    withUnsafePointer(to: &value) {
      $0.withMemoryRebound(to: CChar.self, capacity: MemoryLayout<T>.size) { String(cString: $0) }
    }
  }
}

/// The device's id the app sends in `X-Device-Id-X` on every request (`UserAgent`),
/// for the API's analytics. It does not depend on the cookie consent.
///
/// A UUID v4 made the first time and kept in the Keychain, so it stays the same
/// when the app is reinstalled. `…AfterFirstUnlockThisDeviceOnly`: it never
/// travels to another phone with a backup, and it is not synchronized with iCloud.
/// Android sends its ANDROID_ID under the same header (`DeviceId.kt`).
enum DeviceId {
  static let header = "X-Device-Id-X"

  private static let item: [CFString: Any] = [
    kSecClass: kSecClassGenericPassword,
    kSecAttrService: "co.ordering.app.device-id",
    kSecAttrAccount: "device-id",
  ]

  private enum Kept {
    case id(String)
    /// No id kept, or one that is not a UUID.
    case missing
    /// The Keychain cannot be read now.
    case unreadable
  }

  /// The kept id, or a new one. Nil when the Keychain cannot be read now (before
  /// the first unlock): never a new id then, it would replace the kept one.
  static func read() -> String? {
    switch kept() {
    case .id(let id):
      return id
    case .unreadable:
      return nil
    case .missing:
      // One that is not a UUID is replaced.
      SecItemDelete(item as CFDictionary)
    }
    let id = UUID().uuidString.lowercased()
    var attributes = item
    attributes[kSecValueData] = Data(id.utf8)
    attributes[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    switch SecItemAdd(attributes as CFDictionary, nil) {
    case errSecSuccess:
      return id
    case errSecDuplicateItem:
      // Another read kept one first.
      if case .id(let kept) = kept() { return kept }
      return nil
    default:
      return nil
    }
  }

  private static func kept() -> Kept {
    var query = item
    query[kSecReturnData] = true
    query[kSecMatchLimit] = kSecMatchLimitOne
    var result: AnyObject?
    switch SecItemCopyMatching(query as CFDictionary, &result) {
    case errSecSuccess:
      guard let data = result as? Data, let id = String(data: data, encoding: .utf8), UUID(uuidString: id) != nil else {
        return .missing
      }
      return .id(id)
    case errSecItemNotFound:
      return .missing
    default:
      return .unreadable
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  /// The splash (BootSplash.storyboard, the launch screen) stays over the app
  /// until JS hides it (src/utils/splash.ts).
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    if UserDefaults.standard.bool(forKey: "OrderingLocalSimulatorMode"),
       let port = ProcessInfo.processInfo.environment["ORDERING_LOCAL_METRO_PORT"],
       let number = Int(port), (1024...65535).contains(number) {
      return URL(string: "http://127.0.0.1:\(number)/index.bundle?platform=ios&dev=true&minify=false")
    }
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
