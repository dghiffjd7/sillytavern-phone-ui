/**
 * 手机QQ界面 - 互动检测系统模块
 * 负责检测用户互动意图和处理互动内容
 */

(function() {
    'use strict';
    
    // 注册模块
    QQMobile.modules.interactionSystem = {
        name: '互动检测系统',
        version: '1.0.0',
        dependencies: ['core/namespace']
    };
    
    /**
     * 互动触发符号列表
     */
    const INTERACTIVE_TRIGGER_SYMBOLS = ['&&', '＆＆', '&amp;&amp;'];
    
    /**
     * 默认关键词分类
     */
    const DEFAULT_KEYWORDS = {
        // 身体接触类关键词
        physicalContact: [
            '拥抱', '抱住', '搂抱', '紧抱',
            '亲吻', 
            '触摸', '抚摸', '轻抚', 
            '握手', '牵手', '拉手', 
            '拍肩', '拍背', '轻拍', 
            '推', '拉', '扶', '搀扶', '扶着',
            '贴近', '靠近', '紧贴'
        ],
        
        // 面对面互动类关键词
        faceToFace: [
            '面对面', '当面', '面前', '眼神交流', '对视', '凝视',
            '现实中', '真实中', '现实里', '面对着',
            '走向', '走近', '走过去', '过来', '靠过来',
            '坐过来', '坐在身边', '坐在旁边',
            '躺着', '趴下', '我來了',
            '蹲下', '跪下', '弯腰', '俯身'
        ],
        
        // 情感表达类关键词
        emotional: [
            '心跳', '颤抖',
            '微笑', '笑容', '高兴', '激动',
            '哭', '流泪', '哭泣', '眼泪', '哽咽',
            '愤怒', '恼火', '瞪眼',
            '体贴', '呵护'
        ],
        
        // 动作描述类关键词
        action: [
            '伸手', '张开手', '举手', '挥手', '招手',
            '转身', '回头', '侧身',
            '仰头', '俯视', '仰视',
            '踮脚', '跳跃', '跑过来', '冲过来'
        ]
    };
    
    /**
     * 检测用户互动意图
     * @param {string} content - 用户输入内容
     * @returns {Object|false} 互动检测结果
     */
    function detectInteractiveIntent(content) {
        if (!content || typeof content !== 'string') return false;
        
        const originalText = content.trim();
        const text = content.toLowerCase().trim();
        
        // 优先检测：特殊符号触发
        for (const symbol of INTERACTIVE_TRIGGER_SYMBOLS) {
            if (originalText.includes(symbol)) {
                console.log(`🎯 检测到互动触发符号: ${symbol}`);
                
                // 清理符号后的内容作为互动描述
                let cleanContent = originalText;
                INTERACTIVE_TRIGGER_SYMBOLS.forEach(sym => {
                    cleanContent = cleanContent.replace(
                        new RegExp(sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                        ''
                    );
                });
                cleanContent = cleanContent.trim();
                
                return {
                    isInteractive: true,
                    triggerType: 'symbol',
                    triggerSymbol: symbol,
                    cleanContent: cleanContent || '想要进行互动',
                    description: '用户使用特殊符号主动请求互动内容'
                };
            }
        }
        
        // 检查用户设置：是否启用关键词触发
        const interactiveSettings = getInteractiveSettings();
        
        if (!interactiveSettings.enableKeywordTrigger) {
            console.log('⚙️ 关键词触发已被用户禁用，跳过关键词检测');
            return false;
        }
        
        // 检测用户自定义关键词
        if (interactiveSettings.customKeywords && interactiveSettings.customKeywords.length > 0) {
            for (const keyword of interactiveSettings.customKeywords) {
                if (keyword && text.includes(keyword.toLowerCase())) {
                    console.log(`🎯 检测到用户自定义关键词: ${keyword}`);
                    
                    return {
                        isInteractive: true,
                        triggerType: 'custom_keyword',
                        triggerKeyword: keyword,
                        cleanContent: originalText,
                        description: `用户自定义关键词"${keyword}"触发互动内容`
                    };
                }
            }
        }
        
        // 检测默认关键词（如果用户启用）
        if (interactiveSettings.enableDefaultKeywords) {
            const allKeywords = [
                ...DEFAULT_KEYWORDS.physicalContact,
                ...DEFAULT_KEYWORDS.faceToFace,
                ...DEFAULT_KEYWORDS.emotional,
                ...DEFAULT_KEYWORDS.action
            ];
            
            for (const keyword of allKeywords) {
                if (text.includes(keyword)) {
                    console.log(`🎯 检测到默认关键词: ${keyword}`);
                    
                    // 确定关键词类型
                    let keywordType = 'unknown';
                    if (DEFAULT_KEYWORDS.physicalContact.includes(keyword)) {
                        keywordType = 'physical_contact';
                    } else if (DEFAULT_KEYWORDS.faceToFace.includes(keyword)) {
                        keywordType = 'face_to_face';
                    } else if (DEFAULT_KEYWORDS.emotional.includes(keyword)) {
                        keywordType = 'emotional';
                    } else if (DEFAULT_KEYWORDS.action.includes(keyword)) {
                        keywordType = 'action';
                    }
                    
                    return {
                        isInteractive: true,
                        triggerType: 'default_keyword',
                        triggerKeyword: keyword,
                        keywordType: keywordType,
                        cleanContent: originalText,
                        description: `默认关键词"${keyword}"触发互动内容`
                    };
                }
            }
        }
        
        return false;
    }
    
    /**
     * 严格的互动内容检测
     * 三种触发情况的控制
     */
    function isInteractiveContent(content, isNoFormatResponse = false) {
        console.log('🔍 开始严格的互动内容检测...');
        console.log('🔍 检测参数 - isNoFormatResponse:', isNoFormatResponse, 
                   'QQ_UserTriggeredInteractive:', QQMobile.state.userTriggeredInteractive);
        
        // 情况2和3：用户主动触发（&&符号或关键词匹配）
        if (QQMobile.state.userTriggeredInteractive && hasContentTag(content)) {
            console.log('🎯 【情况2/3】用户主动触发互动（&&或关键词）且AI回复包含content标签');
            
            // 提取content内容
            const contentText = cleanContentTags(content);
            if (!contentText || contentText.trim().length === 0) {
                console.log('❌ content标签为空，不符合互动内容标准');
                return false;
            }
            
            console.log('✅ 用户主动触发且content有效，直接识别为互动内容');
            return true;
        }
        
        // 情况1：AI没有回复线上格式（惊喜机制）
        if (isNoFormatResponse && hasContentTag(content)) {
            console.log('🔍 【情况1】AI没有回复线上格式，检查content标签中是否包含聊天标签...');
            
            // 提取并清理content内容
            const contentText = cleanContentTags(content);
            if (!contentText || contentText.trim().length === 0) {
                console.log('❌ content标签为空，不符合互动内容标准');
                return false;
            }
            
            console.log('📝 提取的content内容长度:', contentText.length);
            
            // 严格检查content标签内是否包含任何聊天格式标签
            const chatTagPatterns = [
                // 群聊标签
                /<群聊[：:][^>]+>/g,
                /<群聊[^>]*>/g,
                // 私聊标签  
                /<[^>]*和[^>]*的?(?:私聊|聊天)[^>]*>/g,
                /<[^>]*和[^>]*(?:私聊|聊天)[^>]*>/g,
                // 动态标签
                /moment_start|moment_end/g,
                // 其他消息格式标签
                /msg_start|msg_end/g,
                // QQ空间相关标签
                /<QQ空间[^>]*>/g,
                // 使用者相关标签
                /<使用者[^>]*>/g,
                // MiPhone格式标签
                /MiPhone_JSON_START|MiPhone_JSON_END/g,
            ];
            
            let hasAnyFormatTag = false;
            for (const pattern of chatTagPatterns) {
                if (pattern.test(contentText)) {
                    hasAnyFormatTag = true;
                    console.log(`✅ 在content中发现聊天格式标签: ${pattern.source}`);
                    break;
                }
            }
            
            if (hasAnyFormatTag) {
                console.log('❌ content中包含聊天标签，应通过格式提取处理，不是互动内容');
                return false;
            }
            
            console.log('🎉 content中没有聊天标签，验证是否为有效互动内容...');
            
            // 验证互动内容特征
            const isValidInteractiveContent = validateInteractiveContentFeatures(contentText);
            if (isValidInteractiveContent) {
                console.log('✅ 【情况1】确认为有效的互动内容');
                return true;
            } else {
                console.log('❌ 【情况1】不符合互动内容特征');
                return false;
            }
        }
        
        // 绝对不触发的情况
        console.log('❌ 不符合任何触发条件，不是互动内容');
        console.log('❌ 检查结果:');
        console.log('   - 用户主动触发:', QQMobile.state.userTriggeredInteractive);
        console.log('   - AI没有回复格式:', isNoFormatResponse);
        console.log('   - 包含content标签:', hasContentTag(content));
        
        return false;
    }
    
    /**
     * 验证互动内容特征
     */
    function validateInteractiveContentFeatures(content) {
        console.log('🔍 开始验证互动内容特征...');
        console.log('📝 待验证内容长度:', content ? content.length : 0);
        console.log('📝 待验证内容预览:', content ? content.substring(0, 200) + (content.length > 200 ? '...' : '') : '空内容');
        
        // 排除明显不是互动内容的情况
        if (!content || content.trim().length < 10) {
            console.log('❌ 内容过短或为空');
            return false;
        }
        
        // 排除明显的错误信息和系统消息
        const excludePatterns = [
            /(?:系统)?错误|error|exception|操作失败|请求失败|网络错误|连接失败/i,
            /<(div|span|p|br|img|a|script|style|meta|head|body)[^>]*>/i,  // 真正的HTML结构标签
            /```/,      // 代码块
            /https?:\/\//,  // URL链接
            /(?:AI_SYSTEM|detected|activated|review|disabled|ethical|restriction)/i, // AI系统信息
        ];
        
        // 增强排除检查
        for (let i = 0; i < excludePatterns.length; i++) {
            const pattern = excludePatterns[i];
            if (pattern.test(content)) {
                const reasons = [
                    '包含系统错误信息',
                    '包含HTML结构标签',
                    '包含代码块',
                    '包含URL链接',
                    '包含AI系统信息'
                ];
                console.log(`❌ 内容被排除，原因: ${reasons[i]} (模式: ${pattern.source})`);
                console.log(`❌ 匹配的内容片段: ${content.match(pattern)?.[0] || '未知'}`);
                return false;
            }
        }
        
        // 互动内容特征模式（必须匹配至少2个）
        const interactivePatterns = [
            /\*[^*]+\*/,  // *动作描述*
            /（[^）]*(?:互动|接触|触摸|拥抱|亲吻|抚摸|牵手)[^）]*）/,  // 具体互动动作
            /【[^】]*(?:情感|心情|想法|内心)[^】]*】/,  // 情感/内心描述
            /(?:现实中|面对面|当面|实际上|真实)/,  // 现实相关
            /(?:身体|眼神|表情|姿态|动作|手势|声音|呼吸)/,  // 身体相关
            /(?:轻轻|慢慢|缓缓|悄悄|小心翼翼|温柔)[地的]/,  // 动作副词
            /(?:靠近|远离|转身|抬头|低头|闭眼|睁眼)/,  // 具体动作
            /(?:感觉到|意识到|注意到|发现|察觉)/,  // 感知相关
            /(?:氛围|环境|周围|空气中)/,  // 环境描述
        ];
        
        // 计算匹配的模式数量
        const matchCount = interactivePatterns.reduce((count, pattern) => {
            const matches = content.match(pattern);
            if (matches) {
                console.log(`✅ 匹配互动特征: ${pattern.source} -> ${matches[0]}`);
                return count + 1;
            }
            return count;
        }, 0);
        
        console.log(`📊 互动特征匹配数量: ${matchCount}/需要至少2个`);
        
        // 需要至少匹配2个特征才认为是有效的互动内容
        const isValidInteractive = matchCount >= 2;
        
        if (isValidInteractive) {
            console.log('✅ 内容符合互动内容特征标准');
        } else {
            console.log('❌ 内容不符合互动内容特征标准');
        }
        
        return isValidInteractive;
    }
    
    /**
     * 处理互动内容
     */
    async function handleInteractiveContent(content, characterName) {
        console.log('🎭 开始处理互动内容...');
        
        try {
            // 确保角色空间独立性
            ensureCharacterSpaceIndependence(characterName);
            
            // 提取content内容
            let interactiveText = cleanContentTags(content);
            
            if (!interactiveText) {
                // 如果没有content标签，直接使用整个内容
                interactiveText = content;
            }
            
            // 清理多余标签
            interactiveText = QQMobile.modules.utils.cleanNestedTags(interactiveText);
            
            // 输出到互动空间
            await outputToInteractiveSpace(interactiveText, characterName);
            
            console.log('✅ 互动内容处理完成');
            
        } catch (error) {
            console.error('❌ 互动内容处理失败:', error);
            throw error;
        }
    }
    
    /**
     * 输出内容到互动空间
     */
    async function outputToInteractiveSpace(content, characterName) {
        console.log(`📤 输出内容到 ${characterName} 的互动空间`);
        
        try {
            // 确保角色互动空间存在
            if (!QQMobile.data.interactiveSpaces[characterName]) {
                QQMobile.data.interactiveSpaces[characterName] = [];
            }
            
            // 创建互动记录
            const interactiveRecord = {
                id: QQMobile.utils.generateId(),
                timestamp: new Date().toISOString(),
                content: content,
                characterName: characterName,
                type: 'ai_interactive'
            };
            
            // 保存到互动空间
            QQMobile.data.interactiveSpaces[characterName].push(interactiveRecord);
            
            // 限制记录数量（防止内存溢出）
            const maxRecords = 100;
            if (QQMobile.data.interactiveSpaces[characterName].length > maxRecords) {
                QQMobile.data.interactiveSpaces[characterName] = 
                    QQMobile.data.interactiveSpaces[characterName].slice(-maxRecords);
            }
            
            // 触发事件
            QQMobile.events.emit('interactive:content:added', {
                characterName,
                content,
                record: interactiveRecord
            });
            
            console.log('✅ 内容已输出到互动空间');
            
        } catch (error) {
            console.error('❌ 输出到互动空间失败:', error);
            throw error;
        }
    }
    
    /**
     * 确保角色空间独立性
     */
    function ensureCharacterSpaceIndependence(characterName) {
        if (!characterName) {
            console.warn('⚠️ 角色名为空，无法确保空间独立性');
            return false;
        }
        
        // 确保每个角色都有独立的空间对象
        if (!QQMobile.data.characterSpaces[characterName]) {
            QQMobile.data.characterSpaces[characterName] = {};
            console.log(`为角色 "${characterName}" 创建了独立的互动空间容器`);
        }
        
        // 验证独立性 - 确保不会引用其他角色的数据
        const characterSpace = QQMobile.data.characterSpaces[characterName];
        const allCharacters = Object.keys(QQMobile.data.characterSpaces);
        
        for (const otherChar of allCharacters) {
            if (otherChar !== characterName && 
                QQMobile.data.characterSpaces[otherChar] === characterSpace) {
                console.error(`检测到角色空间数据引用冲突: ${characterName} 和 ${otherChar} 共享同一个对象`);
                QQMobile.data.characterSpaces[characterName] = {};
                console.log(`已为角色 "${characterName}" 重新创建独立的空间对象`);
                break;
            }
        }
        
        return true;
    }
    
    /**
     * 获取互动设置
     */
    function getInteractiveSettings() {
        return QQMobile.config.interactive;
    }
    
    /**
     * 检查是否有content标签
     */
    function hasContentTag(content) {
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
            return contentMatch[1].trim();
        }
        
        // 尝试简单的content标签
        const simpleMatch = content.match(/<content[^>]*>([\s\S]*?)$/i);
        if (simpleMatch) {
            return simpleMatch[1].trim();
        }
        
        return content;
    }
    
    // 导出函数到全局作用域（向后兼容）
    window.QQ_DetectInteractiveIntent = detectInteractiveIntent;
    window.QQ_IsInteractiveContent = isInteractiveContent;
    window.QQ_HandleInteractiveContent = handleInteractiveContent;
    window.QQ_ValidateInteractiveContentFeatures = validateInteractiveContentFeatures;
    window.QQ_EnsureCharacterSpaceIndependence = ensureCharacterSpaceIndependence;
    window.QQ_GetInteractiveSettings = getInteractiveSettings;
    window.QQ_HasContentTag = hasContentTag;
    window.QQ_CleanContentTags = cleanContentTags;
    
    // 将函数注册到模块中
    QQMobile.modules.interactionSystem.detectInteractiveIntent = detectInteractiveIntent;
    QQMobile.modules.interactionSystem.isInteractiveContent = isInteractiveContent;
    QQMobile.modules.interactionSystem.handleInteractiveContent = handleInteractiveContent;
    QQMobile.modules.interactionSystem.outputToInteractiveSpace = outputToInteractiveSpace;
    QQMobile.modules.interactionSystem.ensureCharacterSpaceIndependence = ensureCharacterSpaceIndependence;
    QQMobile.modules.interactionSystem.getInteractiveSettings = getInteractiveSettings;
    QQMobile.modules.interactionSystem.hasContentTag = hasContentTag;
    QQMobile.modules.interactionSystem.cleanContentTags = cleanContentTags;
    
    // 触发模块加载完成事件
    QQMobile.events.emit('module:loaded', 'interactionSystem');
    
    console.log('✅ 互动检测系统模块已加载');
})();