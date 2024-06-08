import multer from "multer";
import path from "path";

const profileStorage = multer.diskStorage({
    destination: path.join("../frontend/src/images/profiles"),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

export const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 3000000 },
}).single("myImage");
