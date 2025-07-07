import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';

export async function POST(request, { params }) {
  try {
    await connectDb();

    // Vérifier l'authentification Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const contractId = params.id;

    // Vérifier que le contrat existe et est disponible
    const contract = await Contract.findOne({ _id: contractId });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrat non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le contrat est disponible (pas déjà pris)
    if (contract.ownerId !== null) {
      return NextResponse.json(
        { error: 'Ce contrat a déjà été pris par un autre Fixer' },
        { status: 409 }
      );
    }

    // Vérifier que le statut est 'Proposé'
    if (contract.status !== 'Proposé') {
      return NextResponse.json(
        { error: 'Ce contrat n\'est pas disponible pour acceptation' },
        { status: 400 }
      );
    }

    // Vérifier que le joueur n'accepte pas son propre contrat
    if (contract.employerId === userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas accepter votre propre contrat' },
        { status: 400 }
      );
    }

    // Mettre à jour le contrat : assigner au joueur ET changer le statut vers 'Assigné'
    await Contract.updateOne(
      { _id: contractId }, 
      { 
        ownerId: userId,
        status: 'Assigné'
      }
    );
    const updatedContract = await Contract.findOne({ _id: contractId });

    // Créer une notification pour l'employeur
    // await prisma.notification.create({ ... });

    // Log de l'action
    // await prisma.auditLog.create({ ... });

    return NextResponse.json({
      success: true,
      message: 'Contrat accepté avec succès',
      contract: {
        id: updatedContract._id,
        title: updatedContract.title,
        status: updatedContract.status,
        ownerId: updatedContract.ownerId,
        // Ajoute d'autres champs si besoin
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'acceptation du contrat:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 