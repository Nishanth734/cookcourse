'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

export default function ATSPage() {
  const [score, setScore] = useState(78)
  
  const suggestions = [
    { issue: 'Add more action verbs', severity: 'HIGH', fixed: true },
    { issue: 'Include metrics in achievements', severity: 'HIGH', fixed: false },
    { issue: 'Optimize for keywords: React, Node.js', severity: 'MEDIUM', fixed: false },
    { issue: 'Remove unnecessary sections', severity: 'LOW', fixed: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ATS Optimizer</h1>
          <p className="text-gray-600">Optimize your resume for Applicant Tracking Systems</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition">
          <Upload className="w-5 h-5" />
          Upload Resume
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <div className="text-center">
            <div className="relative inline-block">
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${score * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-gray-900">{score}%</div>
              </div>
            </div>
            <div className="mt-4 text-lg font-semibold text-gray-900">ATS Score</div>
            <div className="text-sm text-gray-600 mt-1">
              {score >= 80 ? 'Good! Your resume is well-optimized' : 'Needs improvement'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suggestions</h2>
          <div className="space-y-3">
            {suggestions.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {item.fixed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    item.severity === 'HIGH' ? 'text-red-600' :
                    item.severity === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{item.issue}</div>
                  <div className={`text-xs mt-1 font-semibold ${
                    item.severity === 'HIGH' ? 'text-red-600' :
                    item.severity === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {item.severity} PRIORITY
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
