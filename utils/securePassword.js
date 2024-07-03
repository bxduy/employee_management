import bcryptjs from 'bcryptjs';

export const securepassword = async (password) => {
    const password_hash = await bcryptjs.hash(password, 10)
    return password_hash;
}