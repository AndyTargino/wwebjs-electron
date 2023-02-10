[![npm](https://img.shields.io/npm/v/whatsapp-web-electron.js)](https://www.npmjs.com/package/whatsapp-web-electron.js) [![Depfu](https://badges.depfu.com/badges/4a65a0de96ece65fdf39e294e0c8dcba/overview.svg)](https://depfu.com/github/pedroslopez/whatsapp-web.js?project_id=9765) ![WhatsApp_Web 2.2241.6](https://img.shields.io/badge/WhatsApp_Web-2.2241.6-brightgreen.svg) [![Discord Chat](https://img.shields.io/discord/698610475432411196.svg?logo=discord)](https://discord.gg/H7DqQs4) 

### This is an electron wrapper for [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) which connect using [puppeteer-in-electron](https://github.com/TrevorSundberg/puppeteer-in-electron).

A WhatsApp API client that connects through the WhatsApp Web browser app

It uses Puppeteer to run a real instance of Whatsapp Web to avoid getting blocked.

**NOTE:** I can't guarantee you will not be blocked by using this method, although it has worked for me. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## whatsapp-web.js Quick Links

* [Guide / Getting Started](https://wwebjs.dev/guide) _(work in progress)_
* [Reference documentation](https://docs.wwebjs.dev/)
* [GitHub](https://github.com/pedroslopez/whatsapp-web.js)
* [npm](https://npmjs.org/package/whatsapp-web.js)

## Installation

The module is now available on [npm](https://npmjs.org/package/whatsapp-web-electron.js)! `npm i whatsapp-web-electron.js`

Please note that Node v12+ is required.

## Example usage

```js
const { app, BrowserWindow } = require('electron');
const puppeteer = require('puppeteer-core');
const pie = require('puppeteer-in-electron');
const { Client } = require('whatsapp-web-electron.js');

const window = new BrowserWindow({
    // your options...
});

pie.connect(app, puppeteer).then((pieBrowser) => {
    const client = new Client(pieBrowser, window);

    // No need to listen for "qr" event as you can scan
    // the qr code directly in electron window

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', msg => {
        if (msg.body == '!ping') {
            msg.reply('pong');
        }
    });

    client.initialize();
});
```

Take a look at [whatsapp-web.js example.js](https://github.com/pedroslopez/whatsapp-web.js/blob/master/example.js) for another example with more use cases. The only difference should be the initialization process and a few feature (explained below).

## Preserving Sessions

The original project are using [Authentication Strategies](https://wwebjs.dev/guide/authentication.html) to save and restore sessions. No such thing are needed for electron since it already store its session, so the default `NoAuth` strategy works just fine.

## Remote Access and Docker

The original [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) has remote access feature and supports docker which is irrelevant for an electron project, that's why I didn't include it here.


## Supported features

| Feature  | Status |
| ------------- | ------------- |
| Multi Device  | ✅  |
| Send messages  | ✅  |
| Receive messages  | ✅  |
| Send media (images/audio/documents)  | ✅  |
| Send media (video)  | ✅ [(requires google chrome)](https://wwebjs.dev/guide/handling-attachments.html#caveat-for-sending-videos-and-gifs)  |
| Send stickers | ✅ |
| Receive media (images/audio/video/documents)  | ✅  |
| Send contact cards | ✅ |
| Send location | ✅ |
| Send buttons | ✅ |
| Send lists | ✅ (business accounts not supported) |
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
| Mute/unmute chats | ✅ |
| Block/unblock contacts | ✅ |
| Get contact info | ✅ |
| Get profile pictures | ✅ |
| Set user status message | ✅ |
| React to messages | ✅ |

Something missing? Make an issue and let us know!

## Contributing

Pull requests are welcome! If you see something you'd like to add, please do. For drastic changes, please open an issue first.

## Supporting the project

You can support the maintainer of original [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) project through the links below

- [Support via GitHub Sponsors](https://github.com/sponsors/pedroslopez)
- [Support via PayPal](https://www.paypal.me/psla/)
- [Sign up for DigitalOcean](https://m.do.co/c/73f906a36ed4) and get $100 in credit when you sign up (Referral)

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at https://whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this project except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
