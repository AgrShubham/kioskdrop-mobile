const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONVERSATION_SOURCES = [
  {
    phase: 'Phase 1: Enterprise Web App & Project Genesis',
    dateRange: 'Oct 28, 2026 – Oct 29, 2026',
    base: 'C:/Users/agshu/.gemini/antigravity-ide/brain',
    convId: '5c60082d-60d9-40f3-95ef-45ec4633a678',
    summary: 'Next.js 14 Web App, Landed Cost Engine, Kiosk Simulator, Prisma ORM, 12-page Business Pitch Deck (DOCX/PDF), Vercel deployment setup, and Initial Git History.'
  },
  {
    phase: 'Phase 2: Neon Serverless Postgres, UI Theming & Video Automation',
    dateRange: 'Oct 30, 2026 – Nov 7, 2026',
    base: 'C:/Users/agshu/.gemini/antigravity-ide/brain',
    convId: '7d11e078-f000-4f99-a825-e2e95c8bd0ec',
    summary: 'Neon Postgres DB migration, Docker containerization, dynamic Theme Switcher & deep dark mode redesign, automated video demo recording & AI voiceover scripts.'
  },
  {
    phase: 'Phase 2.5: Experimental Git Flow, PIN Validation & Mobile App Specs',
    dateRange: 'Nov 9, 2026 – Nov 10, 2026',
    base: 'C:/Users/agshu/.gemini/antigravity/brain',
    convId: 'b83f6ec8-30ab-4ce7-bc62-12a289c30f3b',
    summary: '6-digit PIN validation debugging, experimental branch synchronization, and authoring MOBILE_APP_CONVERSION_PROMPT.md & MOBILE_APP_EXECUTION_PLAN.md.'
  },
  {
    phase: 'Phase 2 (Continuation): Architectural Spec Refinement',
    dateRange: 'Nov 10, 2026',
    base: 'C:/Users/agshu/.gemini/antigravity/brain',
    convId: '7d11e078-f000-4f99-a825-e2e95c8bd0ec',
    summary: 'Admin portal discovery, 10x detailed mobile conversion planning, and finalization of mobile system design.'
  },
  {
    phase: 'Phase 3: React Native Mobile App, APK Build & Railway Cloud Deployment',
    dateRange: 'Nov 10, 2026 – Nov 18, 2026',
    base: 'C:/Users/agshu/.gemini/antigravity/brain',
    convId: '03c2c618-5b57-4aba-8029-822acf17b355',
    summary: 'Full Expo/React Native cross-platform app in /mobile, Android Studio Emulator setup, UX overhaul, Standalone APK release compilation, Railway backend deployment (kioskdrop-mobile-production.up.railway.app), and live locker telemetry sync.'
  }
];

const OUTPUT_FILE = path.join(__dirname, '..', 'CHAT_HISTORY.md');

function cleanUserContent(raw) {
  if (!raw) return '';
  const match = raw.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
  if (match) {
    return match[1].trim();
  }
  // Remove metadata tags if present
  let cleaned = raw
    .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
    .replace(/<USER_SETTINGS_CHANGE>[\s\S]*?<\/USER_SETTINGS_CHANGE>/g, '')
    .trim();
  return cleaned || raw.trim();
}

function cleanAssistantContent(raw) {
  if (!raw) return '';
  // Remove internal thought tags if any exist in raw
  return raw
    .replace(/<thought>[\s\S]*?<\/thought>/g, '')
    .replace(/<SYSTEM_MESSAGE>[\s\S]*?<\/SYSTEM_MESSAGE>/g, '')
    .trim();
}

async function syncAllChatHistory() {
  console.log('Compiling project chat history across all conversation phases...');

  let md = `# 📜 KioskDrop Enterprise — Master Conversation & Development History\n\n`;
  md += `> **Project:** KioskDrop Enterprise & KioskDrop Mobile\n`;
  md += `> **Workspace:** \`d:\\Partition1 Backup\\PROJECTS\\Ricoz Internship\\KioskDrop App\`\n`;
  md += `> **Last Synchronized:** ${new Date().toISOString()}\n`;
  md += `> **Total Development Phases:** ${CONVERSATION_SOURCES.length} Recorded Sessions\n\n`;

  md += `## 📑 Executive Phases Overview\n\n`;
  md += `| Phase | Focus Area | Date Range | Primary Conv ID |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  for (let idx = 0; idx < CONVERSATION_SOURCES.length; idx++) {
    const s = CONVERSATION_SOURCES[idx];
    md += `| **Phase ${idx + 1}** | ${s.phase.split(':')[1]?.trim() || s.phase} | \`${s.dateRange}\` | \`${s.convId.substring(0, 8)}...\` |\n`;
  }
  md += `\n---\n\n`;

  let globalTurnIndex = 1;

  for (let idx = 0; idx < CONVERSATION_SOURCES.length; idx++) {
    const s = CONVERSATION_SOURCES[idx];
    const logPath = path.join(s.base, s.convId, '.system_generated', 'logs', 'transcript.jsonl');

    if (!fs.existsSync(logPath)) {
      console.warn(`Warning: Log not found for ${s.phase} at ${logPath}`);
      continue;
    }

    md += `## 🚀 ${s.phase}\n\n`;
    md += `> **Session Metadata:**\n`;
    md += `> - **Active Timeline:** \`${s.dateRange}\`\n`;
    md += `> - **Engine/Environment:** \`${s.base.includes('antigravity-ide') ? 'Antigravity IDE' : 'Antigravity 2.0'}\`\n`;
    md += `> - **Conversation ID:** \`${s.convId}\`\n`;
    md += `> - **Scope & Deliverables:** ${s.summary}\n\n`;

    const fileStream = fs.createReadStream(logPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const entries = [];
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const d = JSON.parse(line);
        if (d.type === 'USER_INPUT') {
          const content = cleanUserContent(d.content);
          if (content) {
            entries.push({
              role: 'User',
              step: d.step_index,
              time: d.created_at,
              content
            });
          }
        } else if (d.type === 'PLANNER_RESPONSE') {
          const raw = d.content || (d.model_response && d.model_response.content) || '';
          const content = cleanAssistantContent(raw);
          if (content) {
            entries.push({
              role: 'Assistant',
              step: d.step_index,
              time: d.created_at,
              content
            });
          }
        }
      } catch (err) {}
    }

    // Format turns
    for (const item of entries) {
      const isUser = item.role === 'User';
      const icon = isUser ? '👤' : '🤖';
      const title = isUser ? `Turn ${globalTurnIndex++}: User Request` : `Assistant Response`;
      const timeStr = item.time ? ` • *(${new Date(item.time).toLocaleString()})*` : '';

      md += `### ${icon} ${title}${timeStr}\n\n`;
      md += `${item.content}\n\n`;
      md += `---\n\n`;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, md, 'utf-8');
  console.log(`Successfully generated Master CHAT_HISTORY.md (${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB)`);
}

module.exports = { syncAllChatHistory, CONVERSATION_SOURCES };

if (require.main === module) {
  syncAllChatHistory().catch(err => {
    console.error('Error syncing master chat history:', err);
    process.exit(1);
  });
}
