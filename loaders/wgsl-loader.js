module.exports = function (/**@type string*/ source) {
    let result = source.replace(/\/\/.*|\/\*.*?\*\//g, ' ');
    result = result.replace(/(?<!\w)\s+|\s+(?!\w)/g, '');
    result = result.replace(/\s+/g, ' ');
    return result;
};
