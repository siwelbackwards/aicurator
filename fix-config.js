const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'next.config.js');
let configContent = fs.readFileSync(configPath, 'utf-8');

// Remove the dynamicParams line
configContent = configContent.replace(/^\s*\/\/\s*Allow dynamic parameters[^\n]*\n\s*dynamicParams:\s*true,\s*\n/m, '');

fs.writeFileSync(configPath, configContent);

console.log('Successfully removed dynamicParams from next.config.js'); 