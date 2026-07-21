import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Transactions } from '../customer/Transactions';

export const AllTransactions = () => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-md">
        <h2 className="text-xl font-bold">Admin Transactions Ledger</h2>
        <p className="text-xs text-blue-100">System-wide transaction monitor and PDF statement export</p>
      </div>
      <Transactions />
    </div>
  );
};
