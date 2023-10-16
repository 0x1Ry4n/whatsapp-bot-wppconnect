const apiRateLimit = require("../middlewares/rateLimit");
const checkAuth = require("../middlewares/checkAuth");
const { validationResult } = require("express-validator")
const { validateScheduling, validateUpdateScheduling } = require("../validators/validateReq");
const { patientSender } = require("./messageController")
const phoneFormatter = require("../helpers/formatPhoneNumber");
const logger = require("../config/logger");
const prisma = require("../config/mongoDb");
const router = require("express").Router();

router.post("/addScheduling", apiRateLimit, validateScheduling, async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            logger.error(errors);

            return res.status(422).json({
                message: errors.mapped()
            })
        }

        const {
            nomeCliente,
            nomeProfissional,
            telefoneCliente,
            telefoneProfissional,
            tipoConsulta,
            dataAgendamento
        } = req.body;

        const dateFormatted = new Date(dataAgendamento)

        const scheduling = await prisma.agendamento.create({
            data: {
                nomeCliente: nomeCliente,
                nomeProfissional: nomeProfissional,
                telefoneCliente: phoneFormatter(telefoneCliente.replace(/\+/g, "")),
                telefoneProfissional: phoneFormatter(telefoneProfissional.replace(/\+/g, "")),
                tipoConsulta: tipoConsulta,
                dataAgendamento: dateFormatted.toISOString(),
                agendado: false
            }
        })

        logger.info(scheduling)

        if (patientSender(scheduling)) {
            res.status(201).json(scheduling)
            return
        }
    } catch (error) {
        logger.error(error);
        return res.status(400).json({
            msg: "Unsucessful scheduling registration"
        })
    }
});

router.get("/listSchedulings", checkAuth, apiRateLimit, async (req, res, next) => {
    try {
        const schedulings = await prisma.agendamento.findMany({
            select: {
                id: true,
                nomeCliente: true,
                nomeProfissional: true,
                telefoneCliente: true,
                telefoneProfissional: true,
                tipoConsulta: true,
                dataAgendamento: true,
                agendado: true
            }
        })

        if (!schedulings.length > 0) {
            res.status(204).json({
                msg: "Response content is none"
            })
        }

        logger.info(schedulings);

        return res.status(200).json(schedulings);
    } catch (error) {
        logger.error(error);
        return res.status(400).json({
            msg: "Unsucessful scheduling fetch!"
        })
    }
});

router.get("/filterData", checkAuth, apiRateLimit, async (req, res, next) => {
    try {
        const schedulings = await prisma.agendamento.findMany({
            where: {
                telefoneProfissional: req.query.telefoneProfissional,
                agendado: req.query.agendado === "true" ? true : false
            },
            select: {
                id: true,
                nomeCliente: true,
                nomeProfissional: true,
                telefoneCliente: true,
                telefoneProfissional: true,
                tipoConsulta: true,
                dataAgendamento: true,
                agendado: true
            },
        });

        if (!schedulings.length > 0) {
            res.status(204).json({
                msg: "Response content is none"
            })
            return
        }

        logger.info(schedulings);

        return res.status(201).json({
            data: schedulings
        });
    } catch (error) {
        logger.error(error);
        return res.status(400).json({
            msg: "Error fetching scheduling"
        });
    }
});

router.post("/updateScheduling", checkAuth, apiRateLimit, validateUpdateScheduling, async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: errors.mapped()
            })
        }

        const scheduling = await prisma.agendamento.update({
            where: {
                id: req.query.id,
            },
            data: {
                agendado: req.query.agendado === "true" ? true : false
            }
        })

        logger.info(scheduling);

        return res.status(200).json(scheduling)
    } catch (error) {
        logger.error(error);
        return res.status(400).json({
            msg: "Unsucessful scheduling update"
        })
    }
});

module.exports = router;
