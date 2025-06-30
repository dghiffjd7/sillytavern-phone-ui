/**
 * 手机QQ界面 - 全局命名空间管理器
 * 用于管理所有全局变量和防止命名冲突
 */

// 创建全局命名空间
window.QQMobile = window.QQMobile || {
    // === 版本信息 ===
    version: '2.0.0',
    buildDate: new Date().toISOString(),
    
    // === 模块管理 ===
    modules: {},
    loadedModules: new Set(),
    
    // === 数据存储 ===
    data: {
        // 聊天数据
        msgjson: {
            私聊: {},
            群聊: {}
        },
        
        // 群组数据
        groups: [],
        groupInitializedSet: new Set(),
        
        // 动态数据
        momentsData: [],
        
        // 聊天备份
        chatBackup: {},
        
        // 用户数据
        newMsg: {},
        lastMsgMap: {
            private: {},
            group: {}
        },
        
        // 角色数据
        characters: {},
        characterSpaces: {},
        
        // 互动空间
        interactiveSpaces: {},
        
        // 缓存数据
        cacheSendMsg: "",
        preloadedCharacters: null,
        fullPublicSpaces: null
    },
    
    // === 状态管理 ===
    state: {
        // 生成状态
        isGenerating: false,
        
        // 重试状态
        retryCount: 0,
        maxRetry: 3,
        
        // 互动状态
        userTriggeredInteractive: false,
        
        // 最后请求
        lastRequest: "",
        lastRequestName: "",
        
        // 新消息状态
        lastAiNewMessages: {}
    },
    
    // === 配置管理 ===
    config: {
        // 互动设置
        interactive: {
            enableKeywordTrigger: true,
            enableDefaultKeywords: true,
            customKeywords: []
        },
        
        // 消息设置
        message: {
            maxChatMessages: 500,
            enableMessageCleanup: true
        },
        
        // 调试设置
        debug: {
            enableConsoleLog: true,
            enableDebugTools: false
        }
    },
    
    // === 工具函数 ===
    utils: {
        /**
         * 深度克隆对象
         */
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(item => this.deepClone(item));
            if (obj instanceof Object) {
                const cloned = {};
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        cloned[key] = this.deepClone(obj[key]);
                    }
                }
                return cloned;
            }
        },
        
        /**
         * 安全的JSON解析
         */
        safeJsonParse: function(str, defaultValue = null) {
            try {
                return JSON.parse(str);
            } catch (error) {
                console.warn('JSON解析失败:', error);
                return defaultValue;
            }
        },
        
        /**
         * 生成唯一ID
         */
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        /**
         * 防抖函数
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        /**
         * 节流函数
         */
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },
    
    // === 事件系统 ===
    events: {
        listeners: {},
        
        /**
         * 注册事件监听器
         */
        on: function(eventName, callback) {
            if (!this.listeners[eventName]) {
                this.listeners[eventName] = [];
            }
            this.listeners[eventName].push(callback);
        },
        
        /**
         * 移除事件监听器
         */
        off: function(eventName, callback) {
            if (!this.listeners[eventName]) return;
            const index = this.listeners[eventName].indexOf(callback);
            if (index > -1) {
                this.listeners[eventName].splice(index, 1);
            }
        },
        
        /**
         * 触发事件
         */
        emit: function(eventName, ...args) {
            if (!this.listeners[eventName]) return;
            this.listeners[eventName].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`事件处理器执行失败 [${eventName}]:`, error);
                }
            });
        }
    },
    
    // === 模块加载器 ===
    loader: {
        /**
         * 加载模块
         */
        loadModule: function(moduleName, moduleUrl) {
            return new Promise((resolve, reject) => {
                if (QQMobile.loadedModules.has(moduleName)) {
                    console.log(`模块 ${moduleName} 已加载`);
                    resolve(QQMobile.modules[moduleName]);
                    return;
                }
                
                const script = document.createElement('script');
                script.src = moduleUrl;
                script.onload = () => {
                    QQMobile.loadedModules.add(moduleName);
                    console.log(`✅ 模块 ${moduleName} 加载成功`);
                    resolve(QQMobile.modules[moduleName]);
                };
                script.onerror = () => {
                    console.error(`❌ 模块 ${moduleName} 加载失败`);
                    reject(new Error(`Failed to load module: ${moduleName}`));
                };
                document.head.appendChild(script);
            });
        },
        
        /**
         * 批量加载模块
         */
        loadModules: async function(moduleConfigs) {
            const loadPromises = moduleConfigs.map(config => 
                this.loadModule(config.name, config.url)
            );
            
            try {
                const results = await Promise.all(loadPromises);
                console.log('✅ 所有模块加载完成');
                return results;
            } catch (error) {
                console.error('❌ 模块加载过程中出现错误:', error);
                throw error;
            }
        }
    },
    
    // === 初始化方法 ===
    init: function() {
        console.log('🚀 QQMobile 命名空间初始化...');
        
        // 设置向后兼容的全局变量别名
        this.setupLegacyAliases();
        
        // 初始化事件系统
        this.initEventSystem();
        
        console.log('✅ QQMobile 命名空间初始化完成');
    },
    
    /**
     * 设置向后兼容的全局变量别名
     */
    setupLegacyAliases: function() {
        // 为了向后兼容，保留原有的全局变量名
        window.QQ_msgjson = this.data.msgjson;
        window.QQ_Groups = this.data.groups;
        window.QQ_GroupInitializedSet = this.data.groupInitializedSet;
        window.QQ_MomentsData = this.data.momentsData;
        window.QQ_ChatBackup = this.data.chatBackup;
        window.QQ_NewMsg = this.data.newMsg;
        window.QQ_CharacterSpaces = this.data.characterSpaces;
        window.QQ_InteractiveSpaces = this.data.interactiveSpaces;
        window.QQ_CacheSendMsg = this.data.cacheSendMsg;
        
        // 状态变量
        window.gening = this.state.isGenerating;
        window.QQ_RetryCount = this.state.retryCount;
        window.QQ_MAX_RETRY = this.state.maxRetry;
        window.QQ_UserTriggeredInteractive = this.state.userTriggeredInteractive;
        window.QQ_LastRequest = this.state.lastRequest;
        window.QQ_LastRequestName = this.state.lastRequestName;
        
        // 使用 Proxy 来保持同步
        this.setupProxySync();
    },
    
    /**
     * 设置代理同步，确保新旧变量同步
     */
    setupProxySync: function() {
        // 同步 gening 状态
        Object.defineProperty(window, 'gening', {
            get: () => this.state.isGenerating,
            set: (value) => { this.state.isGenerating = value; }
        });
        
        // 同步重试计数
        Object.defineProperty(window, 'QQ_RetryCount', {
            get: () => this.state.retryCount,
            set: (value) => { this.state.retryCount = value; }
        });
        
        // 同步用户触发状态
        Object.defineProperty(window, 'QQ_UserTriggeredInteractive', {
            get: () => this.state.userTriggeredInteractive,
            set: (value) => { this.state.userTriggeredInteractive = value; }
        });
    },
    
    /**
     * 初始化事件系统
     */
    initEventSystem: function() {
        // 注册核心事件
        this.events.on('module:loaded', (moduleName) => {
            console.log(`📦 模块已加载: ${moduleName}`);
        });
        
        this.events.on('ai:response', (response) => {
            console.log('🤖 AI响应事件触发');
        });
        
        this.events.on('message:sent', (message) => {
            console.log('💬 消息发送事件触发');
        });
    }
};

// 初始化命名空间
QQMobile.init();

// 导出到全局
window.QQMobile = QQMobile;

console.log('✅ QQMobile 全局命名空间管理器已加载');