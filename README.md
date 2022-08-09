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

### Kodi
1. Install Kodi from Google Play or APK.
2. Make sure that your screen's refresh rate is 60Hz, otherwise you will see a black screen in Kodi.
3. Add Video Source
	1. Settings (Gears icon) -> Media -> Videos... -> External Card -> Push and Hold on "Movies" -> Set content
	2. This directory contains "Movies".
	3. In Settings you can choose preferred language, Default Rating source and etc.
4. (optional) Media -> Videos -> Default select action -> Change to "Show information"

### Installing and running on [Termux](https://termux.dev/)
Use [F Droid](https://f-droid.org/) to install Termux or install APK.
```bash
termux-setup-storage
pkg update && pkg install termux-api git nodejs sqlite iconv curl python
git clone https://github.com/argongym/kodi-companion.git
cd kodi-companion
npm install --no-bin-links
npm run build
```

### [AutoMagic](https://automagic4android.com/download_en.html)
If you have older Android version and you have problems accessing SD card then you should use Automagic to accomplish some tasks, such as rename, move, delete files on SD card and etc.
```
./automagic/flows.xml
./automagic/Automagic_1_38_0.apk
```

### Tips
I'm using [SyncThing](https://syncthing.net/) for quick checks on my Android device.

