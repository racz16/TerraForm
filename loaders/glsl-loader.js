module.exports = function (/**@type string*/ source) {
    let result = source.replace(/\/\/.*|\/\*.*?\*\//g, ' ');
    result = result.replace(/[ \t]+/g, ' ');
    const regex = /(\r?\n)?[ \t]*#.*(\r?\n)?|(?<!\w)(\r?\n)+(?!#)|(\r?\n)+(?!\w|#)/g;
    let regexResult;
    while ((regexResult = regex.exec(result))) {
        const match = regexResult[0];
        if (!match.includes('#')) {
            const position = regexResult.index;
            result = result.substring(0, position) + result.substring(position + match.length);
            regex.lastIndex = position;
        }
    }
    result = result.replace(/[ \t]+/g, ' ');
    return result;
};
