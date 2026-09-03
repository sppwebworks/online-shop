import { uploadApi } from "../api/uploadApi";

export const uploadService = {
  uploadImage: (file) => uploadApi.uploadImage(file),
};
