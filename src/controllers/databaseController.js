const apiRateLimit = require("../middlewares/rateLimit");
const { validationResult, body } = require("express-validator")
const { patientSender } = require("./messageController")
const phoneFormatter = require("../helpers/formatPhoneNumber");
const prisma = require("../config/mongoDb");
const router = require("express").Router();

const validateScheduling = [
    body("nomeCliente").isString({ min: 2, max: 100 }).exists(),
    body("nomeProfissional").isString({ min: 2, max: 100 }).exists(),
    body("telefoneCliente").isString({ max: 16 }).exists(),
    body("telefoneProfissional").isString({ max: 16 }).exists(),
    body("tipoConsulta").isString({ max: 75 }).exists(),
    body("dataAgendamento").isISO8601().exists(),
    body("agendado").isBoolean().exists()
]

router.post("/addScheduling", apiRateLimit, validateScheduling, async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
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
            dataAgendamento,
            agendado
        } = req.body;

        const scheduling = await prisma.agendamento.create({
            data: {
                nomeCliente: nomeCliente,
                nomeProfissional: nomeProfissional,
                telefoneCliente: phoneFormatter(telefoneCliente),
                telefoneProfissional: phoneFormatter(telefoneProfissional),
                tipoConsulta: tipoConsulta,
                dataAgendamento: dataAgendamento,
                agendado: agendado
            }
        })

        console.log(scheduling);

        if (patientSender(scheduling)) {
            res.status(201).json(scheduling)
            return
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({
            msg: "Unsucessful scheduling registration"
        })
        next()
    }
});

router.get("/listSchedulings", apiRateLimit, async (req, res, next) => {
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
                msg: "Unsucessful scheduling fetch!"
            })
        }

        return res.status(201).json(schedulings);
    } catch (error) {
        res.status(400).json({
            msg: "Unsucessful scheduling fetch!"
        })
        next()
    }
});

router.get("/filterData", apiRateLimit, async (req, res, next) => {

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

        console.log(schedulings)

        if (!schedulings.length > 0) {
            res.status(204).json({
                msg: "Unsucessful scheduling filtering!"
            })
            return;
        }

        return res.status(201).json({
            data: schedulings
        });
    } catch (error) {
        console.log(error)
        res.status(400).json({
            msg: "Error fetching scheduling"
        });
        next()
    }
});

router.post("/updateScheduling", apiRateLimit, async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: errors.mapped()
            })
        }

        console.log(req.query.id)

        const scheduling = await prisma.agendamento.update({
            where: {
                id: req.query.id,
            },
            data: {
                agendado: req.query.agendado === "true" ? true : false
            }
        })

        console.log(scheduling);

        return res.status(201).json(scheduling)
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            msg: "Unsucessful scheduling update"
        })
        next()
    }
});

module.exports = router;
