package co.ordering.app

import android.content.Context
import android.content.pm.PackageInfo
import android.os.Build
import com.facebook.react.modules.network.NetworkingModule
import okhttp3.OkHttp

/**
 * The User-Agent of the app's requests (`fetch`, `XMLHttpRequest`: every API call):
 *
 * `<App>/<version> (<package>; build:<code>; Android <release>; <maker> <model>) okhttp/<version>`
 *
 * React Native's own is only `<App>/<version>`, so the API could not tell an
 * Android app (`UserAgentHelper::isAndroid`, the metering's client family) nor
 * its build or device. iOS sends the same shape (`AppDelegate.swift`). A
 * User-Agent the JS sets on a request is kept.
 *
 * The same interceptor adds the device's id (`X-Device-Id-X`, `DeviceId`): React Native
 * takes one client builder only, so every header of the app's own goes here.
 *
 * In the fixed package `co.ordering.app`, not the app's: the Builder
 * renames the app's package (com.reactnativeappstemplate5) only in the files
 * its base lists, so a class of its own lives here and is imported.
 */
object UserAgent {
  private const val HEADER = "User-Agent"

  fun install(context: Context) {
    val pm = context.packageManager
    val packageName = context.packageName
    val info = pm.getPackageInfo(packageName, 0)
    val name = token(pm.getApplicationLabel(context.applicationInfo).toString()).ifEmpty { token(packageName) }
    val version = token(info.versionName)
    // The one React Native sets when the JS sets none (NetworkingModule): replaced.
    val reactDefault = if (version.isEmpty()) name else "$name/$version"
    val value =
      "$reactDefault ($packageName; build:${versionCode(info)}; " +
        "Android ${comment(Build.VERSION.RELEASE)}; ${comment("${Build.MANUFACTURER} ${Build.MODEL}")}) " +
        "okhttp/${OkHttp.VERSION}"
    val deviceId = DeviceId.read(context)

    NetworkingModule.setCustomClientBuilder { builder ->
      builder.addInterceptor { chain ->
        val request = chain.request()
        val headers = request.newBuilder()
        val current = request.header(HEADER)
        if (current == null || current == reactDefault) headers.header(HEADER, value)
        if (deviceId != null && request.header(DeviceId.HEADER) == null) headers.header(DeviceId.HEADER, deviceId)
        chain.proceed(headers.build())
      }
    }
  }

  private fun versionCode(info: PackageInfo): Long =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()

  /** An RFC 7231 token, as React Native reduces the app's name (OkHttp rejects anything outside ASCII). */
  private fun token(value: String?): String =
    value.orEmpty().filter { it in 'a'..'z' || it in 'A'..'Z' || it in '0'..'9' || it in "!#$%&'*+-.^_`|~" }

  /** Printable ASCII without the comment's own delimiters, spaces collapsed. */
  private fun comment(value: String?): String =
    value.orEmpty().filter { it in ' '..'~' && it !in "();" }.trim().replace(Regex(" +"), " ").ifEmpty { "unknown" }
}
