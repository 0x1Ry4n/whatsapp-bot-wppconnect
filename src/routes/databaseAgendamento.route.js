const router = require("express").Router()
const DatabaseController = require("../controllers/databaseController");
const apiRateLimit = require("../middlewares/rateLimit");
const checkAuth = require("../middlewares/checkAuth");
const { validateScheduling, validateUpdateScheduling } = require("../validators/schemas");

router.post("/createScheduling", checkAuth, apiRateLimit, validateScheduling, async (req, res, next) => {
    try {
        await DatabaseController.criarAgendamento(req, res, next);
    } catch (error) {
        console.error(error)
    }
});

router.get("/listSchedulings", checkAuth, apiRateLimit, async (req, res, next) => {
    try {
        await DatabaseController.listarAgendamentos(req, res, next);
    } catch (error) {
        console.error(error)
    }
});

router.get("/filterScheduling", checkAuth, apiRateLimit, async (req, res, next) => {
    try {
        await DatabaseController.filtrarAgendamentos(req, res, next);
    } catch (error) {
        console.error(error)
    }
});

router.post("/updateSchedulingStatus", checkAuth, apiRateLimit, validateUpdateScheduling, async (req, res, next) => {
    try {
        await DatabaseController.atualizarStatusAgendamento(req, res, next);
    } catch (error) {
        console.error(error)
    }
});

module.exports = router;