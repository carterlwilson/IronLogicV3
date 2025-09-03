import { Suspense } from 'react';
import { ResetPasswordContent } from './ResetPasswordContent';

export function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}