'use client';
import { useState } from 'react';
import ButtonWithLoading from './ButtonWithLoading';

export default function ContractAnalyzer({ contract, playerInventory, onAnalyze }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Vérifier si le joueur possède l'Analyseur de Contrat
  const hasAnalyzer = playerInventory?.some(item => 
    item.name === "Analyseur de Contrat" && item.quantity > 0
  );
  
  // Vérifier si les compétences sont déjà révélées
  const skillsRevealed = contract.skillsRevealed || false;
  
  const handleAnalyze = async () => {
    if (!hasAnalyzer) return;
    
    setIsAnalyzing(true);
    try {
      // Appeler la fonction parent pour analyser le contrat
      await onAnalyze(contract._id);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  if (!hasAnalyzer) {
    return (
      <div className="mb-4 p-3 bg-black/30 rounded border border-orange-500/50">
        <p className="text-xs text-orange-400 mb-2">🔒 Compétences cachées</p>
        <p className="text-xs text-[--color-text-secondary]">
          Achetez un "Analyseur de Contrat" au marché noir pour révéler les compétences testées.
        </p>
      </div>
    );
  }
  
  if (skillsRevealed) {
    return (
      <div className="mb-4 p-3 bg-green-400/20 rounded border border-green-500/50">
        <p className="text-xs text-green-400 mb-2">🔍 Compétences révélées par l'Analyseur</p>
        <div className="space-y-2">
          {contract.requiredSkills?.hacking > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💻</span>
                <span className="text-sm text-blue-400 font-semibold">Hacking</span>
              </div>
              <span className="text-lg font-bold text-blue-400">{contract.requiredSkills.hacking}</span>
            </div>
          )}
          {contract.requiredSkills?.stealth > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <span className="text-sm text-green-400 font-semibold">Infiltration</span>
              </div>
              <span className="text-lg font-bold text-green-400">{contract.requiredSkills.stealth}</span>
            </div>
          )}
          {contract.requiredSkills?.combat > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚔️</span>
                <span className="text-sm text-red-400 font-semibold">Combat</span>
              </div>
              <span className="text-lg font-bold text-red-400">{contract.requiredSkills.combat}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-green-300 mt-2">
          Les compétences ont été révélées par l'Analyseur de Contrat.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mb-4 p-3 bg-black/30 rounded border border-[--color-neon-cyan]/50">
      <p className="text-xs text-[--color-neon-cyan] mb-2">🔍 Analyseur disponible</p>
      <ButtonWithLoading
        onClick={handleAnalyze}
        isLoading={isAnalyzing}
        loadingText="ANALYSE..."
        className="bg-[--color-neon-cyan] text-background font-bold py-1 px-3 rounded text-xs hover:bg-white transition-all"
      >
        Analyser Contrat
      </ButtonWithLoading>
    </div>
  );
} 