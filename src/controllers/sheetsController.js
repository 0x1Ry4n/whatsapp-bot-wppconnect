const sheetsRateLimit = require("../middlewares/rateLimit");
const { messageListener, sender } = require("./messageController")
const { serializeBody, serializeFilteredRows } = require("../helpers/serializeBody")
const { getAuthSheets } = require("../config/sheets");
const filterRows = require("../helpers/filterRows");
const router = require("express").Router();

router.get("/metadata", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId
    })
        .then((response) => {
            console.log(response);
            res.status(200).send(response.data);
        })
        .catch((error) => {
            console.log(`metadataError: ${error}`)
            res.status(500).send(error);
        })
})

router.get("/listSchedulings", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const { range } = req.query;

    await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: range
    })
        .then((response) => {
            console.log(response);
            res.status(200).send(response.data)
        })
        .catch((error) => {
            console.log(`listSchedulingError: ${error}`)
            res.status(500).send(error);
        })
})

router.get("/isKnowedNumber", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const { range, column, value } = req.query;

    await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: range
    })
        .then((response) => {
            const filterRowsData = filterRows(response.data, column, value)

            if (!filterRowsData.length > 0) {
                res.status(401).json({
                    result: false,
                    message: "O número não foi encontrado!",
                    data: null
                })
            }

            const serializedData = serializeFilteredRows(filterRowsData);

            console.log(serializedData)

            res.status(200).json({
                result: true,
                message: "Número encontrado com sucesso!",
                data: serializedData
            })
        })
        .catch((error) => {
            console.log(`isKnowedNumberError: ${error}`)
            res.status(500).json({
                result: false,
                message: `Ocorreu algum erro: ${error}`,
                data: null
            })
        })
});

router.post("/addScheduling", sheetsRateLimit, async (req, res) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const { values } = req.body
    const { range } = req.query

    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: values
        }
    })
        .then((response) => {
            if (!response) {
                res.status(500).json({
                    status: false
                })
            }

            const data = serializeBody(response.config.body)

            console.log(data);

            if (sender(data)) res.status(200).send(data)
        })
        .catch((error) => {
            console.log(`addSchedulingError: ${error}`)
            res.status(500).json({
                message: "Não foi possível gravar a linha na planilha!"
            })
        })
});

messageListener()

module.exports = router;
