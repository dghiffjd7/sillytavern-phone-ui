/**
 * 手机QQ界面 - 通用工具函数模块
 * 提供各种常用的工具函数，减少重复代码
 */

(function() {
    'use strict';
    
    // 注册模块
    QQMobile.modules.utils = {
        name: '通用工具函数',
        version: '1.0.0',
        dependencies: ['core/namespace']
    };
    
    /**
     * 清理嵌套标签
     * 移除多层嵌套的HTML/XML标签
     */
    function cleanNestedTags(content) {
        if (!content || typeof content !== 'string') return '';
        
        let cleaned = content;
        
        // 移除常见的嵌套标签
        const tagPatterns = [
            /<consider[\s\S]*?<\/consider>/gi,
            /<thinking[\s\S]*?<\/thinking>/gi,
            /<reflection[\s\S]*?<\/reflection>/gi,
            /<analysis[\s\S]*?<\/analysis>/gi,
            /<internal[\s\S]*?<\/internal>/gi,
            /<meta[\s\S]*?<\/meta>/gi,
            /<system[\s\S]*?<\/system>/gi,
            // 移除HTML注释
            /<!--[\s\S]*?-->/g,
            // 移除空的标签对
            /<(\w+)[^>]*>\s*<\/\1>/g
        ];
        
        tagPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        
        // 清理多余的空白字符
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
        cleaned = cleaned.trim();
        
        return cleaned;
    }
    
    /**
     * 检查是否包含content标签
     */
    function hasContentTag(content) {
        if (!content) return false;
        return /<content[\s\S]*?<\/content>/i.test(content) || 
               /<content[\s\S]*?>/i.test(content);
    }
    
    /**
     * 清理content标签
     */
    function cleanContentTags(content) {
        if (!content) return '';
        
        // 提取content标签内容
        const contentMatch = content.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
        if (contentMatch) {
            return cleanNestedTags(contentMatch[1].trim());
        }
        
        // 尝试简单的content标签
        const simpleMatch = content.match(/<content[^>]*>([\s\S]*?)$/i);
        if (simpleMatch) {
            return cleanNestedTags(simpleMatch[1].trim());
        }
        
        return cleanNestedTags(content);
    }
    
    /**
     * 查找表格化数据
     */
    function findTableData(content) {
        if (!content) return null;
        
        // 查找表格格式的摘要
        const tablePatterns = [
            /(?:摘要|总结|概要)[\s\S]*?\|[\s\S]*?\|[\s\S]*?\|/i,
            /\|[^|]*\|[^|]*\|[^|]*\|[\s\S]*?\|[^|]*\|[^|]*\|/,
            /【.*?】.*?【.*?】.*?【.*?】/
        ];
        
        for (const pattern of tablePatterns) {
            const match = content.match(pattern);
            if (match) {
                console.log('✅ 发现表格化数据');
                return match[0].trim();
            }
        }
        
        return null;
    }
    
    /**
     * 使用用户模式查找摘要
     */
    function findSummaryUsingUserPatterns(content) {
        if (!content) return null;
        
        const patterns = [
            /(?:摘要|总结|概要)[：:]\s*([\s\S]+?)(?:\n\n|\n(?=[A-Z])|$)/i,
            /(?:summary|recap|overview)[：:]\s*([\s\S]+?)(?:\n\n|\n(?=[A-Z])|$)/i,
            /【摘要】([\s\S]+?)【\/摘要】/,
            /\*\*摘要\*\*([\s\S]+?)\*\*\/摘要\*\*/,
            /## 摘要\s*([\s\S]+?)(?:\n#|$)/
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                console.log('✅ 发现用户模式摘要');
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    /**
     * 使用启发式方法查找摘要
     */
    function findSummaryUsingHeuristics(content) {
        if (!content) return null;
        
        // 查找包含关键词的段落
        const keywordPatterns = [
            /[\s\S]*?(?:发送|回复|说|告诉|聊天|消息)[\s\S]*?/i,
            /[\s\S]*?(?:私聊|群聊|QQ空间|动态)[\s\S]*?/i
        ];
        
        for (const pattern of keywordPatterns) {
            const match = content.match(pattern);
            if (match && match[0].length > 20 && match[0].length < 200) {
                console.log('✅ 启发式方法发现摘要');
                return match[0].trim();
            }
        }
        
        // 如果内容不太长，直接返回
        if (content.length > 20 && content.length < 150) {
            console.log('✅ 内容长度适中，直接作为摘要');
            return content.trim();
        }
        
        return null;
    }
    
    /**
     * 创建历史摘要
     */
    function createHistorySummary(lastMessages) {
        if (!lastMessages || Object.keys(lastMessages).length === 0) {
            return null;
        }
        
        const summaryParts = [];
        
        // 统计各类型消息
        let privateCount = 0;
        let groupCount = 0;
        let momentCount = 0;
        
        for (const key in lastMessages) {
            if (key.includes('私聊')) privateCount++;
            if (key.includes('群聊')) groupCount++;
            if (key.includes('动态')) momentCount++;
        }
        
        if (privateCount > 0) summaryParts.push(`私聊消息${privateCount}条`);
        if (groupCount > 0) summaryParts.push(`群聊消息${groupCount}条`);
        if (momentCount > 0) summaryParts.push(`动态消息${momentCount}条`);
        
        if (summaryParts.length > 0) {
            return `AI发送了${summaryParts.join('、')}`;
        }
        
        return null;
    }
    
    /**
     * 计算未读消息数量
     */
    function calculateUnreadCount(characterName, messages, type) {
        if (!messages || !Array.isArray(messages)) return 0;
        
        // 获取上次查看的消息数量
        const lastViewKey = `${type}_${characterName}_lastView`;
        const lastViewCount = parseInt(localStorage.getItem(lastViewKey) || '0');
        
        const currentCount = messages.length;
        const unreadCount = Math.max(0, currentCount - lastViewCount);
        
        return unreadCount;
    }
    
    /**
     * 标记消息为已读
     */
    function markMessagesAsRead(characterName, messageCount, type) {
        const lastViewKey = `${type}_${characterName}_lastView`;
        localStorage.setItem(lastViewKey, messageCount.toString());
    }
    
    /**
     * 清理旧的聊天消息（温和清理）
     */
    function gentleMobileCleanup(msgjson) {
        if (!msgjson) return;
        
        console.log('🧹 开始温和清理聊天数据...');
        
        // 只清理明显无用的数据
        const cleanupPatterns = [
            /^系统消息--/,           // 系统消息
            /^debug--/i,             // 调试信息
            /^test--/i,              // 测试消息
            /^临时--/,               // 临时消息
            /^\[deleted\]/i,         // 已删除消息
            /^\[error\]/i,           // 错误消息
            /^undefined--/,          // undefined消息
            /^null--/,               // null消息
        ];
        
        let cleanedCount = 0;
        
        // 清理私聊
        if (msgjson.私聊) {
            for (const chatKey in msgjson.私聊) {
                if (Array.isArray(msgjson.私聊[chatKey])) {
                    const originalLength = msgjson.私聊[chatKey].length;
                    msgjson.私聊[chatKey] = msgjson.私聊[chatKey].filter(msg => {
                        return !cleanupPatterns.some(pattern => pattern.test(msg));
                    });
                    cleanedCount += originalLength - msgjson.私聊[chatKey].length;
                }
            }
        }
        
        // 清理群聊
        if (msgjson.群聊) {
            for (const groupKey in msgjson.群聊) {
                if (msgjson.群聊[groupKey] && Array.isArray(msgjson.群聊[groupKey].msgs)) {
                    const originalLength = msgjson.群聊[groupKey].msgs.length;
                    msgjson.群聊[groupKey].msgs = msgjson.群聊[groupKey].msgs.filter(msg => {
                        return !cleanupPatterns.some(pattern => pattern.test(msg));
                    });
                    cleanedCount += originalLength - msgjson.群聊[groupKey].msgs.length;
                }
            }
        }
        
        console.log(`✅ 温和清理完成，清理了 ${cleanedCount} 条无用消息`);
    }
    
    /**
     * 限制聊天消息数量
     */
    function limitChatMessages(msgjson, maxMessages = 500) {
        if (!msgjson) return;
        
        console.log('📏 开始限制聊天消息数量...');
        
        let limitedCount = 0;
        
        // 限制私聊消息
        if (msgjson.私聊) {
            for (const chatKey in msgjson.私聊) {
                if (Array.isArray(msgjson.私聊[chatKey]) && msgjson.私聊[chatKey].length > maxMessages) {
                    const originalLength = msgjson.私聊[chatKey].length;
                    msgjson.私聊[chatKey] = msgjson.私聊[chatKey].slice(-maxMessages);
                    limitedCount += originalLength - msgjson.私聊[chatKey].length;
                }
            }
        }
        
        // 限制群聊消息
        if (msgjson.群聊) {
            for (const groupKey in msgjson.群聊) {
                if (msgjson.群聊[groupKey] && Array.isArray(msgjson.群聊[groupKey].msgs) && 
                    msgjson.群聊[groupKey].msgs.length > maxMessages) {
                    const originalLength = msgjson.群聊[groupKey].msgs.length;
                    msgjson.群聊[groupKey].msgs = msgjson.群聊[groupKey].msgs.slice(-maxMessages);
                    limitedCount += originalLength - msgjson.群聊[groupKey].msgs.length;
                }
            }
        }
        
        console.log(`✅ 消息数量限制完成，移除了 ${limitedCount} 条旧消息`);
    }
    
    /**
     * 时间相关工具函数
     */
    const timeUtils = {
        /**
         * 获取时间段描述
         */
        getTimePeriod(hour) {
            if (hour >= 5 && hour < 8) return '清晨';
            if (hour >= 8 && hour < 11) return '上午';
            if (hour >= 11 && hour < 13) return '中午';
            if (hour >= 13 && hour < 17) return '下午';
            if (hour >= 17 && hour < 19) return '傍晚';
            if (hour >= 19 && hour < 22) return '晚上';
            return '深夜';
        },
        
        /**
         * 获取季节描述
         */
        getSeason(month) {
            if (month >= 3 && month <= 5) return '春季';
            if (month >= 6 && month <= 8) return '夏季';
            if (month >= 9 && month <= 11) return '秋季';
            return '冬季';
        },
        
        /**
         * 获取完整时间上下文
         */
        getTimeContext() {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const weekDay = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
            
            const timePeriod = this.getTimePeriod(hour);
            const season = this.getSeason(month);
            
            return `当前时间：${year}年${month}月${day}日 ${weekDay} ${timePeriod} ${hour}:${minute.toString().padStart(2, '0')} (${season})`;
        }
    };
    
    /**
     * 字符串处理工具
     */
    const stringUtils = {
        /**
         * 截断字符串
         */
        truncate(str, maxLength, suffix = '...') {
            if (!str || str.length <= maxLength) return str;
            return str.substring(0, maxLength - suffix.length) + suffix;
        },
        
        /**
         * 移除特殊字符
         */
        removeSpecialChars(str) {
            if (!str) return '';
            return str.replace(/[^\w\s\u4e00-\u9fff]/g, '');
        },
        
        /**
         * 转义HTML字符
         */
        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };
    
    // 导出函数到全局作用域（向后兼容）
    window.QQ_CleanNestedTags = cleanNestedTags;
    window.QQ_HasContentTag = hasContentTag;
    window.QQ_CleanContentTags = cleanContentTags;
    window.QQ_CalculateUnreadCount = calculateUnreadCount;
    window.QQ_MarkMessagesAsRead = markMessagesAsRead;
    window.QQ_GentleMobileCleanup = gentleMobileCleanup;
    window.QQ_LimitChatMessages = limitChatMessages;
    window.QQ_GetTimeContext = timeUtils.getTimeContext;
    window.QQ_GetTimePeriod = timeUtils.getTimePeriod;
    window.QQ_GetSeason = timeUtils.getSeason;
    window.findTableData = findTableData;
    window.findSummaryUsingUserPatterns = findSummaryUsingUserPatterns;
    window.findSummaryUsingHeuristics = findSummaryUsingHeuristics;
    window.createHistorySummary = createHistorySummary;
    
    // 将函数注册到模块中
    QQMobile.modules.utils.cleanNestedTags = cleanNestedTags;
    QQMobile.modules.utils.hasContentTag = hasContentTag;
    QQMobile.modules.utils.cleanContentTags = cleanContentTags;
    QQMobile.modules.utils.calculateUnreadCount = calculateUnreadCount;
    QQMobile.modules.utils.markMessagesAsRead = markMessagesAsRead;
    QQMobile.modules.utils.gentleMobileCleanup = gentleMobileCleanup;
    QQMobile.modules.utils.limitChatMessages = limitChatMessages;
    QQMobile.modules.utils.timeUtils = timeUtils;
    QQMobile.modules.utils.stringUtils = stringUtils;
    QQMobile.modules.utils.findTableData = findTableData;
    QQMobile.modules.utils.findSummaryUsingUserPatterns = findSummaryUsingUserPatterns;
    QQMobile.modules.utils.findSummaryUsingHeuristics = findSummaryUsingHeuristics;
    QQMobile.modules.utils.createHistorySummary = createHistorySummary;
    
    // 触发模块加载完成事件
    QQMobile.events.emit('module:loaded', 'utils');
    
    console.log('✅ 通用工具函数模块已加载');
})();