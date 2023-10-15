const client = require("@wppconnect-team/wppconnect");
const session_name = "teste"

async function createSession() {
    return client.create({
        session: session_name,
        statusFind: (statusSession, session) => {
            console.log(`Session status: ${statusSession}`, `Session name: ${session}`)
        },
        catchQR: (base64Qr, asciiQR) => {
            console.log(asciiQR);

            let matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
                response = {};

            if (matches.length !== 3) {
                return new Error('Invalid input string');
            }

            response.type = matches[1];
            response.data = new Buffer.from(matches[2], 'base64');

            let imageBuffer = response;
            require('fs').writeFile(
                'src/assets/images/out.png',
                imageBuffer['data'],
                'binary',
                function (err) {
                    if (err != null) {
                        console.log(err);
                    }
                }
            );
        },
        logQR: false,
        headless: true,
        useChrome: true,
        folderNameToken: './tokens',
        tokenStore: 'file',
        disableWelcome: true,
        browserArgs: [
            '--disable-web-security',
            '--no-sandbox',
            '--aggressive-cache-discard',
            '--disable-cache',
            '--disable-application-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=0',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
        ],
    })
}

module.exports = { createSession }