import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'draft',
      public_id: () => uuidv4(), 
    },
  });
  
const upload = multer({storage: storage});

export default upload;