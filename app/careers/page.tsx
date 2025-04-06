export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Join our core team to develop and improve our AI-powered art curation algorithms and recommendation systems."
    },
    {
      title: "Art Curator",
      department: "Content",
      location: "New York, NY",
      type: "Full-time",
      description: "Help shape our collection by identifying and evaluating artworks, working with artists, and ensuring the highest quality standards."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description: "Create beautiful and intuitive user experiences for our platform, focusing on both functionality and aesthetics."
    }
  ];

  const benefits = [
    "Competitive salary and equity package",
    "Remote-first work environment",
    "Unlimited PTO policy",
    "Comprehensive health, dental, and vision coverage",
    "Professional development budget",
    "Annual team retreats",
    "Home office setup allowance",
    "Wellness program"
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-4">Join Our Team</h1>
        <p className="text-xl text-gray-600 mb-12">
          Help us revolutionize the art world through technology and innovation.
        </p>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Our Culture</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-4">
              At AI Curator, we're building the future of art collection and curation. Our team combines expertise in technology, art, and design to create innovative solutions that make art more accessible and discoverable.
            </p>
            <p className="mb-4">
              We believe in fostering a collaborative, inclusive environment where creativity and innovation thrive. Our diverse team brings together perspectives from across the tech and art worlds, united by our passion for democratizing art through technology.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{position.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{position.department}</span>
                      <span>•</span>
                      <span>{position.location}</span>
                      <span>•</span>
                      <span>{position.type}</span>
                    </div>
                  </div>
                  <button className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90">
                    Apply Now
                  </button>
                </div>
                <p className="text-gray-600">{position.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 