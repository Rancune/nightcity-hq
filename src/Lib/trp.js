// src/lib/trp.js
import PlayerProfile from "@/models/PlayerProfile";
import Contract from "@/models/Contract";
import connectDb from "@/Lib/database";

const TRP_RATIO = parseInt(process.env.TRP_RATIO, 10) || 60;

export async function updatePlayerTimers(clerkId) {
  console.log(`[TRP] Début de la mise à jour des minuteurs pour ${clerkId}`);
  await connectDb();

  const player = await PlayerProfile.findOne({ clerkId });
  if (!player) {
    console.log("[TRP] Profil joueur non trouvé.");
    return;
  }

  const now = new Date();
  const realTimeElapsedMs = now.getTime() - new Date(player.lastSeen).getTime();
  const realTimeElapsedSeconds = Math.floor(realTimeElapsedMs / 1000);

  // Si le joueur était inactif depuis moins de 10s, on ne fait rien pour éviter trop d'écritures en BDD
  if (realTimeElapsedSeconds < 10) {
    console.log("[TRP] Pas assez de temps écoulé, mise à jour ignorée.");
    return;
  }

  const trpElapsedSeconds = realTimeElapsedSeconds * TRP_RATIO;
  console.log(`[TRP] Temps réel écoulé: ${realTimeElapsedSeconds}s. TRP écoulé: ${trpElapsedSeconds}s.`);

  // --- Mise à jour des minuteurs ---
  // On décrémente les minuteurs des contrats actifs ou proposés du joueur
  await Contract.updateMany(
    { ownerId: clerkId, status: { $in: ['Proposé', 'Actif'] } },
    {
      $inc: { 
        acceptance_deadline_trp: -trpElapsedSeconds,
        // completion_timer_trp: -trpElapsedSeconds
      }
    }
  );

  // --- Vérification des expirations ---
  // On met à jour le statut des contrats dont le minuteur d'acceptation est terminé
  await Contract.updateMany(
  { 
    // La condition de temps est la même
    acceptance_deadline_trp: { $lte: 0 },
    status: 'Proposé',
    // MAIS on cible les contrats publics OU ceux privés du joueur
    $or: [{ ownerId: null }, { ownerId: clerkId }] 
  },
  { $set: { status: 'Expiré' } } // On change leur statut
  );
}