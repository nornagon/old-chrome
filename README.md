## old-chrome
#### Get a download link for an old version of Chromium

This captures the series of steps described at [Download Chromium](https://www.chromium.org/getting-involved/download-chromium) into an automatable form.

To use:

```
$ npx old-chrome Mac 44.0.2403.157
https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F330231%2Fchrome-mac.zip?generation=1431733811955000&alt=media
```

Or, to automatically download the the zip file,

```
$ curl -L -o chrome-mac.zip "$(npx old-chrome Mac 44.0.2403.157)"
```

NB, not every single Chromium version is archived by Google, so you will
generally be downloading a slightly different version of Chromium than the
specific version requested. However, old-chrome does its best to give you the
available version that's closest to the one you asked for.
