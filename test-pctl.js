const { spawn } = require('child_process');
const format = '{{status}}~~DELIM~~{{xesam:title}}~~DELIM~~{{xesam:artist}}~~DELIM~~{{xesam:album}}~~DELIM~~{{mpris:artUrl}}~~DELIM~~{{mpris:length}}';
const p = spawn('playerctl', ['metadata', '--format', format]);
p.stdout.on('data', d => console.log('OUT:', d.toString()));
p.on('close', () => console.log('DONE'));
