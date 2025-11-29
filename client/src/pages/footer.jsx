"use client"
import { FiMail, FiGithub, FiTwitter, FiLinkedin, FiYoutube } from "react-icons/fi"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Security", href: "#security" },
        { label: "Roadmap", href: "#roadmap" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#blog" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "API Reference", href: "#api" },
        { label: "Community", href: "#community" },
        { label: "Support", href: "#support" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
        { label: "Cookie Policy", href: "#cookies" },
        { label: "Compliance", href: "#compliance" },
      ],
    },
  ]

  const socialLinks = [
    { icon: FiTwitter, label: "Twitter", href: "https://twitter.com" },
    { icon: FiGithub, label: "GitHub", href: "https://github.com" },
    { icon: FiLinkedin, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: FiYoutube, label: "YouTube", href: "https://youtube.com" },
  ]

  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Footer Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">ClipSage</h3>
              <p className="text-gray-600 text-sm mt-2">Transform videos into actionable insights with AI.</p>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-900 mb-3">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors duration-200 text-sm"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200">
                  <FiMail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-blue-600 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Side - Copyright */}
            <div>
              <p className="text-gray-600 text-sm">© {currentYear} ClipSage. All rights reserved. Powered by AI.</p>
            </div>

            {/* Right Side - Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white flex items-center justify-center transition-all duration-200"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}