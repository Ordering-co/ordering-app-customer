# frozen_string_literal: true

# ruby ios/native_keys_test.rb
#
# The rule with the table every copy is tested with
# (src/utils/nativeKeys.cases.json), and what the Podfile and the build phases
# do with the entitlements and the built Info.plist (macOS only: plutil,
# PlistBuddy).

require 'minitest/autorun'
require 'tmpdir'
require_relative 'native_keys'

class NativeKeysRuleTest < Minitest::Test
  TABLE = JSON.parse(File.read(File.expand_path('../src/utils/nativeKeys.cases.json', __dir__))).reject { |kind, _| kind == '//' }

  def test_the_table_has_every_kind
    assert_equal NativeKeys::KINDS.map(&:to_s), TABLE.keys
  end

  TABLE.each do |kind, cases|
    cases['off'].each_with_index do |value, index|
      define_method("test_#{kind}_off_#{index}") do
        refute NativeKeys.configured?(value, kind.to_sym), "#{kind}: #{value.inspect} must be off"
      end
    end
    cases['on'].each_with_index do |value, index|
      define_method("test_#{kind}_on_#{index}") do
        assert NativeKeys.configured?(value, kind.to_sym), "#{kind}: #{value.inspect} must be on"
      end
    end
  end

  def test_what_is_not_a_string_is_off
    [nil, 0, 1, true, [], {}].each { |value| refute NativeKeys.configured?(value) }
  end

  def test_an_unknown_kind_raises
    assert_raises(ArgumentError) { NativeKeys.configured?('x', :other) }
  end
end

class NativeKeysFilesTest < Minitest::Test
  MACOS = File.executable?(NativeKeys::PLUTIL) && File.executable?(NativeKeys::PLIST_BUDDY)
  # The values the Builder writes for a key that is off, and a developer's untouched placeholders.
  OFF = ['none', 'null', '', '-', '0'].freeze

  def setup
    skip 'plutil and PlistBuddy: macOS only' unless MACOS
    @dir = Dir.mktmpdir('native-keys')
  end

  def teardown
    FileUtils.remove_entry(@dir) if @dir
  end

  def plist(name, hash)
    path = File.join(@dir, name)
    File.write(path, NativeKeys.plist_xml(hash))
    path
  end

  def entitlements(merchants)
    plist('App.entitlements',
          'aps-environment' => 'development',
          'com.apple.developer.applesignin' => ['Default'],
          NativeKeys::PAYMENTS => merchants,
          'com.apple.security.application-groups' => ['group.com.ordering.app1.onesignal'])
  end

  def app_delegate(maps: '_GOOGLE_MAPS_API_KEY_', api_key: '_INTERCOM_API_KEY_', app_id: '_INTERCOM_APP_ID_')
    path = File.join(@dir, 'AppDelegate.swift')
    File.write(path, <<~SWIFT)
      enum NativeKeys {
        static let googleMapsApiKey = "#{maps}"
        static let intercomApiKey = "#{api_key}"
        static let intercomAppId = "#{app_id}"
      }
    SWIFT
    path
  end

  # Info.plist as the Builder leaves it.
  def info_plist(google:, facebook_id:, client_token:, app_scheme: 'orderingapp', names: true)
    google_type = { 'CFBundleTypeRole' => 'Editor', 'CFBundleURLSchemes' => [google] }
    facebook_type = { 'CFBundleTypeRole' => 'Editor', 'CFBundleURLSchemes' => ["fb#{facebook_id}"] }
    if names
      google_type['CFBundleURLName'] = 'google'
      facebook_type['CFBundleURLName'] = 'facebook'
    end
    plist('Info.plist',
          'CFBundleURLTypes' => [
            google_type,
            facebook_type,
            { 'CFBundleTypeRole' => 'Editor', 'CFBundleURLName' => 'delivery', 'CFBundleURLSchemes' => ['delivery'] },
            { 'CFBundleTypeRole' => 'Editor', 'CFBundleURLSchemes' => ['com.ordering.app1'] },
            { 'CFBundleURLSchemes' => [app_scheme] }
          ],
          'FacebookAppID' => facebook_id,
          'FacebookClientToken' => client_token,
          'FacebookDisplayName' => 'test')
  end

  def schemes(path)
    NativeKeys.read_plist(path).fetch('CFBundleURLTypes', []).flat_map { |type| type['CFBundleURLSchemes'] }
  end

  def process(info, delegate: app_delegate, signing: nil)
    NativeKeys.process_info_plist(info, app_delegate: delegate, signing_entitlements: signing)
  end

  # --- Signing entitlements ---

  def test_apple_pay_is_left_out_without_a_merchant_id
    (OFF + ['_MERCHANT_ID_', 'com.ordering.v5app5']).each do |merchant|
      signing = File.join(@dir, 'App.signing.entitlements')
      assert NativeKeys.write_signing_entitlements(entitlements([merchant]), signing)
      written = NativeKeys.read_plist(signing)
      refute written.key?(NativeKeys::PAYMENTS), "#{merchant.inspect} must leave Apple Pay out"
      assert_equal 'development', written['aps-environment']
      assert_equal ['Default'], written['com.apple.developer.applesignin']
      refute NativeKeys.apple_pay?(signing)
      File.delete(signing)
    end
  end

  def test_apple_pay_stays_with_a_merchant_id
    signing = File.join(@dir, 'App.signing.entitlements')
    NativeKeys.write_signing_entitlements(entitlements([' merchant.com.ordering.app ', 'none']), signing)
    assert_equal ['merchant.com.ordering.app'], NativeKeys.read_plist(signing)[NativeKeys::PAYMENTS]
    assert NativeKeys.apple_pay?(signing)
  end

  def test_the_signing_entitlements_are_written_only_when_they_changed
    signing = File.join(@dir, 'App.signing.entitlements')
    source = entitlements(['merchant.com.ordering.app'])
    assert NativeKeys.write_signing_entitlements(source, signing)
    refute NativeKeys.write_signing_entitlements(source, signing)
    # The .entitlements changed (the merchant id went): the signing ones are out of date.
    entitlements(['none'])
    assert NativeKeys.write_signing_entitlements(source, signing)
    refute NativeKeys.apple_pay?(signing)
  end

  def test_the_check_phase_stops_a_build_with_entitlements_out_of_date
    source = entitlements(['merchant.com.ordering.app'])
    signing = File.join(@dir, 'App.signing.entitlements')
    NativeKeys.write_signing_entitlements(source, signing)
    env = { 'SRCROOT' => @dir, 'CODE_SIGN_ENTITLEMENTS' => 'App.signing.entitlements' }

    with_env(env) { assert_output(//) { NativeKeys.check_entitlements_phase } }

    entitlements(['none'])
    error = with_env(env) { assert_raises(NativeKeys::Error) { NativeKeys.check_entitlements_phase } }
    assert_match(/build again/, error.message)
    refute NativeKeys.apple_pay?(signing)
    # Written again: the next build goes on.
    with_env(env) { NativeKeys.check_entitlements_phase }
  end

  def test_no_apple_pay_without_signing_entitlements
    refute NativeKeys.apple_pay?(nil)
    refute NativeKeys.apple_pay?(File.join(@dir, 'missing.entitlements'))
  end

  # --- The built Info.plist ---

  def test_every_key_off_leaves_only_the_apps_own_schemes
    OFF.each do |off|
      [true, false].each do |names|
        info = info_plist(google: off, facebook_id: off, client_token: off, names: names)
        result = process(info, delegate: app_delegate(maps: off, api_key: off, app_id: off))

        assert_equal %w[delivery com.ordering.app1 orderingapp], schemes(info), "off value #{off.inspect}, names: #{names}"
        assert_equal({ 'googleMaps' => false, 'facebook' => false, 'googleSignIn' => false, 'applePay' => false, 'intercom' => false },
                     result[:features])
        assert_equal result[:features], NativeKeys.read_plist(info)[NativeKeys::FEATURES_KEY]
      end
    end
  end

  def test_untouched_placeholders_are_off_too
    info = info_plist(google: '_REVERSED_CLIENT_ID_', facebook_id: '_FACEBOOK_ID_', client_token: '_FACEBOOK_CLIENT_TOKEN_', app_scheme: '_APP_SCHEME_')
    result = process(info)

    assert_equal %w[delivery com.ordering.app1], schemes(info)
    assert_equal [false], result[:features].values.uniq
  end

  def test_every_key_set_keeps_every_scheme
    signing = File.join(@dir, 'App.signing.entitlements')
    NativeKeys.write_signing_entitlements(entitlements(['merchant.com.ordering.app']), signing)
    info = info_plist(google: 'com.googleusercontent.apps.123-abc', facebook_id: '1234567890', client_token: 'abcdef')
    result = process(info, delegate: app_delegate(maps: 'AIzaSyA-123', api_key: 'ios_sdk-abc', app_id: 'ab12cd34'), signing: signing)

    assert_equal %w[com.googleusercontent.apps.123-abc fb1234567890 delivery com.ordering.app1 orderingapp], schemes(info)
    assert_equal [true], result[:features].values.uniq
    assert_empty result[:removed_schemes]
  end

  def test_each_key_is_independent
    info = info_plist(google: 'com.googleusercontent.apps.123-abc', facebook_id: 'none', client_token: 'none')
    result = process(info, delegate: app_delegate(maps: 'AIzaSyA-123'))
    assert_equal %w[com.googleusercontent.apps.123-abc delivery com.ordering.app1 orderingapp], schemes(info)
    assert_equal({ 'googleMaps' => true, 'facebook' => false, 'googleSignIn' => true, 'applePay' => false, 'intercom' => false },
                 result[:features])
    assert_equal ['fbnone'], result[:removed_schemes]

    info = info_plist(google: 'null', facebook_id: '1234567890', client_token: 'abcdef')
    result = process(info, delegate: app_delegate(api_key: 'ios_sdk-abc', app_id: 'ab12cd34'))
    assert_equal %w[fb1234567890 delivery com.ordering.app1 orderingapp], schemes(info)
    assert_equal({ 'googleMaps' => false, 'facebook' => true, 'googleSignIn' => false, 'applePay' => false, 'intercom' => true },
                 result[:features])
  end

  def test_facebook_needs_both_keys_and_an_id_of_digits
    [['1234567890', 'none'], ['1234567890', ''], ['none', 'abcdef'], ['abc123', 'abcdef'], ['0', 'abcdef']].each do |id, token|
      info = info_plist(google: 'none', facebook_id: id, client_token: token)
      result = process(info)
      refute result[:features]['facebook'], "#{id.inspect} + #{token.inspect}"
      assert_equal %w[delivery com.ordering.app1 orderingapp], schemes(info)
    end
  end

  # As before this rule (to be tried on a device): a client token of `0` with a real app id.
  def test_a_facebook_client_token_of_zero_keeps_facebook_on
    info = info_plist(google: 'none', facebook_id: '1234567890', client_token: '0')
    result = process(info)
    assert result[:features]['facebook']
    assert_includes schemes(info), 'fb1234567890'
  end

  def test_a_wrong_google_scheme_goes_only_from_googles_url_type
    info = info_plist(google: '123-abc.apps.googleusercontent.com', facebook_id: 'none', client_token: 'none')
    result = process(info)
    refute result[:features]['googleSignIn']
    assert_equal %w[delivery com.ordering.app1 orderingapp], schemes(info)
  end

  def test_an_app_scheme_that_starts_with_fb_stays
    info = info_plist(google: 'none', facebook_id: 'none', client_token: 'none', app_scheme: 'fbdelivery')
    process(info)
    assert_equal %w[delivery com.ordering.app1 fbdelivery], schemes(info)
  end

  def test_padded_values_are_trimmed
    info = info_plist(google: ' com.googleusercontent.apps.123-abc ', facebook_id: '1234567890', client_token: ' abcdef ')
    process(info)
    assert_includes schemes(info), 'com.googleusercontent.apps.123-abc'
    assert_equal 'abcdef', NativeKeys.read_plist(info)['FacebookClientToken']
  end

  def test_running_twice_changes_nothing
    info = info_plist(google: 'com.googleusercontent.apps.123-abc', facebook_id: 'none', client_token: 'null')
    delegate = app_delegate(maps: 'AIzaSyA-123')
    first = process(info, delegate: delegate)
    once = File.read(info)
    second = process(info, delegate: delegate)

    assert_equal once, File.read(info)
    assert_equal first[:features], second[:features]
    assert_empty second[:removed_schemes]
  end

  def test_a_binary_info_plist_works
    info = info_plist(google: 'none', facebook_id: 'none', client_token: 'none')
    system(NativeKeys::PLUTIL, '-convert', 'binary1', info)
    process(info)
    assert_equal %w[delivery com.ordering.app1 orderingapp], schemes(info)
  end

  def test_an_app_delegate_without_the_constants_stops_the_build
    info = info_plist(google: 'none', facebook_id: 'none', client_token: 'none')
    delegate = File.join(@dir, 'AppDelegate.swift')
    File.write(delegate, "class AppDelegate {}\n")
    error = assert_raises(NativeKeys::Error) { process(info, delegate: delegate) }
    assert_match(/googleMapsApiKey/, error.message)
  end

  # The repo's own files, as they are committed (placeholders): everything off.
  def test_the_repos_files
    app = File.expand_path('ReactNativeAppsTemplate5', __dir__)
    info = File.join(@dir, 'Info.plist')
    FileUtils.cp(File.join(app, 'Info.plist'), info)
    signing = File.join(@dir, 'App.signing.entitlements')
    NativeKeys.write_signing_entitlements(File.join(app, 'ReactNativeAppsTemplate5.entitlements'), signing)
    result = process(info, delegate: File.join(app, 'AppDelegate.swift'), signing: signing)

    assert_equal [false], result[:features].values.uniq
    assert_equal %w[delivery com.ordering.app1], schemes(info)
    assert_equal %w[_REVERSED_CLIENT_ID_ fb_FACEBOOK_ID_ _APP_SCHEME_], result[:removed_schemes]
    refute NativeKeys.read_plist(signing).key?(NativeKeys::PAYMENTS)
  end

  private

  def with_env(values)
    old = values.keys.to_h { |key| [key, ENV[key]] }
    values.each { |key, value| ENV[key] = value }
    yield
  ensure
    old.each { |key, value| ENV[key] = value }
  end
end
