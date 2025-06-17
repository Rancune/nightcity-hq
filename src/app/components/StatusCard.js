// components/StatusCard.jsx
import React from 'react';

const StatusCard = ({ money, reputation }) => {
  return (
    <div className="rounded-2xl shadow-lg p-4 bg-white max-w-sm">
      <h2 className="text-xl font-bold mb-4">Statut actuel</h2>
      <div className="flex justify-between">
        <div>
          <p className="text-gray-600">Argent</p>
          <p className="text-green-600 font-semibold">{money.toLocaleString()} €</p>
        </div>
        <div>
          <p className="text-gray-600">Réputation</p>
          <p className="text-blue-600 font-semibold">{reputation}</p>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;