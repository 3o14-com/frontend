{
  description =
    "Creates an environment in which you can create, build and emulate an expo app.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    android.url = "github:tadfisher/android-nixpkgs";
    android.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, ... }@inputs:
    let pkgs = nixpkgs.legacyPackages.x86_64-linux;
    in {
      packages.x86_64-linux = {

        android-sdk = inputs.android.sdk.x86_64-linux (sdkPkgs: [
          sdkPkgs.cmdline-tools-latest
          sdkPkgs.cmake-3-22-1
          sdkPkgs.build-tools-34-0-0
          sdkPkgs.build-tools-35-0-0
          sdkPkgs.platform-tools
          sdkPkgs.platforms-android-35
          sdkPkgs.emulator
          sdkPkgs.system-images-android-35-google-apis-x86-64
          sdkPkgs.ndk-26-1-10909125
        ]);

        cremulate =
          pkgs.writeScriptBin "cremulate" # bash
          ''
            #!/usr/bin/env sh
            name=$1
            avd=avd$name
            avdmanager create avd -k 'system-images;android-35;google_apis;x86_64' -n $avd
          '';

        default = self.packages.x86_64-linux.cremulate;
      };
      devShell.x86_64-linux = pkgs.mkShell rec {
        JAVA_HOME = pkgs.corretto17.home;

        ANDROID_HOME =
          "${self.packages.x86_64-linux.android-sdk}/share/android-sdk";

        ANDROID_SDK_ROOT =
          "${self.packages.x86_64-linux.android-sdk}/share/android-sdk";

        GRADLE_OPTS =
          "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/34.0.0/aapt2";

        ANDROID_AVD_HOME = "~/.config/.android/avd";

        nativeBuildInputs = [
          pkgs.nodejs_18
          pkgs.yarn
          pkgs.watchman
          pkgs.corretto17
          pkgs.aapt
          self.packages.x86_64-linux.android-sdk
          self.packages.x86_64-linux.cremulate
        ];
      };
    };
}
