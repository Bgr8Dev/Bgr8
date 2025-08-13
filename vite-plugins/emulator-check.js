/**
 * Vite plugin to check Firebase emulator status and warn in terminal
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ANSI color codes for terminal styling
const colors = {
  red: '\x1b[31m',
  orange: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const checkEmulatorPort = async (port) => {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(1000) // 1 second timeout
    });
    return true;
  } catch (error) {
    return false;
  }
};

const checkEmulatorAvailability = async () => {
  const emulatorPorts = [
    { name: 'Auth', port: 9099 },
    { name: 'Firestore', port: 8080 },
    { name: 'Storage', port: 9199 }
  ];
  
  const checks = emulatorPorts.map(async ({ name, port }) => {
    const available = await checkEmulatorPort(port);
    return { name, port, available };
  });
  
  return Promise.all(checks);
};

export default function emulatorCheckPlugin() {
  return {
    name: 'emulator-check',
    async configureServer(server) {
      // Only run in development mode
      if (server.config.command !== 'serve') return;

      console.log(`\n${colors.blue}🔍 Checking Firebase emulator configuration...${colors.reset}`);

      // Check .env file for VITE_USE_EMULATORS
      let useEmulators = false;
      try {
        const envPath = resolve(process.cwd(), '.env');
        const envContent = readFileSync(envPath, 'utf8');
        const envMatch = envContent.match(/^VITE_USE_EMULATORS=(.*)$/m);
        useEmulators = envMatch ? envMatch[1].trim() === 'true' : false;
      } catch (error) {
        // .env file doesn't exist or can't be read
      }

      if (!useEmulators) {
        console.log(`\n${colors.red}${colors.bold}⚠️  EMULATORS DISABLED WARNING${colors.reset}`);
        console.log(`${colors.red}🔥 FIREBASE EMULATORS ARE DISABLED!${colors.reset}`);
        console.log(`${colors.orange}📝 You are running in development mode but VITE_USE_EMULATORS=false${colors.reset}`);
        console.log(`${colors.orange}💡 This means you're using PRODUCTION Firebase services${colors.reset}`);
        console.log(`${colors.red}🚨 Data changes will affect your live Firebase project!${colors.reset}`);
        console.log(`${colors.blue}📚 See firebase_emulator/README.md for emulator setup instructions${colors.reset}\n`);
        return;
      }

      // Check if emulators are actually running
      const emulatorResults = await checkEmulatorAvailability();
      const unavailableEmulators = emulatorResults.filter(result => !result.available);
      
      if (unavailableEmulators.length > 0) {
        console.log(`\n${colors.orange}${colors.bold}⚠️  EMULATORS NOT RUNNING WARNING${colors.reset}`);
        console.log(`${colors.red}🔥 FIREBASE EMULATORS NOT DETECTED!${colors.reset}`);
        console.log(`${colors.orange}📝 VITE_USE_EMULATORS=true but emulators are not running${colors.reset}`);
        console.log(`${colors.red}🚨 Missing emulators: ${unavailableEmulators.map(e => `${e.name} (port ${e.port})`).join(', ')}${colors.reset}`);
        console.log(`${colors.blue}📚 See firebase_emulator/README.md for setup instructions${colors.reset}`);
        console.log(`${colors.orange}🔄 Your app will try to connect to production Firebase instead${colors.reset}\n`);
      } else {
        console.log(`${colors.green}✅ All Firebase emulators are running and configured correctly!${colors.reset}\n`);
      }
    }
  };
}
