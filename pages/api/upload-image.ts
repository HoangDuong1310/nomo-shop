import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
      }

      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        // Generate unique filename
        const fileExtension = path.extname(file.originalFilename || '');
        const fileName = `${uuidv4()}${fileExtension}`;
        const newPath = path.join(uploadDir, fileName);

        // Move file to final location
        await fs.rename(file.filepath, newPath);

        // Return the URL path
        const imageUrl = `/uploads/${fileName}`;
        
        res.status(200).json({ 
          success: true, 
          imageUrl,
          message: 'File uploaded successfully' 
        });

      } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ error: 'File processing failed' });
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
