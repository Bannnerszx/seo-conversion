// app/local-introduction/page.jsx
import InteractiveMap from "./LocalIntroductionComponents/InteractiveMap";

export async function generateMetadata({ params }) {
  return {
      title: 'Local Introduction',
      keywords: 'REAL MOTOR JAPAN, contact information, Japanese car exports, Toyota city, used cars Japan',
      openGraph: {
          title: 'Local Introduction| REAL MOTOR JAPAN',
          description: 'Reach our team at REAL MOTOR JAPAN for all your Japanese vehicle export inquiries and orders.',
          images: ['/images/contact-og-image.jpg'],
          locale: 'jp_JP',
          type: 'website',
      },
  }
};

// This replaces getStaticProps in App Router
async function getData() {
  const res = await fetch("https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2Ffeatures.json?alt=media&token=33d672f7-7d46-426c-abbc-0ea44de45fbd", {
    next: { revalidate: 60 } // Similar to revalidate: 60 in Pages Router
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  
  return res.json();
}

export default async function LocalIntroduction() {
  const geoData = await getData();
  
  return (
    <main className="container mx-auto py-10 px-4 mt-5">
      <InteractiveMap geoUrl={geoData} />
    </main>
  );
}