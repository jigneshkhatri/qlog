export const escapeString = (inputString) => {
    if (!inputString) {
        return '';
    }

    let escapedString = '';
    for (let i = 0; i < inputString.length; i++) {
        let c = inputString.charAt(i);
        switch (c) {
            case '\\':
                escapedString += '\\\\';
                break;
            case '"':
                escapedString += '\\"';
                break;
            case '\b':
                escapedString += '\\b';
                break;
            case '\f':
                escapedString += '\\f';
                break;
            case '\n':
                escapedString += '\\n';
                break;
            case '\r':
                escapedString += '\\r';
                break;
            case '\t':
                escapedString += '\\t';
                break;
            default:
                if (c < ' ' || c > '~') {
                    let hex = c.charCodeAt(0).toString(16);
                    escapedString += '\\u' + ('0000' + hex).slice(-4);
                } else {
                    escapedString += c;
                }
        }
    }
    return escapedString;
};