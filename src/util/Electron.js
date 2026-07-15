/* Require Optional Dependencies */
try {
    var electron = require('electron');
} catch {
    electron = undefined;
}

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// enable chromium's remote debugging endpoint when wweb.js is required from an
// electron main process so the client can attach puppeteer over cdp. port 0
// lets chromium pick a free port and write it to <userData>/DevToolsActivePort.
if (electron && process.versions.electron) {
    electron.app.commandLine.appendSwitch('remote-debugging-port', '0');
}

const PORT_FILE_NAME = 'DevToolsActivePort';
const PORT_WAIT_TIMEOUT_MS = 5000;
const PORT_WAIT_INTERVAL_MS = 50;

/**
 * Wait for Chromium to write the chosen remote debugging port and return it.
 * Chromium writes the file shortly after the app becomes ready, so the wait
 * is usually a single tick.
 *
 * @returns {Promise<number>}
 */
async function getRemoteDebuggingPort() {
    if (!electron) {
        throw new Error('Not running inside an Electron main process.');
    }
    await electron.app.whenReady();
    const portFile = path.join(
        electron.app.getPath('userData'),
        PORT_FILE_NAME,
    );
    const deadline = Date.now() + PORT_WAIT_TIMEOUT_MS;
    while (Date.now() < deadline) {
        try {
            const head = (await fs.promises.readFile(portFile, 'utf8')).split(
                '\n',
            )[0];
            const port = parseInt(head, 10);
            if (port > 0) return port;
        } catch {
            // file not written yet
        }
        await new Promise((r) => setTimeout(r, PORT_WAIT_INTERVAL_MS));
    }
    throw new Error(
        'Could not determine the Electron remote debugging port. Make sure whatsapp-web.js is required before app.whenReady() in your main process.',
    );
}

/**
 * Find the Puppeteer Page that controls a given Electron BrowserWindow or
 * BrowserView. CDP exposes no direct mapping, so a one shot marker is injected
 * via executeJavaScript and browser.pages() is scanned for the page reporting
 * the marker.
 *
 * @param {object} browser - Puppeteer Browser
 * @param {object} target - Electron BrowserWindow or BrowserView
 * @returns {Promise<object|null>}
 */
async function matchPuppeteerPage(browser, target) {
    const marker = `__wweb_${crypto.randomUUID().replace(/-/g, '')}`;
    await target.webContents.executeJavaScript(`window.${marker}=true;`);
    let match = null;
    for (const candidate of await browser.pages()) {
        const matches = await candidate
            .evaluate((key) => window[key] === true, marker)
            .catch(() => false);
        if (matches) {
            match = candidate;
            break;
        }
    }
    await target.webContents
        .executeJavaScript(`delete window.${marker};`)
        .catch(() => {});
    return match;
}

module.exports = { getRemoteDebuggingPort, matchPuppeteerPage };
