export default function PressPage() {
  const pressReleases = [
    {
      title: "AI Curator Launches Revolutionary Art Collection Platform",
      date: "March 20, 2024",
      source: "Business Wire",
      excerpt: "AI Curator announces the launch of its innovative platform that combines artificial intelligence with fine art curation, revolutionizing how collectors discover and acquire unique pieces.",
      link: "#"
    },
    {
      title: "AI Curator Secures Major Partnership with Leading Art Galleries",
      date: "February 15, 2024",
      source: "Art News Daily",
      excerpt: "In a groundbreaking move, AI Curator partners with over 50 prestigious art galleries worldwide to expand its curated collection of AI-generated and traditional artworks.",
      link: "#"
    },
    {
      title: "The Future of Art Collection: AI Curator's Vision",
      date: "January 30, 2024",
      source: "Tech Insider",
      excerpt: "An exclusive interview with AI Curator's founding team on their vision to democratize art collection through technology and artificial intelligence.",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-8">Press Room</h1>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Media Contact</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              For press inquiries, please contact:
            </p>
            <div className="space-y-2">
              <p className="font-medium">Press Relations</p>
              <p>press@aicurator.com</p>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <h2 className="text-2xl font-bold mb-6">Recent Press Releases</h2>
          {pressReleases.map((release, index) => (
            <article key={index} className="border-b border-gray-200 pb-8">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span>{release.date}</span>
                <span className="mx-2">•</span>
                <span>{release.source}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 hover:text-primary cursor-pointer">
                {release.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {release.excerpt}
              </p>
              <a 
                href={release.link}
                className="text-primary font-medium hover:underline"
              >
                Read full release
              </a>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Brand Assets</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              Download our press kit containing logos, brand guidelines, and high-resolution images.
            </p>
            <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90">
              Download Press Kit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 