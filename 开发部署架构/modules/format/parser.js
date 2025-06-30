/**
 * 手机QQ界面 - 格式解析模块
 * 负责解析和转换各种消息格式
 */

(function() {
    'use strict';
    
    // 注册模块
    QQMobile.modules.formatParser = {
        name: '格式解析器',
        version: '1.0.0',
        dependencies: ['core/namespace']
    };
    
    /**
     * 智能提取有效信息
     * 四层检测机制
     */
    async function extractValidInfo(content) {
        console.log('🧠 开始智能信息提取...');
        
        if (!content || content.trim().length === 0) {
            console.log('❌ 内容为空，无法提取');
            return null;
        }
        
        const result = {
            hasValidInfo: false,
            rawContent: content,
            extractionMethod: null,
            messages: [],
            groups: [],
            moments: [],
            characterChats: [],
            chatInfo: null,
            chatType: null,
            chatName: null
        };
        
        try {
            // 第一层：查找表格化数据
            console.log('🔍 第一层：查找表格化数据...');
            const tableData = findTableData(content);
            if (tableData) {
                console.log('✅ 第一层成功：发现表格化数据');
                result.hasValidInfo = true;
                result.extractionMethod = 'table_data';
                result.tableData = tableData;
                return result;
            }
            
            // 第二层：用户自定义摘要格式
            console.log('🔍 第二层：查找用户自定义摘要格式...');
            const userPattern = findSummaryUsingUserPatterns(content);
            if (userPattern) {
                console.log('✅ 第二层成功：发现用户自定义格式');
                result.hasValidInfo = true;
                result.extractionMethod = 'user_patterns';
                result.userPattern = userPattern;
                return result;
            }
            
            // 第三层：启发式检测
            console.log('🔍 第三层：启发式检测...');
            const heuristicResult = findSummaryUsingHeuristics(content);
            if (heuristicResult) {
                console.log('✅ 第三层成功：启发式检测发现有效内容');
                result.hasValidInfo = true;
                result.extractionMethod = 'heuristics';
                result.heuristicResult = heuristicResult;
                return result;
            }
            
            // 第四层：深度模式识别
            console.log('🔍 第四层：深度模式识别...');
            const deepResult = performDeepPatternRecognition(content);
            if (deepResult.hasValidInfo) {
                console.log('✅ 第四层成功：深度模式识别发现有效内容');
                Object.assign(result, deepResult);
                result.extractionMethod = 'deep_pattern';
                return result;
            }
            
            console.log('❌ 四层检测都未发现有效信息');
            return null;
            
        } catch (error) {
            console.error('❌ 智能信息提取过程中发生错误:', error);
            return null;
        }
    }
    
    /**
     * 第一层：查找表格化数据
     */
    function findTableData(content) {
        console.log('🔍 查找表格化数据...');
        
        // 检查是否包含表格标记
        const tablePatterns = [
            /\|[^|]+\|[^|]+\|/,  // 简单表格格式
            /┌.*?┐[\s\S]*?└.*?┘/,  // 框线表格
            /【.*?】.*?【.*?】/,  // 中文标题格式
            /\*\*.*?\*\*.*?\*\*.*?\*\*/,  // 加粗表格
        ];
        
        for (const pattern of tablePatterns) {
            if (pattern.test(content)) {
                console.log(`✅ 发现表格格式: ${pattern.source}`);
                
                // 提取表格内容
                const matches = content.match(pattern);
                if (matches) {
                    return {
                        type: 'table',
                        content: matches[0],
                        fullMatch: matches
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * 第二层：查找用户自定义摘要格式
     */
    function findSummaryUsingUserPatterns(content) {
        console.log('🔍 查找用户自定义摘要格式...');
        
        // 用户可能使用的摘要标记
        const userPatterns = [
            /(?:摘要|总结|概要)[：:]\s*([\s\S]+?)(?:\n\n|\n(?=[A-Z])|$)/i,
            /(?:summary|recap|overview)[：:]\s*([\s\S]+?)(?:\n\n|\n(?=[A-Z])|$)/i,
            /【摘要】([\s\S]+?)【\/摘要】/,
            /\*\*摘要\*\*([\s\S]+?)\*\*\/摘要\*\*/,
            /## 摘要\s*([\s\S]+?)(?:\n#|$)/,
        ];
        
        for (const pattern of userPatterns) {
            const match = content.match(pattern);
            if (match) {
                console.log(`✅ 发现用户自定义摘要格式: ${pattern.source}`);
                return {
                    type: 'user_summary',
                    content: match[1].trim(),
                    fullMatch: match[0]
                };
            }
        }
        
        return null;
    }
    
    /**
     * 第三层：启发式检测
     */
    function findSummaryUsingHeuristics(content) {
        console.log('🔍 启发式检测...');
        
        // 检查内容长度和结构
        if (content.length < 50) {
            console.log('❌ 内容过短，不适用启发式检测');
            return null;
        }
        
        // 检查是否包含聊天相关关键词
        const chatKeywords = [
            '私聊', '群聊', '消息', '发送', '回复', '聊天',
            '说', '问', '答', '讲', '谈', '告诉'
        ];
        
        const keywordCount = chatKeywords.reduce((count, keyword) => {
            return count + (content.includes(keyword) ? 1 : 0);
        }, 0);
        
        if (keywordCount >= 2) {
            console.log(`✅ 启发式检测发现聊天相关内容，关键词匹配数: ${keywordCount}`);
            return {
                type: 'chat_related',
                content: content,
                keywordCount: keywordCount,
                confidence: Math.min(keywordCount / chatKeywords.length, 1)
            };
        }
        
        return null;
    }
    
    /**
     * 第四层：深度模式识别
     */
    function performDeepPatternRecognition(content) {
        console.log('🔍 深度模式识别...');
        
        const result = {
            hasValidInfo: false,
            messages: [],
            groups: [],
            moments: [],
            characterChats: []
        };
        
        try {
            // 检测私聊模式
            const privateChats = extractPrivateChats(content);
            if (privateChats.length > 0) {
                result.messages.push(...privateChats);
                result.hasValidInfo = true;
                console.log(`✅ 检测到 ${privateChats.length} 个私聊消息`);
            }
            
            // 检测群聊模式
            const groupChats = extractGroupChats(content);
            if (groupChats.length > 0) {
                result.groups.push(...groupChats);
                result.hasValidInfo = true;
                console.log(`✅ 检测到 ${groupChats.length} 个群聊消息`);
            }
            
            // 检测动态模式
            const moments = extractMoments(content);
            if (moments.length > 0) {
                result.moments.push(...moments);
                result.hasValidInfo = true;
                console.log(`✅ 检测到 ${moments.length} 个动态消息`);
            }
            
            // 检测角色间对话
            const characterChats = extractCharacterChats(content);
            if (characterChats.length > 0) {
                result.characterChats.push(...characterChats);
                result.hasValidInfo = true;
                console.log(`✅ 检测到 ${characterChats.length} 个角色间对话`);
            }
            
        } catch (error) {
            console.error('❌ 深度模式识别过程中发生错误:', error);
        }
        
        return result;
    }
    
    /**
     * 提取私聊消息
     */
    function extractPrivateChats(content) {
        const chats = [];
        
        // 各种私聊格式的正则表达式
        const patterns = [
            // 标准格式: <用户名和角色名的私聊>
            /<([^>]+?)和([^>]+?)的(?:私聊|聊天)>([\s\S]*?)(?=<[^>]+?>|$)/g,
            // 简化格式: 用户名 -> 角色名: 消息
            /([^:\n]+?)\s*->\s*([^:\n]+?)\s*[:：]\s*([^\n]+)/g,
            // 对话格式: 用户名: 消息
            /^([^:\n]+?)\s*[:：]\s*([^\n]+)/gm
        ];
        
        patterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                let sender, receiver, message;
                
                if (index === 0) {
                    sender = match[1].trim();
                    receiver = match[2].trim();
                    message = match[3].trim();
                } else if (index === 1) {
                    sender = match[1].trim();
                    receiver = match[2].trim();
                    message = match[3].trim();
                } else {
                    sender = match[1].trim();
                    message = match[2].trim();
                    receiver = '未知角色';
                }
                
                if (message.length > 0) {
                    chats.push({
                        type: 'private',
                        sender: sender,
                        receiver: receiver,
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        return chats;
    }
    
    /**
     * 提取群聊消息
     */
    function extractGroupChats(content) {
        const chats = [];
        
        const patterns = [
            // 标准格式: <群聊: 群名>
            /<群聊[:：]\s*([^>]+?)>([\s\S]*?)(?=<[^>]+?>|$)/g,
            // 群消息格式: [群名] 用户名: 消息
            /\[([^\]]+?)\]\s*([^:：\n]+?)\s*[:：]\s*([^\n]+)/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const groupName = match[1].trim();
                let sender, message;
                
                if (pattern === patterns[0]) {
                    const groupContent = match[2].trim();
                    // 进一步解析群内消息
                    const messagePattern = /([^:：\n]+?)\s*[:：]\s*([^\n]+)/g;
                    let msgMatch;
                    while ((msgMatch = messagePattern.exec(groupContent)) !== null) {
                        chats.push({
                            type: 'group',
                            groupName: groupName,
                            sender: msgMatch[1].trim(),
                            message: msgMatch[2].trim(),
                            timestamp: new Date().toISOString()
                        });
                    }
                } else {
                    sender = match[2].trim();
                    message = match[3].trim();
                    
                    chats.push({
                        type: 'group',
                        groupName: groupName,
                        sender: sender,
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        return chats;
    }
    
    /**
     * 提取动态消息
     */
    function extractMoments(content) {
        const moments = [];
        
        const patterns = [
            // 动态格式: <QQ空间动态>
            /<QQ空间动态[^>]*>([\s\S]*?)(?=<[^>]+?>|$)/g,
            // 动态标签格式
            /<moment_start>([\s\S]*?)<moment_end>/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const momentContent = match[1].trim();
                
                if (momentContent.length > 0) {
                    moments.push({
                        type: 'moment',
                        content: momentContent,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        return moments;
    }
    
    /**
     * 提取角色间对话
     */
    function extractCharacterChats(content) {
        const chats = [];
        
        // 检测不包含用户名的对话
        const userPattern = new RegExp(`\\b${window.UserName || '用户'}\\b`, 'i');
        
        const dialogPattern = /([^:\n]+?)\s*[:：]\s*([^\n]+)/g;
        let match;
        
        while ((match = dialogPattern.exec(content)) !== null) {
            const speaker = match[1].trim();
            const message = match[2].trim();
            
            // 如果不包含用户名，可能是角色间对话
            if (!userPattern.test(speaker) && !userPattern.test(message)) {
                chats.push({
                    type: 'character_chat',
                    speaker: speaker,
                    message: message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return chats;
    }
    
    /**
     * 转换提取的信息为标准格式
     */
    async function convertExtractedToStandard(extractedInfo) {
        console.log('🔄 开始转换智能提取内容为标准格式...');
        
        if (!extractedInfo || !extractedInfo.hasValidInfo) {
            console.log('❌ 提取信息无效，无法转换');
            return null;
        }
        
        try {
            const result = {};
            
            // 处理聊天消息
            if (extractedInfo.messages && extractedInfo.messages.length > 0) {
                console.log(`📝 处理 ${extractedInfo.messages.length} 条聊天消息`);
                
                result.私聊 = {};
                
                extractedInfo.messages.forEach(msg => {
                    let chatKey;
                    
                    if (msg.type === 'private') {
                        // 确定聊天键值
                        if (msg.sender === window.UserName) {
                            chatKey = `${msg.sender}和${msg.receiver}的聊天`;
                        } else if (msg.receiver === window.UserName) {
                            chatKey = `${msg.receiver}和${msg.sender}的聊天`;
                        } else {
                            // 角色间私聊
                            chatKey = `${msg.sender}和${msg.receiver}的聊天`;
                        }
                        
                        if (!result.私聊[chatKey]) {
                            result.私聊[chatKey] = [];
                        }
                        
                        const formattedMsg = `${msg.sender}--${msg.message}--${formatTimestamp(msg.timestamp)}`;
                        result.私聊[chatKey].push(formattedMsg);
                    }
                });
            }
            
            // 处理群聊消息
            if (extractedInfo.groups && extractedInfo.groups.length > 0) {
                console.log(`📝 处理 ${extractedInfo.groups.length} 条群聊消息`);
                
                result.群聊 = {};
                
                extractedInfo.groups.forEach(msg => {
                    if (!result.群聊[msg.groupName]) {
                        result.群聊[msg.groupName] = {
                            msgs: [],
                            desc: `群聊：${msg.groupName}`
                        };
                    }
                    
                    const formattedMsg = `${msg.sender}--${msg.message}--${formatTimestamp(msg.timestamp)}`;
                    result.群聊[msg.groupName].msgs.push(formattedMsg);
                });
            }
            
            // 处理动态消息
            if (extractedInfo.moments && extractedInfo.moments.length > 0) {
                console.log(`📝 处理 ${extractedInfo.moments.length} 条动态消息`);
                // 动态处理逻辑...
            }
            
            // 处理角色间对话
            if (extractedInfo.characterChats && extractedInfo.characterChats.length > 0) {
                console.log(`📝 处理 ${extractedInfo.characterChats.length} 条角色间对话`);
                
                if (!result.私聊) result.私聊 = {};
                
                extractedInfo.characterChats.forEach(msg => {
                    const chatKey = `${msg.speaker}和未知角色的聊天`;
                    
                    if (!result.私聊[chatKey]) {
                        result.私聊[chatKey] = [];
                    }
                    
                    const formattedMsg = `${msg.speaker}--${msg.message}--${formatTimestamp(msg.timestamp)}`;
                    result.私聊[chatKey].push(formattedMsg);
                });
            }
            
            console.log('✅ 格式转换完成');
            return result;
            
        } catch (error) {
            console.error('❌ 格式转换失败:', error);
            return null;
        }
    }
    
    /**
     * 格式修复
     */
    async function repairFormat(content) {
        console.log('🔧 开始格式修复...');
        
        try {
            let repairedContent = content;
            
            // 修复常见的格式问题
            const repairs = [
                // 修复缺失的结束标签
                {
                    pattern: /MiPhone_start([\s\S]+?)(?!MiPhone_end)/g,
                    replacement: 'MiPhone_start$1MiPhone_end'
                },
                // 修复大小写问题
                {
                    pattern: /miphone_start/gi,
                    replacement: 'MiPhone_start'
                },
                {
                    pattern: /miphone_end/gi,
                    replacement: 'MiPhone_end'
                },
                // 修复缺失的冒号
                {
                    pattern: /私聊\s*([^>]+?)>/g,
                    replacement: '私聊: $1>'
                },
                {
                    pattern: /群聊\s*([^>]+?)>/g,
                    replacement: '群聊: $1>'
                }
            ];
            
            repairs.forEach(repair => {
                repairedContent = repairedContent.replace(repair.pattern, repair.replacement);
            });
            
            // 验证修复结果
            if (repairedContent !== content) {
                console.log('✅ 格式修复完成');
                return repairedContent;
            } else {
                console.log('❌ 无需修复或修复失败');
                return null;
            }
            
        } catch (error) {
            console.error('❌ 格式修复过程中发生错误:', error);
            return null;
        }
    }
    
    /**
     * 格式化时间戳
     */
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            // 今天，只显示时间
            return date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            // 其他日期，显示日期和时间
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // 导出函数到全局作用域（向后兼容）
    window.QQ_ExtractValidInfo = extractValidInfo;
    window.QQ_ConvertExtractedToStandard = convertExtractedToStandard;
    window.findTableData = findTableData;
    window.findSummaryUsingUserPatterns = findSummaryUsingUserPatterns;
    window.findSummaryUsingHeuristics = findSummaryUsingHeuristics;
    
    // 将函数注册到模块中
    QQMobile.modules.formatParser.extractValidInfo = extractValidInfo;
    QQMobile.modules.formatParser.convertExtractedToStandard = convertExtractedToStandard;
    QQMobile.modules.formatParser.repairFormat = repairFormat;
    QQMobile.modules.formatParser.findTableData = findTableData;
    QQMobile.modules.formatParser.findSummaryUsingUserPatterns = findSummaryUsingUserPatterns;
    QQMobile.modules.formatParser.findSummaryUsingHeuristics = findSummaryUsingHeuristics;
    
    // 触发模块加载完成事件
    QQMobile.events.emit('module:loaded', 'formatParser');
    
    console.log('✅ 格式解析模块已加载');
})();