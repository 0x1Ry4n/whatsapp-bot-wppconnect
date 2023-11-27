const { validationResult } = require("express-validator")
const WhatsappBotController = require("./messageController")
const phoneFormatter = require("../helpers/formatPhoneNumber");
const prisma = require("../config/mongoDb");
const logger = require("../config/logger");

class DatabaseController {
    static async criarAgendamento(req, res, next) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                logger.error(errors);

                res.status(422).json({
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

            const dateFormatted = new Date(dataAgendamento).toISOString()
            const clientPhoneFormatted = phoneFormatter(telefoneCliente.replace(/\+/g, ""))
            const professionalPhoneFormatted = phoneFormatter(telefoneProfissional.replace(/\+/g, ""))

            const scheduling = await prisma.agendamento.create({
                data: {
                    nomeCliente: nomeCliente,
                    nomeProfissional: nomeProfissional,
                    telefoneCliente: clientPhoneFormatted,
                    telefoneProfissional: professionalPhoneFormatted,
                    tipoConsulta: tipoConsulta,
                    dataAgendamento: dateFormatted,
                    agendado: false
                }
            })

            logger.info(scheduling)

            if (WhatsappBotController.patientSender(scheduling)) {
                res.status(201).json(scheduling)
                return
            }
        } catch (error) {
            logger.error(error);
            res.status(400).json({
                msg: "Unsucessful scheduling registration"
            })
        }
    };

    static async listarAgendamentos(req, res, next) {
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

            res.status(200).json(schedulings);
        } catch (error) {
            logger.error(error);
            res.status(400).json({
                msg: "Unsucessful scheduling fetch!"
            })
        }
    };

    static async filtrarAgendamentos(req, res, next) {
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

            res.status(200).json({
                data: schedulings
            });
        } catch (error) {
            logger.error(error);
            res.status(400).json({
                msg: "Error fetching scheduling"
            });
        }
    };

    static async atualizarStatusAgendamento(req, res, next) {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                res.status(422).json({
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

            res.status(200).json(scheduling)
        } catch (error) {
            logger.error(error);
            res.status(400).json({
                msg: "Unsucessful scheduling update"
            })
        }
    };
}


module.exports = DatabaseController;
