import multer from "multer";
import path from "path";

const imgStorage = multer.diskStorage({
    destination: path.join("../frontend/src/images/pets"),
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    },
});

export const uploadPetsImages = multer({
    storage: imgStorage,
    limits: { fileSize: 3000000 },
}).array("images")