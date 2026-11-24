package com.reactnativeappstemplate5

import android.app.Application
import co.ordering.app.NativeKeys
import co.ordering.app.UserAgent
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.reactnative.androidsdk.FBSDKPackage
import com.intercom.reactnative.IntercomModule

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())

          // Without Facebook's keys its SDK is not started (NativeKeys): its modules, which
          // call it as soon as JS reads them, stay out.
          if (!NativeKeys.facebook) removeAll { it is FBSDKPackage }
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Replaced by the Builder; each optional SDK starts only when its keys are set (NativeKeys).
    val intercomApiKey = "_INTERCOM_API_KEY_"
    val intercomAppId = "_INTERCOM_APP_ID_"
    NativeKeys.load(this, intercomApiKey, intercomAppId)

    UserAgent.install(this)
    NativeKeys.startFacebook(this)
    loadReactNative(this)
    if (NativeKeys.intercom) {
      try {
        IntercomModule.initialize(this, intercomApiKey.trim(), intercomAppId.trim())
      } catch (e: Exception) {
        // Intercom's keys are not valid: skip it rather than stop the app (IntercomIntegrationException).
      }
    }
  }
}
