// src/lib/trp.js
import PlayerProfile from "@/models/PlayerProfile";
import Contract from "@/models/Contract";
import connectDb from "@/Lib/database";

const TRP_RATIO = parseInt(process.env.TRP_RATIO, 10) || 60;

export async function updatePlayerTimers(clerkId) {
  console.log(`[TRP] Début de la mise à jour des minuteurs pour ${clerkId}`);
  await connectDb();

  const player = await PlayerProfile.findOne({ clerkId });
  if (!player) return;

  const now = new Date();
  const realTimeElapsedMs = now.getTime() - new Date(player.lastSeen).getTime();
  const realTimeElapsedSeconds = Math.floor(realTimeElapsedMs / 1000);

  // On abaisse le seuil pour des mises à jour plus fréquentes
  if (realTimeElapsedSeconds < 5) {
    console.log("[TRP] Pas assez de temps écoulé, mise à jour ignorée.");
    return;
  }

  const trpElapsedSeconds = realTimeElapsedSeconds * TRP_RATIO;
  console.log(`[TRP] Temps réel écoulé: ${realTimeElapsedSeconds}s. TRP écoulé: ${trpElapsedSeconds}s.`);

  // --- CORRECTION 1 : Mise à jour des minuteurs ---
  // On cible maintenant les contrats proposés qui sont soit publics, soit privés au joueur.
  await Contract.updateMany(
    { 
      status: 'Proposé',
      $or: [{ ownerId: null }, { ownerId: clerkId }]
    },
    { $inc: { acceptance_deadline_trp: -trpElapsedSeconds } }
  );

  // --- CORRECTION 2 : Vérification des expirations ---
  // On applique la même logique de ciblage ici.
  await Contract.updateMany(
    {
      acceptance_deadline_trp: { $lte: 0 },
      status: 'Proposé',
      $or: [{ ownerId: null }, { ownerId: clerkId }]
    },
    { $set: { status: 'Expiré' } }
  );

  // On met à jour la date de dernière présence du joueur
  player.lastSeen = now;
  await player.save();

  console.log("[TRP] Mise à jour des minuteurs terminée.");
}
