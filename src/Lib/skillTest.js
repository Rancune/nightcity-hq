// src/Lib/skillTest.js
// Fonction pour tester les compétences du runner

// Configuration des seuils (facilement modifiables pour équilibrer le jeu)
const SKILL_TEST_CONFIG = {
  SUCCESS_THRESHOLD: 0.6,        // 60% de réussite minimum pour succès global
  CRITICAL_FAILURE_THRESHOLD: 0.3, // < 30% = échec critique (mort)
  MIN_SUCCESS_CHANCE: 0.05,      // 5% minimum de chance de succès
  MAX_SUCCESS_CHANCE: 0.95,      // 95% maximum de chance de succès
  SKILL_BONUS_MULTIPLIER: 1.0,   // Multiplicateur pour les bonus de compétences
  DIFFICULTY_PENALTY_MULTIPLIER: 1.0 // Multiplicateur pour les pénalités de difficulté
};

export function testRunnerSkills(runner, requiredSkills, activeEffects = {}) {
  const results = {};
  let totalSuccess = 0;
  let totalTests = 0;

  // Tester chaque compétence requise
  Object.keys(requiredSkills).forEach(skill => {
    if (requiredSkills[skill] > 0) {
      let runnerSkill = runner.skills[skill] || 0;
      const requiredSkill = requiredSkills[skill];
      let isSuccess = false;
      
      // Appliquer les effets actifs
      if (activeEffects.bonusRoll && activeEffects.bonusSkill === skill) {
        runnerSkill += activeEffects.bonusRoll;
      }
      
      if (activeEffects.reduceDifficulty) {
        // Réduire la difficulté effective
        const effectiveRequired = Math.max(1, requiredSkill - activeEffects.reduceDifficulty);
        
        // Calculer la probabilité de succès avec la difficulté réduite
        const successChance = Math.min(
          SKILL_TEST_CONFIG.MAX_SUCCESS_CHANCE, 
          Math.max(
            SKILL_TEST_CONFIG.MIN_SUCCESS_CHANCE, 
            (runnerSkill / effectiveRequired) * SKILL_TEST_CONFIG.SKILL_BONUS_MULTIPLIER
          )
        );
        
        isSuccess = Math.random() < successChance;
        
        results[skill] = {
          required: requiredSkill,
          effectiveRequired: effectiveRequired,
          actual: runnerSkill,
          success: isSuccess,
          chance: successChance,
          effects: {
            difficultyReduced: requiredSkill - effectiveRequired,
            bonusApplied: activeEffects.bonusRoll || 0
          }
        };
      } else {
        // Calcul normal sans réduction de difficulté
        const successChance = Math.min(
          SKILL_TEST_CONFIG.MAX_SUCCESS_CHANCE, 
          Math.max(
            SKILL_TEST_CONFIG.MIN_SUCCESS_CHANCE, 
            (runnerSkill / requiredSkill) * SKILL_TEST_CONFIG.SKILL_BONUS_MULTIPLIER
          )
        );
        
        isSuccess = Math.random() < successChance;
        
        results[skill] = {
          required: requiredSkill,
          effectiveRequired: requiredSkill,
          actual: runnerSkill,
          success: isSuccess,
          chance: successChance,
          effects: {
            difficultyReduced: 0,
            bonusApplied: activeEffects.bonusRoll || 0
          }
        };
      }
      
      if (isSuccess) totalSuccess++;
      totalTests++;
    }
  });

  // Vérifier si un succès automatique est activé
  if (activeEffects.autoSuccess && totalTests > 0) {
    // Trouver le test le plus difficile et le forcer en succès
    let hardestTest = null;
    let highestRequired = 0;
    
    Object.entries(results).forEach(([skill, result]) => {
      if (result.required > highestRequired) {
        highestRequired = result.required;
        hardestTest = skill;
      }
    });
    
    if (hardestTest && !results[hardestTest].success) {
      results[hardestTest].success = true;
      results[hardestTest].chance = 1.0; // 100% de chance (forcé)
      results[hardestTest].effects.autoSuccess = true;
      totalSuccess++;
    }
  }

  // Déterminer le résultat global
  const successRate = totalTests > 0 ? totalSuccess / totalTests : 0;
  const isOverallSuccess = successRate >= SKILL_TEST_CONFIG.SUCCESS_THRESHOLD;

  // Déterminer le statut du runner
  let runnerStatus = 'Disponible';
  if (successRate < SKILL_TEST_CONFIG.CRITICAL_FAILURE_THRESHOLD) {
    // Échec critique : le runner meurt
    runnerStatus = 'Mort';
  } else if (successRate < SKILL_TEST_CONFIG.SUCCESS_THRESHOLD) {
    // Échec partiel : le runner est grillé
    runnerStatus = 'Grillé';
  }

  return {
    isSuccess: isOverallSuccess,
    successRate,
    skillResults: results,
    runnerStatus,
    config: SKILL_TEST_CONFIG,
    activeEffects: activeEffects
  };
}

// Fonction utilitaire pour obtenir la configuration actuelle
export function getSkillTestConfig() {
  return { ...SKILL_TEST_CONFIG };
}

// Fonction pour modifier la configuration (utile pour les tests ou l'équilibrage)
export function updateSkillTestConfig(newConfig) {
  Object.assign(SKILL_TEST_CONFIG, newConfig);
} 