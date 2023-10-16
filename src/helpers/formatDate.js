const formatDateToPTBR = (data) => {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(data).toLocaleString('pt-BR', options);
};

module.exports = { formatDateToPTBR }