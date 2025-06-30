/**
 * 手机QQ界面 - AI回复处理核心模块
 * 负责处理AI回复的六级优先级处理机制
 */

(function() {
    'use strict';
    
    // 注册模块
    QQMobile.modules.aiResponseHandler = {
        name: 'AI回复处理器',
        version: '1.0.0',
        dependencies: ['core/namespace']
    };
    
    /**
     * AI回复处理主控制器
     * 实现六级优先级处理机制
     */
    async function ResultHandle(result, isRetry = false) {
        const ns = QQMobile;
        console.log(`🎯 开始AI回复处理 - 严格优先级模式`, { 
            isRetry, 
            retryCount: ns.state.retryCount 
        });
        
        // *** 优先级0：空回复处理（立即return） ***
        if (!result) {
            console.log("🔍 优先级0：检测到空回复");
            return await handleEmptyResponse(isRetry);
        }
        
        // 清理和预处理
        result = System_TagCompletion(result);
        result = QQMobile.modules.utils.cleanNestedTags(result);
        console.log(`清理后的结果:\n${result.substring(0, 200)}...`);

        // *** 优先级1：严格匹配完整标签 ***
        console.log("🔍 优先级1：开始严格匹配完整标签");
        const strictResult = await processStrictFormat(result);
        if (strictResult.success) {
            console.log("✅ 优先级1成功：严格匹配处理完成");
            return await handleSuccess();
        }
        
        if (strictResult.shouldRetry && !isRetry && ns.state.retryCount < ns.state.maxRetry) {
            return await executeRetry();
        }
        
        // *** 优先级2：模糊/修复匹配 ***
        console.log("🔍 优先级2：开始模糊/修复匹配");
        const fuzzyResult = await processFuzzyRepair(result);
        if (fuzzyResult.success) {
            console.log("✅ 优先级2成功：模糊/修复匹配处理完成");
            return await handleSuccess();
        }
        
        // *** 优先级3：互动内容检测 ***
        console.log("🔍 优先级3：开始互动内容检测");
        const interactiveResult = await processInteractiveContent(result);
        if (interactiveResult.success) {
            console.log("✅ 优先级3成功：互动内容处理完成");
            return await handleSuccess();
        }
        
        // *** 优先级4：智能提取有效信息 ***
        console.log("🔍 优先级4：开始智能提取有效信息");
        const extractResult = await processValidExtraction(result);
        if (extractResult.success) {
            console.log("✅ 优先级4成功：智能提取处理完成");
            return await handleSuccess();
        }
        
        // *** 优先级5：content标签检查 ***
        console.log("🔍 优先级5：开始content标签检查");
        const contentResult = await processContentTag(result);
        if (contentResult.success) {
            console.log("✅ 优先级5成功：content标签处理完成");
            return await handleSuccess();
        }
        
        // *** 优先级6：重传机制（最后手段） ***
        console.log("🔍 优先级6：开始重传机制（最后手段）");
        if (!isRetry && ns.state.retryCount < ns.state.maxRetry) {
            return await executeRetry();
        } else {
            console.log('❌ 所有优先级处理都失败，已放弃处理');
            triggerSlash("/echo AI回复内容无法识别，已放弃处理");
            resetRetry();
        }
    }
    
    /**
     * 处理空回复
     */
    async function handleEmptyResponse(isRetry) {
        const ns = QQMobile;
        
        if (!isRetry && ns.state.retryCount < ns.state.maxRetry) {
            ns.state.retryCount++;
            console.log(`AI空回复，开始第${ns.state.retryCount}次重试`);
            triggerSlash(`/echo AI空回复，正在重试... (${ns.state.retryCount}/${ns.state.maxRetry})`);
            
            if (ns.state.lastRequest) {
                ns.state.isGenerating = true;
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000 + ns.state.retryCount * 500));
                    const retryResult = await QQ_Gen(ns.state.lastRequest);
                    return await ResultHandle(retryResult, true);
                } finally {
                    ns.state.isGenerating = false;
                }
            }
        } else {
            if (ns.state.retryCount >= ns.state.maxRetry) {
                triggerSlash("/echo AI连续空回复，可能存在问题，已停止重试");
            } else {
                triggerSlash("/echo 空回复了");
            }
            resetRetry();
        }
    }
    
    /**
     * 处理成功情况
     */
    async function handleSuccess() {
        resetRetry();
        QQ_UpdateNewTips();
        await QQ_Save_Chat_Backup();
        
        // 触发成功事件
        QQMobile.events.emit('ai:response:success');
    }
    
    /**
     * 执行重试
     */
    async function executeRetry() {
        const ns = QQMobile;
        ns.state.retryCount++;
        console.log(`所有处理方式失败，开始第${ns.state.retryCount}次重试`);
        triggerSlash(`/echo 内容无法识别，正在重新生成... (${ns.state.retryCount}/${ns.state.maxRetry})`);
        
        if (ns.state.lastRequest) {
            ns.state.isGenerating = true;
            try {
                await new Promise(resolve => setTimeout(resolve, 1000 + ns.state.retryCount * 500));
                const retryResult = await QQ_Gen(ns.state.lastRequest);
                return await ResultHandle(retryResult, true);
            } finally {
                ns.state.isGenerating = false;
            }
        }
    }
    
    /**
     * 重置重试状态
     */
    function resetRetry() {
        QQMobile.state.retryCount = 0;
    }
    
    /**
     * 严格格式匹配处理
     */
    async function processStrictFormat(result) {
        const strictFormatPatterns = [
            /MiPhone_start([\s\S]+?)MiPhone_end/g,
            /MiPhone_JSON_START([\s\S]+?)MiPhone_JSON_END/g,
            /MiPhone_JSON_start([\s\S]+?)MiPhone_JSON_end/g,
            /MiPhone_START([\s\S]+?)MiPhone_END/g
        ];
        
        console.log("📋 开始严格格式匹配检查...");
        
        for (const pattern of strictFormatPatterns) {
            const matches = [...result.matchAll(pattern)];
            if (matches.length > 0) {
                console.log(`✅ 找到 ${matches.length} 个严格格式匹配`);
                
                try {
                    for (const match of matches) {
                        const content = match[1].trim();
                        console.log("📤 严格格式内容长度:", content.length);
                        
                        // 验证内容并转换
                        const convertedResult = await QQMobile.modules.formatParser.convertExtractedToStandard({
                            hasValidInfo: true,
                            rawContent: content,
                            extractionMethod: 'strict_format'
                        });
                        
                        if (convertedResult) {
                            await QQ_Msg_Parse(JSON.stringify(convertedResult));
                            return { success: true };
                        }
                    }
                } catch (error) {
                    console.error("❌ 严格格式处理失败:", error);
                    return { success: false, shouldRetry: true };
                }
            }
        }
        
        console.log("❌ 未找到任何严格格式标签");
        return { success: false, shouldRetry: false };
    }
    
    /**
     * 模糊修复匹配处理
     */
    async function processFuzzyRepair(result) {
        console.log("🔧 开始模糊匹配和格式修复...");
        
        try {
            // 检查是否包含部分格式标签
            const partialPatterns = [
                /MiPhone_start/i,
                /MiPhone_end/i,
                /私聊.*?:/,
                /群聊.*?:/,
                /QQ空间/
            ];
            
            let hasPartialFormat = false;
            for (const pattern of partialPatterns) {
                if (pattern.test(result)) {
                    hasPartialFormat = true;
                    console.log(`🔍 检测到部分格式: ${pattern.source}`);
                    break;
                }
            }
            
            if (hasPartialFormat) {
                // 尝试修复格式
                const repairedContent = await QQMobile.modules.formatParser.repairFormat(result);
                if (repairedContent) {
                    await QQ_Msg_Parse(repairedContent);
                    return { success: true };
                }
            }
            
        } catch (error) {
            console.error("❌ 模糊匹配处理失败:", error);
        }
        
        return { success: false };
    }
    
    /**
     * 互动内容处理
     */
    async function processInteractiveContent(result) {
        // 检查是否为互动内容
        const isInteractive = QQMobile.modules.interactionSystem.isInteractiveContent(
            result, 
            true // isNoFormatResponse = true
        );
        
        if (isInteractive) {
            console.log("🎭 确认为互动内容，开始处理...");
            
            try {
                await QQMobile.modules.interactionSystem.handleInteractiveContent(
                    result, 
                    QQMobile.state.lastRequestName
                );
                return { success: true };
            } catch (error) {
                console.error("❌ 互动内容处理失败:", error);
            }
        }
        
        return { success: false };
    }
    
    /**
     * 智能信息提取
     */
    async function processValidExtraction(result) {
        console.log("🧠 开始智能信息提取...");
        
        try {
            const extractedInfo = await QQMobile.modules.formatParser.extractValidInfo(result);
            
            if (extractedInfo && extractedInfo.hasValidInfo) {
                console.log("✅ 智能提取发现有效信息");
                
                const convertedResult = await QQMobile.modules.formatParser.convertExtractedToStandard(extractedInfo);
                if (convertedResult) {
                    await QQ_Msg_Parse(JSON.stringify(convertedResult));
                    return { success: true };
                }
            }
        } catch (error) {
            console.error("❌ 智能信息提取失败:", error);
        }
        
        return { success: false };
    }
    
    /**
     * content标签处理
     */
    async function processContentTag(result) {
        console.log("📝 开始content标签处理...");
        
        try {
            if (QQMobile.modules.utils.hasContentTag(result)) {
                const contentText = QQMobile.modules.utils.cleanContentTags(result);
                
                if (contentText && contentText.trim().length > 50) {
                    console.log("✅ 发现有效的content标签内容");
                    
                    // 输出到互动空间
                    await QQMobile.modules.interactionSystem.outputToInteractiveSpace(
                        contentText,
                        QQMobile.state.lastRequestName || '未知角色'
                    );
                    
                    return { success: true };
                }
            }
        } catch (error) {
            console.error("❌ content标签处理失败:", error);
        }
        
        return { success: false };
    }
    
    /**
     * 消息保存和上下文净化
     */
    async function QQ_Save_Msg(msg) {
        if (!msg || msg.trim() === "") {
            console.warn('⚠️ 收到的消息为空，已跳过所有处理。');
            return;
        }
        
        console.log('✅ 收到新消息，开始最终处理流程...');

        try {
            // 步骤1: 解析并备份UI数据
            if (await QQ_Msg_Parse(msg)) {
                console.log('✅ 消息解析成功，触发聊天记录备份...');
                await QQ_Save_Chat_Backup();
            } else {
                console.warn('⚠️ 消息未包含有效聊天内容，跳过聊天记录备份。');
            }
        } catch (error) {
            console.error('❌ 在解析和备份UI数据时发生严重错误:', error);
        }

        try {
            // 步骤2: 净化AI回复以优化上下文
            const aiRawResponse = msg;

            // 安全检查
            const isFunctionalMessage = [
                'MiPhone_Start',
                '<msg_start>',
                '<moment_start>',
                '<discord_start>'
            ].some(tag => aiRawResponse.includes(tag));

            if (isFunctionalMessage) {
                console.log('✅ 检测到功能性标签，跳过上下文净化');
                return;
            }

            // 四层上下文净化系统
            console.log('消息为纯对话，开始执行上下文净化...');
            let cleanSummaryText = null;

            // 第一层: 查找表格化数据
            cleanSummaryText = QQMobile.modules.utils.findTableData(aiRawResponse);
            
            // 第二层: 查找用户自定义的摘要格式
            if (!cleanSummaryText) {
                cleanSummaryText = QQMobile.modules.utils.findSummaryUsingUserPatterns(aiRawResponse);
            }
            
            // 第三层: 查找通用的启发式摘要格式
            if (!cleanSummaryText) {
                cleanSummaryText = QQMobile.modules.utils.findSummaryUsingHeuristics(aiRawResponse);
            }
            
            // 第四层: 前端生成机械式总结
            if (!cleanSummaryText) {
                cleanSummaryText = QQMobile.modules.utils.createHistorySummary(
                    QQMobile.state.lastAiNewMessages || {}
                );
            }
            
            if (!cleanSummaryText || cleanSummaryText.trim() === "") {
                cleanSummaryText = "[AI进行了操作，但未生成有效上下文]";
                console.log('⚠️ 四层净化全部失败，使用默认文本。');
            }

            // 步骤3: 更新上下文
            const context = await ST.GetContext();
            const turnNumber = context.turn;
            
            const summaryMessageObject = System_TagCompletion([{
                "is_user": false,
                "is_name": true,
                "send_date": 0,
                "name": charcardname,
                "msg": cleanSummaryText,
            }]);

            console.log(`✅ 净化完成，准备使用摘要更新第 ${turnNumber} 回合的上下文。`);
            await setChatMessage(summaryMessageObject, turnNumber, false);
            
            QQMobile.state.lastAiNewMessages = {};

        } catch (error) {
            console.error('❌ 在净化和重写AI上下文时发生严重错误:', error);
        }
    }
    
    // 导出主要函数到全局作用域（向后兼容）
    window.ResultHandle = ResultHandle;
    window.QQ_Save_Msg = QQ_Save_Msg;
    
    // 将函数注册到模块中
    QQMobile.modules.aiResponseHandler.ResultHandle = ResultHandle;
    QQMobile.modules.aiResponseHandler.QQ_Save_Msg = QQ_Save_Msg;
    
    // 触发模块加载完成事件
    QQMobile.events.emit('module:loaded', 'aiResponseHandler');
    
    console.log('✅ AI回复处理模块已加载');
})();