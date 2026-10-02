import { validateParticleEntityConfig } from './validateParticleEntityConfig.js';
/** Scan structure before JSON.parse so duplicate decoded property names cannot disappear. */
export function parseParticleEntityConfig(json) {
    if (typeof json !== 'string')
        throw new TypeError('json must be a string');
    let cursor = 0;
    const whitespace = () => { while (/\s/.test(json[cursor] ?? '') && cursor < json.length)
        cursor++; };
    const string = () => {
        const start = cursor++;
        while (cursor < json.length) {
            const char = json[cursor++];
            if (char === '\\')
                cursor++;
            else if (char === '"')
                return JSON.parse(json.slice(start, cursor));
        }
        throw new SyntaxError('Unterminated JSON string');
    };
    const value = () => {
        whitespace();
        if (json[cursor] === '{') {
            cursor++;
            whitespace();
            const keys = new Set();
            if (json[cursor] === '}') {
                cursor++;
                return;
            }
            while (cursor < json.length) {
                whitespace();
                if (json[cursor] !== '"')
                    throw new SyntaxError('Expected JSON property');
                const key = string();
                if (keys.has(key))
                    throw new SyntaxError(`Duplicate JSON key: ${key}`);
                keys.add(key);
                whitespace();
                if (json[cursor++] !== ':')
                    throw new SyntaxError('Expected colon');
                value();
                whitespace();
                const char = json[cursor++];
                if (char === '}')
                    return;
                if (char !== ',')
                    throw new SyntaxError('Expected comma');
            }
        }
        else if (json[cursor] === '[') {
            cursor++;
            whitespace();
            if (json[cursor] === ']') {
                cursor++;
                return;
            }
            while (cursor < json.length) {
                value();
                whitespace();
                const char = json[cursor++];
                if (char === ']')
                    return;
                if (char !== ',')
                    throw new SyntaxError('Expected comma');
            }
        }
        else if (json[cursor] === '"') {
            string();
            return;
        }
        else {
            const start = cursor;
            while (cursor < json.length && !/[\s,\]}]/.test(json[cursor]))
                cursor++;
            if (cursor === start)
                throw new SyntaxError('Expected JSON value');
            JSON.parse(json.slice(start, cursor));
            return;
        }
        throw new SyntaxError('Unterminated JSON structure');
    };
    value();
    whitespace();
    if (cursor !== json.length)
        throw new SyntaxError('Unexpected trailing JSON content');
    return validateParticleEntityConfig(JSON.parse(json));
}
