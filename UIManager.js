/**
 * UI管理模块
 * 负责处理用户界面交互和状态
 */
const UIManager = (function() {
    // 存储UI元素的对象
    const elements = {};
    
    // 文件列表
    let fileList = [];
    
    /**
     * 初始化UI管理器
     * @param {Object} config - 配置对象，包含UI元素引用
     */
    function init(config) {
        // 保存UI元素引用
        elements.dropZone = config.dropZone;
        elements.fileList = config.fileList;
        elements.importBtn = config.importBtn;
        elements.savePdfBtn = config.savePdfBtn;
        elements.fileInput = config.fileInput;
        elements.addButton = config.addButton;
        elements.openDirBtn = config.openDirBtn;
        elements.loadingIndicator = document.getElementById('loading-indicator');
        elements.loadingMessage = document.getElementById('loading-message');
        
        // 设置事件监听器
        setupEventListeners();
        
        console.log('UI管理器初始化完成');
    }
    
    /**
     * 设置事件监听器
     */
    function setupEventListeners() {
        // 导入按钮点击事件
        if (elements.importBtn) {
            elements.importBtn.addEventListener('click', () => {
                if (elements.fileInput) {
                    elements.fileInput.click();
                }
            });
        }
        
        // 添加按钮点击事件
        if (elements.addButton) {
            elements.addButton.addEventListener('click', () => {
                if (elements.fileInput) {
                    elements.fileInput.click();
                }
            });
        }
        
        // 打开保存目录按钮点击事件
        if (elements.openDirBtn) {
            elements.openDirBtn.addEventListener('click', openSaveDirectory);
        }
    }
    
    /**
     * 打开保存目录
     */
    function openSaveDirectory() {
        try {
            if (typeof nw !== 'undefined') {
                // 尝试从本地存储获取上次保存目录
                let savePath = "";
                try {
                    savePath = localStorage.getItem('lastSavePath') || "";
                } catch (e) {
                    console.warn('无法读取上次保存路径', e);
                }
                
                // 如果有保存路径，则打开目录
                if (savePath) {
                    nw.Shell.openItem(savePath);
                } else {
                    alert('尚未设置保存目录，请先生成一个PDF文件');
                }
            } else {
                alert('此功能在当前环境下不可用');
            }
        } catch (error) {
            console.error('打开保存目录失败:', error);
            alert('无法打开保存目录');
        }
    }
    
    /**
     * 添加文件到列表
     * @param {Array} files - 文件对象数组
     */
    function addFiles(files) {
        if (!files || !files.length) return;
        
        files.forEach(file => {
            // 创建文件预览
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.fileName = file.name;
            
            // 文件预览区域
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            
            // 预览图像
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src); // 释放对象URL
            };
            previewContainer.appendChild(img);
            
            // 文件名
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            // 操作区域
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'file-actions';
            
            // 删除按钮
            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove';
            removeBtn.textContent = '删除';
            removeBtn.onclick = () => {
                removeFile(file.name);
                fileItem.remove();
            };
            actionsContainer.appendChild(removeBtn);
            
            // 将元素添加到文件项
            fileItem.appendChild(previewContainer);
            fileItem.appendChild(fileName);
            fileItem.appendChild(actionsContainer);
            
            // 添加到文件列表
            elements.fileList.appendChild(fileItem);
            
            // 添加到内部文件列表
            fileList.push({
                name: file.name,
                file: file
            });
        });
        
        // 更新按钮状态
        updateButtonStates();
    }
    
    /**
     * 从列表中移除文件
     * @param {string} fileName - 文件名
     */
    function removeFile(fileName) {
        // 从内部列表移除
        fileList = fileList.filter(item => item.name !== fileName);
        
        // 更新按钮状态
        updateButtonStates();
    }
    
    /**
     * 清空文件列表
     */
    function clearFiles() {
        // 清空UI
        if (elements.fileList) {
            elements.fileList.innerHTML = '';
        }
        
        // 清空内部列表
        fileList = [];
        
        // 更新按钮状态
        updateButtonStates();
    }
    
    /**
     * 更新按钮状态
     */
    function updateButtonStates() {
        if (elements.savePdfBtn) {
            elements.savePdfBtn.disabled = fileList.length === 0;
        }
    }
    
    /**
     * 设置加载状态
     * @param {boolean} isLoading - 是否正在加载
     * @param {string} message - 加载消息
     */
    function setLoading(isLoading, message = '处理中...') {
        if (elements.loadingIndicator) {
            elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
        
        if (elements.loadingMessage && message) {
            elements.loadingMessage.textContent = message;
        }
    }
    
    // 返回公共API
    return {
        init: init,
        addFiles: addFiles,
        removeFile: removeFile,
        clearFiles: clearFiles,
        setLoading: setLoading,
        getFileList: function() {
            return fileList;
        }
    };
})();