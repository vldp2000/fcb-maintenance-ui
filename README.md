# FCB Maintenance UI

Vue 2 maintenance UI for the VGMates FCB1010 live rig.

The UI edits songs, gigs, presets, instrument mappings, live volumes, BiasFX effect flags, and preset usage.

## Install

```powershell
npm install
```

## Develop

```powershell
npm run serve
```

## Test

```powershell
npm test
```

## Lint

```powershell
npm run lint
```

## Build

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm run build
```

## Release To Dist Repository

The Raspberry Pi 2 should not build the UI. Build locally and publish the generated files to `fcb-maintenance-ui-dist`:

```powershell
.\release-ui.ps1 -Push
```
