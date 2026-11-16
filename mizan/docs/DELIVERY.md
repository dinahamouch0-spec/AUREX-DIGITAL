# MIZAN — Delivery checklist

This is the hand-off page. Status of every feature: [`STATUS.md`](STATUS.md).

## 1. What needs the owner (nothing else is blocking)

| # | Item | Needed for | Required? | Where it goes (never in Git) |
|---|---|---|---|---|
| 1 | **Apple Developer Program** membership | Installing on iPhone (development build / TestFlight) | **Yes, to run on iPhone** | Apple account; EAS stores signing credentials |
| 2 | **Expo account** (free) | Cloud iOS builds via EAS | Yes, to build | `npx eas-cli@latest login` |
| 3 | **Confirm prayer-time parameters** with your marjaʿ / local calendar | Trustworthy prayer times and alerts | Yes, before relying on alerts | In the app: Settings → Prayer times (tick "I have checked…") |
| 4 | **Supabase project** — URL + anon (publishable) key | Accounts, cloud sync, multi-device | Optional (app is fully usable local-only) | `mizan/.env.local` (git-ignored) **and** EAS environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Steps: [`SUPABASE.md`](SUPABASE.md) |
| 5 | Supabase **service-role key** | Only for the `delete-account` Edge Function | Only with #4 | Supabase dashboard → Edge Functions secrets. **Never** in the app, `.env*`, or Git |
| 6 | **AI provider choice** + API key | External conversational AI | Optional (on-device assistant works now) | Key in a server-side proxy (e.g. Supabase Edge Function secret); app only gets `EXPO_PUBLIC_AI_PROXY_URL`. See [`AI.md`](AI.md) |
| 7 | **Apple Health** | Importing weight/steps/sleep/workouts | Optional | Requires a native HealthKit module + entitlement — not built. See [`INTEGRATIONS.md`](INTEGRATIONS.md) |
| 8 | Final **brand assets** (icon/splash) | Store polish | Optional (provisional icon included) | `mizan/assets/images/` |
| 9 | **Privacy policy** | TestFlight external testers / App Store | Only for external distribution | Legal text, hosted URL |

No keys or credentials were invented or committed. `.env.example` lists the variable names with empty values.

## 2. Running MIZAN on your iPhone (in order)

1. Join the **Apple Developer Program** (developer.apple.com) with your Apple ID.
2. Create a free **Expo account** at expo.dev.
3. On a computer with Node 22: `git clone` the repo, then
   ```bash
   cd mizan
   npm ci
   npx eas-cli@latest login
   npx eas-cli@latest init          # links the project to your Expo account (writes the projectId into app.json)
   ```
4. Register your iPhone for development builds:
   ```bash
   npx eas-cli@latest device:create  # open the link on the iPhone and install the profile
   ```
5. Build the development app in the cloud (no Mac needed):
   ```bash
   npm run build:ios:dev             # EAS asks to sign in to Apple and creates certificates/profiles
   ```
6. Open the build link on the iPhone and install MIZAN. On iOS 16+, enable **Settings → Privacy & Security → Developer Mode** when asked, then restart.
7. Start the dev server on the computer and open MIZAN on the phone:
   ```bash
   npx expo start --dev-client       # same Wi-Fi, or add --tunnel
   ```
8. Work through the **real-device checklist** in [`IPHONE.md`](IPHONE.md) §C and note results in `STATUS.md`.
9. When satisfied, ship to yourself via **TestFlight** (no computer needed afterwards):
   ```bash
   npm run build:ios:prod
   npm run submit:ios                # then add yourself as an internal tester in App Store Connect
   ```
10. Optional, later: connect Supabase (§1 #4) and rebuild so the app shows sign-in and sync.

## 3. What was verified here vs. what needs the iPhone

**Verified in this environment (automated, repeatable):**
- TypeScript strict, ESLint (0 issues), `expo-doctor` 20/20.
- 159 unit tests — domain rules, store, sync engine (fake server), use cases, notifications planning, Perfect Days incl. as-of stability.
- 45 PostgreSQL checks — RLS isolation, integrity constraints, append-only ledgers, seal times (DST), definition immutability.
- Web build + 164 smoke checks (both languages, every screen) + 22 functional flow checks (goals, reminders → notification centre, invoice + partial payment, client timeline, pipeline, programs, meals, routines, planner, calendar, assistant approval, prayer adjustment, settings persistence, AI switch, export).
- **Native iOS JavaScript bundle compiles** (`expo export --platform ios`, Hermes bytecode).
- **iOS project generation succeeds** (`expo prebuild --platform ios` in a scratch copy): bundle id `app.mizan.personal`, iOS 16.4+, only the photo-library permission string, no camera/microphone/HealthKit requests.

**Needs the physical iPhone (not claimed to work yet):**
- Local notifications: prayer alerts (combined wording), follow-ups, quiet hours, review reminders — delivery timing and Focus / Low Power behaviour.
- SQLite persistence after force-quit; app lifecycle.
- Photo picker + private storage of progress photos.
- iOS share sheet for export.
- RTL/LTR layout with the iOS keyboard, safe areas, Dynamic Type, VoiceOver.
- Adhan audio: **not supported** (standard notification sound only).
- Apple Health: **not implemented**.

## 4. Known, accepted limitations
See `STATUS.md` → Known limitations. Notably: preferences are per device; version history for streak stability is per device; `npm audit` reports 3 moderate advisories in build-time tooling (`minimatch` via `@expo/fingerprint`) whose only automatic "fix" is downgrading Expo SDK 58 → 52, which is not applied.
