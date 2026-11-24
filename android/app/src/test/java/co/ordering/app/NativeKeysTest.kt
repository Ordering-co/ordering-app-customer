package co.ordering.app

import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The rule of the optional Builder keys with the table every copy is tested
 * with (src/utils/nativeKeys.cases.json; also src/utils/__tests__/nativeKeys.test.ts
 * and ios/native_keys_test.rb):
 *
 *     ./gradlew :app:testDebugUnitTest --tests 'co.ordering.app.NativeKeysTest'
 */
class NativeKeysTest {
  /** Gradle runs the tests from android/app. */
  private val table: JSONObject by lazy {
    val file = generateSequence(File("").absoluteFile) { it.parentFile }
      .map { File(it, "src/utils/nativeKeys.cases.json") }
      .first { it.isFile }
    JSONObject(file.readText())
  }

  private fun strings(array: JSONArray) = (0 until array.length()).map { array.getString(it) }

  @Test
  fun theTableHasEveryKind() {
    val kinds = table.keys().asSequence().filter { it != "//" }.toSet()
    assertEquals(NativeKeys.Kind.values().map { it.name.lowercase() }.toSet(), kinds)
  }

  @Test
  fun everyCaseOfTheTable() {
    val failures = mutableListOf<String>()
    var cases = 0
    for (kind in NativeKeys.Kind.values()) {
      val entry = table.getJSONObject(kind.name.lowercase())
      for ((expected, key) in listOf(false to "off", true to "on")) {
        for (value in strings(entry.getJSONArray(key))) {
          cases++
          if (NativeKeys.isConfigured(value, kind) != expected) {
            failures += "${kind.name.lowercase()}: \"$value\" must be $key"
          }
        }
      }
    }
    assertTrue("no case read", cases > 100)
    assertEquals(emptyList<String>(), failures)
    println("NativeKeysTest: $cases cases of the table pass")
  }

  @Test
  fun aKeyThatIsMissingIsOff() {
    NativeKeys.Kind.values().forEach { assertFalse(NativeKeys.isConfigured(null, it)) }
  }

  @Test
  fun theGenericRuleWithoutAKind() {
    assertTrue(NativeKeys.isConfigured("AIzaSyA-123"))
    assertFalse(NativeKeys.isConfigured("0"))
    assertFalse(NativeKeys.isConfigured("-"))
  }
}
