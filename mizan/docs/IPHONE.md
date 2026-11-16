# Installing and testing MIZAN on an iPhone

MIZAN uses native modules (SQLite, notifications, Keychain, photo picker), so use a **development build** or **TestFlight**, not Expo Go.

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
| 8 | Behaviour in Focus / Silent / Low Power Mode | Note any delays |
| 9 | Adhan audio | Not supported; confirm only the default sound plays |
| 10 | Export opens the share sheet and the JSON file is readable | Settings → Export & delete |
| 11 | Progress photo: permission prompt, photo stays in app, delete removes it | Fitness → Body |
| 12 | Arabic RTL layout, keyboard, safe areas (notch, home indicator) | Switch language both ways |
| 13 | Dynamic Type (larger text) and VoiceOver labels on main screens | iOS Accessibility settings |
| 14 | After Supabase is configured: sign in, offline capture in Airplane Mode, reconnect → sync | See `docs/SUPABASE.md` |
