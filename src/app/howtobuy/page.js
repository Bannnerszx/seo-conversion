import HowToBuyCom from "./howtobuyComponents/HowToBuyCom";

export async function generateMetadata({ params }) {
    return {
        title: 'How To Buy',
        keywords: 'REAL MOTOR JAPAN, contact information, Japanese car exports, Toyota city, used cars Japan',
        openGraph: {
            title: 'How To Buy | REAL MOTOR JAPAN',
            description: 'Reach our team at REAL MOTOR JAPAN for all your Japanese vehicle export inquiries and orders.',
            images: ['/images/contact-og-image.jpg'],
            locale: 'jp_JP',
            type: 'website',
        },
    }
  };



const HowToBuy = () => {
    return (
        <div className="mt-5">
            <HowToBuyCom />
        </div>
    )
};

export default HowToBuy;