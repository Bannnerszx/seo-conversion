import { Toaster } from "sonner";
import ContactUs from "./contactUsComponents/ContactUsCSR";

export async function generateMetadata({ params }) {
    return {
        title: 'Contact Us | REAL MOTOR JAPAN',
        description: 'Get in touch with REAL MOTOR JAPAN. Contact our team via phone, email, or visit our location in Toyota City, Aichi, Japan. Business hours: Mon-Sat, 9AM-6PM JST.',
        keywords: 'REAL MOTOR JAPAN, contact information, Japanese car exports, Toyota city, used cars Japan',
        openGraph: {
            title: 'Contact Us | REAL MOTOR JAPAN',
            description: 'Reach our team at REAL MOTOR JAPAN for all your Japanese vehicle export inquiries and orders.',
            images: ['/images/contact-og-image.jpg'],
            locale: 'en_US',
            type: 'website',
        },
    }
};

export default async function ContactUsPage() {
    return (
        <><Toaster />   <ContactUs /></>
    )
}
