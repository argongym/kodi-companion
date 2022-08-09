# kodi-companion

### Installing and running a dev server
```bash
npm install
npm run dev
```

### CloudFlare reverse proxy
```
./cloudflare/proxy.js
```

### [AutoMagic](https://automagic4android.com/download_en.html)
```
./automagic/flows.xml
./automagic/Automagic_1_38_0.apk
```

### Installing and running on [Termux](https://termux.dev/)
Use [F Droid](https://f-droid.org/) to install Termux or install APK.
```bash
termux-setup-storage
pkg update && pkg install git nodejs sqlite iconv curl termux-api
git clone https://github.com/argongym/kodi-companion.git
cd kodi
npm install --no-bin-links
npm run build
```

### Kodi
1. Install Kodi from Google Play or APK.
2. ...

### Tips
I'm using [SyncThing](https://syncthing.net/) for quick checks on my Android device.

