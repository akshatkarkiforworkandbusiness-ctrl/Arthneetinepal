import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Scale, Ban, UserCheck, Mail } from 'lucide-react';

const sections = [
  {
    icon: <FileText size={20} />,
    title: 'Acceptance of Terms',
    content: `By accessing or using the Arthneeti platform (arthneetinepal.vercel.app), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our platform. These terms apply to all users, including students, visitors, and registered members.`,
  },
  {
    icon: <UserCheck size={20} />,
    title: 'Eligibility & Account Registration',
    content: `Arthneeti is open to anyone interested in financial literacy. By creating an account, you confirm that:`,
    items: [
      'You are at least 13 years of age.',
      'You will provide accurate and complete information during registration.',
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You will notify us immediately of any unauthorized use of your account.',
      'You may create only one account per person. Duplicate accounts may be removed.',
    ],
  },
  {
    icon: <AlertTriangle size={20} />,
    title: 'Platform Purpose & Disclaimer',
    content: `Arthneeti is an educational platform designed to promote financial literacy among Nepali students. Important clarifications:`,
    items: [
      'Arthneeti provides educational content and market data for learning purposes only.',
      'Nothing on Arthneeti constitutes financial advice, investment recommendations, or a solicitation to buy or sell securities.',
      'Market data displayed (including NEPSE indices) may be delayed, simulated, or sourced from third-party APIs and should not be used for trading decisions.',
      'The trading game feature is a simulated environment for educational practice — no real money is involved.',
      'Always consult a qualified financial advisor before making investment decisions.',
    ],
  },
  {
    icon: <Scale size={20} />,
    title: 'User Conduct & Community Guidelines',
    content: `When using Arthneeti's community features, you agree to:`,
    items: [
      'Post only content that is relevant, respectful, and constructive.',
      'Not engage in harassment, bullying, hate speech, or discrimination of any kind.',
      'Not post spam, misleading information, or fraudulent content.',
      'Not attempt to manipulate market data or spread false financial rumors.',
      'Not impersonate other users, professionals, or organizations.',
      'Not use automated tools (bots, scrapers) to access or interact with the platform.',
      'Report any inappropriate content or behavior to our team.',
    ],
  },
  {
    icon: <Ban size={20} />,
    title: 'Intellectual Property',
    content: `All content on Arthneeti is protected by intellectual property laws:`,
    items: [
      'Arthneeti\'s original content, curriculum, design, logos, and branding are owned by Arthneeti and may not be copied or reproduced without permission.',
      'User-generated content (posts, comments) remains yours, but by posting on Arthneeti, you grant us a non-exclusive license to display, distribute, and promote that content on our platform.',
      'You may not redistribute, sell, or commercially exploit any content from Arthneeti without explicit written consent.',
      'Third-party content (images, videos, data) is used under fair use or with appropriate licenses.',
    ],
  },
  {
    icon: <AlertTriangle size={20} />,
    title: 'Certificates & Achievements',
    content: `Arthneeti issues digital certificates upon course completion:`,
    items: [
      'Certificates are digital records of your learning achievement on the Arthneeti platform.',
      'Certificates are not accredited qualifications and should not be presented as formal academic credentials.',
      'Arthneeti reserves the right to revoke certificates if fraudulent activity is detected (e.g., cheating on quizzes).',
      'Certificate verification is available via the public certificate URL provided upon completion.',
    ],
  },
  {
    icon: <Ban size={20} />,
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law:`,
    items: [
      'Arthneeti is provided "as is" and "as available" without warranties of any kind, whether express or implied.',
      'We are not responsible for any financial losses, decisions, or actions taken based on information available on the platform.',
      'We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.',
      'Our total liability to you for any claims related to the platform shall not exceed the amount you paid to us (which is currently zero, as Arthneeti is free).',
    ],
  },
  {
    icon: <FileText size={20} />,
    title: 'Termination',
    content: `We reserve the right to suspend or terminate your account if:`,
    items: [
      'You violate any of these Terms of Service.',
      'You engage in conduct that is harmful to other users or the platform.',
      'We are required to do so by law.',
      'You may also delete your account at any time by contacting us at learnarthneeti@gmail.com.',
      'Upon termination, your right to use the platform ceases immediately. We may retain certain data as described in our Privacy Policy.',
    ],
  },
  {
    icon: <Scale size={20} />,
    title: 'Governing Law & Disputes',
    content: `These terms are governed by the laws of Nepal. Any disputes arising from or relating to these terms or your use of Arthneeti shall be resolved in the courts of Nepal. We encourage you to contact us first to attempt to resolve any dispute informally before pursuing formal action.`,
  },
  {
    icon: <FileText size={20} />,
    title: 'Changes to These Terms',
    content: `We may modify these Terms of Service at any time. Changes will be posted on this page with an updated effective date. Continued use of the platform after changes constitutes acceptance of the new terms. We will make reasonable efforts to notify users of significant changes.`,
  },
];

export default function TermsOfServicePage() {
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
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight">
                Terms of Service
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Effective Date: July 2025 &middot; Last Updated: July 2025
          </p>
          <p className="text-slate-600 text-lg leading-relaxed mt-6 max-w-3xl">
            Welcome to Arthneeti. These Terms of Service outline the rules and guidelines for using our platform. Please read them carefully before using Arthneeti.
          </p>
        </div>

        {/* Quick Summary Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 mb-12">
          <h2 className="text-lg font-bold text-amber-800 mb-3 font-display">Key Points to Remember</h2>
          <ul className="space-y-2 text-sm text-amber-700 leading-relaxed">
            <li>&#8226; Arthneeti is an educational platform — we do not provide financial advice.</li>
            <li>&#8226; Market data is for learning purposes and should not be used for real trading decisions.</li>
            <li>&#8226; Be respectful in community discussions — no spam, harassment, or misleading information.</li>
            <li>&#8226; Your content is yours, but posting grants us a license to display it on the platform.</li>
            <li>&#8226; We are not liable for any financial losses based on information from this platform.</li>
            <li>&#8226; You can delete your account at any time by contacting us.</li>
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
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-3">Questions About These Terms?</h2>
          <p className="text-sm text-slate-500 mb-6">
            If you have any questions about these Terms of Service, please contact us.
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
