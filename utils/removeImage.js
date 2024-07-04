import fs from 'fs'
import path from "path"

export const removeImg = (imgPath) => {
    if (imgPath) {
        fs.unlink(imgPath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    }
}