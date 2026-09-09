# Kaitai mobile

Expo app for the Kaitai API. Run commands below from `mobile/`.

## Local development

```sh
npm ci
npm start
```

Run the web API and MongoDB with `docker compose up --build` from the repository root. Development builds discover the API host from Expo's `hostUri` on port 3000, with Android emulator and localhost fallbacks. A physical device must be able to reach the development machine over the network.

## Release configuration

The iOS bundle identifier and Android package are `app.kaitai.mobile`. The URL scheme is `kaitai` and is trusted by the server's Better Auth configuration.

`EXPO_PUBLIC_API_URL` must be `https://kaitai.app` for production. `app.config.ts` validates it and embeds its normalized origin in `extra.apiUrl`; authentication, analysis, history, and settings use that same origin. Missing release configuration, HTTP URLs, paths, credentials, query strings, fragments, and known placeholder hosts fail config evaluation. The URL is public; never put API keys or server secrets in Expo public variables or app config.

Link the app to the team's Expo project and configure its production environment:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest env:set --environment production --name EXPO_PUBLIC_API_URL --value https://kaitai.app --visibility plaintext
```

Keep the generated `extra.eas.projectId` (and `owner`, if set) in `app.json`. The dynamic config preserves those fields. Use the existing project if the team already has one.

| Profile | Distribution | EAS environment | Purpose |
| --- | --- | --- | --- |
| `development` | Internal development client | `development` | Local API development |
| `preview` | Internal; Android APK, iOS ad hoc | `production` | Installed release against production |
| `production` | Store; Android AAB, iOS App Store | `production` | TestFlight / Play internal testing and release |

Both release profiles use production environment variables and increment native build numbers through EAS. [Expo build profiles](https://docs.expo.dev/build/eas-json/) and [environment variables](https://docs.expo.dev/eas/environment-variables/manage/) describe these settings.

```sh
npx eas-cli@latest build --profile preview --platform android
# iOS ad hoc builds require an Apple Developer account and registered devices.
npx eas-cli@latest device:create
npx eas-cli@latest build --profile preview --platform ios
# Store-signed artifacts for TestFlight / Play internal testing:
npx eas-cli@latest build --profile production --platform all
```

Store builds also require the corresponding App Store Connect / Play Console app and signing credentials. Building does not submit the artifact to a store.

For a local release export or native release build, copy `.env.local.example` to `.env.local`, or pull the production environment with `npx eas-cli@latest env:pull --environment production`. Verify the public config with `NODE_ENV=production npx expo config --type public`. The API origin is embedded when building; changing an EAS variable requires rebuilding.

`ios/` and `android/` are ignored generated projects. EAS regenerates them from Expo config. Before building locally with existing native directories, regenerate with `npx expo prebuild --clean` so the native identifiers match `app.json`; preserve any intentional native edits first.

Expo's on-demand filesystem is disabled so Metro uses its explicit watched folders to resolve the shared `common/` files during release bundling.