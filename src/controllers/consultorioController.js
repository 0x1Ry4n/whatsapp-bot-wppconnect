const { tipoConsultaDefault, tipoProcedimentoDefault, tipoConvenioDefault, localAgendaDefault, dataValidadeDefault, horaFimDefault } = require("./constants/constants");
const { validatePatientScheduling } = require("../validators/schemas");
const { validationResult } = require("express-validator");
const apiRateLimit = require("../middlewares/rateLimit");
const logger = require("../config/logger");
const axios = require("axios");
const router = require("express").Router();

const associarPacienteConvenio = async ({ data, headers, auth }) => {
    const { tipoConvenioDefault, idPaciente } = data;

    try {
        const response = await axios.get(`${process.env.CONSULTORIO_API_ADDRESS}/convenio-paciente/lista`, {
            headers,
            auth,
            params: {
                idPaciente: idPaciente
            }
        });

        if (response.data.lista && response.data.lista.length > 0) {
            return response.data.lista[0];
        }

        const associar = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/convenio-paciente/associar`, {
            idPaciente: idPaciente,
            idTipoConvenio: tipoConvenioDefault,
            dataValidade: dataValidadeDefault
        }, {
            headers,
            auth
        });

        return associar.data;
    } catch (error) {
        throw error;
    }
};

const criarAgenda = async ({ data, idPaciente, headers, auth }) => {
    const {
        telefone,
        email,
        dataAgendamentoInicio,
	dataAgendamentoFim,
        status
    } = data;

    try {
        const dataAgendamentoInicioFormatado = new Date(dataAgendamentoInicio.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
        const dataAgendamentoFimFormatado = new Date(dataAgendamentoFim.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

	const associacaoPaciente = await associarPacienteConvenio({ data: { tipoConvenioDefault, idPaciente }, headers: headers, auth: auth });

        const response = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/agenda/novo`, {
            idPaciente: idPaciente,
            emailPaciente: email,
            telefoneCelularPaciente: telefone,
            data: `${dataAgendamentoInicioFormatado.getFullYear()}-${dataAgendamentoInicioFormatado.getMonth()}-${dataAgendamentoInicioFormatado.getDate()}`,
            horaInicio: `${dataAgendamentoInicioFormatado.getHours()}:${dataAgendamentoInicioFormatado.getMinutes()}:00`,
            horaFim: `${dataAgendamentoFimFormatado.getHours()}:${dataAgendamentoFimFormatado.getMinutes()}:00`,
            idTipoConsulta: tipoConsultaDefault,
            idLocalAgenda: localAgendaDefault,
            idPacienteConvenio: associacaoPaciente.id,
            procedimentos: [
                {
                    idTipoProcedimento: tipoProcedimentoDefault,
                    quantidade: 1
                }
            ],
            status: status
        }, {
            headers,
            auth
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

const criarPaciente = async ({ data, headers, auth }) => {
    const {
        nome,
        cpf,
	dataNascimento,
        telefone,
        email
    } = data;

    try {
        const response = await axios.post(`${process.env.CONSULTORIO_API_ADDRESS}/paciente/novo`, {
            nome: nome,
            cpfcnpj: cpf,
            dataNascimento: dataNascimento,
            sexo: "M",
            contato: {
                email: email,
                telefoneCelular: telefone
            },
            endereco: {
                bairro: "",
                cep: "",
                complemento: "",
                idCidade: 1,
                numero: "",
                rua: ""
            },
            estrangeiro: false
        }, {
            headers,
            auth
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

router.post("/createScheduling", apiRateLimit, validatePatientScheduling, async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            logger.error(errors);
            return res.status(422).json({
                message: errors.mapped()
            });
        }

        const { clientid, clientsecret, clinicanasnuvenscid } = req.headers;

        const headers = {
            'clinicaNasNuvens-cid': clinicanasnuvenscid,
        };

        const auth = {
            username: clientid,
            password: clientsecret
        };

        const params = {
            cpfCnpj: req.body.cpf
        };

        const responseLista = await axios.get(`${process.env.CONSULTORIO_API_ADDRESS}/paciente/lista`, {
            params,
            headers,
            auth
        });

        if (responseLista.data.lista && responseLista.data.lista.length > 0) {
            const obj = responseLista.data.lista[0];
            const agenda = await criarAgenda({ data: req.body, idPaciente: obj.id, headers: headers, auth: auth });
            console.log(agenda)
            res.status(200).json({ message: "Agenda criada." });
        } else {
            const obj = await criarPaciente({ data: req.body, headers: headers, auth: auth });
            const agenda = await criarAgenda({ data: req.body, idPaciente: obj.id, headers: headers, auth: auth });
            console.log(agenda)
            res.status(200).json({ message: "Paciente e agenda criados." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Erro ao criar o paciente ou a agenda", error: error.response?.data || error.response });
    }
});

module.exports = router;
