import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let checked = 0;
let failed = 0;
function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (['node_modules', 'generated', '.git'].includes(entry.name)) continue;
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) visit(path);
        else if (entry.name.endsWith('.js')) {
            const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
            checked++;
            if (result.status !== 0) { console.error(path, result.stderr); failed++; }
        }
    }
}
for (const directory of ['RO4_1', 'RO4_2', 'RO4_3', 'RO4_4', 'scripts', 'tests']) visit(directory);
console.log(`Проверено JS-файлов: ${checked}; ошибок: ${failed}`);
process.exitCode = failed ? 1 : 0;
