const { google } = require("googleapis");

async function getAuthSheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.SHEETS_KEY_FILE,
        scopes: process.env.SHEETS_SCOPES
    })

    const client = await auth.getClient();

    const googleSheets = google.sheets({
        version: process.env.SHEETS_VERSION,
        auth: client
    })

    const spreadsheetId = process.env.SPREAD_SHEET_ID

    return {
        auth,
        client,
        googleSheets,
        spreadsheetId
    }
}

module.exports = { getAuthSheets }