/**
 * PDF生成器模块 - 将图片转换为A4比例PDF文件
 * 完美裁剪模式：确保无白边、黑边，且不拉伸变形
 */

// 创建PDFGenerator单例对象
const PDFGenerator = (function() {
    // A4尺寸（毫米）
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    // A4纸比例
    const A4_RATIO = A4_HEIGHT / A4_WIDTH;
    
    // 保存上次选择的保存路径
    let lastSavePath = '';

    /**
     * 加载图像
     * @param {string} imagePath - 图像路径
     * @returns {Promise<HTMLImageElement>} - 加载好的图像元素
     */
    function loadImage(imagePath) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = (error) => reject(new Error(`加载图像失败: ${imagePath}, 错误: ${error.message}`));
            image.src = imagePath;
        });
    }

    /**
     * 将图像切割成多个A4比例的页面
     * @param {HTMLImageElement} image - 图像元素
     * @returns {Array} - 切割后的图像信息数组
     */
    function sliceIntoPages(image) {
        // 创建临时Canvas用于处理图像
        const imgWidth = image.width;
        const imgHeight = image.height;
        
        // 计算A4页面在原图上的等效宽度
        let pageWidth = imgWidth;
        let pageHeight = pageWidth * A4_RATIO;
        
        // 如果图片太宽，需调整为合适的宽度
        if (imgWidth / imgHeight > 4) { // 防止过宽的图片导致页面太窄
            pageWidth = imgHeight / 2;
            pageHeight = pageWidth * A4_RATIO;
        }
        
        // 计算需要多少页来容纳整个图像
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        console.log(`图片尺寸: ${imgWidth}x${imgHeight}, 页面尺寸: ${pageWidth}x${pageHeight}, 总页数: ${totalPages}`);
        
        const pages = [];
        
        // 切割图像为多个A4页面
        for (let i = 0; i < totalPages; i++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = pageWidth;
            canvas.height = pageHeight;
            
            // 填充白色背景
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, pageWidth, pageHeight);
            
            // 计算当前页在原图中的位置
            const sourceY = i * pageHeight;
            // 计算当前页应绘制的高度，最后一页可能不足一页高
            const currentHeight = Math.min(pageHeight, imgHeight - sourceY);
            
            // 绘制图像到Canvas
            if (currentHeight > 0) {
                ctx.drawImage(
                    image,
                    0, sourceY, pageWidth, currentHeight, // 源图像区域
                    0, 0, pageWidth, currentHeight // 目标区域
                );
            }
            
            pages.push({
                canvas: canvas,
                width: pageWidth,
                height: pageHeight,
                dataUrl: canvas.toDataURL('image/jpeg', 1.0) // 最高质量
            });
        }
        
        return pages;
    }
    
    /**
     * 为单个图像创建PDF文件
     * @param {string} imagePath - 图像路径
     * @returns {Promise<Blob>} - 生成的PDF Blob对象
     */
    async function createSingleImagePDF(imagePath) {
        try {
            // 创建新的PDF文档 - 从全局变量访问jsPDF
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });
            
            // 是否是第一页标志
            let isFirstPage = true;
            
            // 加载图像
            const image = await loadImage(imagePath);
            
            // 将图像切割为多个A4页面
            const pages = sliceIntoPages(image);
            
            // 将每个切割后的页面添加到PDF
            for (const page of pages) {
                // 如果不是第一页，添加新页
                if (!isFirstPage) {
                    pdf.addPage();
                }
                
                // 将页面添加到PDF，完全填充页面（无边距）
                pdf.addImage(
                    page.dataUrl,
                    'JPEG',
                    0, // x = 0，无左边距
                    0, // y = 0，无上边距
                    A4_WIDTH, // 使用A4宽度
                    A4_HEIGHT // 使用A4高度
                );
                
                isFirstPage = false;
            }
            
            // 生成PDF Blob对象
            const pdfBlob = pdf.output('blob');
            console.log('单图PDF生成完成');
            return pdfBlob;
            
        } catch (error) {
            console.error('创建PDF时出错:', error);
            throw error;
        }
    }
    
    /**
     * 选择保存目录 - 使用NW.js原生对话框
     * @returns {Promise<string>} 所选目录路径，如果取消则返回空
     */
    function chooseSaveDirectory() {
        return new Promise((resolve) => {
            try {
                if (typeof nw !== 'undefined') {
                    // 初始路径，尝试使用上次保存的路径
                    let initialPath = "";
                    
                    // 从localStorage读取上次保存路径
                    try {
                        const savedPath = localStorage.getItem('lastSavePath');
                        if (savedPath) {
                            initialPath = savedPath;
                        }
                    } catch (e) {
                        console.warn('无法读取上次保存路径', e);
                    }
                    
                    // 使用NW.js的选择文件夹对话框
                    const chooser = document.createElement('input');
                    chooser.type = 'file';
                    chooser.nwdirectory = true; // 指定为选择目录
                    
                    if (initialPath) {
                        chooser.nwworkingdir = initialPath;
                    }
                    
                    chooser.addEventListener('change', function() {
                        if (this.value) {
                            // 保存选择的路径
                            lastSavePath = this.value;
                            try {
                                localStorage.setItem('lastSavePath', this.value);
                            } catch (e) {
                                console.warn('无法保存路径到localStorage', e);
                            }
                            resolve(this.value);
                        } else {
                            resolve('');
                        }
                    });
                    
                    // 取消选择时
                    chooser.addEventListener('cancel', function() {
                        resolve('');
                    });
                    
                    // 模拟点击触发选择对话框
                    chooser.click();
                } else {
                    // 如果不在NW.js环境中，使用当前目录
                    resolve('./');
                }
            } catch (e) {
                console.error('选择目录出错:', e);
                resolve('');
            }
        });
    }
    
    /**
     * 从文件对象中提取基本名称（无扩展名）
     * @param {Object} file - 文件对象
     * @returns {string} 文件基本名称
     */
    function extractBaseName(file) {
        let filename = '';
        if (typeof file === 'string') {
            // 如果是字符串路径，直接处理
            const parts = file.split(/[\\/]/);
            filename = parts[parts.length - 1];
        } else if (file && file.name) {
            // 如果是文件对象，获取名称
            filename = file.name;
        } else if (file && file.file && file.file.name) {
            // 如果是包装的文件对象
            filename = file.file.name;
        }
        
        // 移除扩展名
        return filename.replace(/\.[^/.]+$/, "");
    }
    
    /**
     * 生成PDF文件
     * @param {Array} files - 文件列表
     * @returns {Promise<Array>} 生成的PDF文件路径数组
     */
    async function generatePDF(files) {
        if (!files || files.length === 0) {
            throw new Error('没有可处理的文件');
        }
        
        // 选择保存目录
        const savePath = await chooseSaveDirectory();
        if (!savePath) {
            throw new Error('未选择保存目录');
        }
        
        // 创建每个文件的PDF
        const pdfPaths = [];
        
        for (const fileObj of files) {
            try {
                // 获取文件路径
                let filePath;
                if (fileObj.file) {
                    // 如果是UI添加的文件对象
                    filePath = URL.createObjectURL(fileObj.file);
                } else if (typeof fileObj === 'string') {
                    // 如果是字符串路径
                    filePath = fileObj;
                } else {
                    // 直接是文件对象
                    filePath = URL.createObjectURL(fileObj);
                }
                
                // 生成PDF
                const pdfBlob = await createSingleImagePDF(filePath);
                
                // 获取文件名（无扩展名）
                const baseName = extractBaseName(fileObj);
                
                // 创建保存路径
                const pdfPath = `${savePath}/${baseName}.pdf`;
                
                // 保存文件 - 使用NW.js的文件系统API
                if (typeof nw !== 'undefined') {
                    const fs = nw.require('fs');
                    
                    // 将Blob转换为Buffer
                    const arrayBuffer = await pdfBlob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    
                    // 写入文件
                    fs.writeFileSync(pdfPath, buffer);
                    
                    // 添加到路径列表
                    pdfPaths.push(pdfPath);
                } else {
                    // 浏览器环境下使用下载链接
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(pdfBlob);
                    link.download = `${baseName}.pdf`;
                    link.click();
                    
                    // 添加到路径列表
                    pdfPaths.push(link.download);
                    
                    // 释放URL
                    setTimeout(() => URL.revokeObjectURL(link.href), 100);
                }
                
                // 如果使用了URL.createObjectURL，释放
                if (fileObj.file || typeof fileObj !== 'string') {
                    URL.revokeObjectURL(filePath);
                }
                
            } catch (error) {
                console.error(`处理文件时出错:`, error);
                // 继续处理其他文件
            }
        }
        
        return pdfPaths;
    }
    
    /**
     * 获取上次保存路径
     * @returns {string} 上次保存路径
     */
    function getSavePath() {
        if (lastSavePath) {
            return lastSavePath;
        }
        
        try {
            return localStorage.getItem('lastSavePath') || '';
        } catch (e) {
            return '';
        }
    }
    
    // 返回公共API
    return {
        generatePDF: generatePDF,
        getSavePath: getSavePath
    };
})();