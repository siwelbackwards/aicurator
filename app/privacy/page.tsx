export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: `We collect information that you provide directly to us, including when you create an account, make a purchase, or contact us for support. This may include:
        • Name and contact information
        • Payment and transaction information
        • Account credentials
        • Communication preferences
        • Profile information and preferences`
    },
    {
      title: "How We Use Your Information",
      content: `We use the information we collect to:
        • Provide and maintain our services
        • Process your transactions
        • Send you updates and marketing communications
        • Improve our services and develop new features
        • Protect against fraud and unauthorized access
        • Comply with legal obligations`
    },
    {
      title: "Information Sharing",
      content: `We may share your information with:
        • Service providers who assist in our operations
        • Payment processors for transaction processing
        • Law enforcement when required by law
        • Other parties with your consent
        
        We do not sell your personal information to third parties.`
    },
    {
      title: "Your Rights and Choices",
      content: `You have the right to:
        • Access your personal information
        • Correct inaccurate information
        • Request deletion of your information
        • Opt-out of marketing communications
        • Control cookie preferences
        
        Contact us at privacy@aicurator.com to exercise these rights.`
    },
    {
      title: "Security",
      content: `We implement appropriate technical and organizational measures to protect your personal information. However, no security system is impenetrable and we cannot guarantee the security of our systems 100%.`
    },
    {
      title: "Updates to This Policy",
      content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">
          Last Updated: March 25, 2024
        </p>
        
        <div className="prose max-w-none text-gray-600 mb-8">
          <p>
            At AI Curator, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
          </p>
        </div>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <section key={index}>
              <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
              <div className="prose max-w-none text-gray-600">
                <p className="whitespace-pre-line">{section.content}</p>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <div className="space-y-2">
            <p>AI Curator Privacy Team</p>
            <p>privacy@aicurator.com</p>
            <p>123 Art Street, Suite 100</p>
            <p>New York, NY 10001</p>
          </div>
        </div>
      </div>
    </div>
  );
} 