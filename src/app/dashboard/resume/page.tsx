'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Plus } from 'lucide-react'

export default function ResumePage() {
  const [resumeData, setResumeData] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    education: [],
    experience: [],
    skills: [],
    projects: []
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
          <p className="text-gray-600">Create ATS-friendly resumes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Full Name" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-600 focus:outline-none" />
            <input type="email" placeholder="Email" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-600 focus:outline-none" />
            <input type="tel" placeholder="Phone" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-600 focus:outline-none" />
            <textarea placeholder="Professional Summary" rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-600 focus:outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition">
              <Plus className="w-4 h-4" />
              Add Skill
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['JavaScript', 'React', 'Node.js', 'Python', 'SQL'].map((skill) => (
              <span key={skill} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
