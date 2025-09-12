export default {
    name: 'Clean Cli Tool Borders',
    function: (text) => {
        if (!text) return '';

        // This regex looks for lines that are enclosed in box-drawing characters
        // and removes the outer frame characters.
        const borderRegex = /^\s*[|│┃║┆┇┊┋╎╏┌┐└┘┏┓┗┛├┤┬┴┼┣┫┳┻╋]\s*(.*?)\s*[|│┃║┆┇┊┋╎╏┌┐└┘┏┓┗┛├┤┬┴┼┣┫┳┻╋]\s*$/;

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
