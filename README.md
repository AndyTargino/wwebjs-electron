<div align="center">
    <br />
    <p>
        <a href="https://wwebjs.dev"><img src="https://github.com/wwebjs/logos/blob/main/4_Full%20Logo%20Lockup_Small/small_banner_blue.png?raw=true" title="whatsapp-web.js" alt="WWebJS Website" width="500" /></a>
    </p>
    <br />
    <p>
		<a href="https://www.npmjs.com/package/wwebjs-electron"><img src="https://img.shields.io/npm/v/wwebjs-electron.svg" alt="npm" /></a>
        <a href="https://depfu.com/github/pedroslopez/whatsapp-web.js?project_id=9765"><img src="https://badges.depfu.com/badges/4a65a0de96ece65fdf39e294e0c8dcba/overview.svg" alt="Depfu" /></a>
        <img src="https://img.shields.io/badge/WhatsApp_Web-2.3000.1017054665-brightgreen.svg" alt="WhatsApp_Web 2.2346.52" />
        <a href="https://discord.gg/H7DqQs4"><img src="https://img.shields.io/discord/698610475432411196.svg?logo=discord" alt="Discord server" /></a>
	</p>
    <br />
</div>

## About
**A WhatsApp API client optimized for Electron applications**

wwebjs-electron is a fork of whatsapp-web.js with native support for Electron host applications. It embeds WhatsApp Web directly inside an Electron `BrowserWindow` or `BrowserView` — without spawning a separate Chromium instance and without relying on `puppeteer-in-electron`. Puppeteer attaches to Electron's own Chromium over CDP (Chrome DevTools Protocol), providing access to all WhatsApp Web features while maintaining the security and performance benefits of Electron.

> [!IMPORTANT]
> **It is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.**

## Links

* [Website][website]
* [Guide][guide] ([source][guide-source]) _(work in progress)_
* [Documentation][documentation] ([source][documentation-source])
* [WWebJS Discord][discord]
* [GitHub][gitHub]
* [npm][npm]

## Installation

The module is now available on npm! `npm i wwebjs-electron`

No extra dependencies are needed for Electron integration — `puppeteer-in-electron` and `puppeteer-core` are **not** required anymore.

> [!TIP]
> The bundled `puppeteer` dependency downloads a standalone Chromium (~170MB) during `npm install`. That browser is only used in standalone mode (outside Electron) — when the `electron` option is set, the client attaches to Electron's own Chromium instead. If your app only runs inside Electron, you can skip the download by setting the environment variable `PUPPETEER_SKIP_DOWNLOAD=true` before `npm install` (or via a `.puppeteerrc.cjs` with `{ skipDownload: true }`).

> [!NOTE]
> **Node ``v18+`` is required.**

## QUICK STEPS TO UPGRADE NODE

### Windows

#### Manual
Just get the latest LTS from the [official node website][nodejs].

#### npm
```powershell
sudo npm install -g n
sudo n stable
```

#### Choco
```powershell
choco install nodejs-lts
```

#### Winget
```powershell
winget install OpenJS.NodeJS.LTS
```

### Ubuntu / Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
```

## Example usage

### Basic Electron Implementation

> [!IMPORTANT]
> `wwebjs-electron` must be `require`d in your **main process before `app.whenReady()`**, so Chromium's remote debugging switch can be appended in time.

```js
// Require wwebjs-electron BEFORE app.whenReady() (top of your main process file)
const { app, BrowserWindow, BrowserView } = require('electron');
const { Client, LocalAuth } = require('wwebjs-electron');

app.whenReady().then(async () => {
    // Create main window
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Create BrowserView for WhatsApp
    const whatsappView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Add BrowserView to window
    mainWindow.addBrowserView(whatsappView);
    mainWindow.setBrowserView(whatsappView);

    // Set BrowserView bounds
    const { width, height } = mainWindow.getContentBounds();
    whatsappView.setBounds({ x: 0, y: 0, width, height });

    // Create WhatsApp client attached to the BrowserView
    // (you can also pass a whole window: electron: { window: mainWindow })
    const client = new Client({
        authStrategy: new LocalAuth(),
        electron: { view: whatsappView }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        // Display QR code to user
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
    });

    client.on('message', async (msg) => {
        if (msg.body === '!ping') {
            await msg.reply('🤖 Pong!');
        }
    });

    // Initialize client — WhatsApp Web is loaded into the BrowserView
    await client.initialize();
});
```

### Standalone Usage (Compatible with original whatsapp-web.js)

```js
const { Client, LocalAuth } = require('wwebjs-electron');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
```

Take a look at [example.js][examples] for another examples with additional use cases.  
For further details on saving and restoring sessions, explore the provided [Authentication Strategies][auth-strategies].

## Key Differences from whatsapp-web.js

wwebjs-electron adds a single `electron` option to `ClientOptions`:

```ts
electron?: {
    window?: Electron.BrowserWindow;
    view?: Electron.BrowserView;
};
```

When set, `client.initialize()`:

1. Reads the remote debugging port that Chromium wrote to `<userData>/DevToolsActivePort` (the switch `--remote-debugging-port=0` is appended automatically at `require` time — that's why the library must be required before `app.whenReady()`);
2. Connects Puppeteer to Electron's Chromium over CDP (`puppeteer.connect`), using your `puppeteer` client options as the base;
3. Locates the Puppeteer `Page` that corresponds to your `BrowserWindow`/`BrowserView` and loads WhatsApp Web into it.

Everything else — events, auth strategies, message APIs — behaves exactly like upstream whatsapp-web.js. If the `electron` option is not set, the library behaves identically to the original (spawning its own Chromium via Puppeteer), so it can also be used outside Electron.

### Migrating from puppeteer-in-electron (`page` option)

Older versions of wwebjs-electron used `puppeteer-in-electron` and a `page` option. That approach is no longer needed:

```diff
- const pie = require('puppeteer-in-electron');
- const puppeteer = require('puppeteer-core');
- pie.initialize(app);
- const browser = await pie.connect(app, puppeteer);
- const page = await pie.getPage(browser, whatsappView);
- const client = new Client({ authStrategy: new LocalAuth(), page });
+ const client = new Client({ authStrategy: new LocalAuth(), electron: { view: whatsappView } });
```

You can remove `puppeteer-core` and `puppeteer-in-electron` from your dependencies.

## Supported features

| Feature  | Status |
| ------------- | ------------- |
| Multi Device  | ✅  |
| Send messages  | ✅  |
| Receive messages  | ✅  |
| Send media (images/audio/documents)  | ✅  |
| Send media (video)  | ✅ [(requires Google Chrome)][google-chrome]  |
| Send stickers | ✅ |
| Receive media (images/audio/video/documents)  | ✅  |
| Send contact cards | ✅ |
| Send location | ✅ |
| Send buttons | ❌  [(DEPRECATED)][deprecated-video] |
| Send lists | ❌  [(DEPRECATED)][deprecated-video] |
| Receive location | ✅ | 
| Message replies | ✅ |
| Join groups by invite  | ✅ |
| Get invite for group  | ✅ |
| Modify group info (subject, description)  | ✅  |
| Modify group settings (send messages, edit info)  | ✅  |
| Add group participants  | ✅  |
| Kick group participants  | ✅  |
| Promote/demote group participants | ✅ |
| Mention users | ✅ |
| Mention groups | ✅ |
| Mute/unmute chats | ✅ |
| Block/unblock contacts | ✅ |
| Get contact info | ✅ |
| Get profile pictures | ✅ |
| Set user status message | ✅ |
| React to messages | ✅ |
| Create polls | ✅ |
| Channels | ✅ |
| Vote in polls | 🔜 |
| Communities | 🔜 |

Something missing? Make an issue and let us know!

## Contributing

Feel free to open pull requests; we welcome contributions! However, for significant changes, it's best to open an issue beforehand. Make sure to review our [contribution guidelines][contributing] before creating a pull request. Before creating your own issue or pull request, always check to see if one already exists!

## Supporting the project

You can support the maintainer of this project through the links below

- [Support via GitHub Sponsors][gitHub-sponsors]
- [Support via PayPal][support-payPal]
- [Sign up for DigitalOcean][digitalocean] and get $200 in credit when you sign up (Referral)

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at [whatsapp.com][whatsapp]. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners. Also it is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## License

Copyright 2019 Pedro S Lopez  

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this project except in compliance with the License.  
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.  

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License.  


[website]: https://wwebjs.dev
[guide]: https://guide.wwebjs.dev/guide
[guide-source]: https://github.com/wwebjs/wwebjs.dev/tree/main
[documentation]: https://docs.wwebjs.dev/
[documentation-source]: https://github.com/pedroslopez/whatsapp-web.js/tree/main/docs
[discord]: https://discord.gg/H7DqQs4
[gitHub]: https://github.com/pedroslopez/whatsapp-web.js
[npm]: https://npmjs.org/package/wwebjs-electron
[nodejs]: https://nodejs.org/en/download/
[examples]: https://github.com/pedroslopez/whatsapp-web.js/blob/master/example.js
[auth-strategies]: https://wwebjs.dev/guide/creating-your-bot/authentication.html
[google-chrome]: https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html#caveat-for-sending-videos-and-gifs
[deprecated-video]: https://www.youtube.com/watch?v=hv1R1rLeVVE
[gitHub-sponsors]: https://github.com/sponsors/pedroslopez
[support-payPal]: https://www.paypal.me/psla/
[digitalocean]: https://m.do.co/c/73f906a36ed4
[contributing]: https://github.com/pedroslopez/whatsapp-web.js/blob/main/CODE_OF_CONDUCT.md
[whatsapp]: https://whatsapp.com
