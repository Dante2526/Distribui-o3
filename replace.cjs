const fs = require('fs');
let content = fs.readFileSync('c:/Users/nayla/.antigravity/Distribui-o2/src/App.tsx', 'utf-8');

// Global Background
content = content.replace(/bg-black/g, 'bg-[#1A202C]');
content = content.replace(/text-gray-100/g, 'text-[#f7fafc]');

// Header
content = content.replace(/bg-\[#29303D\]/g, 'bg-[#2D3748]');
content = content.replace(/text-\[#A0ABB8\]/g, 'text-[#a0aec0]');

// Cards
content = content.replace(/bg-\[#1C1C1E\]/g, 'bg-[#2D3748]');
content = content.replace(/border-\[#2C2C2E\]/g, 'border-[#1A202C]');
content = content.replace(/bg-\[#2C2C2E\]\/20/g, 'bg-[#1A202C]/20');

// Rows
content = content.replace(/bg-\[#2A2B31\]/g, 'bg-[#1A202C]');
content = content.replace(/hover:bg-\[#34353C\]/g, 'hover:bg-[#4a5568]');
content = content.replace(/bg-\[#34353C\]/g, 'bg-[#2D3748]'); // dropdown bg
content = content.replace(/text-\[#8E8E93\]/g, 'text-[#a0aec0]');
content = content.replace(/hover:bg-\[#2C2C2E\]\/30/g, 'hover:bg-[#1A202C]/50');
content = content.replace(/bg-\[#1D1E22\]/g, 'bg-[#2D3748]'); // dropdown 2 bg

fs.writeFileSync('c:/Users/nayla/.antigravity/Distribui-o2/src/App.tsx', content);
