const { body } = require("express-validator");

const validateScheduling = [
    body("nomeCliente").isString({ min: 2, max: 255 }).exists(),
    body("nomeProfissional").isString({ min: 2, max: 255 }).exists(),
    body("telefoneCliente").isString({ max: 16 }).exists(),
    body("telefoneProfissional").isString({ max: 16 }).exists(),
    body("tipoConsulta").isString({ max: 75 }).exists(),
    body("dataAgendamento").isISO8601().exists()
]

const validateUpdateScheduling = [
    body("nomeCliente").isString({ min: 2, max: 255 }).optional(),
    body("nomeProfissional").isString({ min: 2, max: 255 }).optional(),
    body("telefoneCliente").isString({ max: 16 }).optional(),
    body("telefoneProfissional").isString({ max: 16 }).optional(),
    body("tipoConsulta").isString({ max: 75 }).optional(),
    body("dataAgendamento").isISO8601().optional(),
    body("agendado").isBoolean().optional()
]

const validatePatientScheduling = [
    body("nome").isString({ min: 2, max: 255 }),
    body("cpf").isString({ max: 12 }),
    body("telefone").isString({ min: 16 }),
    body("email").isString({ max: 255 }),
    body("dataAgendamento").isISO8601().optional(),
    body("status").isString()
]

module.exports = {
    validateScheduling,
    validateUpdateScheduling,
    validatePatientScheduling
}