// src/app/contrats/[id]/page.js
import Link from 'next/link';

// On modifie légèrement la fonction pour qu'elle prenne "id" en argument
async function getContractDetails(id) {
  try {
    // On s'assure que la variable d'environnement est bien lue
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("La variable d'environnement de l'API n'est pas définie.");
    }
    
    const res = await fetch(`${apiUrl}/api/contrats/${id}`, { cache: 'no-store' });
    
    if (!res.ok) {
      // Si l'API renvoie une erreur (404, 500), on la propage
      throw new Error(`Erreur de l'API: ${res.statusText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Erreur dans getContractDetails:", error);
    return null; // On renvoie null en cas d'échec du fetch
  }
}

// La page elle-même
export default async function ContractDetailsPage({ params }) {
  // On passe l'ID à notre fonction
  const contract = await getContractDetails(await params.id);

  if (!contract) {
    return (
      <main className="min-h-screen p-4 text-center">
        <h1 className="text-2xl text-[--color-neon-pink]">Contrat non trouvé ou erreur de chargement.</h1>
        <Link href="/" className="mt-4 inline-block text-[--color-neon-cyan] hover:underline">
          &larr; Retour à la liste
        </Link>
      </main>
    );
  }

  // Le reste du JSX pour afficher le contrat reste le même
  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>
        <p className="text-[--color-text-secondary]">Statut : {contract.status} | Difficulté : {contract.difficulty || 'Non spécifiée'}</p>
      </header>
      
      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
        <p className="text-[--color-text-secondary] whitespace-pre-wrap">{contract.description}</p>
      </div>
      
      <div className="mt-8">
        <p className="text-2xl text-[--color-neon-pink]">Récompense : {contract.reward.eddies} €$</p>
      </div>

      <Link href="/" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
        &larr; Retour à la liste des contrats
      </Link>
    </main>
  );
}