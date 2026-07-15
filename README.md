<div align="center">
    <p>
        <a href="https://github.com/AndyTargino/wwebjs-electron">
            <img src="https://raw.githubusercontent.com/AndyTargino/wwebjs-electron/main/.github/images/banner.png"
                title="wwebjs-electron" alt="wwebjs-electron" />
        </a>
    </p>
    <p>
        <a href="https://www.npmjs.com/package/wwebjs-electron"><img
                src="https://img.shields.io/npm/v/wwebjs-electron.svg" alt="npm" /></a>
        <a href="https://www.npmjs.com/package/wwebjs-electron"><img alt="NPM Downloads"
                src="https://img.shields.io/npm/d18m/wwebjs-electron" /></a>
        <a href="https://github.com/AndyTargino/wwebjs-electron/graphs/contributors"><img alt="GitHub contributors"
                src="https://img.shields.io/github/contributors-anon/AndyTargino/wwebjs-electron" /></a>
        <a href="https://discord.wwebjs.dev"><img
                src="https://img.shields.io/discord/698610475432411196.svg?logo=discord" alt="Discord server" /></a>
    </p>
</div>

## About

wwebjs-electron is inspired by (and kept in sync with) [whatsapp-web.js][wwebjs], adapted to run natively inside [Electron][electron] applications, **with interface**. Instead of spawning a hidden Chromium through Puppeteer, it loads WhatsApp Web straight into a `BrowserWindow` or `BrowserView` of your app, so your users can see and interact with WhatsApp while your code drives it through the same powerful API of whatsapp-web.js. Puppeteer attaches to Electron's own Chromium over CDP (Chrome DevTools Protocol): no `puppeteer-in-electron`, no `puppeteer-core`, no second browser.

Everything else (events, authentication strategies, messages, groups) behaves exactly like whatsapp-web.js. If you don't pass the `electron` option, it behaves identically to the original library (spawning its own browser), so it also works outside Electron.

## Links

- [GitHub][gitHub]
- [Guide][guide] ([source][guide-source])
- [Documentation][documentation] ([source][documentation-source])
- [Discord Server][discord]
- [npm][npm]

## Installation

**Node.js `v18.0.0` or higher and Electron `v20` or higher are required.**

```sh
npm install wwebjs-electron
yarn add wwebjs-electron
pnpm add wwebjs-electron
```

No extra dependencies are needed: `puppeteer-in-electron` and `puppeteer-core` are **not** required.

> [!TIP]
> The bundled `puppeteer` dependency downloads a standalone Chromium (~170MB) during `npm install`. It is only used in standalone mode (outside Electron); inside Electron the client attaches to Electron's own Chromium. If your app only runs inside Electron, skip the download with the environment variable `PUPPETEER_SKIP_DOWNLOAD=true` (or a `.puppeteerrc.cjs` with `{ skipDownload: true }`).

## Example usage

> [!IMPORTANT]
> `wwebjs-electron` must be `require`d in your **main process before `app.whenReady()`**, so Chromium's remote debugging switch can be appended in time. Just keep the `require` at the top of your main process file and you're fine.

### Inside an Electron `BrowserWindow`

WhatsApp Web takes over a whole window of your app:

```js
// main.js (Electron main process)
const { app, BrowserWindow } = require('electron'); // eslint-disable-line
const { Client, LocalAuth } = require('wwebjs-electron'); // required BEFORE app.whenReady()

app.whenReady().then(async () => {
    const whatsappWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const client = new Client({
        authStrategy: new LocalAuth(),
        electron: { window: whatsappWindow },
    });

    client.on('qr', (qr) => {
        // The QR code is also rendered visually inside the window,
        // so the user can simply scan it there!
        console.log('QR RECEIVED', qr);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', (msg) => {
        if (msg.body == '!ping') {
            msg.reply('pong');
        }
    });

    // initialize() loads WhatsApp Web into the window
    await client.initialize();
});
```

### Inside an Electron `BrowserView`

WhatsApp Web lives in a panel of your app, side by side with your own UI (a sidebar, a dashboard, etc.):

```js
// main.js (Electron main process)
const { app, BrowserWindow, BrowserView } = require('electron'); // eslint-disable-line
const { Client, LocalAuth } = require('wwebjs-electron'); // required BEFORE app.whenReady()

const SIDEBAR_WIDTH = 300; // space reserved for your own UI

app.whenReady().then(async () => {
    const mainWindow = new BrowserWindow({ width: 1400, height: 900 });

    // Your own interface (menu, contact list, CRM, whatever you build)
    mainWindow.loadFile('index.html');

    // The panel that will host WhatsApp Web
    const whatsappView = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.addBrowserView(whatsappView);

    const fitView = () => {
        const { width, height } = mainWindow.getContentBounds();
        whatsappView.setBounds({
            x: SIDEBAR_WIDTH,
            y: 0,
            width: width - SIDEBAR_WIDTH,
            height,
        });
    };
    fitView();
    mainWindow.on('resize', fitView);

    const client = new Client({
        authStrategy: new LocalAuth(),
        electron: { view: whatsappView },
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', async (msg) => {
        if (msg.body == '!ping') {
            await msg.reply('pong');
        }
    });

    // initialize() loads WhatsApp Web into the BrowserView
    await client.initialize();
});
```

> [!NOTE]
> `electron: { view }` accepts anything that exposes a `webContents`, so newer
> `WebContentsView` instances work the same way as `BrowserView`.

### Standalone (compatible with the original whatsapp-web.js)

Without the `electron` option, it works exactly like upstream, including outside Electron:

```js
const { Client } = require('wwebjs-electron');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', (msg) => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
```

Take a look at [example.js][examples] for additional examples and use cases.  
For more details on saving and restoring sessions, check out the [Authentication Strategies][auth-strategies].

### Migrating from puppeteer-in-electron (`page` option)

Older versions of wwebjs-electron relied on `puppeteer-in-electron` and a `page` option. That is no longer needed:

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

| Feature                                          | Status                                       |
| ------------------------------------------------ | -------------------------------------------- |
| Multi Device                                     | ✅                                           |
| Send messages                                    | ✅                                           |
| Receive messages                                 | ✅                                           |
| Send media (images/audio/documents)              | ✅                                           |
| Send media (video)                               | ✅ [(requires Google Chrome)][google-chrome] |
| Send stickers                                    | ✅                                           |
| Receive media (images/audio/video/documents)     | ✅                                           |
| Send contact cards                               | ✅                                           |
| Send location                                    | ✅                                           |
| Send buttons                                     | ❌ [(DEPRECATED)][deprecated-video]          |
| Send lists                                       | ❌ [(DEPRECATED)][deprecated-video]          |
| Receive location                                 | ✅                                           |
| Message replies                                  | ✅                                           |
| Join groups by invite                            | ✅                                           |
| Get invite for group                             | ✅                                           |
| Modify group info (subject, description)         | ✅                                           |
| Modify group settings (send messages, edit info) | ✅                                           |
| Add group participants                           | ✅                                           |
| Kick group participants                          | ✅                                           |
| Promote/demote group participants                | ✅                                           |
| Mention users                                    | ✅                                           |
| Mention groups                                   | ✅                                           |
| Mute/unmute chats                                | ✅                                           |
| Block/unblock contacts                           | ✅                                           |
| Get contact info                                 | ✅                                           |
| Get profile pictures                             | ✅                                           |
| Set user status message                          | ✅                                           |
| React to messages                                | ✅                                           |
| Create polls                                     | ✅                                           |
| Channels                                         | ✅                                           |
| Vote in polls                                    | ✅                                           |
| Communities                                      | 🔜                                           |

Something missing? Make an issue and let us know!

## How it works

When required from an Electron main process, wwebjs-electron appends `--remote-debugging-port=0` to Chromium's command line. Once your app is ready, `initialize()`:

1. Reads the debugging port Chromium wrote to `<userData>/DevToolsActivePort`;
2. Connects Puppeteer to Electron's own Chromium over CDP (`puppeteer.connect`, so no second browser is spawned);
3. Finds the Puppeteer `Page` that corresponds to your `BrowserWindow`/`BrowserView` and loads WhatsApp Web into it.

This project stays in sync with upstream [whatsapp-web.js][wwebjs] releases automatically: each release here mirrors the upstream release of the same version, with the Electron integration applied on top.

## Supporting the project

You can support the maintainer of the original whatsapp-web.js project through the links below:

- [Support via GitHub Sponsors][gitHub-sponsors]
- [Support via PayPal][support-payPal]

## Contributing

Feel free to open pull requests; we welcome contributions! However, for significant changes, it's best to open an issue beforehand. Before creating your own issue or pull request, always check to see if one already exists!

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at [whatsapp.com][whatsapp]. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners. Also it is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## License

Copyright 2019 Pedro S Lopez

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this project except in compliance with the License.  
You may obtain a copy of the License at <https://www.apache.org/licenses/LICENSE-2.0>.

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License.

[wwebjs]: https://github.com/wwebjs/whatsapp-web.js
[electron]: https://www.electronjs.org/
[guide]: https://guide.wwebjs.dev/guide
[guide-source]: https://github.com/wwebjs/wwebjs.dev/tree/main
[documentation]: https://docs.wwebjs.dev/
[documentation-source]: https://github.com/wwebjs/whatsapp-web.js/tree/main/docs
[discord]: https://discord.wwebjs.dev
[gitHub]: https://github.com/AndyTargino/wwebjs-electron
[npm]: https://npmjs.org/package/wwebjs-electron
[nodejs]: https://nodejs.org/en/download/
[examples]: https://github.com/AndyTargino/wwebjs-electron/blob/main/example.js
[auth-strategies]: https://wwebjs.dev/guide/creating-your-bot/authentication.html
[google-chrome]: https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html#caveat-for-sending-videos-and-gifs
[deprecated-video]: https://www.youtube.com/watch?v=hv1R1rLeVVE
[gitHub-sponsors]: https://github.com/sponsors/wwebjs
[support-payPal]: https://www.paypal.me/psla/
[whatsapp]: https://whatsapp.com
