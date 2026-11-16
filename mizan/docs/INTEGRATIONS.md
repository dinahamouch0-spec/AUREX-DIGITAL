# Integrations

Framework: `src/integrations/types.ts`. Each provider declares scopes, reports an honest status (`unavailable`, `not_connected`, `connected`, `paused`, `error`) and supports connect / disconnect / sync. The Settings → About → Integrations screen lists them. **No integration is simulated.**

## Apple Health (HealthKit): Pending External Setup + Real Device Validation
Current state: `src/integrations/appleHealth.ts` reports `unavailable` and imports nothing.

Requirements to implement:
1. **Native module.** HealthKit is not available in Expo Go or on the web. Options: a maintained community module with an Expo config plugin (e.g. `@kingstinct/react-native-healthkit`), or a small local Expo module. Check the module's compatibility with the project's Expo SDK at the time of implementation.
2. **Entitlement.** Enable the HealthKit capability for the App ID (`com.apple.developer.healthkit`) through the config plugin. EAS will sync capabilities.
3. **Info.plist usage strings.** `NSHealthShareUsageDescription` (read) and, only if writing, `NSHealthUpdateUsageDescription`. Write them in plain Arabic and English.
4. **Scopes (read-only to start).** Body mass, height, step count, sleep analysis, workouts, dietary water. Request them contextually, from the integration card, not at launch.
5. **Mapping.** Import into `body_measurements` (source = `apple_health`), `workouts`, `hydration_logs` and `recovery_logs`, keeping the HealthKit sample UUID to deduplicate. Record a sync job (time, counts, sanitised error).
6. **Controls.** Pause, disconnect (stops reading; offers to delete imported records), and a visible last-sync time.
7. **Validation (real iPhone).** Permission sheet, partial permissions, denial, background delivery limits, and the minor-user safety rules (no calorie or deficit targets derived from Health data).

App Store note: HealthKit apps must have a privacy policy and must not use health data for advertising.
