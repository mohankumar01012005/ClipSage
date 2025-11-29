"use client"
import { Zap, Brain, Lock, Clock, Video, Sparkles } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      id: 1,
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Get instant video summaries in seconds, not hours. Our AI processes complex tutorials instantly, saving you valuable time.",
    },
    {
      id: 2,
      icon: Brain,
      title: "Smart Understanding",
      description:
        "Advanced AI understands context and extracts the most important insights from your videos with remarkable accuracy.",
    },
    {
      id: 3,
      icon: Lock,
      title: "Secure & Private",
      description:
        "Your videos are processed securely. We never store or share your sensitive information. Your privacy matters.",
    },
    {
      id: 4,
      icon: Clock,
      title: "Save 80% Time",
      description: "Reduce video watching time by 80%. Focus on what matters most while AI handles the heavy lifting.",
    },
    {
      id: 5,
      icon: Video,
      title: "Multiple Formats",
      description: "Works with YouTube, MP4, WebM and more. ClipSage supports any video format you throw at it.",
    },
    {
      id: 6,
      icon: Sparkles,
      title: "Customizable Output",
      description: "Choose summary length, style, and format. Get exactly the summary you need for your workflow.",
    },
  ]

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose <span className="text-blue-600">ClipSage</span>?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the power of AI-driven video understanding designed to boost your productivity and learning.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.id}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                {/* Icon Container */}
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}