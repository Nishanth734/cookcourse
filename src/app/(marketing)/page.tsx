'use client'

import { Suspense } from 'react'
import LandingPage from './marketingpage'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPage />
    </Suspense>
  )
}
