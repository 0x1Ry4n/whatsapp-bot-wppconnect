const { body } = require("express-validator");

const validateScheduling = [
    body("nomeCliente").isString({ min: 2, max: 100 }).exists(),
    body("nomeProfissional").isString({ min: 2, max: 100 }).exists(),
    body("telefoneCliente").isString({ max: 16 }).exists(),
    body("telefoneProfissional").isString({ max: 16 }).exists(),
    body("tipoConsulta").isString({ max: 75 }).exists(),
    body("dataAgendamento").isISO8601().exists()
]

const validateUpdateScheduling = [
    body("nomeCliente").isString({ min: 2, max: 100 }).optional(),
    body("nomeProfissional").isString({ min: 2, max: 100 }).optional(),
    body("telefoneCliente").isString({ max: 16 }).optional(),
    body("telefoneProfissional").isString({ max: 16 }).optional(),
    body("tipoConsulta").isString({ max: 75 }).optional(),
    body("dataAgendamento").isISO8601().optional(),
    body("agendado").isBoolean().optional()
]

module.exports = {
    validateScheduling,
    validateUpdateScheduling
}