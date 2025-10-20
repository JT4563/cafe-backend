
import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import UploadController from '../controllers/upload.controller';

const upload = multer({ dest: '/tmp/uploads' });
const router = Router();

router.post('/bulk', authMiddleware, upload.single('file'), UploadController.bulkUpload);

export default router;
