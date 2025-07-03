/**
 * Contract Creation Page - Modern Implementation
 * Uses the new AI-powered contract generation system
 */

'use client';

import React from 'react';
import { ContractGenerationProvider, ContractGenerationLayout } from '@/components/citizendashboard/contracts';

export default function CreateContractPage() {
  return (
    <ContractGenerationProvider>
      <ContractGenerationLayout />
    </ContractGenerationProvider>
  );
}