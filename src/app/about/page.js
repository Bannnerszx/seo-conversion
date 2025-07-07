import AboutContent from "./aboutusComponent/AboutContent";

export async function generateMetadata({ params }) {
  return {
      title: 'About Us | REAL MOTOR JAPAN',
      keywords: 'REAL MOTOR JAPAN, contact information, Japanese car exports, Toyota city, used cars Japan',
      openGraph: {
          title: 'About Us | REAL MOTOR JAPAN',
          description: 'Reach our team at REAL MOTOR JAPAN for all your Japanese vehicle export inquiries and orders.',
          images: ['/images/contact-og-image.jpg'],
          locale: 'jp_JP',
          type: 'website',
      },
  }
};

// Define the page component as an arrow function
const AboutPage = () => {
  return (
    <div>
      <AboutContent />
    </div>
  );
};

// Then export that arrow function as default
export default AboutPage;