package com.reactnativeappstemplate5

import android.os.Bundle
import android.view.View
import co.ordering.app.NativeKeys
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens restores its fragments after the process dies
    // (react-native-bootsplash's README, react-native-screens >= 4.16).
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    // Before super.onCreate(): the splash (BootTheme, res/values/styles.xml)
    // stays over the app until JS hides it (src/utils/splash.ts).
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)

    val contentView = window.decorView.findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(contentView) { view, insets ->
      val navigationBarInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
      view.setPadding(0, 0, 0, navigationBarInsets.bottom)
      insets
    }
  }
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ReactNativeAppsTemplate5"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        // What the optional native keys allow, for JS to hide what is off (NativeKeys.kt).
        override fun getLaunchOptions(): Bundle =
            Bundle().apply { putBundle("nativeFeatures", NativeKeys.forJS()) }
      }
}
