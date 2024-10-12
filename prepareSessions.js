const fs = require('fs');
const path = require('path');

const authDir = './wweb_auth';
const sessionsFile = './whatsapp-sessions.json';
const cacheDir = './.wwebjs_cache';

// Function to clean the .wwebjs_cache folder
function cleanCache() {
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    
    files.forEach(file => {
      const filePath = path.join(cacheDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });

    console.log('.wwebjs_cache folder has been cleaned.');
  } else {
    console.log('.wwebjs_cache folder does not exist.');
  }
}

function prepareSessions() {
  let sessions = [];

  // Load existing sessions if available
  if (fs.existsSync(sessionsFile)) {
    const existingSessionsData = fs.readFileSync(sessionsFile, 'utf-8');
    try {
      sessions = JSON.parse(existingSessionsData);
    } catch (error) {
      console.error('Error parsing existing sessions JSON:', error);
    }
  }

  // Read all session folders in the auth directory
  const folders = fs.readdirSync(authDir).filter(folder => folder.startsWith('session-'));

  folders.forEach(folder => {
    const id = folder.replace('session-', '');
    const existingSession = sessions.find(session => session.id === id);

    if (!existingSession) {
      // Add new session
      sessions.push({
        id: id,
        description: '',
        ready: true
      });
    }
  });

  // Write updated sessions to file
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}
cleanCache();
prepareSessions();
