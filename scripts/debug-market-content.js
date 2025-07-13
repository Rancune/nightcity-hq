// scripts/debug-market-content.js
import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';

async function debugMarket() {
  await connectDb();
  const items = await Program.find({ isActive: true }).lean();
  console.log(`Total programmes actifs : ${items.length}`);
  items.forEach(item => {
    console.log(
      `- ${item.name} | vendor: ${item.vendor} | stock: ${item.stock} | rarity: ${item.rarity} | streetCredRequired: ${item.streetCredRequired}`
    );
  });
  process.exit(0);
}
debugMarket(); 