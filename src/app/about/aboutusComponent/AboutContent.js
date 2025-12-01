import { Mail, Phone, Printer, MapPin, Clock, Globe, MessageCircle } from "lucide-react"
import Image from "next/image"

export default function AboutContent() {
  return (
    <div className="container mx-auto py-12 px-6 mt-5">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-12">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <Image
              className="object-contain"
              src="/aboutus.webp"
              alt="Real Motor Japan Modern Headquarters"
              width={404}
              height={390}
            />
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Company Profile</div>
            <h2 className="block mt-1 text-2xl leading-tight font-medium text-black">Real Motor Japan</h2>
            <p className="mt-2 text-gray-500">A division of Yanagisawa Automobile Sales Co., Ltd.</p>
            <p className="mt-2 text-gray-500">
              <strong>President:</strong> Morishita Kazuki
            </p>
            <p className="mt-2 text-gray-500">
              <strong>Established:</strong> 1979
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3"></div>
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-full mr-3">
                <Phone className="h-6 w-6 text-indigo-600" />
              </span>
              Contact Details
            </h3>

            <div className="space-y-6">
              {/* Phone Section */}
              <div className="group">
                <div className="flex items-center p-4 rounded-lg border border-gray-100 group-hover:border-indigo-200 transition-all duration-300 group-hover:bg-indigo-50">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                    <Phone className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone</p>
                    <p className="text-lg font-semibold text-gray-800">+81-565-85-0602</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Section - Added Here */}
              <div className="group">
                <a
                  href="https://wa.me/818035419928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 rounded-lg border border-gray-100 group-hover:border-indigo-200 transition-all duration-300 group-hover:bg-indigo-50"
                >
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                    <MessageCircle className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-500 font-medium">WhatsApp</p>
                    <p className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700">
                      +81-80-3541-9928
                    </p>
                  </div>
                </a>
              </div>

              <div className="group">
                <div className="flex items-center p-4 rounded-lg border border-gray-100 group-hover:border-indigo-200 transition-all duration-300 group-hover:bg-indigo-50">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                    <Printer className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Fax</p>
                    <p className="text-lg font-semibold text-gray-800">+81-565-85-0606</p>
                  </div>
                </div>
              </div>

              <div className="group">
                <a
                  href="mailto:info@realmotor.jp"
                  className="flex items-center p-4 rounded-lg border border-gray-100 group-hover:border-indigo-200 transition-all duration-300 group-hover:bg-indigo-50"
                >
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-lg font-semibold text-indigo-600 group-hover:text-indigo-700">
                      info@realmotor.jp
                    </p>
                  </div>
                </a>
              </div>

              <div className="group">
                <a
                  href="https://realmotor.jp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 rounded-lg border border-gray-100 group-hover:border-indigo-200 transition-all duration-300 group-hover:bg-indigo-50"
                >
                  <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-all duration-300">
                    <Globe className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Website</p>
                    <p className="text-lg font-semibold text-indigo-600 group-hover:text-indigo-700">realmotor.jp</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3"></div>
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-full mr-3">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </span>
              Location
            </h3>

            <div className="mb-6 p-4 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all duration-300 hover:bg-indigo-50">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Address</p>
                  <p className="text-lg font-semibold text-gray-800">
                    Nishihaiagari-5-2 Kamiokacho, Toyota, Aichi 473-0931
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Business Hours</p>
                  <p className="text-lg font-semibold text-gray-800">Monday - Friday: 9:00 AM - 6:00 PM JST</p>
                </div>
              </div>
            </div>

            <div className="h-[320px] relative rounded-lg overflow-hidden shadow-md">
              <iframe
                src={
                  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1632.936608114054!2d137.09699772767226!3d35.0599087490721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60049f743d9d0723%3A0x32785dd77ebf1094!2z5qCq5byP5Lya56S-44Ok44OK44Ku44K144Ov77yo77yk!5e0!3m2!1sen!2sjp!4v1746670892196!5m2!1sen!2sjp"
                }
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Real Motor Japan location map`}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">Our Mission</h2>
        <p className="text-lg text-center max-w-3xl mx-auto text-white">
          At Real Motor Japan, we are committed to providing high-quality automotive solutions to our customers
          worldwide. With our extensive experience and dedication to excellence, we strive to be your trusted partner in
          the automotive industry.
        </p>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">Our Team & Facilities</h2>
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2FIMG_8047.webp?alt=media&token=e84a35db-4d23-4ddb-99ec-6fa8de2588ea"
                alt="Premium Vehicle Selection at Real Motor Japan"
                fill
                style={{ objectFit: "cover" }}
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src={
                  "/showcase.webp"
                }
                alt="Detailed view of our luxury vehicles"
                fill
                style={{ objectFit: "cover" }}
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src={
                "https://firebasestorage.googleapis.com/v0/b/samplermj.appspot.com/o/assets%2F20240105%E5%88%9D%E9%A1%94%E5%90%88%E3%82%8F%E3%81%9B%E3%83%BC%EF%BC%91%20(1).webp?alt=media&token=1508ddf1-eb86-45bb-a4fe-1ced2bed9415"
              }
              alt="The Real Motor Japan Team"
              fill
              style={{ objectFit: "cover" }}
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  )
}