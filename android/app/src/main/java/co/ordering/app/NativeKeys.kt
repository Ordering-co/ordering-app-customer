package co.ordering.app

import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import com.facebook.FacebookSdk

/**
 * The optional keys the Builder writes into the Android files (base 100's
 * actions replace each placeholder's text with the value of the constant):
 * Google Maps' key in AndroidManifest.xml, Facebook's app id and client token
 * in res/values/strings.xml (the manifest's meta-data point at them),
 * Intercom's API key and app id in MainApplication.kt.
 *
 * This file is Android's one copy of the rule that tells a real value from a
 * key that is off ([isConfigured]; the same as src/utils/nativeKeys.ts and
 * ios/native_keys.rb, all three tested with src/utils/nativeKeys.cases.json:
 * NativeKeysTest.kt). MainApplication loads the keys once ([load]) and starts
 * each SDK only when its keys are set; JS gets the booleans (the root
 * component's `nativeFeatures`, App.tsx) and hides what is off.
 *
 * In the fixed package `co.ordering.app` (see UserAgent.kt).
 */
object NativeKeys {
  /** What a key is, for the shape its value must have. */
  enum class Kind(val shape: Regex? = null) {
    GENERIC,
    /** `merchant.…` */
    MERCHANT_ID(Regex("merchant\\.[!-~]+")),
    /** Digits only (and not zero). */
    FACEBOOK_ID(Regex("[0-9]+")),
    /** As [GENERIC], but `0` stays a value (as before this rule). */
    FACEBOOK_CLIENT_TOKEN,
    /** `com.googleusercontent.apps.…` */
    GOOGLE_REVERSED_CLIENT_ID(Regex("com\\.googleusercontent\\.apps\\.[A-Za-z0-9.-]+")),
  }

  private const val TAG = "NativeKeys"
  private const val MAPS_KEY = "com.google.android.maps.v2.API_KEY"
  private const val FACEBOOK_APP_ID = "com.facebook.sdk.ApplicationId"
  private const val FACEBOOK_CLIENT_TOKEN = "com.facebook.sdk.ClientToken"

  /** A placeholder the Builder has not replaced: capitals, digits and underscores between two underscores. */
  private val PLACEHOLDER = Regex("_[A-Z0-9_]*_")
  /** The values that switch a key off (any case), besides the empty one and a placeholder. */
  private val OFF_VALUES = setOf("none", "null", "-", "0")
  private val ZEROS = Regex("0+")

  /**
   * Whether a key the Builder writes holds a real value: not empty, `none`,
   * `null`, `-`, `0` nor its placeholder left as it is, and of its kind's shape.
   */
  fun isConfigured(value: String?, kind: Kind = Kind.GENERIC): Boolean {
    val key = value?.trim().orEmpty()
    if (key.isEmpty() || PLACEHOLDER.matches(key)) return false
    val off = if (kind == Kind.FACEBOOK_CLIENT_TOKEN) OFF_VALUES - "0" else OFF_VALUES
    if (key.lowercase() in off) return false
    if (kind == Kind.FACEBOOK_ID && ZEROS.matches(key)) return false
    return kind.shape?.matches(key) ?: true
  }

  /** The native map: the manifest has Google Maps' key. */
  var googleMaps = false
    private set

  /** Facebook's SDK: an app id and a client token. */
  var facebook = false
    private set

  /** Intercom's SDK: an API key and an app id. */
  var intercom = false
    private set

  private var facebookAppId = ""
  private var facebookClientToken = ""

  /** Reads the keys (MainApplication.onCreate, before anything uses them). */
  fun load(context: Context, intercomApiKey: String, intercomAppId: String) {
    val metaData = metaData(context)
    facebookAppId = metaData?.get(FACEBOOK_APP_ID)?.toString().orEmpty().trim()
    facebookClientToken = metaData?.get(FACEBOOK_CLIENT_TOKEN)?.toString().orEmpty().trim()
    googleMaps = isConfigured(metaData?.get(MAPS_KEY)?.toString())
    facebook = isConfigured(facebookAppId, Kind.FACEBOOK_ID) &&
      isConfigured(facebookClientToken, Kind.FACEBOOK_CLIENT_TOKEN)
    intercom = isConfigured(intercomApiKey) && isConfigured(intercomAppId)
  }

  /**
   * Starts Facebook's SDK when its keys are set. Its own start (the provider
   * `FacebookInitProvider`, taken out of the manifest) runs whatever the keys:
   * with an id that is not one it asks Graph for that app's settings, and with
   * an empty one it throws and leaves the SDK unusable. Without the keys
   * nothing of the SDK runs: MainApplication also leaves its React Native
   * package out, and JS hides the Facebook button and logs no app event.
   */
  fun startFacebook(context: Context) {
    if (!facebook) return
    try {
      FacebookSdk.setApplicationId(facebookAppId)
      FacebookSdk.setClientToken(facebookClientToken)
      @Suppress("DEPRECATION")
      FacebookSdk.sdkInitialize(context.applicationContext)
    } catch (e: Exception) {
      Log.w(TAG, "Facebook's SDK did not start", e)
      facebook = false
    }
  }

  /** The root component's `nativeFeatures` (App.tsx). */
  fun forJS(): Bundle =
    Bundle().apply {
      putBoolean("googleMaps", googleMaps)
      putBoolean("facebook", facebook)
      putBoolean("intercom", intercom)
    }

  private fun metaData(context: Context): Bundle? =
    try {
      context.packageManager
        .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        .metaData
    } catch (e: Exception) {
      null
    }
}
