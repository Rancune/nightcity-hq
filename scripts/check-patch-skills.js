// scripts/check-patch-skills.js
const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../src/data/program-catalog.json');
const VALID_SKILLS = ['hacking', 'stealth', 'combat', 'all'];

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

let errors = [];
catalog.forEach(item => {
  if (item.effects && item.effects.add_bonus_roll !== undefined) {
    const skill = item.effects.skill;
    if (!skill || !VALID_SKILLS.includes(skill)) {
      errors.push({
        id: item.id,
        name: item.name,
        found: skill,
        expected: VALID_SKILLS.join(', ')
      });
    }
  }
});

if (errors.length === 0) {
  console.log('✅ Tous les patchs/objets à bonus ont un champ skill correct.');
} else {
  console.log('❌ Problèmes trouvés dans le catalogue :');
  errors.forEach(e => {
    console.log(`- ${e.id} (${e.name}) : skill trouvé = ${e.found} (attendu : ${e.expected})`);
  });
  process.exit(1);
} 