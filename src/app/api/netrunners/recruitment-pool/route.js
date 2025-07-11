// src/app/api/netrunners/recruitment-pool/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateRunnerNameAndLore } from '@/Lib/ai';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const pool = [];
    
    // Générer 6 candidats avec des noms et lore par IA
    for (let i = 0; i < 6; i++) {
      try {
        // Générer des compétences aléatoires
        const skills = {
          hacking: Math.floor(Math.random() * 10) + 1,
          stealth: Math.floor(Math.random() * 10) + 1,
          combat: Math.floor(Math.random() * 10) + 1,
        };
        
        const totalPower = skills.hacking + skills.stealth + skills.combat;
        
        // Générer le nom et le lore par IA
        const { name, lore } = await generateRunnerNameAndLore(skills);
        
        // Calculer la commission basée sur la puissance totale
        const commission = Math.floor(totalPower * 50) + 200;
        
        pool.push({
          id: `recruit-${i}`,
          name,
          lore,
          skills,
          commission,
          totalPower
        });
        
      } catch (error) {
        console.error(`[RECRUITMENT-POOL] Erreur lors de la génération du candidat ${i}:`, error);
        
        // Fallback avec des noms prédéfinis
        const fallbackNames = [
          'Neo', 'Cipher', 'Ghost', 'Shadow', 'Echo', 'Void', 'Pulse', 'Static',
          'Flicker', 'Glitch', 'Phantom', 'Specter', 'Wraith', 'Shade', 'Mirage',
          'Raven', 'Crow', 'Vulture', 'Hawk', 'Falcon', 'Eagle', 'Owl', 'Bat',
          'Spider', 'Scorpion', 'Viper', 'Cobra', 'Python', 'Anaconda', 'Rattlesnake'
        ];
        
        const skills = {
          hacking: Math.floor(Math.random() * 10) + 1,
          stealth: Math.floor(Math.random() * 10) + 1,
          combat: Math.floor(Math.random() * 10) + 1,
        };
        
        const totalPower = skills.hacking + skills.stealth + skills.combat;
        const commission = Math.floor(totalPower * 50) + 200;
        
        pool.push({
          id: `recruit-${i}`,
          name: fallbackNames[Math.floor(Math.random() * fallbackNames.length)],
          lore: null, // Pas de lore pour les fallbacks
          skills,
          commission,
          totalPower
        });
      }
    }
    
    return NextResponse.json(pool);
    
  } catch (error) {
    console.error("[API GET /netrunners/recruitment-pool] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 