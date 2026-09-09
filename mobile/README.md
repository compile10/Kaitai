# Kaitai mobile

Expo app for the Kaitai API. Run commands below from `mobile/`.

## Local development

```sh
npm ci
npm start
```

Run the web API and MongoDB with `docker compose up --build` from the repository root. Development builds discover the API host from Expo's `hostUri` on port 3000, with Android emulator and localhost fallbacks. A physical device must be able to reach the development machine over the network.

## Basic error monitoring

Render-boundary, analysis/history, and query/mutation failures are reported to
Kaitai's `/api/telemetry` route using the configured API origin. SigNoz credentials
are configured only on the server. Reporting is best effort; native crashes,
offline persistence, and release stack symbolication are not included.
See [monitoring setup](../docs/monitoring.md).
