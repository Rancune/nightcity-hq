// components/MissionSummary.jsx
import React from 'react';

const MissionSummary = ({ missions, runners, cost, potentialGain }) => {
  return (
    <div className="rounded-2xl shadow-lg p-6 bg-white max-w-md w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Résumé des missions</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Missions en cours</span>
          <span className="font-semibold">{missions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Runners engagés</span>
          <span className="font-semibold">{runners}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Coût total</span>
          <span className="text-red-600 font-semibold">{cost.toLocaleString('en-US')} €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Gain potentiel:</span>
          <span className="text-green-600 font-semibold">{potentialGain.toLocaleString('en-US')} €</span>
        </div>
      </div>
    </div>
  );
};

export default MissionSummary;
