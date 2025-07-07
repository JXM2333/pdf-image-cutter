/**
 * 图像处理模块
 * 负责图片分割和保存处理
 */
const ImageProcessor = (function() {
    // A4比例 (210:297)
    const A4_RATIO = 210 / 297;
    
    /**
     * 获取图像数据
     * @param {File} file - 图片文件
     * @returns {Promise<Image>} 加载好的图像对象
     */
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
            img.src = URL.createObjectURL(file);
        });
    }
    
    /**
     * 按A4比例分割图片
     * @param {Image} img - 图片对象
     * @returns {Array} 分割后的图片数据对象数组
     */
    function sliceImageByA4Ratio(img) {
        // 创建画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 获取图片宽高
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        // 使用图片的宽度来计算切片尺寸，保持A4比例
        const sliceWidth = imgWidth;
        const sliceHeight = sliceWidth / A4_RATIO;
        
        // 计算需要多少行来切片（向上取整）
        const rows = Math.ceil(imgHeight / sliceHeight);
        
        console.log(`图片尺寸: ${imgWidth}x${imgHeight}, 切片尺寸: ${sliceWidth}x${sliceHeight}, 行数: ${rows}`);
        
        // 切片结果数组
        const slices = [];
        
        // 设置画布尺寸为切片尺寸
        canvas.width = sliceWidth;
        canvas.height = sliceHeight;
        
        // 从上到下切片
        for (let r = 0; r < rows; r++) {
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制当前切片
            ctx.drawImage(
                img,
                0, r * sliceHeight,  // 源图像起始坐标
                sliceWidth, sliceHeight,  // 源图像尺寸
                0, 0,  // 目标位置
                sliceWidth, sliceHeight  // 目标尺寸
            );
            
            // 保存切片数据
            slices.push({
                dataUrl: canvas.toDataURL('image/png'),
                row: r + 1,
                width: sliceWidth,
                height: sliceHeight
            });
        }
        
        return slices;
    }
    
    /**
     * 保存切片
     * @param {Array} slices - 切片数据数组
     * @param {string} originalFileName - 原始文件名
     * @returns {Promise} 保存完成的Promise
     */
    function saveSlices(slices, originalFileName) {
        return new Promise((resolve, reject) => {
            try {
                // 提取不带扩展名的文件名
                const baseName = originalFileName.replace(/\.[^/.]+$/, "");
                
                // 创建下载链接
                const downloadLinks = slices.map((slice, index) => {
                    const fileName = `${baseName}_s${(index + 1).toString().padStart(2, '0')}.png`;
                    return {
                        fileName: fileName,
                        url: slice.dataUrl
                    };
                });
                
                // 执行下载，每个文件间隔100ms，避免浏览器限制
                let downloadPromises = [];
                downloadLinks.forEach((link, index) => {
                    downloadPromises.push(
                        new Promise(resolve => {
                            setTimeout(() => {
                                downloadDataURL(link.url, link.fileName);
                                resolve();
                            }, index * 100);
                        })
                    );
                });
                
                // 所有下载完成后，解析Promise
                Promise.all(downloadPromises).then(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * 下载DataURL为文件
     * @param {string} dataUrl - 数据URL
     * @param {string} fileName - 文件名
     */
    function downloadDataURL(dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // 延迟移除链接元素
        setTimeout(() => {
            document.body.removeChild(link);
            // 释放URL对象
            URL.revokeObjectURL(link.href);
        }, 100);
    }
    
    // 返回公共API
    return {
        /**
         * 处理单个图片
         * @param {string|File} file - 图片文件或数据URL
         * @returns {Promise<string>} 处理后的图像数据URL
         */
        processImage: async function(file) {
            try {
                if (typeof file === 'string') {
                    // 如果已经是数据URL，直接返回
                    return file;
                }
                const img = await loadImage(file);
                // 简化处理，返回原始图像
                return URL.createObjectURL(file);
            } catch (error) {
                console.error('处理图片失败:', error);
                throw error;
            }
        },
        
        /**
         * 处理多个图片
         * @param {Array} fileList - 文件列表
         * @returns {Promise<Array>} 处理后的图像数据URL数组
         */
        processImages: async function(fileList) {
            try {
                const results = [];
                for (const fileObj of fileList) {
                    const processed = await this.processImage(fileObj.file || fileObj);
                    results.push(processed);
                }
                return results;
            } catch (error) {
                console.error('批量处理图片失败:', error);
                throw error;
            }
        },
        
        /**
         * 保存切片
         * @param {Array} slices - 切片数据数组
         * @param {string} originalFileName - 原始文件名
         * @returns {Promise} 保存完成的Promise
         */
        saveSlices: saveSlices
    };
})();