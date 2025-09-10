export default {
    name: 'Clean Cli Tool Borders',
    function: (text) => {
        if (!text) return '';

        // This regex looks for lines that are enclosed in |...| characters,
        // which is common in text copied from k9s (and alike), and removes the border.
        const borderRegex = /^\s*\|\s*(.*?)\s*\|\s*$/;

        return text.split('\n').map(line => {
            const match = line.match(borderRegex);
            // If the line matches, return the captured content inside the pipes.
            if (match && match[1] !== undefined) {
                return match[1];
            }
            // Otherwise, return the line unchanged.
            return line;
        }).join('\n');
    }
};
