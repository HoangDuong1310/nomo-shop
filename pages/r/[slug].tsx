import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React from 'react';
import { getRedirectBySlug, incrementHit } from '../../lib/qr-redirects';

interface Props { slug: string; notFound?: boolean; inactive?: boolean; }

const RedirectFallback: React.FC<Props> = ({ slug, notFound, inactive }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Head><title>Liên kết tạm thời không khả dụng</title></Head>
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-4 text-gray-800">Liên kết không khả dụng</h1>
        {notFound && <p className="text-gray-600">Không tìm thấy slug: <strong>{slug}</strong>.</p>}
        {inactive && <p className="text-gray-600">Liên kết <strong>{slug}</strong> hiện đang bị tắt.</p>}
        <p className="mt-4 text-sm text-gray-500">Vui lòng liên hệ hỗ trợ nếu bạn nghĩ đây là lỗi.</p>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const slug = String(ctx.params?.slug || '').toLowerCase();
  // Bỏ qua cache để trạng thái bật/tắt phản hồi ngay lập tức
  const record = await getRedirectBySlug(slug, false);
  if (!record) {
    return { props: { slug, notFound: true } };
  }
  if (!record.is_active) {
    return { props: { slug, inactive: true } };
  }
  // increment hits (await to ensure accuracy; could be fire-and-forget)
  try { await incrementHit(record.id); } catch (e) { /* silent */ }
  return {
    redirect: { destination: record.target_url, permanent: false }
  };
};

export default RedirectFallback;
