import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Code, 
  FileText, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle,
  ArrowRight,
  Search,
  Star,
  Zap,
  Shield,
  Briefcase
} from 'lucide-react'

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const signupHref = searchQuery.trim()
    ? `/signup?topic=${encodeURIComponent(searchQuery.trim())}`
    : '/signup'

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Roadmaps',
      description: 'Personalized learning paths from beginner to job-ready, adapted to your goals and timeline.',
      color: 'text-indigo-600'
    },
    {
      icon: BookOpen,
      title: 'Curated Resources',
      description: 'Best courses, tutorials, and docs organized by topic, difficulty, and learning style.',
      color: 'text-emerald-600'
    },
    {
      icon: Code,
      title: 'Coding Practice',
      description: 'LeetCode-style problems with company tags, difficulty levels, and detailed editorials.',
      color: 'text-amber-600'
    },
    {
      icon: Users,
      title: 'Mock Interviews',
      description: 'AI-powered technical, HR, and behavioral interviews with instant feedback.',
      color: 'text-rose-600'
    },
    {
      icon: FileText,
      title: 'Resume & ATS',
      description: 'Build optimized resumes and get ATS scores with actionable improvement suggestions.',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Track your journey with readiness scores, skill mastery, and predictive insights.',
      color: 'text-blue-600'
    }
  ]

  const topics = [
    'DSA', 'Web Development', 'Python', 'Java', 'Data Science',
    'System Design', 'DevOps', 'React', 'Machine Learning', 'Placement Prep'
  ]

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'SDE at Google',
      content: 'CourseCook helped me structure my DSA preparation. The AI roadmap and mock interviews were game-changers!',
      avatar: 'RS',
      company: 'Google'
    },
    {
      name: 'Priya Patel',
      role: 'Frontend Developer at Microsoft',
      content: 'The curated resources and project suggestions gave me exactly what I needed to land my dream job.',
      avatar: 'PP',
      company: 'Microsoft'
    },
    {
      name: 'Amit Kumar',
      role: 'Data Scientist at Amazon',
      content: 'From zero to placed in 6 months. The daily planner and progress tracking kept me accountable.',
      avatar: 'AK',
      company: 'Amazon'
    }
  ]

  const stats = [
    { value: '50K+', label: 'Active Learners' },
    { value: '10K+', label: 'Successful Placements' },
    { value: '500+', label: 'Company Tracks' },
    { value: '95%', label: 'Success Rate' }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">CourseCook</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</Link>
              <Link href="#topics" className="text-gray-600 hover:text-gray-900 transition">Topics</Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Success Stories</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">Login</Link>
              <Link 
                href="/signup" 
                className="gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              From Learning to{' '}
              <span className="text-gradient">Job-Ready</span>{' '}
              in One Platform
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Master any skill with AI-powered roadmaps, curated resources, coding practice, mock interviews, 
              and ATS-optimized resumes. Your complete career preparation ecosystem.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="What do you want to master? (e.g., DSA, Web Development, Python)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-600 focus:outline-none text-lg shadow-lg"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={signupHref}
                className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 hover:border-gray-400 transition flex items-center justify-center"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Get Placed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A complete ecosystem that guides you from confusion to mastery to job-ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl border-2 border-gray-100 card-hover bg-white"
              >
                <div className={`w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section id="topics" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular Learning Tracks
            </h2>
            <p className="text-xl text-gray-600">
              Choose your path and start learning today
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/signup?topic=${encodeURIComponent(topic)}`}
                  className="block p-6 rounded-xl bg-white border-2 border-gray-200 hover:border-indigo-600 transition text-center card-hover"
                >
                  <div className="font-semibold text-gray-900">{topic}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Journey to Success
            </h2>
            <p className="text-xl text-gray-600">
              A proven framework that works
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              { step: 1, title: 'Set Your Goal', desc: 'Choose your target role and companies' },
              { step: 2, title: 'Get Roadmap', desc: 'AI generates personalized learning path' },
              { step: 3, title: 'Learn & Practice', desc: 'Follow curated resources and solve problems' },
              { step: 4, title: 'Build & Prepare', desc: 'Complete projects and mock interviews' },
              { step: 5, title: 'Get Placed', desc: 'Optimize resume and start applying' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                {index < 4 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-indigo-600 to-transparent -translate-x-8"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Real learners, real results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-white border-2 border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl gradient-primary text-white"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of learners who transformed their careers with CourseCook
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={signupHref}
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>AI-powered learning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Placement support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-2xl font-bold">CourseCook</span>
              </div>
              <p className="text-gray-400">
                Your complete career preparation ecosystem. Learn, practice, and get placed.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#topics" className="hover:text-white transition">Topics</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 CourseCook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
