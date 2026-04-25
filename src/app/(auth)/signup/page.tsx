'use client'

import { Suspense } from 'react'
import SignupPage from './signupage'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPage />
    </Suspense>
  )
}
