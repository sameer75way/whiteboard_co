const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') return;
        file = dir + '/' + file;
        try {
            const stat = fs.lstatSync(file);
            if (stat && stat.isDirectory()) { 
                results = results.concat(walk(file));
            } else if (stat && stat.isSymbolicLink()) {
                return;
            } else { 
                if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                    results.push(file);
                }
            }
        } catch(e) {}
    });
    return results;
}

const files = [...walk('client/src'), ...walk('server/src'), ...walk('shared/types')];
let count = 0;

files.forEach(file => {
    let original = fs.readFileSync(file, 'utf8');
    
    let content = original.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/(?<![:"'])\/\/.*/g, '');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
    }
});

console.log(`Stripped comments from ${count} files.`);
