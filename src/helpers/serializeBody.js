function serializeBody(body) {
    const jsonObject = JSON.parse(body)

    const [nomeCliente, nomeProfissional, telefoneProfissional, telefoneCliente, tipoConsulta, dataAgendamento] = jsonObject.values[0];

    const data = {
        nomeCliente,
        nomeProfissional,
        telefoneProfissional,
        telefoneCliente,
        tipoConsulta,
        dataAgendamento
    };

    return data;
}

function serializeFilteredRows(rows) {
    serializedRows = []

    rows.forEach((row) => {
        const [nomeCliente, nomeProfissional, telefoneProfissional, telefoneCliente, tipoConsulta, dataAgendamento] = row;
        const data = {
            nomeCliente,
            nomeProfissional,
            telefoneProfissional,
            telefoneCliente,
            tipoConsulta,
            dataAgendamento
        };
        serializedRows.push(data)
    })

    return serializedRows;
}

module.exports = { serializeBody, serializeFilteredRows }