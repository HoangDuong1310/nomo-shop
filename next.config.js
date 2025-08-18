/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Thêm các domain thực tế để Next/Image không chặn ảnh
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'nomoshop.app',
      'www.nomoshop.app',
      // IP server (phòng trường hợp dữ liệu cũ lưu absolute URL dạng http://IP/uploads/..)
      '14.225.206.162'
    ],
  },
  // Cho phép standalone nếu cần deploy tối ưu (có thể bật sau)
  // output: 'standalone'
}

module.exports = nextConfig;