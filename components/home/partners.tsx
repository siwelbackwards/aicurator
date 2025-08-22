import Image from 'next/image';

export default function Partners() {
  const partners = [
    { name: 'Sotheby\'s', logo: 'https://via.placeholder.com/200x80/f8f9fa/374151?text=Partner+1' },
    { name: 'Christie\'s', logo: 'https://via.placeholder.com/200x80/f8f9fa/374151?text=Partner+2' },
    { name: 'Art Basel', logo: 'https://via.placeholder.com/200x80/f8f9fa/374151?text=Partner+3' },
    { name: 'Frieze', logo: 'https://via.placeholder.com/200x80/f8f9fa/374151?text=Partner+4' },
    { name: 'Gagosian', logo: 'https://via.placeholder.com/200x80/f8f9fa/374151?text=Partner+5' }
  ];

  return (
    <section className="py-16 max-w-[1400px] mx-auto px-4">
      <h2 className="text-4xl font-serif mb-8">Our Partners</h2>
      <div className="text-gray-600 mb-8 max-w-3xl">
        Trusted by leading galleries, fairs, and institutions.
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="flex items-center justify-center h-20 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors p-4"
            aria-label={`Partner: ${partner.name}`}
          >
            <Image
              src={partner.logo}
              alt={`${partner.name} logo`}
              width={200}
              height={80}
              className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </section>
  );
}


