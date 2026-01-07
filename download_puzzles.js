const fs = require('fs');
const https = require('https');

const THEMES = ['mateIn1', 'mateIn2', 'advantage', 'middlegame', 'opening'];
const PUZZLES_PER_THEME = 100; // Total ~500 puzzles
const OUTPUT_FILE = 'puzzles.json';

let allPuzzles = [];

function fetchPuzzles(theme) {
    return new Promise((resolve) => {
        const url = `https://chess-puzzles-api.vercel.app/puzzles?themes=${theme}&limit=${PUZZLES_PER_THEME}`;
        console.log(`Fetching ${theme}...`);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const puzzles = JSON.parse(data);
                    // Add theme to each puzzle object if not present, or just trust the fetch
                    puzzles.forEach(p => {
                        // Ensure themes string includes the fetched theme
                        if (!p.Themes) p.Themes = theme;
                    });
                    resolve(puzzles);
                } catch (e) {
                    console.error(`Error parsing ${theme}:`, e);
                    resolve([]);
                }
            });
        }).on('error', err => {
            console.error(`Error fetching ${theme}:`, err);
            resolve([]);
        });
    });
}

async function run() {
    for (const theme of THEMES) {
        const puzzles = await fetchPuzzles(theme);
        console.log(`Got ${puzzles.length} puzzles for ${theme}`);
        allPuzzles = allPuzzles.concat(puzzles);
    }

    // Remove duplicates based on PuzzleId
    const seen = new Set();
    const uniquePuzzles = allPuzzles.filter(p => {
        if (seen.has(p.PuzzleId)) return false;
        seen.add(p.PuzzleId);
        return true;
    });

    console.log(`Total unique puzzles: ${uniquePuzzles.length}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniquePuzzles, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

run();
