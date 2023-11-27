const router = require("express").Router()
const ConsultorioController = require("../controllers/consultorioController")
const apiRateLimit = require("../middlewares/rateLimit");
const { validatePatientScheduling } = require("../validators/schemas");

router.post("/createScheduling", apiRateLimit, validatePatientScheduling, async (req, res, next) => {
    try {
        await ConsultorioController.criarAgendamento(req, res, next);
    } catch (error) {
        console.log(error)
    }
});

module.exports = router;