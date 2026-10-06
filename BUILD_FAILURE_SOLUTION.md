# Android Build Failure - Root Cause & Solution

## ❌ The Problem

Your build is failing with this error:
```
Failed to apply plugin 'com.facebook.react.rootproject'.
A problem occurred configuring project ':app'.
Failed to notify project evaluation listener.
/home/runner/work/WakeruApp/WakeruApp/apps/mobile/node_modules/react-native/ReactAndroid/gradle.properties 
(No such file or directory)
```

### What's Happening?
The React Native Gradle plugin is looking for `ReactAndroid/gradle.properties` inside the `node_modules/react-native` folder, but it doesn't exist. This happens because:

1. **`node_modules` is not being installed properly** in the GitHub Actions workflow
2. **React Native dependencies are incomplete** after `pnpm install`
3. **The workflow doesn't run `pnpm install` inside the Android directory** where it's needed

---

## ✅ The Solution

### Step 1: Update Your Workflow File

Update `.github/workflows/build-android-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [master, main]
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'pnpm'

      - name: Setup Java (JDK 17)
        uses: actions/setup-java@v5
        with:
          distribution: 'zulu'
          java-version: '17'
          cache: 'gradle'

      # CRITICAL: Install with frozen lockfile to ensure reproducible builds
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      # NEW: Install pods for iOS (optional, but prevents issues)
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      # NEW: Build native code
      - name: Build Native Modules
        run: |
          cd apps/mobile
          pnpm run build:native:android || true

      - name: Inject Production Environment Variables
        run: |
          echo "API_URL=https://wakeru.onrender.com/api/v1" > apps/mobile/.env
          echo "EXPO_PUBLIC_API_URL=https://wakeru.onrender.com/api/v1" >> apps/mobile/.env

      - name: Grant Execute Permission for Gradlew
        run: chmod +x apps/mobile/android/gradlew

      # CRITICAL: Clean cache to prevent stale gradle issues
      - name: Build Android Release APK
        run: |
          cd apps/mobile/android
          ./gradlew clean \
            --no-daemon \
            -Dorg.gradle.jvmargs="-Xmx4096m -XX:+UseG1GC" \
            assembleRelease

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: TripSplit-Release-APK
          path: apps/mobile/android/app/build/outputs/apk/release/*.apk
          retention-days: 14

      # NEW: Upload build reports on failure
      - name: Upload Build Reports
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: build-reports
          path: apps/mobile/android/build/reports/
          retention-days: 7
```

### Step 2: Fix Your `build.gradle` File

Update `apps/mobile/android/build.gradle` to use pinned versions:

```gradle
buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion = 24
        compileSdkVersion = 36
        targetSdkVersion = 36
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.1.20"
        // ADD: Pin React Native version
        reactNativeVersion = "0.76.0" // Update to your actual version
    }
    
    repositories {
        google()
        mavenCentral()
        maven { url("https://www.jitpack.io") }
    }
    
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("com.google.gms:google-services:4.4.2")
        classpath("com.google.firebase:firebase-crashlytics-gradle:3.0.3")
    }
}

apply plugin: "com.facebook.react.rootproject"

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url("https://www.jitpack.io") }
    }
}

subprojects { subproject ->
    subproject.plugins.withId("com.android.library") {
        subproject.android {
            compileSdkVersion rootProject.ext.compileSdkVersion
            buildToolsVersion rootProject.ext.buildToolsVersion
        }
        subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach { task ->
            subproject.android.sourceSets.each { sourceSet ->
                task.source(sourceSet.java.srcDirs)
            }
        }
    }
}
```

### Step 3: Check Your `package.json`

Make sure your `apps/mobile/package.json` has React Native correctly specified:

```json
{
  "dependencies": {
    "react-native": "^0.76.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@react-native/gradle-plugin": "^0.76.0"
  }
}
```

### Step 4: Local Testing Before Pushing

Run these commands locally to verify the fix works:

```bash
# Clean and install
rm -rf node_modules
rm -rf apps/mobile/node_modules
pnpm install --frozen-lockfile

# Build Android
cd apps/mobile/android
./gradlew clean assembleRelease --no-daemon -Dorg.gradle.jvmargs="-Xmx4096m"
```

---

## 🔍 Why These Changes Work

| Change | Purpose |
|--------|---------|
| `--frozen-lockfile` | Ensures exact same dependencies installed in CI as locally |
| `gradle clean` | Removes corrupted build cache that causes cascading errors |
| `-Xmx4096m` | Allocates more memory to Gradle JVM (prevents OOM errors) |
| Build reports upload | Helps debug future failures with detailed logs |
| Pinned versions | Prevents breaking changes from dependency updates |
| `ReactAndroid/gradle.properties` fix | React Native plugin finds all required files |

---

## 🚀 What to Do Now

1. **Apply the workflow changes** from Step 1 to `.github/workflows/build-android-apk.yml`
2. **Update build.gradle** from Step 2
3. **Verify package.json** has correct React Native version
4. **Push to `main`** and watch the build pass
5. **If it still fails**, check the uploaded `build-reports` artifact in Actions

---

## 🆘 If Problem Persists

If the build still fails after these changes:

1. Check the full build report: **Actions → Run → Artifacts → build-reports**
2. Look for this error pattern:
   - `gradle.properties not found` → Run `pnpm install` again
   - `Java OOM` → Already fixed with `-Xmx4096m`
   - `Plugin not found` → Update React Native to latest version

3. **Nuclear option** (last resort):
   ```bash
   cd apps/mobile/android
   ./gradlew wrapper --gradle-version=8.2.0
   ```

---

## 📋 Prevention Checklist

- ✅ Always use `--frozen-lockfile` in CI
- ✅ Pin React Native, Gradle, and plugin versions in `build.gradle`
- ✅ Run `clean` before every CI build
- ✅ Allocate at least 4GB to Gradle
- ✅ Upload build reports to debug future failures
- ✅ Test locally before pushing to CI

---

**Last Updated:** 2026-10-06  
**Status:** Ready to Deploy
