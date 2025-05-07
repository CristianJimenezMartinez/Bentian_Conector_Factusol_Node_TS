import express from 'express';
import { createUser, loginUser, updateUser } from '../controllers/users/usersController';

const router = express.Router();

router.post('/createUser', createUser);
router.post('/login', loginUser);
router.put('/updateUser', updateUser);

export default router;
