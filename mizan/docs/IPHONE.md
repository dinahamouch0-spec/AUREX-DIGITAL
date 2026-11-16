# Installing and testing MIZAN on an iPhone

Every native module MIZAN uses (SQLite, notifications, Secure Store, image picker, file system, sharing) is included in Expo Go SDK 58, so there are three ways to run it: **Expo Go + EAS Update** (free, iPhone only — section 0), a **development build**, or **TestFlight** (both need the Apple Developer Program).

## 0. Expo Go + EAS Update (free, no computer, no Apple Developer Program)

Status: **prepared, not yet validated on a device.** Expo's docs confirm Expo Go loads EAS Updates for projects you own (changelog, May 2026), but the exact iOS steps to open a published update are not documented, so this path is only proven once it works on the phone.

How the project is set up for it:
- `expo-updates` is installed (EAS CLI needs it to publish).
- `app.json` → `"runtimeVersion": { "policy": "sdkVersion" }`, which resolves to `exposdk:58.0.0` — the runtime Expo Go SDK 58 accepts. (The default `appVersion` policy would produce `1.0.0`, which Expo Go rejects.)
- No secrets are in the project. `owner`, `extra.eas.projectId` and `updates.url` are written by `eas init` once an Expo account is linked.

Steps (owner actions are marked **you**):
1. **You:** on expo.dev → Settings → Access Tokens, create a token limited to your personal account with the **Developer** role. Enter it only in the session's secure credential form for `api.expo.dev` — never in chat or files.
2. Verify the account: `eas whoami`.
3. Link the project: `eas init` (creates the MIZAN project on your account; commit the resulting `app.json` change).
4. Publish once: `eas update --platform ios --environment production --message "…"` (free plan: unlimited updates up to 1,000 monthly users).
5. **You (iPhone):** open Expo Go signed in to the same account and open MIZAN from your projects, or tap the update link from the project page on expo.dev.

Limits inside Expo Go: the app shows as Expo Go (name, icon, notification sender, photo-permission text); data lives inside Expo Go and is lost if Expo Go is deleted — use Settings → Export regularly; remote push is unavailable (MIZAN doesn't use it); scheduled local notifications on iOS must be checked with the list in section C.

## Prerequisites (owner)
1. An **Apple Developer Program** membership (paid). It's needed for device builds and TestFlight.
2. A free **Expo account** (`npx eas-cli@latest login`).
3. No Mac is required; EAS builds in the cloud.

## A. Development build (fastest way to test on your own iPhone)
```bash
cd mizan
npx eas-cli@latest login
npx eas-cli@latest device:create          # register your iPhone (opens a link on the phone)
npm run build:ios:dev                     # = eas build --profile development --platform ios
```
Install the build from the link/QR that EAS shows, then on your computer:
```bash
npx expo start --dev-client
```
Open the MIZAN app on the iPhone and connect to the dev server (same Wi-Fi, or `--tunnel`).

## B. TestFlight (installable build, no computer needed afterwards)
```bash
npm run build:ios:prod                    # production profile, auto-increments build number
npm run submit:ios                        # uploads to App Store Connect
```
In App Store Connect → TestFlight, add yourself as an internal tester and install with the TestFlight app.
Bundle identifier: `app.mizan.personal` (change in `app.json` before the first build if you prefer another).

## C. Real-device validation checklist
Nothing below is claimed to work until checked here. Record results in `docs/STATUS.md`.

| # | Check | How |
|---|---|---|
| 1 | Data survives app kill + restart (SQLite) | Log a prayer, a habit and a transaction → force-quit → reopen |
| 2 | Notification permission prompt appears only from Settings → Notifications | Fresh install |
| 3 | Permission denied path | Deny → app shows "blocked" message; reminders still saved |
| 4 | Prayer alerts fire at the calculated times | Enable reminders + prayer alerts; compare with your trusted calendar for 3 days |
| 5 | Combined wording: Fajr / "Dhuhr and Asr" / "Maghrib and Isha"; each prayer still logged separately | |
| 6 | Follow-up reminder fires only if the group isn't recorded | Set follow-up 15 min; log one group, leave another |
| 7 | Quiet hours suppress ordinary reminders but not prayer alerts | |
| 7b | Review reminders: daily, weekly (Sunday), monthly (1st) fire at the chosen time | Settings → Notifications |
| 8 | Behaviour in Focus / Silent / Low Power Mode | Note any delays |
| 9 | Adhan audio | Not supported; confirm only the default sound plays |
| 10 | Export opens the share sheet and the JSON file is readable | Settings → Export & delete |
| 11 | Progress photo: permission prompt, photo stays in app, delete removes it | Fitness → Body |
| 12 | Arabic RTL layout, keyboard, safe areas (notch, home indicator) | Switch language both ways |
| 13 | Dynamic Type (larger text) and VoiceOver labels on main screens | iOS Accessibility settings |
| 14 | After Supabase is configured: sign in, offline capture in Airplane Mode, reconnect → sync | See `docs/SUPABASE.md` |
