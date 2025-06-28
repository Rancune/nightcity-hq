// src/Lib/skillTest.js
// Fonction pour tester les compétences du runner

export function testRunnerSkills(runner, requiredSkills) {
  const results = {};
  let totalSuccess = 0;
  let totalTests = 0;

  // Tester chaque compétence requise
  Object.keys(requiredSkills).forEach(skill => {
    if (requiredSkills[skill] > 0) {
      const runnerSkill = runner.skills[skill] || 0;
      const requiredSkill = requiredSkills[skill];
      
      // Calculer la probabilité de succès (compétence du runner vs exigence)
      const successChance = Math.min(0.95, Math.max(0.05, runnerSkill / requiredSkill));
      const isSuccess = Math.random() < successChance;
      
      results[skill] = {
        required: requiredSkill,
        actual: runnerSkill,
        success: isSuccess,
        chance: successChance
      };
      
      if (isSuccess) totalSuccess++;
      totalTests++;
    }
  });

  // Déterminer le résultat global
  const successRate = totalTests > 0 ? totalSuccess / totalTests : 0;
  const isOverallSuccess = successRate >= 0.6; // 60% de réussite minimum

  // Déterminer le statut du runner
  let runnerStatus = 'Disponible';
  if (successRate < 0.3) {
    // Échec critique : le runner meurt
    runnerStatus = 'Mort';
  } else if (successRate < 0.6) {
    // Échec partiel : le runner est grillé
    runnerStatus = 'Grillé';
  }

  return {
    isSuccess: isOverallSuccess,
    successRate,
    skillResults: results,
    runnerStatus
  };
} 