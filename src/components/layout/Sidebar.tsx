'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  BookOpen,
  FileText,
  HelpCircle,
  Code,
  Users,
  Briefcase,
  FolderOpen,
  Star,
  FileEdit,
  Shield,
  BarChart3,
  MessageCircle,
  Gamepad2,
  User,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Map, label: 'My Roadmap', href: '/dashboard/roadmap' },
  { icon: BookOpen, label: 'Resources', href: '/dashboard/resources' },
  { icon: FileText, label: 'Notes', href: '/dashboard/notes' },
  { icon: HelpCircle, label: 'Quizzes', href: '/dashboard/quizzes' },
  { icon: Code, label: 'Coding', href: '/dashboard/coding' },
  { icon: Users, label: 'Interviews', href: '/dashboard/interviews' },
  { icon: FolderOpen, label: 'Projects', href: '/dashboard/projects' },
  { icon: Star, label: 'Placement Stories', href: '/dashboard/placements' },
  { icon: FileEdit, label: 'Resume Builder', href: '/dashboard/resume' },
  { icon: Shield, label: 'ATS Optimizer', href: '/dashboard/ats' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Gamepad2, label: 'Gamified Learning', href: '/dashboard/gamified' },
  { icon: MessageCircle, label: 'Community', href: '/dashboard/community' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 80 }}
      className="fixed left-0 top-0 h-full z-50"
    >
      <div className="flex flex-col h-full glass rounded-none border-r border-white/20">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-white/20">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-gradient"
            >
              CourseCook
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ring-soft ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-800 hover:bg-white/60'
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="p-4 border-t border-white/20 hover:bg-white/60 transition"
        >
          <div className="flex items-center gap-3">
            {isOpen ? (
              <>
                <ChevronLeft className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 mx-auto" />
            )}
          </div>
        </button>
      </div>
    </motion.aside>
  )
}
