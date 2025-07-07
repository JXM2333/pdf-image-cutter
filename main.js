/**
 * 主程序入口 - 截图转PDF工具
 */
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const addButton = document.getElementById('addButton');
    const importBtn = document.getElementById('importBtn');
    const savePdfBtn = document.getElementById('savePdfBtn');
    const fileListElement = document.getElementById('fileList');
    const openDirBtn = document.getElementById('openDirBtn');
    
    // 初始化UI管理器
    UIManager.init({
        dropZone: dropZone,
        fileList: fileListElement,
        importBtn: importBtn,
        savePdfBtn: savePdfBtn,
        fileInput: fileInput,
        addButton: addButton,
        openDirBtn: openDirBtn
    });
    
    // 初始化拖放处理
    DragDropHandler.init(dropZone, (files) => {
        handleFiles(files);
    });
    
    // 文件处理函数
    function handleFiles(files) {
        // 显示加载状态
        UIManager.setLoading(true, '处理图片中...');
        
        // 过滤并验证文件
        const validFiles = Array.from(files).filter(file => {
            return FileValidator.isValidImage(file);
        });
        
        if (validFiles.length === 0) {
            UIManager.setLoading(false);
            alert('请选择有效的图片文件！');
            return;
        }
        
        // 处理图片文件
        Promise.all(validFiles.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        name: file.name,
                        data: e.target.result,
                        file: file
                    });
                };
                reader.readAsDataURL(file);
            });
        }))
        .then(imageFiles => {
            // 添加到UI
            imageFiles.forEach(imageFile => {
                UIManager.addFiles([imageFile.file]);
            });
            UIManager.setLoading(false);
        })
        .catch(error => {
            console.error('处理文件时出错:', error);
            UIManager.setLoading(false);
            alert('处理图片时出错，请重试！');
        });
    }
    
    // 监听文件选择变化
    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            handleFiles(event.target.files);
            // 重置文件输入，确保可以再次选择相同文件
            event.target.value = '';
        }
    });
    
    // 保存PDF按钮点击事件
    savePdfBtn.addEventListener('click', () => {
        const files = UIManager.getFileList ? UIManager.getFileList() : [];
        if (files.length === 0) {
            alert('请先添加图片！');
            return;
        }
        
        UIManager.setLoading(true, '生成PDF中...');
        
        try {
            // 使用PDFGenerator生成PDF
            PDFGenerator.generatePDF(files)
                .then((result) => {
                    UIManager.setLoading(false);
                    
                    // PDF生成成功，清空文件列表
                    if (result && result.length > 0) {
                        // 显示成功提示
                        const fileCount = result.length;
                        alert(`成功生成 ${fileCount} 个PDF文件！`);
                        
                        // 清空文件列表
                        UIManager.clearFiles();
                    }
                })
                .catch(error => {
                    console.error('生成PDF时出错:', error);
                    UIManager.setLoading(false);
                    alert('生成PDF时出错，请重试！');
                });
        } catch (error) {
            console.error('调用PDF生成器时出错:', error);
            UIManager.setLoading(false);
            alert('PDF生成功能出错，请检查浏览器控制台');
        }
    });
    
    // 设置应用图标，确保在任务栏中显示
    if (typeof nw !== 'undefined') {
        var win = nw.Window.get();
        win.setShowInTaskbar(true);
        console.log("设置任务栏图标");
    }
});