module.exports = function (data, column, value) {
    const columns = data.values[0];
    const columnIndex = columns.indexOf(column);

    if (columnIndex === -1) {
        return [];
    }

    return data.values.slice(1).filter((row) => row[columnIndex] === value);
}

