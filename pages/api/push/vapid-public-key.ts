import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      console.error('VAPID_PUBLIC_KEY not configured');
      return res.status(500).json({
        success: false,
        message: 'Push notifications not configured'
      });
    }

    res.status(200).json({
      success: true,
      publicKey
    });

  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
