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
      <div className="mb-4 p-3 bg-black/30 rounded border border-green-500/50">
        <p className="text-xs text-green-400 mb-2">🔍 Compétences révélées</p>
        <div className="flex gap-2 text-xs">
          {contract.requiredSkills?.hacking > 0 && (
            <span className="text-blue-400">Hacking: {contract.requiredSkills.hacking}</span>
          )}
          {contract.requiredSkills?.stealth > 0 && (
            <span className="text-green-400">Infiltration: {contract.requiredSkills.stealth}</span>
          )}
          {contract.requiredSkills?.combat > 0 && (
            <span className="text-red-400">Combat: {contract.requiredSkills.combat}</span>
          )}
        </div>
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