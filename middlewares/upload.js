import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const employee_code = req.body.employee_code || Date.now(); // Use employee_code or Date.now as a fallback
        const filename = `${employee_code}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed!'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export default upload;
