// src/components/ContractDetailsView.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Ce composant reçoit le contrat initial en tant que "prop"
export default function ContractDetailsView({ initialContract }) {
  const [contract, setContract] = useState(initialContract);
  const router = useRouter();

  const handleResolve = async () => {
    // La logique de résolution reste la même
    const response = await fetch(`/api/contrats/${contract._id}/resolve`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      alert(`Mission terminée ! Résultat : ${data.outcome}`);
      router.push('/'); // Redirige vers la page d'accueil
      router.refresh(); // Force le rafraîchissement des données
    } else {
      alert("Erreur lors de la résolution du contrat.");
    }
  };

  if (!contract) return <div>Contrat introuvable.</div>;

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>
        <p className="text-[--color-text-secondary]">Statut : {contract.status}</p>
      </header>

      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
        <p className="text-[--color-text-secondary] whitespace-pre-wrap">{contract.description}</p>
      </div>

      <div className="mt-8">
        <p className="text-2xl text-[--color-neon-pink]">Récompense : {contract.reward.eddies.toLocaleString()} €$</p>
      </div>

      {/* Le bouton interactif vit ici, en sécurité dans un composant client */}
      {contract.status === 'Assigné' && (
        <div className="mt-8">
          <button onClick={handleResolve} className="bg-red-600 text-white font-bold p-4 rounded-lg animate-pulse hover:bg-red-500">
            TENTER LA RÉSOLUTION DU CONTRAT
          </button>
        </div>
      )}

      <Link href="/" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
        &larr; Retour à la liste des contrats
      </Link>
    </main>
  );
}