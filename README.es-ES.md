

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

## Acerca de

wwebjs-electron se inspira en (y se mantiene sincronizado con) [whatsapp-web.js][wwebjs], adaptado para ejecutarse nativamente dentro de aplicaciones [Electron][electron], **con interfaz**. En lugar de iniciar un Chromium oculto a través de Puppeteer, carga WhatsApp Web directamente en una `BrowserWindow` o `BrowserView` de tu aplicación, para que tus usuarios puedan ver e interactuar con WhatsApp mientras tu código lo controla a través de la misma potente API de whatsapp-web.js. Puppeteer se conecta al propio Chromium de Electron a través de CDP (Chrome DevTools Protocol): sin `puppeteer-in-electron`, sin `puppeteer-core`, sin un segundo navegador.

Todo lo demás (eventos, estrategias de autenticación, mensajes, grupos) se comporta exactamente como whatsapp-web.js. Si no pasas la opción `electron`, se comporta idénticamente a la biblioteca original (iniciando su propio navegador), por lo que también funciona fuera de Electron.

## Enlaces

- [GitHub][gitHub]
- [Guía][guide] ([fuente][guide-source])
- [Documentación][documentation] ([fuente][documentation-source])
- [Servidor de Discord][discord]
- [npm][npm]

## Instalación

**Se requiere Node.js `v18.0.0` o superior y Electron `v20` o superior.**

```sh
npm install wwebjs-electron
yarn add wwebjs-electron
pnpm add wwebjs-electron
```

No se necesitan dependencias adicionales: `puppeteer-in-electron` y `puppeteer-core` **no** son requeridos.

### Canales de versión

whatsapp-web.js publica versiones estables a un ritmo lento, pero su rama `main` se actualiza casi a diario. wwebjs-electron refleja ambas:

| Canal | Instalación | Refleja | Versión de ejemplo |
| ------- | ------- | ------- | --------------- |
| Estable | `npm install wwebjs-electron` | la última **versión** de whatsapp-web.js | `1.34.7` |
| Beta | `npm install wwebjs-electron@beta` | la rama **`main`** de whatsapp-web.js | `1.34.8-beta.1` |

Una versión beta es una prepublicación de la *siguiente* versión de parche, por lo que siempre se considera superior a la versión estable actual, y la versión oficial la reemplaza tan pronto como se publica aguas arriba. Los rangos estándar como `^1.34.7` nunca se resuelven en una versión beta, por lo que solo obtendrás una si la solicitas explícitamente. Las betas contienen código original que aún no ha pasado por una versión oficial: útil para aplicar una corrección anticipada, pero no recomendado para producción.

El código estable reside en la rama [`main`](https://github.com/AndyTargino/wwebjs-electron/tree/main) y el código beta en la rama [`beta`](https://github.com/AndyTargino/wwebjs-electron/tree/beta).

> [!TIP]
> La dependencia `puppeteer` incluida descarga un Chromium independiente (~170 MB) durante `npm install`. Solo se utiliza en modo independiente (fuera de Electron); dentro de Electron, el cliente se conecta al propio Chromium de Electron. Si tu aplicación solo se ejecuta dentro de Electron, omite la descarga con la variable de entorno `PUPPETEER_SKIP_DOWNLOAD=true` (o un archivo `.puppeteerrc.cjs` con `{ skipDownload: true }`).

## Ejemplo de uso

> [!IMPORTANT]
> `wwebjs-electron` debe importarse con `require` en tu **proceso principal antes de `app.whenReady()`**, para que se pueda agregar a tiempo el parámetro de depuración remota de Chromium. Simplemente mantén el `require` en la parte superior de tu archivo del proceso principal y estarás bien.

### Dentro de una `BrowserWindow` de Electron

WhatsApp Web ocupa toda una ventana de tu aplicación:

```js
// main.js (proceso principal de Electron)
const { app, BrowserWindow } = require('electron'); // eslint-disable-line
const { Client, LocalAuth } = require('wwebjs-electron'); // requerido ANTES de app.whenReady()

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
        // El código QR también se muestra visualmente dentro de la ventana,
        // ¡así que el usuario simplemente puede escanearlo allí!
        console.log('QR RECIBIDO', qr);
    });

    client.on('ready', () => {
        console.log('¡Cliente listo!');
    });

    client.on('message', (msg) => {
        if (msg.body == '!ping') {
            msg.reply('pong');
        }
    });

    // initialize() carga WhatsApp Web en la ventana
    await client.initialize();
});
```

### Dentro de una `BrowserView` de Electron

WhatsApp Web reside en un panel de tu aplicación, junto a tu propia interfaz (una barra lateral, un panel de control, etc.):

```js
// main.js (proceso principal de Electron)
const { app, BrowserWindow, BrowserView } = require('electron'); // eslint-disable-line
const { Client, LocalAuth } = require('wwebjs-electron'); // requerido ANTES de app.whenReady()

const SIDEBAR_WIDTH = 300; // espacio reservado para tu propia interfaz

app.whenReady().then(async () => {
    const mainWindow = new BrowserWindow({ width: 1400, height: 900 });

    // Tu propia interfaz (menú, lista de contactos, CRM, lo que sea que construyas)
    mainWindow.loadFile('index.html');

    // El panel que alojará WhatsApp Web
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
        console.log('¡Cliente listo!');
    });

    client.on('message', async (msg) => {
        if (msg.body == '!ping') {
            await msg.reply('pong');
        }
    });

    // initialize() carga WhatsApp Web en la BrowserView
    await client.initialize();
});
```

> [!NOTE]
> `electron: { view }` acepta cualquier objeto que exponga un `webContents`, por lo que las instancias más recientes de `WebContentsView` funcionan de la misma manera que `BrowserView`.

### Modo independiente (compatible con el whatsapp-web.js original)

Sin la opción `electron`, funciona exactamente como el código original, incluyendo fuera de Electron:

```js
const { Client } = require('wwebjs-electron');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡Cliente listo!');
});

client.on('message', (msg) => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
```

Echa un vistazo a [example.js][examples] para ver ejemplos y casos de uso adicionales.  
Para obtener más detalles sobre cómo guardar y restaurar sesiones, consulta las [Estrategias de Autenticación][auth-strategies].

### Migración desde puppeteer-in-electron (opción `page`)

Las versiones anteriores de wwebjs-electron dependían de `puppeteer-in-electron` y una opción `page`. Ya no es necesario:

```diff
- const pie = require('puppeteer-in-electron');
- const puppeteer = require('puppeteer-core');
- pie.initialize(app);
- const browser = await pie.connect(app, puppeteer);
- const page = await pie.getPage(browser, whatsappView);
- const client = new Client({ authStrategy: new LocalAuth(), page });
+ const client = new Client({ authStrategy: new LocalAuth(), electron: { view: whatsappView } });
```

Puedes eliminar `puppeteer-core` y `puppeteer-in-electron` de tus dependencias.

## Características compatibles

| Característica                                          | Estado                                       |
| ------------------------------------------------ | -------------------------------------------- |
| Multi Dispositivo                                  | ✅                                           |
| Enviar mensajes                                    | ✅                                           |
| Recibir mensajes                                   | ✅                                           |
| Enviar multimedia (imágenes/audio/documentos)      | ✅                                           |
| Enviar multimedia (video)                          | ✅ [(requiere Google Chrome)][google-chrome] |
| Enviar stickers                                    | ✅                                           |
| Recibir multimedia (imágenes/audio/video/documentos)| ✅                                           |
| Enviar tarjetas de contacto                        | ✅                                           |
| Enviar ubicación                                   | ✅                                           |
| Enviar botones                                     | ❌ [(OBSOLETO)][deprecated-video]            |
| Enviar listas                                      | ❌ [(OBSOLETO)][deprecated-video]            |
| Recibir ubicación                                  | ✅                                           |
| Respuestas a mensajes                              | ✅                                           |
| Unirse a grupos por invitación                     | ✅                                           |
| Obtener invitación para grupo                      | ✅                                           |
| Modificar información del grupo (nombre, descripción)| ✅                                         |
| Modificar ajustes del grupo (enviar mensajes, editar info)| ✅                                     |
| Añadir participantes al grupo                      | ✅                                           |
| Expulsar participantes del grupo                   | ✅                                           |
| Promover/degradar participantes del grupo          | ✅                                           |
| Mencionar usuarios                                 | ✅                                           |
| Mencionar grupos                                   | ✅                                           |
| Silenciar/desilenciar chats                        | ✅                                           |
| Bloquear/desbloquear contactos                     | ✅                                           |
| Obtener información de contacto                    | ✅                                           |
| Obtener fotos de perfil                            | ✅                                           |
| Establecer estado del usuario                      | ✅                                           |
| Reaccionar a mensajes                              | ✅                                           |
| Crear encuestas                                    | ✅                                           |
| Canales                                            | ✅                                           |
| Votar en encuestas                                 | ✅                                           |
| Comunidades                                        | 🔜                                           |

¿Falta algo? ¡Crea un issue y háznoslo saber!

## Cómo funciona

Al importarlo desde un proceso principal de Electron, wwebjs-electron agrega `--remote-debugging-port=0` a la línea de comandos de Chromium. Una vez que tu aplicación está lista, `initialize()`:

1. Lee el puerto de depuración que Chromium escribió en `<userData>/DevToolsActivePort`;
2. Conecta Puppeteer al propio Chromium de Electron a través de CDP (`puppeteer.connect`, por lo que no se inicia un segundo navegador);
3. Encuentra la `Page` de Puppeteer que corresponde a tu `BrowserWindow`/`BrowserView` y carga WhatsApp Web en ella.

Este proyecto se mantiene sincronizado automáticamente con los lanzamientos de [whatsapp-web.js][wwebjs]: cada lanzamiento aquí refleja la versión original de la misma versión, con la integración de Electron aplicada encima.

## Apoyar el proyecto

Puedes apoyar al mantenedor del proyecto original whatsapp-web.js a través de los siguientes enlaces:

- [Apoyar a través de GitHub Sponsors][gitHub-sponsors]
- [Apoyar a través de PayPal][support-payPal]

## Contribuir

¡Siente libre de abrir pull requests; bienvenidas las contribuciones! Sin embargo, para cambios significativos, es mejor abrir un issue de antemano. ¡Antes de crear tu propio issue o pull request, verifica siempre si ya existe uno!

## Descargo de responsabilidad

Este proyecto no está afiliado, asociado, autorizado, respaldado por, ni conectado de ninguna manera oficialmente con WhatsApp ni con ninguna de sus filiales o afiliados. El sitio web oficial de WhatsApp se puede encontrar en [whatsapp.com][whatsapp]. "WhatsApp", así como nombres, marcas, emblemas e imágenes relacionados, son marcas comerciales registradas de sus respectivos propietarios. Tampoco está garantizado que no serás bloqueado al usar este método. WhatsApp no permite bots ni clientes no oficiales en su plataforma, por lo que esto no debería considerarse totalmente seguro.

## Licencia

Copyright 2019 Pedro S Lopez

Licenciado bajo la Licencia Apache, Versión 2.0 (la "Licencia");  
no podrá utilizar este proyecto excepto de acuerdo con la Licencia.  
Puede obtener una copia de la Licencia en <https://www.apache.org/licenses/LICENSE-2.0>.

A menos que se requiera por ley aplicable o se acuerde por escrito, el software  
distribuido bajo la Licencia se distribuye en una base "TAL CUAL",  
SIN GARANTÍAS O CONDICIONES DE NINGÚN TIPO, ya sean expresas o implícitas.  
Consulte la Licencia para el lenguaje específico que rige los permisos y  
las limitaciones bajo la Licencia.

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
