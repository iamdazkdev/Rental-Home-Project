.PHONY: build project pods pub clean

# linux and macos based Makefile

apk-debug: project
	flutter build apk --debug

apk-release: project
	flutter build apk --release

release-android: project
	flutter build appbundle --release

release-ios:    project
	flutter build ios --release 

build: project
#	@echo "prep release quickfix..."
#	flutter build ios --config-only --release
#	@echo "prep release quickfix done"

project: clean pub models pods

pods:
	cd ios && pod install

models:
	dart run build_runner build --delete-conflicting-outputs

pub:
	flutter pub upgrade
	flutter pub get

clean:
	flutter clean
	@echo "cleaning g.dart files..."
	find . -name "*.g.dart" -type f -print0 | xargs -0 rm -fv
	@echo "cleaning dart_tool files..."
	rm -rf .dart_tool/
	@echo "cleaning lock files..."
	rm -fv pubspec.lock
	rm -rf ios/Podfile.lock
	rm -rf macos/Podfile.lock
	@echo "cleaning ios files..."
	rm -rf ios/Podfile.lock ios/Pods ios/.symlinks ios/Flutter/Flutter.framework
	@echo "cleaning ios done"

build-release-android:
	flutter build appbundle --release
	open build/app/outputs/bundle/release/

# generate-upload-keystore:
#	keytool -genkey -v -keystore /tmp/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
