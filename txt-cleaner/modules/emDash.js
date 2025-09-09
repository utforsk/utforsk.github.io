export default {
    name: 'Replace em-dash with hyphen',
    function: (text) => {
        if (!text) return '';
        return text.replace(/—/g, '-');
    }
};
