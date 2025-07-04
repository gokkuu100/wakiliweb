/**
 * Contract Creation Landing Page
 * Shows contract creation dashboard with stats, history and creation workflow
 * No background layout - standalone page
 */

'use client';

import React from 'react';
import { ContractCreationHome } from '@/components/contract-generation/ContractCreationHome';

export default function CreateContractPage() {
  return (
    <ContractCreationHome />
  );
}