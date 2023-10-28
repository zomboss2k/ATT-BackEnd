const express = require("express");
const cloudinary = require("cloudinary");
const router = express.Router();
const fs = require("fs");

// Thiết lập cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/upload", async (req, res) => {
  const type = req.body.type;
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ msg: "No files were uploaded." });
    }
    const files = req.files;
    if (Object.keys(files).length === 1) {
      const file = files.file;
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ msg: "Size too large" });
      }
      if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
        return res.status(400).json({ msg: "File format is incorrect." });
      }
      const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: `ATT/Avatar`,
      });
      await removeTmp(file.tempFilePath);

      return res.json({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } else {
      const imageProduct = [];
      for (const key in files) {
        if (Object.prototype.hasOwnProperty.call(files, key)) {
          const file = files[key];
          if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ msg: "Size too large" });
          }
          if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
            return res.status(400).json({ msg: "File format is incorrect." });
          }
          const result = await cloudinary.v2.uploader.upload(
            file.tempFilePath,
            {
              folder: `ATT/${type}`,
            }
          );
          await removeTmp(file.tempFilePath);
          imageProduct.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
      }
      // console.log({ imageProduct });

      return res.json({ imageProduct });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

// Router xóa ảnh
router.delete("/delete-image/:public_id", async (req, res) => {
  const public_id = req.params.public_id; // Lấy public_id từ đường dẫn
  console.log(public_id);

  try {
    const result = await cloudinary.v2.uploader.destroy(public_id);
    console.log(result);
    if (result.result === "ok") {
      // Xóa ảnh thành công, bạn có thể xóa thông tin ảnh khỏi cơ sở dữ liệu của bạn ở đây
      return res.status(200).json({ msg: "Xóa ảnh thành công" });
    } else {
      return res.status(400).json({ msg: "Lỗi khi xóa ảnh" });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};

module.exports = router;
