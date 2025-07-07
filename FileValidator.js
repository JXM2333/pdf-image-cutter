/**
 * 文件验证模块
 * 用于验证文件类型和大小
 */
const FileValidator = (function() {
    // 支持的图像类型
    const SUPPORTED_IMAGE_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/tiff'
    ];
    
    // 最大文件大小（20MB）
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    
    /**
     * 检查文件是否为有效图片
     * @param {File} file - 要验证的文件对象
     * @returns {boolean} 是否为有效图片
     */
    function isValidImage(file) {
        // 检查文件类型
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            console.warn(`不支持的文件类型: ${file.type}`);
            return false;
        }
        
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`文件过大: ${file.name}, 大小: ${file.size} 字节`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 检查文件名是否有效
     * @param {string} fileName - 文件名
     * @returns {boolean} 文件名是否有效
     */
    function isValidFileName(fileName) {
        // 检查文件名是否为空
        if (!fileName || fileName.trim() === '') {
            return false;
        }
        
        // 检查文件名长度
        if (fileName.length > 255) {
            return false;
        }
        
        // 检查是否包含无效字符
        const invalidChars = /[\\/:*?"<>|]/g;
        if (invalidChars.test(fileName)) {
            return false;
        }
        
        return true;
    }
    
    // 返回公共API
    return {
        isValidImage: isValidImage,
        isValidFileName: isValidFileName,
        SUPPORTED_IMAGE_TYPES: SUPPORTED_IMAGE_TYPES,
        MAX_FILE_SIZE: MAX_FILE_SIZE
    };
})();