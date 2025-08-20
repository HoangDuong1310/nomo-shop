import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    // Kiểm tra thư mục uploads
    let uploadsExists = false;
    let fileCount = 0;
    try {
      const files = await fs.readdir(uploadsDir);
      uploadsExists = true;
      fileCount = files.filter(f => !f.startsWith('.')).length;
    } catch (error) {
      uploadsExists = false;
    }

    // Kiểm tra quyền truy cập
    let canWrite = false;
    try {
      await fs.access(uploadsDir, fs.constants.W_OK);
      canWrite = true;
    } catch (error) {
      canWrite = false;
    }

    // Kiểm tra dung lượng disk
    const stats = await fs.stat(uploadsDir).catch(() => null);
    
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {
        uploadsDirectory: {
          exists: uploadsExists,
          writable: canWrite,
          fileCount: fileCount,
          imageFiles: 0,
          latestFiles: [] as string[]
        },
        nextjs: {
          version: process.version,
          env: process.env.NODE_ENV,
          uptime: process.uptime()
        },
        system: {
          memory: process.memoryUsage(),
          platform: process.platform
        }
      }
    };

    // Test một file upload mẫu
    if (uploadsExists) {
      try {
        const testFiles = await fs.readdir(uploadsDir);
        const imageFiles = testFiles.filter(f => 
          f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.gif') || f.endsWith('.webp')
        );
        
        healthCheck.checks.uploadsDirectory.imageFiles = imageFiles.length;
        healthCheck.checks.uploadsDirectory.latestFiles = imageFiles.slice(-3);
      } catch (error) {
        console.error('Error reading image files:', error);
      }
    }

    res.status(200).json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
}
