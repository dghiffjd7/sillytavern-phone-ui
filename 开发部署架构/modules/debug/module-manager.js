/**
 * 手机QQ界面 - 模块管理和调试工具
 * 提供模块状态监控、调试功能和性能分析
 */

(function() {
    'use strict';
    
    // 注册模块
    QQMobile.modules.debugTools = {
        name: '调试工具',
        version: '1.0.0',
        dependencies: ['core/namespace']
    };
    
    /**
     * 模块健康检查
     */
    function performModuleHealthCheck() {
        console.log('🏥 === 模块健康检查开始 ===');
        
        const healthReport = {
            timestamp: new Date().toISOString(),
            overallStatus: 'healthy',
            modules: {},
            issues: [],
            recommendations: []
        };
        
        // 检查核心模块
        const coreModules = ['namespace', 'utils', 'formatParser', 'interactionSystem', 'aiResponseHandler'];
        
        coreModules.forEach(moduleName => {
            const moduleStatus = {
                loaded: QQMobile.loadedModules.has(moduleName),
                functional: false,
                errors: []
            };
            
            try {
                // 检查模块是否可访问
                if (QQMobile.modules[moduleName]) {
                    moduleStatus.functional = true;
                    
                    // 执行基本功能测试
                    switch (moduleName) {
                        case 'utils':
                            // 测试工具函数
                            if (typeof QQMobile.modules.utils.cleanNestedTags === 'function') {
                                const testResult = QQMobile.modules.utils.cleanNestedTags('<test>content</test>');
                                if (testResult !== 'content') {
                                    moduleStatus.errors.push('cleanNestedTags函数测试失败');
                                }
                            }
                            break;
                            
                        case 'interactionSystem':
                            // 测试互动检测
                            if (typeof QQMobile.modules.interactionSystem.detectInteractiveIntent === 'function') {
                                // 简单测试
                            }
                            break;
                            
                        case 'formatParser':
                            // 测试格式解析
                            if (typeof QQMobile.modules.formatParser.extractValidInfo === 'function') {
                                // 简单测试
                            }
                            break;
                    }
                    
                } else {
                    moduleStatus.errors.push('模块对象不存在');
                    moduleStatus.functional = false;
                }
                
            } catch (error) {
                moduleStatus.errors.push(`测试时发生错误: ${error.message}`);
                moduleStatus.functional = false;
            }
            
            healthReport.modules[moduleName] = moduleStatus;
            
            // 记录问题
            if (!moduleStatus.loaded) {
                healthReport.issues.push(`模块 ${moduleName} 未加载`);
            }
            if (!moduleStatus.functional) {
                healthReport.issues.push(`模块 ${moduleName} 功能异常`);
            }
            if (moduleStatus.errors.length > 0) {
                healthReport.issues.push(`模块 ${moduleName} 存在错误: ${moduleStatus.errors.join(', ')}`);
            }
        });
        
        // 检查全局变量
        const globalVars = ['QQ_msgjson', 'QQ_Groups', 'QQ_MomentsData', 'gening'];
        globalVars.forEach(varName => {
            if (typeof window[varName] === 'undefined') {
                healthReport.issues.push(`全局变量 ${varName} 未定义`);
            }
        });
        
        // 检查内存使用情况
        if (performance.memory) {
            const memoryInfo = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            
            healthReport.memoryUsage = memoryInfo;
            
            if (memoryInfo.used > memoryInfo.limit * 0.8) {
                healthReport.issues.push('内存使用率过高');
                healthReport.recommendations.push('考虑清理缓存数据');
            }
        }
        
        // 设置整体状态
        if (healthReport.issues.length === 0) {
            healthReport.overallStatus = 'healthy';
        } else if (healthReport.issues.length <= 3) {
            healthReport.overallStatus = 'warning';
        } else {
            healthReport.overallStatus = 'critical';
        }
        
        // 生成建议
        if (healthReport.issues.length > 0) {
            healthReport.recommendations.push('检查控制台错误信息');
            healthReport.recommendations.push('尝试重新加载模块');
        }
        
        console.log('📊 健康检查报告:', healthReport);
        console.log('🏥 === 模块健康检查完成 ===');
        
        return healthReport;
    }
    
    /**
     * 性能监控
     */
    function performanceMonitor() {
        console.log('📈 === 性能监控开始 ===');
        
        const perfReport = {
            timestamp: new Date().toISOString(),
            metrics: {},
            recommendations: []
        };
        
        // 页面性能指标
        if (performance.timing) {
            const timing = performance.timing;
            perfReport.metrics.pageLoad = {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                pageLoad: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domComplete - timing.domLoading
            };
        }
        
        // 模块加载性能
        const moduleLoadTimes = {};
        QQMobile.loadedModules.forEach(moduleName => {
            // 这里可以记录每个模块的加载时间
            moduleLoadTimes[moduleName] = 'loaded';
        });
        perfReport.metrics.moduleLoading = moduleLoadTimes;
        
        // DOM元素数量
        perfReport.metrics.domElements = document.querySelectorAll('*').length;
        
        // 事件监听器数量（近似）
        const eventTypes = ['click', 'load', 'resize', 'scroll'];
        let listenerCount = 0;
        eventTypes.forEach(type => {
            const elements = document.querySelectorAll(`[on${type}]`);
            listenerCount += elements.length;
        });
        perfReport.metrics.eventListeners = listenerCount;
        
        // 生成性能建议
        if (perfReport.metrics.domElements > 1000) {
            perfReport.recommendations.push('DOM元素过多，考虑优化页面结构');
        }
        
        if (perfReport.metrics.eventListeners > 100) {
            perfReport.recommendations.push('事件监听器过多，考虑使用事件委托');
        }
        
        console.log('📊 性能监控报告:', perfReport);
        console.log('📈 === 性能监控完成 ===');
        
        return perfReport;
    }
    
    /**
     * 数据完整性检查
     */
    function dataIntegrityCheck() {
        console.log('🔍 === 数据完整性检查开始 ===');
        
        const integrityReport = {
            timestamp: new Date().toISOString(),
            dataStatus: {},
            issues: [],
            recommendations: []
        };
        
        // 检查聊天数据
        if (QQMobile.data.msgjson) {
            const chatData = QQMobile.data.msgjson;
            
            integrityReport.dataStatus.privateChats = {
                count: Object.keys(chatData.私聊 || {}).length,
                totalMessages: 0
            };
            
            integrityReport.dataStatus.groupChats = {
                count: Object.keys(chatData.群聊 || {}).length,
                totalMessages: 0
            };
            
            // 统计消息数量
            for (const chatKey in chatData.私聊 || {}) {
                if (Array.isArray(chatData.私聊[chatKey])) {
                    integrityReport.dataStatus.privateChats.totalMessages += chatData.私聊[chatKey].length;
                } else {
                    integrityReport.issues.push(`私聊 ${chatKey} 数据格式异常`);
                }
            }
            
            for (const groupKey in chatData.群聊 || {}) {
                if (chatData.群聊[groupKey] && Array.isArray(chatData.群聊[groupKey].msgs)) {
                    integrityReport.dataStatus.groupChats.totalMessages += chatData.群聊[groupKey].msgs.length;
                } else {
                    integrityReport.issues.push(`群聊 ${groupKey} 数据格式异常`);
                }
            }
            
        } else {
            integrityReport.issues.push('聊天数据对象不存在');
        }
        
        // 检查动态数据
        if (Array.isArray(QQMobile.data.momentsData)) {
            integrityReport.dataStatus.moments = {
                count: QQMobile.data.momentsData.length
            };
        } else {
            integrityReport.issues.push('动态数据格式异常');
        }
        
        // 检查互动空间数据
        if (QQMobile.data.interactiveSpaces) {
            integrityReport.dataStatus.interactiveSpaces = {
                characterCount: Object.keys(QQMobile.data.interactiveSpaces).length
            };
        } else {
            integrityReport.issues.push('互动空间数据不存在');
        }
        
        // 生成建议
        if (integrityReport.dataStatus.privateChats && 
            integrityReport.dataStatus.privateChats.totalMessages > 10000) {
            integrityReport.recommendations.push('私聊消息过多，建议清理旧消息');
        }
        
        if (integrityReport.dataStatus.groupChats && 
            integrityReport.dataStatus.groupChats.totalMessages > 5000) {
            integrityReport.recommendations.push('群聊消息过多，建议清理旧消息');
        }
        
        console.log('📊 数据完整性报告:', integrityReport);
        console.log('🔍 === 数据完整性检查完成 ===');
        
        return integrityReport;
    }
    
    /**
     * 综合系统诊断
     */
    function systemDiagnosis() {
        console.log('🔧 === 系统综合诊断开始 ===');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            version: QQMobile.version,
            buildDate: QQMobile.buildDate,
            healthCheck: performModuleHealthCheck(),
            performance: performanceMonitor(),
            dataIntegrity: dataIntegrityCheck(),
            overallStatus: 'unknown',
            criticalIssues: [],
            recommendations: []
        };
        
        // 汇总关键问题
        diagnosis.criticalIssues = [
            ...diagnosis.healthCheck.issues,
            ...diagnosis.dataIntegrity.issues
        ];
        
        // 汇总建议
        diagnosis.recommendations = [
            ...diagnosis.healthCheck.recommendations,
            ...diagnosis.performance.recommendations,
            ...diagnosis.dataIntegrity.recommendations
        ];
        
        // 确定整体状态
        if (diagnosis.criticalIssues.length === 0) {
            diagnosis.overallStatus = 'excellent';
        } else if (diagnosis.criticalIssues.length <= 2) {
            diagnosis.overallStatus = 'good';
        } else if (diagnosis.criticalIssues.length <= 5) {
            diagnosis.overallStatus = 'warning';
        } else {
            diagnosis.overallStatus = 'critical';
        }
        
        // 生成总结报告
        const summary = {
            status: diagnosis.overallStatus,
            issueCount: diagnosis.criticalIssues.length,
            recommendationCount: diagnosis.recommendations.length,
            moduleCount: QQMobile.loadedModules.size,
            memoryUsage: diagnosis.performance.memoryUsage || 'unknown'
        };
        
        console.log('🎯 系统诊断总结:', summary);
        console.log('📋 详细诊断报告:', diagnosis);
        console.log('🔧 === 系统综合诊断完成 ===');
        
        return diagnosis;
    }
    
    /**
     * 清理和优化建议
     */
    function optimizationSuggestions() {
        const suggestions = [];
        
        // 检查数据大小
        const dataSize = JSON.stringify(QQMobile.data).length;
        if (dataSize > 1024 * 1024) { // 大于1MB
            suggestions.push({
                type: 'data_cleanup',
                priority: 'high',
                description: '数据过大，建议清理旧的聊天记录',
                action: '调用 QQ_GentleMobileCleanup() 进行温和清理'
            });
        }
        
        // 检查内存使用
        if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
            suggestions.push({
                type: 'memory_optimization',
                priority: 'medium',
                description: '内存使用较高，建议重启应用或清理缓存',
                action: '重新加载页面或清理浏览器缓存'
            });
        }
        
        // 检查模块依赖
        const loadedCount = QQMobile.loadedModules.size;
        if (loadedCount < 5) {
            suggestions.push({
                type: 'module_loading',
                priority: 'high',
                description: '部分模块未加载，可能影响功能',
                action: '调用 QQ_ModuleLoader.reload() 重新加载模块'
            });
        }
        
        return suggestions;
    }
    
    /**
     * 导出调试工具到控制台
     */
    function initializeDebugConsole() {
        // 注册全局调试命令
        window.QQ_Debug = {
            // 系统诊断
            diagnosis: systemDiagnosis,
            healthCheck: performModuleHealthCheck,
            performance: performanceMonitor,
            dataIntegrity: dataIntegrityCheck,
            
            // 优化建议
            optimize: optimizationSuggestions,
            
            // 模块管理
            modules: {
                list: () => Array.from(QQMobile.loadedModules),
                status: () => {
                    const status = {};
                    QQMobile.loadedModules.forEach(name => {
                        status[name] = {
                            loaded: true,
                            module: QQMobile.modules[name] || null
                        };
                    });
                    return status;
                },
                reload: async () => {
                    if (window.QQ_ModuleLoader && window.QQ_ModuleLoader.reload) {
                        await window.QQ_ModuleLoader.reload();
                        return '模块重新加载完成';
                    }
                    return '模块加载器不可用';
                }
            },
            
            // 数据管理
            data: {
                export: () => JSON.stringify(QQMobile.data, null, 2),
                size: () => {
                    const str = JSON.stringify(QQMobile.data);
                    return {
                        characters: str.length,
                        bytes: new Blob([str]).size,
                        kb: Math.round(new Blob([str]).size / 1024),
                        mb: Math.round(new Blob([str]).size / 1024 / 1024 * 100) / 100
                    };
                },
                cleanup: () => {
                    if (typeof QQ_GentleMobileCleanup === 'function') {
                        QQ_GentleMobileCleanup(QQMobile.data.msgjson);
                        return '数据清理完成';
                    }
                    return '清理函数不可用';
                }
            },
            
            // 测试工具
            test: {
                interaction: (content) => {
                    if (QQMobile.modules.interactionSystem) {
                        return QQMobile.modules.interactionSystem.detectInteractiveIntent(content);
                    }
                    return '互动检测系统不可用';
                },
                format: (content) => {
                    if (QQMobile.modules.formatParser) {
                        return QQMobile.modules.formatParser.extractValidInfo(content);
                    }
                    return '格式解析器不可用';
                }
            }
        };
        
        console.log('🛠️ 调试工具已初始化');
        console.log('使用 QQ_Debug.diagnosis() 进行系统诊断');
        console.log('使用 QQ_Debug.modules.status() 查看模块状态');
        console.log('使用 QQ_Debug.data.size() 查看数据大小');
    }
    
    // 将函数注册到模块中
    QQMobile.modules.debugTools.systemDiagnosis = systemDiagnosis;
    QQMobile.modules.debugTools.performModuleHealthCheck = performModuleHealthCheck;
    QQMobile.modules.debugTools.performanceMonitor = performanceMonitor;
    QQMobile.modules.debugTools.dataIntegrityCheck = dataIntegrityCheck;
    QQMobile.modules.debugTools.optimizationSuggestions = optimizationSuggestions;
    QQMobile.modules.debugTools.initializeDebugConsole = initializeDebugConsole;
    
    // 自动初始化调试控制台
    initializeDebugConsole();
    
    // 定期健康检查（可选）
    if (QQMobile.config.debug.enablePeriodicCheck) {
        setInterval(() => {
            const health = performModuleHealthCheck();
            if (health.overallStatus === 'critical') {
                console.warn('⚠️ 检测到系统关键问题，建议进行诊断');
            }
        }, 5 * 60 * 1000); // 每5分钟检查一次
    }
    
    // 触发模块加载完成事件
    QQMobile.events.emit('module:loaded', 'debugTools');
    
    console.log('✅ 调试工具模块已加载');
})();