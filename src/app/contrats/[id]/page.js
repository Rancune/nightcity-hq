// src/app/contrats/[id]/page.js
import Link from 'next/link';
import ContractDetailsView from '@/components/ContractDetailsView';

export default async function ContractDetailsPage(props) {
  const params = await props.params;

  let contract = null;

  try {
    // LA CORRECTION FINALE EST ICI.
    // L'URL DOIT ÊTRE ENTOURÉE PAR DES ACCENTS GRAVES ( ` )
    // ET NON PAS DES GUILLEMETS SIMPLES ( ' ).
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contrats/${params.id}`, { 
  cache: 'no-store' 
});

    if (res.ok) {
      const rawData = await res.json();
      contract = JSON.parse(JSON.stringify(rawData));
    } else {
        console.error(`Erreur de l'API: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.error("Erreur lors du fetch dans la page de détails:", error);
  }

  return <ContractDetailsView initialContract={contract} />;
}