# frozen_string_literal: true

# The optional keys the Builder writes into the iOS files (base 100's actions
# replace each placeholder's text with the value of the constant):
#
#   google_maps_api_key                AppDelegate.swift (NativeKeys.googleMapsApiKey)
#   intercom_api_key, intercom_app_id  AppDelegate.swift (NativeKeys.intercomApiKey, .intercomAppId)
#   facebook_id, facebook_client_token Info.plist (FacebookAppID, FacebookClientToken, the `fb…` URL scheme)
#   google_reversed_client_id          Info.plist (the `com.googleusercontent.apps.…` URL scheme)
#   apple_merchant_id                  ReactNativeAppsTemplate5.entitlements
#
# This file is iOS's one copy of the rule that tells a real value from a key
# that is off (`configured?`; the same as src/utils/nativeKeys.ts and Android's
# NativeKeys.kt, all three tested with src/utils/nativeKeys.cases.json:
# `ruby ios/native_keys_test.rb`). It decides at build time, and Swift only
# reads what it decided:
#
# - the Podfile writes the signing entitlements (`write_signing_entitlements`):
#   Apple Pay is left out without a merchant id;
# - the build phase `[CP-User] Native keys: signing entitlements` stops the
#   build when they are older than the .entitlements they come from
#   (`check-entitlements`);
# - the build phase `[CP-User] Native keys: Info.plist` (`info-plist`) takes the
#   URL types of the keys that are off out of the built Info.plist and writes
#   there what the app may start (`OrderingNativeFeatures`), which
#   AppDelegate.swift reads and hands to JS.
#
# Plain Ruby (2.6, the system's, is enough) with plutil and PlistBuddy: the
# build phases run without CocoaPods' gems.

require 'json'
require 'open3'

module NativeKeys
  # A placeholder the Builder has not replaced: capitals, digits and underscores between two underscores.
  PLACEHOLDER = /\A_[A-Z0-9_]*_\z/.freeze
  # The values that switch a key off (any case), besides the empty one and a placeholder.
  OFF_VALUES = %w[none null - 0].freeze
  # The shape a key of a kind must have: a wrong one would break the signing or the URL schemes.
  SHAPES = {
    merchant_id: /\Amerchant\.[!-~]+\z/,
    facebook_id: /\A[0-9]+\z/,
    google_reversed_client_id: /\Acom\.googleusercontent\.apps\.[A-Za-z0-9.-]+\z/
  }.freeze
  KINDS = %i[generic merchant_id facebook_id facebook_client_token google_reversed_client_id].freeze

  PAYMENTS = 'com.apple.developer.in-app-payments'
  FEATURES_KEY = 'OrderingNativeFeatures'
  # The names of Info.plist's URL types of Google Sign-In and Facebook (CFBundleURLName).
  GOOGLE_URL_NAME = 'google'
  FACEBOOK_URL_NAME = 'facebook'
  GOOGLE_SCHEME_PREFIX = 'com.googleusercontent.apps'
  # AppDelegate.swift's constants the Builder writes.
  SWIFT_CONSTANTS = %w[googleMapsApiKey intercomApiKey intercomAppId].freeze

  PLUTIL = '/usr/bin/plutil'
  PLIST_BUDDY = '/usr/libexec/PlistBuddy'

  class Error < StandardError; end

  module_function

  # Whether a key the Builder writes holds a real value: not empty, `none`,
  # `null`, `-`, `0` nor its placeholder left as it is, and of its kind's shape.
  # A Facebook client token of `0` stays a value, as before this rule.
  def configured?(value, kind = :generic)
    raise ArgumentError, "unknown kind #{kind.inspect}" unless KINDS.include?(kind)
    return false unless value.is_a?(String)

    key = value.strip
    return false if key.empty? || key.match?(PLACEHOLDER)

    off = kind == :facebook_client_token ? OFF_VALUES - ['0'] : OFF_VALUES
    return false if off.include?(key.downcase)
    return false if kind == :facebook_id && key.match?(/\A0+\z/)

    shape = SHAPES[kind]
    shape.nil? || key.match?(shape)
  end

  # --- Signing entitlements -------------------------------------------------

  def read_plist(path)
    out, err, status = Open3.capture3(PLUTIL, '-convert', 'json', '-o', '-', path)
    raise Error, "cannot read #{path}: #{err.strip}#{out.strip}" unless status.success?

    JSON.parse(out)
  end

  def plist_xml(hash)
    out, err, status = Open3.capture3(PLUTIL, '-convert', 'xml1', '-o', '-', '-', stdin_data: JSON.generate(hash))
    raise Error, "cannot write a plist: #{err.strip}#{out.strip}" unless status.success?

    out
  end

  # The merchant ids of some entitlements that are real ones.
  def merchant_ids(entitlements)
    Array(entitlements[PAYMENTS])
      .select { |id| configured?(id, :merchant_id) }
      .map(&:strip)
  end

  # The entitlements the app signs with, from the ones the Builder writes the
  # merchant id into: without a merchant id Apple Pay's entitlement is left
  # out (a provisioning profile whose App ID has no Apple Pay, or not that
  # merchant, would fail the signing).
  def signing_entitlements(source)
    entitlements = read_plist(source)
    if entitlements.key?(PAYMENTS)
      merchants = merchant_ids(entitlements)
      if merchants.empty?
        entitlements.delete(PAYMENTS)
      else
        entitlements[PAYMENTS] = merchants
      end
    end
    plist_xml(entitlements)
  end

  # Writes them when they changed. True when the file was written.
  def write_signing_entitlements(source, target)
    xml = signing_entitlements(source)
    return false if File.exist?(target) && File.read(target) == xml

    File.write(target, xml)
    true
  end

  # `X.signing.entitlements` comes from `X.entitlements`.
  def entitlements_source(signing_path)
    return nil unless signing_path.end_with?('.signing.entitlements')

    signing_path.sub(/\.signing\.entitlements\z/, '.entitlements')
  end

  def apple_pay?(signing_path)
    return false if signing_path.nil? || !File.exist?(signing_path)

    !merchant_ids(read_plist(signing_path)).empty?
  end

  # --- AppDelegate.swift's constants ------------------------------------------

  # `static let googleMapsApiKey = "…"`: the values the Builder wrote.
  def swift_constants(app_delegate)
    source = File.read(app_delegate)
    SWIFT_CONSTANTS.each_with_object({}) do |name, constants|
      match = source.match(/^\s*static\s+let\s+#{name}\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/)
      raise Error, "#{app_delegate}: `static let #{name} = \"…\"` not found (NativeKeys)" unless match

      constants[name] = match[1]
    end
  end

  # --- The built Info.plist -------------------------------------------------

  def buddy(plist, command)
    out, status = Open3.capture2e(PLIST_BUDDY, '-c', command, plist)
    [out.chomp, status.success?]
  end

  def buddy!(plist, command)
    out, ok = buddy(plist, command)
    raise Error, "PlistBuddy `#{command}` on #{plist}: #{out}" unless ok

    out
  end

  def plist_string(plist, key)
    out, ok = buddy(plist, "Print :#{key}")
    ok ? out : nil
  end

  # [{ name:, schemes: [...] }] of CFBundleURLTypes.
  def url_types(plist)
    types = []
    loop do
      index = types.length
      _, exists = buddy(plist, "Print :CFBundleURLTypes:#{index}")
      break unless exists

      schemes = []
      loop do
        scheme, found = buddy(plist, "Print :CFBundleURLTypes:#{index}:CFBundleURLSchemes:#{schemes.length}")
        break unless found

        schemes << scheme
      end
      types << { name: plist_string(plist, "CFBundleURLTypes:#{index}:CFBundleURLName"), schemes: schemes }
    end
    types
  end

  def facebook?(app_id, client_token)
    configured?(app_id, :facebook_id) && configured?(client_token, :facebook_client_token)
  end

  # Whether a URL scheme stays in the built Info.plist. Google's and Facebook's
  # (their URL type's name, or what the scheme looks like) only when their keys
  # are set; any other (the app's deep link) unless it is an off value or a
  # placeholder left as it is.
  def keep_scheme?(scheme, name, facebook_app_id, facebook)
    if name == GOOGLE_URL_NAME || scheme.strip.start_with?(GOOGLE_SCHEME_PREFIX)
      configured?(scheme, :google_reversed_client_id)
    elsif name == FACEBOOK_URL_NAME || scheme == "fb#{facebook_app_id}"
      facebook && scheme.strip == "fb#{facebook_app_id.to_s.strip}"
    else
      configured?(scheme)
    end
  end

  # Takes the URL types of the keys that are off out of the built Info.plist
  # (`fbnone`, `fb`, `null`, an empty scheme…: `fb` is the Facebook app's own
  # scheme, and the App Store rejects an empty one), trims the values that stay
  # and writes what the app may start. Run again on a plist it already changed,
  # it changes nothing.
  def process_info_plist(plist, app_delegate:, signing_entitlements:)
    raise Error, "#{plist} not found" unless File.exist?(plist)

    app_id = plist_string(plist, 'FacebookAppID')
    client_token = plist_string(plist, 'FacebookClientToken')
    facebook = facebook?(app_id, client_token)
    removed = []
    google_sign_in = false

    types = url_types(plist)
    (types.length - 1).downto(0) do |index|
      type = types[index]
      kept = 0
      (type[:schemes].length - 1).downto(0) do |position|
        scheme = type[:schemes][position]
        path = "CFBundleURLTypes:#{index}:CFBundleURLSchemes:#{position}"
        if keep_scheme?(scheme, type[:name], app_id, facebook)
          kept += 1
          google_sign_in ||= configured?(scheme, :google_reversed_client_id)
          buddy!(plist, "Set :#{path} #{scheme.strip}") if scheme != scheme.strip
        else
          removed << scheme
          buddy!(plist, "Delete :#{path}")
        end
      end
      buddy!(plist, "Delete :CFBundleURLTypes:#{index}") if kept.zero?
    end

    if facebook
      { 'FacebookAppID' => app_id, 'FacebookClientToken' => client_token }.each do |key, value|
        buddy!(plist, "Set :#{key} #{value.strip}") if value != value.strip
      end
    end

    constants = swift_constants(app_delegate)
    features = {
      'googleMaps' => configured?(constants['googleMapsApiKey']),
      'facebook' => facebook,
      'googleSignIn' => google_sign_in,
      'applePay' => apple_pay?(signing_entitlements),
      'intercom' => configured?(constants['intercomApiKey']) && configured?(constants['intercomAppId'])
    }
    buddy(plist, "Delete :#{FEATURES_KEY}")
    buddy!(plist, "Add :#{FEATURES_KEY} dict")
    features.each { |name, on| buddy!(plist, "Add :#{FEATURES_KEY}:#{name} bool #{on}") }

    { features: features, removed_schemes: removed.reverse }
  end

  # --- The build phases (ios/Podfile) -----------------------------------------

  def env!(name)
    value = ENV[name].to_s
    raise Error, "#{name} is not set (run from the Xcode build phase)" if value.empty?

    value
  end

  def signing_path_from_env
    relative = ENV['CODE_SIGN_ENTITLEMENTS'].to_s
    relative.empty? ? nil : File.expand_path(relative, env!('SRCROOT'))
  end

  # `[CP-User] Native keys: signing entitlements`
  def check_entitlements_phase
    target = signing_path_from_env
    source = target && entitlements_source(target)
    unless source && File.exist?(source)
      puts 'note: no .signing.entitlements to check (CODE_SIGN_ENTITLEMENTS)'
      return
    end
    return unless write_signing_entitlements(source, target)

    # Xcode read the old file when it planned this build: it must not sign with it.
    raise Error, "#{File.basename(target)} was older than #{File.basename(source)} and has been written again: build again " \
                 '(`pod install` writes it too)'
  end

  # `[CP-User] Native keys: Info.plist`
  def info_plist_phase
    plist = File.join(env!('TARGET_BUILD_DIR'), env!('INFOPLIST_PATH'))
    app_delegate = File.join(env!('SRCROOT'), File.dirname(env!('INFOPLIST_FILE')), 'AppDelegate.swift')
    result = process_info_plist(plist, app_delegate: app_delegate, signing_entitlements: signing_path_from_env)
    off = result[:features].reject { |_, on| on }.keys
    puts "note: native features off: #{off.empty? ? 'none' : off.join(', ')}"
    puts "note: URL schemes left out of Info.plist: #{result[:removed_schemes].map(&:inspect).join(', ')}" unless result[:removed_schemes].empty?
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    case ARGV[0]
    when 'check-entitlements' then NativeKeys.check_entitlements_phase
    when 'info-plist' then NativeKeys.info_plist_phase
    else
      warn 'usage: ruby native_keys.rb check-entitlements | info-plist'
      exit 2
    end
  rescue NativeKeys::Error => e
    warn "error: #{e.message}"
    exit 1
  end
end
