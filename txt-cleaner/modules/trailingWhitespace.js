export default {
    name: 'Remove trailing whitespace',
    function: (text) => {
        if (!text) return '';
        return text.split('\n').map(line => line.trimEnd()).join('\n');
    }
};
