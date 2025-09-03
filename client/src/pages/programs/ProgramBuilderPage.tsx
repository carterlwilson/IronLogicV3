import { Suspense } from 'react';
import { ProgramBuilder } from '../../components/programs/ProgramBuilder';

export function ProgramBuilderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProgramBuilder />
    </Suspense>
  );
}