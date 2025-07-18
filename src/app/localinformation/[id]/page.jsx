// app/local/[id]/page.jsx
import Image from 'next/image'
import fs from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'

import { MapPin, Phone, LocateIcon as LocationIcon } from 'lucide-react'
import { ImageCarousel } from '../localInformationComponents/image-carousel'
export async function generateStaticParams() {
    const filePath = path.join(process.cwd(), 'services', 'countryInformation.json')
    const raw = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)

    return data.country.map(c => ({
        // URI‑encode the title so spaces and special chars become safe in the URL
        id: encodeURIComponent(c.title)
    }))
}

export default async function LocalInformation({ params }) {
    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const filePath = path.join(process.cwd(), 'services', 'countryInformation.json')
    const raw = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(raw)

    // lookup by the decoded title
    const country = data.country.find(c => c.title === decodedId)

    if (!country) {
        // if no match, throw a 404
        notFound()
    }
    const flagImages = {
        // North America
        Canada: "https://flagcdn.com/w80/ca.png",

        // Africa
        Zambia: "https://flagcdn.com/w80/zm.png",
        Uganda: "https://flagcdn.com/w80/ug.png",
        Tanzania: "https://flagcdn.com/w80/tz.png",
        Kenya: "https://flagcdn.com/w80/ke.png",
        DR_Congo: "https://flagcdn.com/w80/cd.png",
        Mozambique: "https://flagcdn.com/w80/mz.png",
        Malawi: "https://flagcdn.com/w80/mw.png",
        Zimbabwe: "https://flagcdn.com/w80/zw.png",
        Burundi: "https://flagcdn.com/w80/bi.png",

        // Asia
        China: "https://flagcdn.com/w80/cn.png",
        India: "https://flagcdn.com/w80/in.png",
        Japan: "https://flagcdn.com/w80/jp.png",
        Thailand: "https://flagcdn.com/w80/th.png",
        Vietnam: "https://flagcdn.com/w80/vn.png",

        // Caribbean
        Jamaica: "https://flagcdn.com/w80/jm.png",
        Cuba: "https://flagcdn.com/w80/cu.png",
        "Dominican Republic": "https://flagcdn.com/w80/do.png",
        Haiti: "https://flagcdn.com/w80/ht.png",
        "Puerto Rico": "https://flagcdn.com/w80/pr.png",
        "Antigua and Barbuda": "https://flagcdn.com/w80/ag.png",
        "Saint Lucia": "https://flagcdn.com/w80/lc.png",
        Barbados: "https://flagcdn.com/w80/bb.png",
        "Saint Vincent and the Grenadines": "https://flagcdn.com/w80/vc.png",
        "Trinidad and Tobago": "https://flagcdn.com/w80/tt.png",
        "Saint Kitts and Nevis": "https://flagcdn.com/w80/kn.png",
        "Cayman Islands": "https://flagcdn.com/w80/ky.png",
        "Netherlands Antilles": "https://flagcdn.com/w80/an.png",
        Panama: "https://flagcdn.com/w80/pa.png",
        Grenada: "https://flagcdn.com/w80/gd.png",
        "Papua New Guinea": "https://flagcdn.com/w80/pg.png",
    };
    const displayTitle =
        country.title === "DR_Congo"
            ? "Democratic Republic of Congo (DR Congo)"
            : country.title;

    const chipataImages = [
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm1.jpg?alt=media&token=3e63a404-7732-42ff-a2ba-ceb2deb27cd5", alt: "Chipata Branch Exterior" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm2.jpg?alt=media&token=09a88e20-0858-4c6e-ae15-894ab0329e0f", alt: "Chipata Branch Interior" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm3.jpg?alt=media&token=7c40e386-8c95-4f58-a0bc-79a834ac197f", alt: "Chipata Branch Cars" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm4.jpg?alt=media&token=a016375b-62dd-4136-ac37-42df5c0dabbb", alt: "Zambia Branch" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm5.jpg?alt=media&token=bc72b182-3995-4d19-a69d-1cf43d713b94", alt: "Zambia Branch 2" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm7.jpg?alt=media&token=8f7a20ae-ca51-4850-a70c-17d1553e32f2", alt: "Zambia Branch 3" },
        { src: "https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm8.jpg?alt=media&token=ccc97885-7d1c-4679-8363-3342e7a71d97", alt: "Zambia Branch 4" },
        { src: " https://firebasestorage.googleapis.com/v0/b/real-motor-japan.firebasestorage.app/o/assets%2Fzambia-assets%2Fzm6.jpg?alt=media&token=4396bf41-7203-49e8-85fe-4f572ab52594", alt: "Zambia Branch 5" }

    ]


    if (decodedId === "Zambia") {
        return (
            <div className="min-h-screen bg-white relative mt-20">
                <div className="absolute inset-0 w-full h-full z-[9]">
                    <svg height="0" width="0">
                        <defs>
                            <pattern
                                id="backgroundPattern"
                                patternUnits="userSpaceOnUse"
                                width={132} // width of your pattern
                                height={137} // height of your pattern
                                viewBox="0 0 132 137"
                            >
                                <path
                                    d="M118.829 68.387l12.746-22.077a.868.868 0 000-.872l-12.99-22.5a.868.868 0 00-.754-.435H92.338L79.598.436A.871.871 0 0078.844 0H52.861a.87.87 0 00-.754.436l-12.74 22.068H13.861a.871.871 0 00-.754.436L.117 45.44a.87.87 0 000 .872l12.744 22.08L.117 90.465a.874.874 0 000 .872l12.99 22.5a.866.866 0 00.754.436h25.51l12.735 22.06a.877.877 0 00.754.436h25.98a.865.865 0 00.754-.436l12.736-22.06h25.5a.869.869 0 00.754-.436l12.99-22.5a.868.868 0 000-.872l-12.745-22.078zm-62.72 51.1l8.645-4.989-11.5 19.911v-13.272l2.855-1.65zm-38.99-22.5l8.635-4.982-11.5 19.911V98.642l2.865-1.655zM14.252 38.14V24.865l11.5 19.91-.958-.552-10.542-6.083zm39-35.78l11.5 19.911-11.5-6.634V2.36zm-39 80.807V69.891l11.5 19.91-.958-.552-10.542-6.082zM17.11 51.96l8.635-4.982-11.5 19.91V53.615l2.865-1.655zm36.151 40.427l11.5 19.91-11.5-6.634V92.387zm13-67.509l11.5 19.911-11.5-6.636V24.878zm-.41 73.045l-10.663-6.156h21.333l-10.67 6.156zm37.891-50.946l-11.5 19.911V53.615l2.852-1.648 8.648-4.99zm-11.5 22.912l11.5 19.911-11.5-6.634V69.889zm-39-22.514l11.5 19.91-11.5-6.634V47.375zm25.2 0v13.274l-11.494 6.635 11.494-19.909zm-13 35.789l-11.5 6.638 11.5-19.91v13.272zm.81-13.273l11.5 19.911-11.5-6.636V69.891zm12.591-8.544l11.5 6.634H67.354l11.49-6.634zm-26 0l11.5 6.636h-23l11.5-6.636zm11.494 7.441l-8.769 5.066-2.727 1.573-11.5-6.637 22.996-.002zm-8.239 5.689l8.646-4.988-11.5 19.911V76.123l2.854-1.646zm9.742 9.383l10.661 6.152H55.188L65.84 83.86zm1.106-14.37l11.494 6.636v13.273L66.946 69.49zm11.9 5.938l-11.5-6.64h23l-11.5 6.64zm.4-14.778v-12.3L89.9 66.803 79.246 60.65zm-12.994 6.232V53.607l11.5-6.636-11.5 19.911zm-.809-13.272v13.271l-11.5-19.909 11.5 6.638zm-13 7.04l-10.662 6.156L52.443 48.34v12.31zm0 15.474v12.3L41.788 69.968l10.655 6.156zm26.8 0l10.66-6.158-10.654 18.457-.006-12.299zm-13.4-23.212L55.18 46.755h21.332l-10.669 6.157zm25.6.7v12.3L80.787 47.457l10.656 6.155zm-51.186 12.3v-12.3l10.66-6.158-10.66 18.458zm-.808-12.3v13.274l-11.5-19.909 11.5 6.635zm.008 16.277v13.273l-11.496 6.639 11.496-19.912zm.8.97l10.655 18.454-10.659-6.149.004-12.305zm64.18 5.265v13.272l-11.5-19.91 11.5 6.638zm0-28.745v13.272l-11.5 6.637 11.5-19.909zm-9.807 3.924l-2.792 1.611-11.5-6.637h22.992l-8.7 5.026zm-54.783 1.62l-11.5-6.641h23l-11.5 6.641zm-12.592-5.537l11.5 19.911-11.5-6.636V47.386zm0 42.019V76.13l11.5-6.636-11.5 19.911zm12.592-5.535l11.5 6.633h-22.99l11.49-6.633zm25.6 14.758V111.9l-11.5-19.91 11.5 6.638zm.806 0l11.5-6.637-11.5 19.912V98.628zm25.185-27.764v12.312l-10.66 6.147 10.66-18.459zm13.4 4.573l-10.663-6.156h21.332l-10.669 6.156zM94.184 67.51l10.654-6.152 10.661 6.152H94.184zm-2.342-28.665l11.5 6.636h-23l11.5-6.636zm-24.88-14.369l11.491 6.636v13.273L66.961 24.476zm-1.107 14.371l10.661 6.151H55.197l10.658-6.151zm-37.5 6.626l11.492-6.636 11.5 6.633-22.992.003zM26.846 61.35l10.661 6.152H16.193l10.653-6.152zm10.674 7.923l-10.669 6.156-10.663-6.156H37.52zm2.331 28.672l-11.5-6.641h23l-11.5 6.641zm38.6-5.558v13.273l-11.49 6.636 11.49-19.909zm13.39-8.523L103.34 90.5h-23l11.5-6.636zm13.399-7.74l11.5-6.636-11.5 19.911V76.124zm0-15.469V47.38l11.5 19.911-11.5-6.636zM91.44 38.14l-10.66 6.156L91.44 25.83v12.31zm-25.989.009l-11.5 6.638 11.5-19.91v13.272zm-14.543 6.139L40.25 38.139v-12.3l10.658 18.449zM26.446 60.653l-11.5 6.638 11.5-19.909v13.271zm0 15.474v13.272l-11.5-19.91 11.5 6.638zm13.8 22.515l10.66-6.158L40.26 110.94l-.015-12.298zm40.532-6.152l10.655 6.152v12.3L80.778 92.49zm11.056 5.454l-11.5-6.637h22.992l-8.77 5.066-2.722 1.571zm14.1-8.144l11.5-19.909v13.273l-11.5 6.636zm0-42.821l11.492 6.635v13.274l-11.492-19.909zm-13.7-8.84V24.865l11.5 19.91-11.5-6.636zM79.261 43.41v-12.3l10.658-6.158L79.261 43.41zm-14.5-18.933l-11.5 19.91V31.112l2.852-1.648 8.648-4.987zm-12.3 6.636v12.3L41.805 24.958l10.656 6.155zm-13-6.247V38.14l-11.494 6.635 11.494-19.909zm0 73.778v13.273l-11.5-19.909 11.5 6.636zm13-5.29v12.312l-10.67 6.157 10.67-18.469zm26.8.006l10.654 18.454-10.657-6.149.003-12.305zm12.987 18.558V98.642l2.852-1.648 8.645-4.989-11.497 19.913zm25.595-59l-11.5-6.641h23l-11.5 6.641zm-11.894-8.145l11.5-19.909v13.274l-11.5 6.635zm-.7-.4V31.098l11.5-6.636-11.5 19.911zm-.809-13.272v13.272l-11.5-19.91 11.5 6.638zm-25.586-.686l-11.5-6.641h23l-11.5 6.641zm-11.893-8.144l11.5-19.909v13.273l-11.5 6.636zm-.7-.4V8.596l11.5-6.636-11.5 19.911zm-.809-13.273V21.87l-11.5-19.91 11.5 6.638zm-9.806 20.207l-2.792 1.611-11.5-6.637h22.992l-8.7 5.026zm-28.39 15.568V31.098l11.5-6.636-11.5 19.911zm-.81-13.272v13.272l-11.5-19.91 11.5 6.638zm-9.72 20.156l-2.877 1.66-11.5-6.637H25.34l-8.614 4.977zm-2.87 32.608l10.048 5.8 1.451.838h-23l11.5-6.638zm12.6 8.544v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.497 19.914-11.5-6.636.003-13.278zm25.6 13.953l11.5 6.635h-23l11.5-6.635zm12.6 8.544v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.5 19.912-11.5-6.637v-13.275zm.7-.4l11.492 6.636v13.273l-11.492-19.909zm11.894-8.142l11.5 6.633h-22.99l11.49-6.633zm25.587-13.952v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.5 19.912-11.5-6.636V92.412zm.7-.4l11.492 6.636v13.274l-11.492-19.91zm11.9-8.142l11.5 6.633h-22.99l11.49-6.633zm.4-.7V70.865l10.655 18.454-10.655-6.149zm0-17.256v-12.3l10.658-6.158-10.658 18.458zm-11.9-20.439l11.493-6.636 11.5 6.633-22.993.003zm-1.508-15.07L94.19 24.248h21.332l-10.669 6.157zM67.361 22.97l11.492-6.635 11.5 6.633-22.992.002zM65.853 7.9L55.19 1.744h21.332L65.853 7.9zm-13 8.436l11.5 6.636h-23l11.5-6.636zM26.847 30.403l-10.663-6.157h21.332l-10.669 6.157zm-13 8.435l10.05 5.8 1.45.838h-23l11.5-6.638zm-.4 14.777v12.3L2.792 47.46l10.655 6.155zm0 17.241v12.312L2.791 89.323l10.656-18.467zm11.9 20.448l-8.686 5.019-2.812 1.623-11.5-6.637 22.998-.005zm1.5 15.074l10.661 6.151h-21.31l10.65-6.151zm37.5 7.422l-8.77 5.066-2.726 1.574-11.5-6.638 22.996-.002zm1.5 15.074l10.661 6.151h-21.31l10.65-6.151zm13-8.433l-11.5-6.641h23l-11.5 6.641zm25.987-14.063l10.661 6.151h-21.31l10.649-6.151zm13-8.433l-11.5-6.641h23l-11.5 6.641zm11.061-53.656l-10.658-6.149v-12.3l10.658 18.449zm-38.989-22.5L79.25 15.64V3.334l10.657 18.455zM52.453 3.323v12.312l-10.662 6.158 10.662-18.47zm-39.005 22.5v12.311L2.786 44.29l10.662-18.467zM2.798 92.484l10.654 6.152v12.3L2.797 92.484zm39 22.5l10.654 6.151v12.3l-10.655-18.451zm37.46 18.449v-12.3l10.657-6.158-10.658 18.458zm38.987-22.5v-12.3l10.658-6.158-10.658 18.458z"
                                    fill="#0000ff"
                                    opacity="0.2"
                                />
                            </pattern>
                        </defs>
                    </svg>
                    <svg
                        width={'100%'}
                        height={'100%'}
                        viewBox="0 0 1439 788"
                        preserveAspectRatio="xMidYMid slice"
                        xmlns="http://www.w3.org/2000/svg"

                    >
                        <path
                            d="M1282.01 1.196c-71.67 7.749-74.64 72.617-74.64 72.617s-74.98-26.2-89.58 46.848c0 0-64.45-41.536-134.645-4.343-70.192 37.193-44.732 123.012-44.732 123.012s-136.694 13.512-145.321 142.525c0 0-65.195 17.658-70.375 56.606 0 0-178.4-45.6-276.894 105.616 0 0-35.407-20-89.85 6.6 0 0-47.556-77.09-146.882-51.849 0 0-41.7-116.97-209.091-65.44v166.49a44.52 44.52 0 014.351-.21h378.385c20.218 0 36.608 13.429 36.608 29.99s-16.39 29.989-36.608 29.989H279.724a29.994 29.994 0 00-21.509 8.622 30.016 30.016 0 00-6.622 9.788 30.01 30.01 0 000 23.173 30.016 30.016 0 0016.511 16.26 29.994 29.994 0 0011.62 2.15h58.083a29.994 29.994 0 110 59.987H53.735a29.877 29.877 0 00-20.689 8.278H1439v-99.681H913.046a30 30 0 010-59.993h117.614c7.95 0 15.58-3.159 21.2-8.783a29.968 29.968 0 000-42.408 29.975 29.975 0 00-21.2-8.783H717.696a30 30 0 010-59.992h538.954a29.986 29.986 0 0020.89-8.957 30.006 30.006 0 008.62-21.039c0-7.872-3.1-15.428-8.62-21.039a29.986 29.986 0 00-20.89-8.957h-103.37c-20.23 0-36.62-13.425-36.62-29.99 0-16.565 16.39-29.986 36.62-29.986H1439V17.552a49.215 49.215 0 00-23.93-7.151c-40.37-1.437-42.35 15.473-42.35 15.473S1357.53.001 1303.2 0c-7.08.02-14.15.42-21.19 1.2"
                            fill="url(#backgroundPattern)" // Apply the pattern to the cloud shape
                        />
                    </svg>
                </div>

                <div className="container mx-auto px-4 py-16 relative z-10">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-2">Our Zambia Branch Locations</h1>
                        <p className="text-gray-500 text-lg">Visit us at any of our convenient branch locations across Zambia.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Chipata Branch */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-blue-700 mb-4">Chipata Branch</h2>

                                <div className="flex items-start mb-3">
                                    <Phone className="text-blue-700 mr-3 mt-1 flex-shrink-0" />
                                    <p className="text-gray-700">+260976887356</p>
                                </div>

                                <div className="flex items-start mb-6">
                                    <LocationIcon className="text-blue-700 mr-3 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-700">Plot 674,</p>
                                        <p className="text-gray-700">Off Umodzi Highway,</p>
                                        <p className="text-gray-700">Chipata,</p>
                                        <p className="text-gray-700">Eastern Province,</p>
                                        <p className="text-gray-700">Zambia.</p>
                                    </div>
                                </div>

                                <div className="rounded-md overflow-hidden h-64 mb-4">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3899.589148585417!2d32.6334839!3d-13.6334791!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1918eba679380461:0x94e7cafdf4ab121b!2sUmodzi%20Hwy%2C%20Zambia!5e0!3m2!1sen!2s!4v1708997477945!5m2!1sen!2s"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                    ></iframe>
                                </div>

                                <a
                                    href="https://www.google.com/maps/place/Umodzi+Hwy,+Zambia/@-13.6337319,32.6335675,15z/data=!4m6!3m5!1s0x1918eba679380461:0x94e7cafdf4ab121b!8m2!3d-13.6334791!4d32.6334839!16s%2Fg%2F11l5vl37kd?hl=en&entry=ttu&g_ep=EgoyMDI1MDIyNS4wIKXMDSoASAFQAw%3D%3D"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-700 text-white py-3 px-6 rounded-md inline-block font-medium hover:bg-blue-800 transition-colors"
                                >
                                    Get Directions
                                </a>
                            </div>
                        </div>

                        {/* Lusaka Branch */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-blue-700 mb-4">Lusaka Branch</h2>

                                <div className="flex items-start mb-1">
                                    <Phone className="text-blue-700 mr-3 mt-1 flex-shrink-0" />
                                    <p className="text-gray-700">+260976887356</p>
                                </div>
                                <div className="flex items-start mb-3 ml-8">
                                    <p className="text-gray-700">+260777590058</p>
                                </div>

                                <div className="flex items-start mb-6">
                                    <LocationIcon className="text-blue-700 mr-3 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-700">Plot # 5017</p>
                                        <p className="text-gray-700">Saise Road,</p>
                                        <p className="text-gray-700">Roads Park,</p>
                                        <p className="text-gray-700">Lusaka,</p>
                                        <p className="text-gray-700">Zambia.</p>
                                    </div>
                                </div>

                                <div className="rounded-md overflow-hidden h-64 mb-4">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15385.371556344675!2d28.297311664660306!3d-15.41203390398377!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1940f50008324a4d%3A0xaa1e705647a1cec6!2sReal%20Motor%20Zambia!5e0!3m2!1sen!2sjp!4v1740709679603!5m2!1sen!2sjp"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                    ></iframe>
                                </div>

                                <a
                                    href="https://www.google.com/maps/place/Real+Motor+Zambia/@-15.397998,28.297858,13z/data=!4m6!3m5!1s0x1940f50008324a4d:0xaa1e705647a1cec6!8m2!3d-15.3979982!4d28.2978583!16s%2Fg%2F11wwgzxf3k?hl=en&entry=ttu&g_ep=EgoyMDI1MDIyNS4wIKXMDSoASAFQAw%3D%3D"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-700 text-white py-3 px-6 rounded-md inline-block font-medium hover:bg-blue-800 transition-colors"
                                >
                                    Get Directions
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="my-6">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3">Branch Gallery</h3>
                        <ImageCarousel images={chipataImages} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-5">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-white dark:bg-gray-700 p-1 rounded-md shadow-sm overflow-hidden flex items-center justify-center h-12 w-20">
                                    <Image
                                        src={flagImages[country.title] || defaultFlag}
                                        alt={`Flag of ${country.title}`}
                                        width={80}
                                        height={40}
                                        className="object-cover"
                                    />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold">
                                    {displayTitle}
                                </h1>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            {country.content.map(({ mini_title, text }, idx) => (
                                <section key={idx} className="mb-8 last:mb-0">
                                    {mini_title && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            <h2 className="text-xl font-semibold">{mini_title}</h2>
                                        </div>
                                    )}
                                    <p className="leading-relaxed text-gray-700 dark:text-gray-300">{text}</p>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full z-[9]">
                    <svg
                        width={'100%'}
                        height={'100%'}
                        viewBox="0 0 1439 788"
                        preserveAspectRatio="xMidYMid slice"
                        xmlns="http://www.w3.org/2000/svg"

                    > <path
                            d="M1282.01 1.196c-71.67 7.749-74.64 72.617-74.64 72.617s-74.98-26.2-89.58 46.848c0 0-64.45-41.536-134.645-4.343-70.192 37.193-44.732 123.012-44.732 123.012s-136.694 13.512-145.321 142.525c0 0-65.195 17.658-70.375 56.606 0 0-178.4-45.6-276.894 105.616 0 0-35.407-20-89.85 6.6 0 0-47.556-77.09-146.882-51.849 0 0-41.7-116.97-209.091-65.44v166.49a44.52 44.52 0 014.351-.21h378.385c20.218 0 36.608 13.429 36.608 29.99s-16.39 29.989-36.608 29.989H279.724a29.994 29.994 0 00-21.509 8.622 30.016 30.016 0 00-6.622 9.788 30.01 30.01 0 000 23.173 30.016 30.016 0 0016.511 16.26 29.994 29.994 0 0011.62 2.15h58.083a29.994 29.994 0 110 59.987H53.735a29.877 29.877 0 00-20.689 8.278H1439v-99.681H913.046a30 30 0 010-59.993h117.614c7.95 0 15.58-3.159 21.2-8.783a29.968 29.968 0 000-42.408 29.975 29.975 0 00-21.2-8.783H717.696a30 30 0 010-59.992h538.954a29.986 29.986 0 0020.89-8.957 30.006 30.006 0 008.62-21.039c0-7.872-3.1-15.428-8.62-21.039a29.986 29.986 0 00-20.89-8.957h-103.37c-20.23 0-36.62-13.425-36.62-29.99 0-16.565 16.39-29.986 36.62-29.986H1439V17.552a49.215 49.215 0 00-23.93-7.151c-40.37-1.437-42.35 15.473-42.35 15.473S1357.53.001 1303.2 0c-7.08.02-14.15.42-21.19 1.2"
                            fill="url(#backgroundPattern)" // Apply the pattern to the cloud shape
                        />
                    </svg>
                </div>

            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center relative mt-20">
            <div className="absolute inset-0 w-full h-full z-[-1]">
                <svg height="0" width="0">
                    <defs>
                        <pattern
                            id="backgroundPattern"
                            patternUnits="userSpaceOnUse"
                            width={132} // width of your pattern
                            height={137} // height of your pattern
                            viewBox="0 0 132 137"
                        >
                            <path
                                d="M118.829 68.387l12.746-22.077a.868.868 0 000-.872l-12.99-22.5a.868.868 0 00-.754-.435H92.338L79.598.436A.871.871 0 0078.844 0H52.861a.87.87 0 00-.754.436l-12.74 22.068H13.861a.871.871 0 00-.754.436L.117 45.44a.87.87 0 000 .872l12.744 22.08L.117 90.465a.874.874 0 000 .872l12.99 22.5a.866.866 0 00.754.436h25.51l12.735 22.06a.877.877 0 00.754.436h25.98a.865.865 0 00.754-.436l12.736-22.06h25.5a.869.869 0 00.754-.436l12.99-22.5a.868.868 0 000-.872l-12.745-22.078zm-62.72 51.1l8.645-4.989-11.5 19.911v-13.272l2.855-1.65zm-38.99-22.5l8.635-4.982-11.5 19.911V98.642l2.865-1.655zM14.252 38.14V24.865l11.5 19.91-.958-.552-10.542-6.083zm39-35.78l11.5 19.911-11.5-6.634V2.36zm-39 80.807V69.891l11.5 19.91-.958-.552-10.542-6.082zM17.11 51.96l8.635-4.982-11.5 19.91V53.615l2.865-1.655zm36.151 40.427l11.5 19.91-11.5-6.634V92.387zm13-67.509l11.5 19.911-11.5-6.636V24.878zm-.41 73.045l-10.663-6.156h21.333l-10.67 6.156zm37.891-50.946l-11.5 19.911V53.615l2.852-1.648 8.648-4.99zm-11.5 22.912l11.5 19.911-11.5-6.634V69.889zm-39-22.514l11.5 19.91-11.5-6.634V47.375zm25.2 0v13.274l-11.494 6.635 11.494-19.909zm-13 35.789l-11.5 6.638 11.5-19.91v13.272zm.81-13.273l11.5 19.911-11.5-6.636V69.891zm12.591-8.544l11.5 6.634H67.354l11.49-6.634zm-26 0l11.5 6.636h-23l11.5-6.636zm11.494 7.441l-8.769 5.066-2.727 1.573-11.5-6.637 22.996-.002zm-8.239 5.689l8.646-4.988-11.5 19.911V76.123l2.854-1.646zm9.742 9.383l10.661 6.152H55.188L65.84 83.86zm1.106-14.37l11.494 6.636v13.273L66.946 69.49zm11.9 5.938l-11.5-6.64h23l-11.5 6.64zm.4-14.778v-12.3L89.9 66.803 79.246 60.65zm-12.994 6.232V53.607l11.5-6.636-11.5 19.911zm-.809-13.272v13.271l-11.5-19.909 11.5 6.638zm-13 7.04l-10.662 6.156L52.443 48.34v12.31zm0 15.474v12.3L41.788 69.968l10.655 6.156zm26.8 0l10.66-6.158-10.654 18.457-.006-12.299zm-13.4-23.212L55.18 46.755h21.332l-10.669 6.157zm25.6.7v12.3L80.787 47.457l10.656 6.155zm-51.186 12.3v-12.3l10.66-6.158-10.66 18.458zm-.808-12.3v13.274l-11.5-19.909 11.5 6.635zm.008 16.277v13.273l-11.496 6.639 11.496-19.912zm.8.97l10.655 18.454-10.659-6.149.004-12.305zm64.18 5.265v13.272l-11.5-19.91 11.5 6.638zm0-28.745v13.272l-11.5 6.637 11.5-19.909zm-9.807 3.924l-2.792 1.611-11.5-6.637h22.992l-8.7 5.026zm-54.783 1.62l-11.5-6.641h23l-11.5 6.641zm-12.592-5.537l11.5 19.911-11.5-6.636V47.386zm0 42.019V76.13l11.5-6.636-11.5 19.911zm12.592-5.535l11.5 6.633h-22.99l11.49-6.633zm25.6 14.758V111.9l-11.5-19.91 11.5 6.638zm.806 0l11.5-6.637-11.5 19.912V98.628zm25.185-27.764v12.312l-10.66 6.147 10.66-18.459zm13.4 4.573l-10.663-6.156h21.332l-10.669 6.156zM94.184 67.51l10.654-6.152 10.661 6.152H94.184zm-2.342-28.665l11.5 6.636h-23l11.5-6.636zm-24.88-14.369l11.491 6.636v13.273L66.961 24.476zm-1.107 14.371l10.661 6.151H55.197l10.658-6.151zm-37.5 6.626l11.492-6.636 11.5 6.633-22.992.003zM26.846 61.35l10.661 6.152H16.193l10.653-6.152zm10.674 7.923l-10.669 6.156-10.663-6.156H37.52zm2.331 28.672l-11.5-6.641h23l-11.5 6.641zm38.6-5.558v13.273l-11.49 6.636 11.49-19.909zm13.39-8.523L103.34 90.5h-23l11.5-6.636zm13.399-7.74l11.5-6.636-11.5 19.911V76.124zm0-15.469V47.38l11.5 19.911-11.5-6.636zM91.44 38.14l-10.66 6.156L91.44 25.83v12.31zm-25.989.009l-11.5 6.638 11.5-19.91v13.272zm-14.543 6.139L40.25 38.139v-12.3l10.658 18.449zM26.446 60.653l-11.5 6.638 11.5-19.909v13.271zm0 15.474v13.272l-11.5-19.91 11.5 6.638zm13.8 22.515l10.66-6.158L40.26 110.94l-.015-12.298zm40.532-6.152l10.655 6.152v12.3L80.778 92.49zm11.056 5.454l-11.5-6.637h22.992l-8.77 5.066-2.722 1.571zm14.1-8.144l11.5-19.909v13.273l-11.5 6.636zm0-42.821l11.492 6.635v13.274l-11.492-19.909zm-13.7-8.84V24.865l11.5 19.91-11.5-6.636zM79.261 43.41v-12.3l10.658-6.158L79.261 43.41zm-14.5-18.933l-11.5 19.91V31.112l2.852-1.648 8.648-4.987zm-12.3 6.636v12.3L41.805 24.958l10.656 6.155zm-13-6.247V38.14l-11.494 6.635 11.494-19.909zm0 73.778v13.273l-11.5-19.909 11.5 6.636zm13-5.29v12.312l-10.67 6.157 10.67-18.469zm26.8.006l10.654 18.454-10.657-6.149.003-12.305zm12.987 18.558V98.642l2.852-1.648 8.645-4.989-11.497 19.913zm25.595-59l-11.5-6.641h23l-11.5 6.641zm-11.894-8.145l11.5-19.909v13.274l-11.5 6.635zm-.7-.4V31.098l11.5-6.636-11.5 19.911zm-.809-13.272v13.272l-11.5-19.91 11.5 6.638zm-25.586-.686l-11.5-6.641h23l-11.5 6.641zm-11.893-8.144l11.5-19.909v13.273l-11.5 6.636zm-.7-.4V8.596l11.5-6.636-11.5 19.911zm-.809-13.273V21.87l-11.5-19.91 11.5 6.638zm-9.806 20.207l-2.792 1.611-11.5-6.637h22.992l-8.7 5.026zm-28.39 15.568V31.098l11.5-6.636-11.5 19.911zm-.81-13.272v13.272l-11.5-19.91 11.5 6.638zm-9.72 20.156l-2.877 1.66-11.5-6.637H25.34l-8.614 4.977zm-2.87 32.608l10.048 5.8 1.451.838h-23l11.5-6.638zm12.6 8.544v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.497 19.914-11.5-6.636.003-13.278zm25.6 13.953l11.5 6.635h-23l11.5-6.635zm12.6 8.544v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.5 19.912-11.5-6.637v-13.275zm.7-.4l11.492 6.636v13.273l-11.492-19.909zm11.894-8.142l11.5 6.633h-22.99l11.49-6.633zm25.587-13.952v13.272l-11.5 6.638 11.5-19.91zm.808 0l11.5 19.912-11.5-6.636V92.412zm.7-.4l11.492 6.636v13.274l-11.492-19.91zm11.9-8.142l11.5 6.633h-22.99l11.49-6.633zm.4-.7V70.865l10.655 18.454-10.655-6.149zm0-17.256v-12.3l10.658-6.158-10.658 18.458zm-11.9-20.439l11.493-6.636 11.5 6.633-22.993.003zm-1.508-15.07L94.19 24.248h21.332l-10.669 6.157zM67.361 22.97l11.492-6.635 11.5 6.633-22.992.002zM65.853 7.9L55.19 1.744h21.332L65.853 7.9zm-13 8.436l11.5 6.636h-23l11.5-6.636zM26.847 30.403l-10.663-6.157h21.332l-10.669 6.157zm-13 8.435l10.05 5.8 1.45.838h-23l11.5-6.638zm-.4 14.777v12.3L2.792 47.46l10.655 6.155zm0 17.241v12.312L2.791 89.323l10.656-18.467zm11.9 20.448l-8.686 5.019-2.812 1.623-11.5-6.637 22.998-.005zm1.5 15.074l10.661 6.151h-21.31l10.65-6.151zm37.5 7.422l-8.77 5.066-2.726 1.574-11.5-6.638 22.996-.002zm1.5 15.074l10.661 6.151h-21.31l10.65-6.151zm13-8.433l-11.5-6.641h23l-11.5 6.641zm25.987-14.063l10.661 6.151h-21.31l10.649-6.151zm13-8.433l-11.5-6.641h23l-11.5 6.641zm11.061-53.656l-10.658-6.149v-12.3l10.658 18.449zm-38.989-22.5L79.25 15.64V3.334l10.657 18.455zM52.453 3.323v12.312l-10.662 6.158 10.662-18.47zm-39.005 22.5v12.311L2.786 44.29l10.662-18.467zM2.798 92.484l10.654 6.152v12.3L2.797 92.484zm39 22.5l10.654 6.151v12.3l-10.655-18.451zm37.46 18.449v-12.3l10.657-6.158-10.658 18.458zm38.987-22.5v-12.3l10.658-6.158-10.658 18.458z"
                                fill="#0000ff"
                                opacity="0.2"
                            />
                        </pattern>
                    </defs>
                </svg>
                <svg
                    width={'100%'}
                    height={'100%'}
                    viewBox="0 0 1439 788"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"

                >
                    <path
                        d="M1282.01 1.196c-71.67 7.749-74.64 72.617-74.64 72.617s-74.98-26.2-89.58 46.848c0 0-64.45-41.536-134.645-4.343-70.192 37.193-44.732 123.012-44.732 123.012s-136.694 13.512-145.321 142.525c0 0-65.195 17.658-70.375 56.606 0 0-178.4-45.6-276.894 105.616 0 0-35.407-20-89.85 6.6 0 0-47.556-77.09-146.882-51.849 0 0-41.7-116.97-209.091-65.44v166.49a44.52 44.52 0 014.351-.21h378.385c20.218 0 36.608 13.429 36.608 29.99s-16.39 29.989-36.608 29.989H279.724a29.994 29.994 0 00-21.509 8.622 30.016 30.016 0 00-6.622 9.788 30.01 30.01 0 000 23.173 30.016 30.016 0 0016.511 16.26 29.994 29.994 0 0011.62 2.15h58.083a29.994 29.994 0 110 59.987H53.735a29.877 29.877 0 00-20.689 8.278H1439v-99.681H913.046a30 30 0 010-59.993h117.614c7.95 0 15.58-3.159 21.2-8.783a29.968 29.968 0 000-42.408 29.975 29.975 0 00-21.2-8.783H717.696a30 30 0 010-59.992h538.954a29.986 29.986 0 0020.89-8.957 30.006 30.006 0 008.62-21.039c0-7.872-3.1-15.428-8.62-21.039a29.986 29.986 0 00-20.89-8.957h-103.37c-20.23 0-36.62-13.425-36.62-29.99 0-16.565 16.39-29.986 36.62-29.986H1439V17.552a49.215 49.215 0 00-23.93-7.151c-40.37-1.437-42.35 15.473-42.35 15.473S1357.53.001 1303.2 0c-7.08.02-14.15.42-21.19 1.2"
                        fill="url(#backgroundPattern)" // Apply the pattern to the cloud shape
                    />
                </svg>
            </div>
            <div className="container mx-auto px-4 py-8 w-full">

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
                        <div className="flex items-center gap-4">
                            <div className="bg-white dark:bg-gray-700 p-1 rounded-md shadow-sm overflow-hidden flex items-center justify-center h-12 w-20">
                                <Image
                                    src={flagImages[country.title] || defaultFlag}
                                    alt={`Flag of ${country.title}`}
                                    width={80}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold">
                                {displayTitle}
                            </h1>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {country.content.map(({ mini_title, text }, idx) => (
                            <section key={idx} className="mb-8 last:mb-0">
                                {mini_title && (
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <h2 className="text-xl font-semibold">{mini_title}</h2>
                                    </div>
                                )}
                                <p className="leading-relaxed text-gray-700 dark:text-gray-300">{text}</p>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full z-[-1]">
                <svg
                    width={'100%'}
                    height={'100%'}
                    viewBox="0 0 1439 788"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"

                > <path
                        d="M1282.01 1.196c-71.67 7.749-74.64 72.617-74.64 72.617s-74.98-26.2-89.58 46.848c0 0-64.45-41.536-134.645-4.343-70.192 37.193-44.732 123.012-44.732 123.012s-136.694 13.512-145.321 142.525c0 0-65.195 17.658-70.375 56.606 0 0-178.4-45.6-276.894 105.616 0 0-35.407-20-89.85 6.6 0 0-47.556-77.09-146.882-51.849 0 0-41.7-116.97-209.091-65.44v166.49a44.52 44.52 0 014.351-.21h378.385c20.218 0 36.608 13.429 36.608 29.99s-16.39 29.989-36.608 29.989H279.724a29.994 29.994 0 00-21.509 8.622 30.016 30.016 0 00-6.622 9.788 30.01 30.01 0 000 23.173 30.016 30.016 0 0016.511 16.26 29.994 29.994 0 0011.62 2.15h58.083a29.994 29.994 0 110 59.987H53.735a29.877 29.877 0 00-20.689 8.278H1439v-99.681H913.046a30 30 0 010-59.993h117.614c7.95 0 15.58-3.159 21.2-8.783a29.968 29.968 0 000-42.408 29.975 29.975 0 00-21.2-8.783H717.696a30 30 0 010-59.992h538.954a29.986 29.986 0 0020.89-8.957 30.006 30.006 0 008.62-21.039c0-7.872-3.1-15.428-8.62-21.039a29.986 29.986 0 00-20.89-8.957h-103.37c-20.23 0-36.62-13.425-36.62-29.99 0-16.565 16.39-29.986 36.62-29.986H1439V17.552a49.215 49.215 0 00-23.93-7.151c-40.37-1.437-42.35 15.473-42.35 15.473S1357.53.001 1303.2 0c-7.08.02-14.15.42-21.19 1.2"
                        fill="url(#backgroundPattern)" // Apply the pattern to the cloud shape
                    />
                </svg>
            </div>
        </div>
    )
}
