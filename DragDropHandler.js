/**
 * 拖放处理模块
 * 处理文件拖放功能
 */
const DragDropHandler = (function() {
    // 回调函数
    let filesCallback = null;
    // 拖放区域元素
    let dropZoneElement = null;
    
    /**
     * 初始化拖放处理
     * @param {HTMLElement} dropZone - 拖放区域元素
     * @param {Function} onFilesDropped - 文件拖放后的回调函数
     */
    function init(dropZone, onFilesDropped) {
        if (!dropZone) {
            console.error('拖放区域元素不能为空');
            return;
        }
        
        dropZoneElement = dropZone;
        filesCallback = onFilesDropped;
        
        // 防止默认行为（阻止文件被浏览器打开）
        dropZoneElement.addEventListener('dragover', handleDragOver);
        dropZoneElement.addEventListener('dragenter', handleDragEnter);
        dropZoneElement.addEventListener('dragleave', handleDragLeave);
        dropZoneElement.addEventListener('drop', handleDrop);
        
        console.log('拖放处理初始化完成');
    }
    
    /**
     * 处理拖拽移动事件
     * @param {DragEvent} event - 拖拽事件
     */
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    /**
     * 处理拖拽进入事件
     * @param {DragEvent} event - 拖拽事件
     */
    function handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 添加拖放高亮样式
        dropZoneElement.classList.add('drag-over');
    }
    
    /**
     * 处理拖拽离开事件
     * @param {DragEvent} event - 拖拽事件
     */
    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 移除拖放高亮样式
        dropZoneElement.classList.remove('drag-over');
    }
    
    /**
     * 处理文件拖放事件
     * @param {DragEvent} event - 拖放事件
     */
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 移除拖放高亮样式
        dropZoneElement.classList.remove('drag-over');
        
        // 获取拖放的文件列表
        const files = event.dataTransfer.files;
        
        // 如果有文件并且回调函数存在，则调用回调
        if (files.length > 0 && typeof filesCallback === 'function') {
            filesCallback(files);
        }
    }
    
    // 返回公共API
    return {
        init: init
    };
})();