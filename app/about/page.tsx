export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-bold mb-8">About AI Curator</h1>
        
        <div className="prose lg:prose-lg">
          <p className="text-xl text-gray-600 mb-8">
            AI Curator is revolutionizing the way people discover, collect, and trade AI-generated art and luxury items.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Our Mission</h2>
          <p>
            We believe in democratizing access to unique, AI-generated artworks while maintaining the highest standards of quality and authenticity. Our platform connects visionary artists and collectors in a curated marketplace that celebrates innovation and creativity.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Our Story</h2>
          <p>
            Founded in 2024, AI Curator emerged from a passion for both artificial intelligence and fine art. We recognized the transformative potential of AI in the art world and created a platform that bridges the gap between traditional collecting and cutting-edge technology.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <strong>Innovation:</strong> We embrace new technologies and creative approaches in the art world.
            </li>
            <li>
              <strong>Quality:</strong> We maintain strict curation standards to ensure exceptional artwork quality.
            </li>
            <li>
              <strong>Authenticity:</strong> We verify and track the provenance of every piece on our platform.
            </li>
            <li>
              <strong>Community:</strong> We foster connections between artists, collectors, and art enthusiasts.
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4">Join Our Community</h2>
          <p>
            Whether you're an artist pushing the boundaries of AI-generated art or a collector seeking unique pieces, AI Curator offers a sophisticated platform for discovering and acquiring exceptional artwork.
          </p>
        </div>
      </div>
    </div>
  );
} 