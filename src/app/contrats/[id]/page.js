// src/app/contrats/[id]/page.js
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { updatePlayerTimers } from '@/Lib/trp';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import MissionTimer from '@/components/MissionTimer';


// Cette page est un Server Component, elle peut directement parler à la BDD.
export default async function ContractDetailsPage({ params }) {
  let contract = null;

  try {
    // --- DÉCLENCHEMENT DU TICK TRP ---
    const { userId } = await auth();
    if (userId) {
      await updatePlayerTimers(userId);
    }
    // ------------------------------------

    // On récupère les détails du contrat directement depuis la BDD
    // C'est plus performant que de passer par notre propre API
    await connectDb();
    contract = await Contract.findById(await params.id).lean();

  } catch (error) {
    console.error("Erreur lors de la récupération de la page de détails:", error);
    // On laisse 'contract' à null, la page affichera un message d'erreur.
  }

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

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>

        {/* AFFICHER LE TIMER DE MISSION SI ACTIF */}
        {contract.status === 'Assigné' && contract.initial_completion_duration_trp > 0 ? (
          <div className="text-center w-32">
            <span className="text-xs text-text-secondary">Mission en cours </span>
            <MissionTimer 
              totalDuration={contract.initial_completion_duration_trp}
              startTime={contract.completion_timer_started_at}
            />
          </div>
        ) : (
          <p className="text-[--color-text-secondary]">Statut : {contract.status}</p>
        )}
      </header>
      
      <div className="bg-white/5 p-6 rounded-lg">
        <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
        <p className="text-[--color-text-secondary] whitespace-pre-wrap">{contract.description}</p>
      </div>
      
      <div className="mt-8">
        <p className="text-2xl text-[--color-neon-pink]">Récompense : {contract.reward.eddies.toLocaleString()} €$</p>
      </div>

      <Link href="/" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
        &larr; Retour à la liste des contrats
      </Link>
    </main>
  );
}