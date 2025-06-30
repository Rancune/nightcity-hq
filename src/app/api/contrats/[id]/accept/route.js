import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const contractId = params.id;
    const userId = session.user.id;

    // Vérifier que le contrat existe et est disponible
    const contract = await prisma.contrat.findUnique({
      where: { id: contractId },
      include: {
        owner: true,
        runner: true,
      }
    });

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

    // Mettre à jour le contrat : changer l'ownerId mais garder le statut 'Proposé'
    const updatedContract = await prisma.contrat.update({
      where: { id: contractId },
      data: {
        ownerId: userId,
        // Le statut reste 'Proposé' - il sera changé en 'En cours' quand un runner sera assigné
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        employer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        runner: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Créer une notification pour l'employeur
    await prisma.notification.create({
      data: {
        userId: contract.employerId,
        type: 'CONTRACT_ACCEPTED',
        title: 'Contrat accepté',
        message: `Votre contrat "${contract.title}" a été pris en charge par ${session.user.username}`,
        data: {
          contractId: contract.id,
          fixerId: userId,
          fixerUsername: session.user.username
        }
      }
    });

    // Log de l'action
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'CONTRACT_ACCEPT',
        targetType: 'CONTRACT',
        targetId: contractId,
        details: {
          contractTitle: contract.title,
          previousOwner: null,
          newOwner: userId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contrat accepté avec succès',
      contract: {
        id: updatedContract.id,
        title: updatedContract.title,
        status: updatedContract.status,
        ownerId: updatedContract.ownerId,
        owner: updatedContract.owner
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