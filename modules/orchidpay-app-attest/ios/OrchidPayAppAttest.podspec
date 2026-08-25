Pod::Spec.new do |s|
  s.name = 'OrchidPayAppAttest'
  s.version = '1.0.0'
  s.summary = 'OrchidPay Apple App Attest native bridge'
  s.description = 'Local Expo module exposing a minimal Apple App Attest bridge for OrchidPay.'
  s.author = 'Purple Orchid GROUP'
  s.homepage = 'https://docs.expo.dev/modules/'
  s.platforms = {
    :ios => '15.1'
  }
  s.source = { git: '' }
  s.swift_version = '5.9'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
