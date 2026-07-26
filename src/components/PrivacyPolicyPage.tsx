import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from 'lucide-react';

const sections = [
  {
    icon: <Database size={20} />,
    title: 'Information We Collect',
    content: `When you use Arthneeti, we collect the following types of information:`,
    items: [
      'Account Information: Your name, email address, and phone number when you sign up via Google or phone authentication.',
      'Profile Data: Your display name, profile picture, and bio that you choose to provide.',
      'Community Content: Posts, comments, and discussions you create in our community forums.',
      'Learning Data: Your quiz scores, course progress, and certificates earned through our curriculum.',
      'Bookmarks: Content you save for later reference.',
      'Device & Usage Data: Browser type, device information, IP address, and pages visited — collected automatically through Firebase Analytics.',
    ],
  },
  {
    icon: <Eye size={20} />,
    title: 'How We Use Your Information',
    content: `We use the information we collect for the following purposes:`,
    items: [
      'To provide and operate the Arthneeti platform, including community forums, learning modules, and market data features.',
      'To authenticate your identity and manage your account.',
      'To track your learning progress and issue digital certificates upon course completion.',
      'To display your contributions (posts, comments) in the community section.',
      'To improve our platform through aggregated usage analytics.',
      'To communicate with you about updates, events, and new features (with opt-out options).',
      'To ensure platform security and prevent abuse.',
    ],
  },
  {
    icon: <UserCheck size={20} />,
    title: 'Data Sharing & Third Parties',
    content: `We do not sell your personal information. We may share data only in these limited circumstances:`,
    items: [
      'Firebase (Google): Our platform is built on Firebase, which provides authentication, database, and analytics services. Your data is processed under Google\'s privacy policy.',
      'Vercel: Our hosting provider, which may collect basic server logs for performance and security.',
      'Legal Requirements: We may disclose information if required by Nepali law or to protect the rights and safety of our users.',
      'Aggregated Data: We may share anonymized, aggregated statistics (e.g., "500 students completed Module 3") that cannot identify any individual.',
    ],
  },
  {
    icon: <Lock size={20} />,
    title: 'Data Security',
    content: `We take reasonable measures to protect your personal information:`,
    items: [
      'All data is transmitted over encrypted connections (HTTPS).',
      'Firebase Authentication handles secure sign-in with industry-standard encryption.',
      'Firestore security rules ensure that only authorized users can access or modify their own data.',
      'We do not store payment information — Arthneeti is currently a free platform.',
      'However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    icon: <Shield size={20} />,
    title: 'Your Rights & Choices',
    content: `You have the following rights regarding your data:`,
    items: [
      'Access: You can view your profile data, posts, and learning progress at any time through your profile page.',
      'Correction: You can update your profile information directly from your account settings.',
      'Deletion: You can request deletion of your account and associated data by contacting us at learnarthneeti@gmail.com.',
      'Opt-Out: You can opt out of non-essential communications by contacting us.',
      'Community Content: You may delete your own posts and comments at any time.',
    ],
  },
  {
    icon: <Mail size={20} />,
    title: 'Data Retention',
    content: `We retain your personal information only for as long as necessary to provide our services:`,
    items: [
      'Account data is retained as long as your account is active.',
      'Community posts and comments are retained until you delete them or your account is removed.',
      'Learning progress and certificates are retained to maintain your achievement records.',
      'When you delete your account, we remove your personal data within 30 days, except where retention is required by law.',
      'Analytics data is retained in aggregated form and cannot be linked back to individual users.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white pt-28 pb-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Effective Date: July 2025 &middot; Last Updated: July 2025
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mt-6 max-w-3xl">
            At Arthneeti, we are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your data. This policy applies to all users of the Arthneeti platform.
          </p>
        </div>

        {/* Quick Summary Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 mb-12">
          <h2 className="text-lg font-bold text-emerald-800 mb-3 font-display">In Simple Terms</h2>
          <ul className="space-y-2 text-sm text-emerald-700 leading-relaxed">
            <li>&#8226; We collect your name, email, and phone number to create your account.</li>
            <li>&#8226; We track your learning progress to issue certificates and show your achievements.</li>
            <li>&#8226; Your community posts and comments are visible to other users.</li>
            <li>&#8226; We never sell your personal information to anyone.</li>
            <li>&#8226; You can delete your account and data at any time by contacting us.</li>
            <li>&#8226; We use Firebase (Google) for authentication, database, and analytics.</li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="border border-slate-200 rounded-3xl p-8 hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-display">{section.title}</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{section.content}</p>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>

        {/* Children's Privacy */}
        <section className="mt-10 border border-slate-200 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Children's Privacy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Arthneeti is designed for students and young adults interested in financial literacy. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information promptly.
          </p>
        </section>

        {/* Changes to Policy */}
        <section className="mt-10 border border-slate-200 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Changes to This Policy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any significant changes by posting the updated policy on this page with a new effective date. We encourage you to review this page periodically.
          </p>
        </section>

        {/* Contact */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-3">Questions About Your Privacy?</h2>
          <p className="text-sm text-slate-500 mb-6">
            If you have any questions, concerns, or requests regarding your data, please reach out to us.
          </p>
          <a
            href="mailto:learnarthneeti@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm"
          >
            <Mail size={16} />
            learnarthneeti@gmail.com
          </a>
        </div>
      </div>
    </motion.main>
  );
}
