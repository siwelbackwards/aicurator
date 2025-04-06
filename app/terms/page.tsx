export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: `By accessing or using AI Curator's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.`
    },
    {
      title: "User Accounts",
      content: `To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.

You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.`
    },
    {
      title: "Intellectual Property",
      content: `The Service and its original content, features, and functionality are owned by AI Curator and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of AI Curator.`
    },
    {
      title: "User Content",
      content: `By posting, uploading, or sharing content through our platform, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content.

You represent and warrant that you own or control all rights in and to the content you post, and that such content does not violate these Terms or any applicable law.`
    },
    {
      title: "Prohibited Activities",
      content: `You agree not to engage in any of the following prohibited activities:
        • Using the service for any illegal purpose
        • Violating any applicable laws or regulations
        • Impersonating another person or entity
        • Interfering with the proper functioning of the service
        • Attempting to gain unauthorized access to our systems
        • Engaging in any automated use of the system`
    },
    {
      title: "Termination",
      content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.

All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`
    },
    {
      title: "Disclaimer",
      content: `Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.`
    },
    {
      title: "Limitation of Liability",
      content: `In no event shall AI Curator, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">
          Last Updated: March 25, 2024
        </p>
        
        <div className="prose max-w-none text-gray-600 mb-8">
          <p>
            Please read these Terms of Service carefully before using the AI Curator platform. These terms constitute a legally binding agreement between you and AI Curator regarding your use of our services.
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
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="space-y-2">
            <p>AI Curator Legal Team</p>
            <p>legal@aicurator.com</p>
            <p>123 Art Street, Suite 100</p>
            <p>New York, NY 10001</p>
          </div>
        </div>
      </div>
    </div>
  );
} 