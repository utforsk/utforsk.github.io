export default {
    name: 'Clean Shell Prompt',
    function: (text) => {
        if (!text) return '';

        const cleanLine = (line) => {
            // Common symbols that indicate a noisy prompt. If none exist, we can do a simpler check or exit.
            const noiseIndicators = ['', '', '', '', '✔', 'git'];
            const hasNoise = noiseIndicators.some(indicator => line.includes(indicator));

            if (!hasNoise) {
                // Handle simple prompts like 'user@host:~$ command' or '# command'
                const simpleMatch = line.match(/^(?:.*[a-z0-9-_]\s)?[#$%>~] ?(.*)$/i);
                if (simpleMatch && simpleMatch[1]) {
                    return '$ ' + simpleMatch[1].trim();
                }
                return line; // Not a prompt we can confidently clean
            }

            // It's a fancy prompt. Find the last possible prompt terminator before the command.
            const promptTerminators = ['$', '%', '#', '❯', '›', '➜', '', ''];
            let commandStartIndex = -1;

            for (const terminator of promptTerminators) {
                let index = line.lastIndexOf(terminator);
                if (index > commandStartIndex) {
                    commandStartIndex = index;
                }
            }

            if (commandStartIndex === -1) {
                return line; // No clear separator found
            }

            // The command is everything after the last terminator symbol.
            // We look for the first space after the symbol to be more precise.
            let command = line.substring(commandStartIndex + 1);
            const spaceAfterTerminator = command.search(/\s/);
            if (spaceAfterTerminator > -1) {
                command = command.substring(spaceAfterTerminator + 1);
            }

            // Now, remove trailing noise from the command itself.
            // Find the first occurrence of a trailing noise indicator.
            const trailerNoiseIndicators = ['', '✔'];
            let trailerStartIndex = -1;

            for (const indicator of trailerNoiseIndicators) {
                const index = command.indexOf(indicator);
                if (index !== -1 && (trailerStartIndex === -1 || index < trailerStartIndex)) {
                    trailerStartIndex = index;
                }
            }

            if (trailerStartIndex !== -1) {
                command = command.substring(0, trailerStartIndex);
            }

            command = command.trim();

            if (command) {
                return '$ ' + command;
            } else {
                // This was a line with only a prompt and no command.
                return '';
            }
        };

        return text.split('\n').map(cleanLine).join('\n');
    }
};
