const fs = require('fs');
const path = require('path');

const claudeKey = process.env.CLAUDE_API_KEY || '';

const content = `export const environment = {
    production: true,
    supabase: {
        url: 'https://szuhfoyqdkoyzltrexcr.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dWhmb3lxZGtveXpsdHJleGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDk1MDUsImV4cCI6MjA4OTY4NTUwNX0.jJeRzrcn-uuRmM3LsTpedc0xp8nRn_fmd7u7Ejv3kNE',
    },
    claudeApiKey: '${claudeKey}',
};
`;

const envPath = path.join(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(envPath, content);
console.log('environment.ts generated', claudeKey ? '(with Claude key)' : '(no Claude key)');
