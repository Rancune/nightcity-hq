// src/app/contrats/[id]/page.js
import Link from 'next/link';

console.log("URL DE L'API LUE PAR LE SERVEUR:", process.env.NEXT_PUBLIC_API_URL); // NOTRE MOUCHARD


// Fonction pour récupérer les données d'un contrat spécifique
async function getContractDetails(id) {
  // Assure-toi que les backticks (`) sont bien utilisés ici
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contrats/${id}`, { cache: 'no-store' });
  
  if (!res.ok) {
    return null;
  }
  return res.json();
}

// La page elle-même
export default async function ContractDetailsPage({ params }) {
  const id = params.id;
  const contract = await getContractDetails(id);

  if (!contract) {
    return (
      <main className="min-h-screen p-4">
        <h1 className="text-2xl">Contrat non trouvé.</h1>
        <Link href="/" className="text-[--color-neon-cyan] hover:underline">Retour à la liste</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>
        <p className="text-[--color-text-secondary]">Statut : {contract.status} | Difficulté : {contract.difficulty}</p>
      </header>

      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
        <p className="text-[--color-text-secondary] whitespace-pre-wrap">{contract.description}</p>
      </div>

      <div className="mt-8">
        <p className="text-2xl text-[--color-neon-pink]">Récompense : {contract.reward} €$</p>
      </div>

      <Link href="/" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
        &larr; Retour à la liste des contrats
      </Link>
    </main>
  );
}