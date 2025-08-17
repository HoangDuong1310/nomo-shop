import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '../components/Layout';
import { FaCheckCircle, FaCoffee, FaUsers, FaTrophy, FaMapMarkerAlt } from 'react-icons/fa';

const About: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Giới thiệu - Cloud Shop</title>
        <meta name="description" content="Giới thiệu về Cloud Shop - Dịch vụ đặt món trực tuyến qua mã QR" />
      </Head>

      <main>
        {/* Hero Section */}
        <section className="relative bg-primary-700 text-white py-24">
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Về Cloud Shop
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Chuyên cung cấp các món ăn và thức uống chất lượng cao, 
                đặt món dễ dàng thông qua công nghệ quét mã QR hiện đại.
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image 
                  src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56" 
                  alt="Câu chuyện của Cloud Shop" 
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-6">Câu chuyện của chúng tôi</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Cloud Shop được thành lập vào năm 2023, với ý tưởng đơn giản là cung cấp những món ăn và thức uống 
                    chất lượng cao kết hợp với công nghệ đặt hàng hiện đại thông qua mã QR.
                  </p>
                  <p>
                    Chúng tôi tin rằng trải nghiệm đặt món nên đơn giản, nhanh chóng và tiện lợi. Đó là lý do chúng tôi 
                    phát triển hệ thống cho phép khách hàng chỉ cần quét mã QR để xem thực đơn, đặt món và thanh toán 
                    một cách dễ dàng.
                  </p>
                  <p>
                    Với đội ngũ đầu bếp chuyên nghiệp và nhân viên tận tâm, chúng tôi cam kết mang đến cho khách hàng 
                    không chỉ những món ăn ngon mà còn là trải nghiệm dịch vụ tuyệt vời từ lúc đặt hàng đến khi nhận món.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Giá trị cốt lõi</h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Những giá trị mà chúng tôi luôn đặt lên hàng đầu trong quá trình phục vụ khách hàng
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                  <FaCoffee className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Chất lượng</h3>
                <p className="text-gray-600">
                  Chúng tôi cam kết sử dụng nguyên liệu tươi ngon nhất để tạo ra những món ăn và đồ uống hoàn hảo.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                  <FaUsers className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Khách hàng</h3>
                <p className="text-gray-600">
                  Khách hàng luôn là trọng tâm, chúng tôi lắng nghe và không ngừng cải thiện để đáp ứng mong muốn của bạn.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                  <FaMapMarkerAlt className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Địa phương</h3>
                <p className="text-gray-600">
                  Chúng tôi tự hào sử dụng nhiều nguyên liệu được sản xuất tại địa phương để hỗ trợ cộng đồng.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                  <FaTrophy className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sự hài lòng</h3>
                <p className="text-gray-600">
                  Sự hài lòng của khách hàng là thước đo thành công của chúng tôi, chúng tôi luôn cố gắng vượt qua mong đợi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Tại sao chọn Cloud Shop?</h2>
                
                <div className="space-y-6">
                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <FaCheckCircle className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold mb-2">Đặt hàng dễ dàng qua mã QR</h3>
                      <p className="text-gray-600">
                        Chỉ cần quét mã QR, bạn có thể truy cập vào thực đơn đầy đủ và đặt món một cách nhanh chóng, 
                        không cần tải ứng dụng hay đăng ký tài khoản.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <FaCheckCircle className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold mb-2">Free ship trong bán kính 3km</h3>
                      <p className="text-gray-600">
                        Chúng tôi miễn phí giao hàng trong bán kính 3km, giúp bạn tiết kiệm chi phí khi đặt món.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 mt-1">
                      <FaCheckCircle className="text-primary-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold mb-2">Nhiều phương thức thanh toán</h3>
                      <p className="text-gray-600">
                        Chúng tôi hỗ trợ nhiều phương thức thanh toán khác nhau, bao gồm thanh toán khi nhận hàng (COD) 
                        và thanh toán trực tuyến qua VNPay.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image 
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24" 
                  alt="Đặt món qua mã QR" 
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Đội ngũ của chúng tôi</h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Những con người đầy nhiệt huyết và sáng tạo đứng sau Cloud Shop
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-80">
                  <Image 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a" 
                    alt="Nguyễn Văn A" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">Nguyễn Văn A</h3>
                  <p className="text-primary-600 mb-4">CEO & Founder</p>
                  <p className="text-gray-600">
                    Với hơn 10 năm kinh nghiệm trong ngành F&B, anh A là người đặt nền móng và định hướng phát triển cho Cloud Shop.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-80">
                  <Image 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330" 
                    alt="Trần Thị B" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">Trần Thị B</h3>
                  <p className="text-primary-600 mb-4">Head Chef</p>
                  <p className="text-gray-600">
                    Chị B là đầu bếp chính với kinh nghiệm làm việc tại nhiều nhà hàng nổi tiếng, chịu trách nhiệm về chất lượng món ăn.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-80">
                  <Image 
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7" 
                    alt="Lê Văn C" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold">Lê Văn C</h3>
                  <p className="text-primary-600 mb-4">CTO</p>
                  <p className="text-gray-600">
                    Anh C là người phụ trách phát triển công nghệ, đặc biệt là hệ thống đặt món qua mã QR của Cloud Shop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default About; 