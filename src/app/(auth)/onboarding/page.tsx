'use client'

import { Suspense } from 'react'
import OnboardingForm from './Onboardingpage'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingForm />
    </Suspense>
  )
}
