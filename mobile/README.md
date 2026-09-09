# Kaitai mobile

Expo app for the Kaitai API. Run commands below from `mobile/`.

## Local development

```sh
npm ci
npm start
```

Run the web API and MongoDB with `docker compose up --build` from the repository root. Development builds discover the API host from Expo's `hostUri` on port 3000, with Android emulator and localhost fallbacks. A physical device must be able to reach the development machine over the network.
