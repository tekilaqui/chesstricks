const fs = require('fs');

try {
    const raw = fs.readFileSync('puzzles.json', 'utf8');
    const content = `const LOCAL_PUZZLES_DB = ${raw};`;
    fs.writeFileSync('puzzles_data.js', content);
    console.log('Converted puzzles.json to puzzles_data.js');
} catch (e) {
    console.error('Error:', e);
}
