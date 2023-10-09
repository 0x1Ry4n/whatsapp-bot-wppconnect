const sheetsRateLimit = require("../middlewares/rateLimit");
const { getAuthSheets } = require("../config/sheets");
const router = require("express").Router();

// sheets controller implementado

router.get("/metadata", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const metadata = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId
    })

    res.send(metadata.data);
})

router.get("/getRows", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Página1"
    })

    res.send(getRows.data)
})

router.post("/addRow", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const { values } = req.body

    const row = await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Página1",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: values
        }
    })

    res.send(row)
})


module.exports = router;
