import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const requiredVars = ['WIKIPEDIA_API_URL', 'REPLICATE_API_TOKEN', 'SITE_URL'];

function checkEnv() {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    console.error('.env file not found. Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }

  const envContent = readFileSync(envPath, 'utf-8');
  const missing = [];

  for (const varName of requiredVars) {
    const regex = new RegExp('^' + varName + '=', 'm');
    if (!regex.test(envContent)) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('Missing environment variables: ' + missing.join(', '));
    console.error('Check your .env file against .env.example');
    process.exit(1);
  }

  console.log('All required environment variables are present.');
}

checkEnv();
