// scripts/fix-program-vendors.js
// Met à jour le champ vendor de tous les programmes en base à partir du catalogue

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import fs from 'fs';
import path from 'path';

async function fixVendors() {
  try {
    await connectDb();
    const catalogPath = path.join(process.cwd(), 'src', 'data', 'program-catalog.json');
    const CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    let updated = 0;
    let notFound = 0;
    for (const item of CATALOG) {
      const prog = await Program.findOne({ marketId: item.id });
      if (prog) {
        prog.vendor = item.vendor;
        await prog.save();
        updated++;
      } else {
        console.log(`❌ Programme non trouvé en base pour id: ${item.id}`);
        notFound++;
      }
    }
    console.log(`✅ Champ vendor mis à jour pour ${updated} programmes.`);
    if (notFound > 0) {
      console.log(`⚠️  ${notFound} programmes du catalogue non trouvés en base.`);
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur lors de la mise à jour des vendors:', e);
    process.exit(1);
  }
}

fixVendors(); 