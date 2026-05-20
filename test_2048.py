"""
2048游戏自动化测试脚本
使用browser-use进行功能测试
"""
import asyncio
import os
from datetime import datetime
from browser_use import Agent, Browser
from browser_use import ChatBrowserUse
import json

# 测试配置
GAME_PATH = r"c:\Users\Administrator\Desktop\520\index.html"
REPORT_PATH = r"c:\Users\Administrator\Desktop\520\2048_TEST_REPORT.md"
FILE_URL = f"file:///{GAME_PATH.replace(chr(92), '/')}"

# 测试结果存储
test_results = {
    "test_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "test_environment": "Windows, Browser-Use Automated Testing",
    "test_cases": [],
    "defects": [],
    "screenshots": []
}

def add_test_result(test_name, test_step, expected, actual, status, notes=""):
    """记录测试结果"""
    test_results["test_cases"].append({
        "test_name": test_name,
        "test_step": test_step,
        "expected": expected,
        "actual": actual,
        "status": status,
        "notes": notes
    })

def add_defect(test_id, description, severity, priority, steps):
    """记录缺陷"""
    test_results["defects"].append({
        "test_id": test_id,
        "description": description,
        "severity": severity,
        "priority": priority,
        "steps": steps
    })

async def test_game_initialization(agent):
    """测试1: 游戏初始化"""
    print("正在测试：游戏初始化...")
    try:
        # 打开游戏页面
        await agent.run("打开文件 c:\\Users\\Administrator\\Desktop\\520\\index.html，等待页面完全加载，检查4x4网格是否正确显示，确认初始有两个方块（值为2或4）")
        
        # 截图
        await agent.run("截图保存为 game_initial.png")
        test_results["screenshots"].append("game_initial.png")
        
        add_test_result(
            "游戏初始化",
            "打开index.html，检查4x4网格和初始方块",
            "显示4x4网格，有2个初始方块（值为2或4）",
            "需要验证",
            "待测试",
            "使用browser-use自动验证"
        )
        return True
    except Exception as e:
        print(f"游戏初始化测试失败: {e}")
        add_defect("DEF001", "游戏初始化失败", "Critical", "High", str(e))
        return False

async def test_keyboard_controls(agent):
    """测试2: 键盘控制"""
    print("正在测试：键盘控制...")
    results = {}
    
    # 测试向左移动
    try:
        await agent.run("按键盘左箭头键←，观察方块是否向左移动并合并，截图保存为 move_left.png")
        test_results["screenshots"].append("move_left.png")
        results["left"] = "通过"
        add_test_result(
            "向左移动",
            "按←键",
            "方块向左移动",
            "待验证",
            "待测试",
            ""
        )
    except Exception as e:
        results["left"] = f"失败: {e}"
        add_defect("DEF002", "向左移动功能异常", "High", "High", str(e))
    
    # 测试向右移动
    try:
        await agent.run("按键盘右箭头键→，观察方块是否向右移动并合并，截图保存为 move_right.png")
        test_results["screenshots"].append("move_right.png")
        results["right"] = "通过"
        add_test_result(
            "向右移动",
            "按→键",
            "方块向右移动",
            "待验证",
            "待测试",
            ""
        )
    except Exception as e:
        results["right"] = f"失败: {e}"
        add_defect("DEF003", "向右移动功能异常", "High", "High", str(e))
    
    # 测试向上移动
    try:
        await agent.run("按键盘上箭头键↑，观察方块是否向上移动并合并，截图保存为 move_up.png")
        test_results["screenshots"].append("move_up.png")
        results["up"] = "通过"
        add_test_result(
            "向上移动",
            "按↑键",
            "方块向上移动",
            "待验证",
            "待测试",
            ""
        )
    except Exception as e:
        results["up"] = f"失败: {e}"
        add_defect("DEF004", "向上移动功能异常", "High", "High", str(e))
    
    # 测试向下移动
    try:
        await agent.run("按键盘下箭头键↓，观察方块是否向下移动并合并，截图保存为 move_down.png")
        test_results["screenshots"].append("move_down.png")
        results["down"] = "通过"
        add_test_result(
            "向下移动",
            "按↓键",
            "方块向下移动",
            "待验证",
            "待测试",
            ""
        )
    except Exception as e:
        results["down"] = f"失败: {e}"
        add_defect("DEF005", "向下移动功能异常", "High", "High", str(e))
    
    return results

async def test_score_calculation(agent):
    """测试3: 分数计算"""
    print("正在测试：分数计算...")
    try:
        await agent.run("进行多次移动操作，观察分数是否正确计算（分数=合并方块数字之和），截图保存为 score_test.png")
        test_results["screenshots"].append("score_test.png")
        
        add_test_result(
            "分数计算",
            "进行多次合并操作",
            "分数正确累加",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF006", "分数计算异常", "High", "High", str(e))
        return False

async def test_new_game(agent):
    """测试4: 新游戏功能"""
    print("正在测试：新游戏...")
    try:
        await agent.run("点击'New Game'按钮，观察游戏是否重置（分数归零，网格清空重新生成2个方块），截图保存为 new_game.png")
        test_results["screenshots"].append("new_game.png")
        
        add_test_result(
            "新游戏功能",
            "点击New Game按钮",
            "游戏重置",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF007", "新游戏功能异常", "High", "High", str(e))
        return False

async def test_animations(agent):
    """测试5: 动画效果"""
    print("正在测试：动画效果...")
    try:
        await agent.run("观察方块移动和合并时的动画效果，检查是否流畅自然，截图保存为 animation_test.png")
        test_results["screenshots"].append("animation_test.png")
        
        add_test_result(
            "移动动画",
            "观察方块移动",
            "动画流畅",
            "待验证",
            "待测试",
            ""
        )
        add_test_result(
            "合并动画",
            "观察方块合并",
            "合并有缩放效果",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF008", "动画效果异常", "Medium", "Medium", str(e))
        return False

async def test_responsive_design(agent):
    """测试6: 响应式布局"""
    print("正在测试：响应式布局...")
    try:
        await agent.run("调整浏览器窗口大小，检查游戏布局是否自适应，截图保存为 responsive_test.png")
        test_results["screenshots"].append("responsive_test.png")
        
        add_test_result(
            "响应式布局",
            "调整窗口大小",
            "布局自适应",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF009", "响应式布局问题", "Medium", "Medium", str(e))
        return False

async def test_ui_elements(agent):
    """测试7: UI元素"""
    print("正在测试：UI元素...")
    try:
        await agent.run("检查页面UI元素：标题'SCORE'和'BEST'显示，分数数字清晰，按钮悬停有视觉反馈，截图保存为 ui_test.png")
        test_results["screenshots"].append("ui_test.png")
        
        add_test_result(
            "UI元素",
            "检查界面显示",
            "UI元素正常显示",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF010", "UI元素异常", "Low", "Low", str(e))
        return False

async def test_game_logic(agent):
    """测试8: 游戏逻辑（胜利/失败判定）"""
    print("正在测试：游戏逻辑...")
    try:
        await agent.run("进行游戏操作，观察是否能达到2048并显示胜利提示，或者无法移动时显示失败提示，截图保存为 game_over_test.png")
        test_results["screenshots"].append("game_over_test.png")
        
        add_test_result(
            "游戏逻辑",
            "进行游戏操作",
            "胜利/失败判定正确",
            "待验证",
            "待测试",
            ""
        )
        return True
    except Exception as e:
        add_defect("DEF011", "游戏逻辑异常", "High", "High", str(e))
        return False

async def generate_report():
    """生成测试报告"""
    print("正在生成测试报告...")
    
    total_tests = len(test_results["test_cases"])
    passed_tests = sum(1 for t in test_results["test_cases"] if t["status"] == "通过")
    failed_tests = total_tests - passed_tests
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    report_content = f"""# 2048游戏测试报告

## 测试概述
- **测试日期**: {test_results['test_date']}
- **测试人员**: AI Testing Agent (browser-use-0.12.6)
- **测试范围**: P0（核心玩法）、P1（用户体验）、P2（数据持久化）
- **测试环境**: {test_results['test_environment']}

## 测试结果汇总
- **总测试用例数**: {total_tests}
- **通过用例数**: {passed_tests}
- **失败用例数**: {failed_tests}
- **通过率**: {pass_rate:.2f}%

## 功能测试详情

### P0功能测试（核心玩法）
| 序号 | 测试项 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|--------|----------|----------|----------|------|------|
"""
    
    # P0功能测试
    p0_tests = [
        ("1", "游戏初始化", "打开index.html，检查4x4网格和初始方块", "显示4x4网格，有2个初始方块", "待验证", "待测试", ""),
        ("2", "向左移动", "按←键", "方块向左移动并合并", "待验证", "待测试", ""),
        ("3", "向右移动", "按→键", "方块向右移动并合并", "待验证", "待测试", ""),
        ("4", "向上移动", "按↑键", "方块向上移动并合并", "待验证", "待测试", ""),
        ("5", "向下移动", "按↓键", "方块向下移动并合并", "待验证", "待测试", ""),
        ("6", "分数计算", "进行多次合并操作", "分数正确累加", "待验证", "待测试", ""),
        ("7", "游戏逻辑", "进行游戏操作", "胜利/失败判定正确", "待验证", "待测试", ""),
        ("8", "新游戏功能", "点击New Game按钮", "游戏重置", "待验证", "待测试", ""),
    ]
    
    for test in p0_tests:
        report_content += f"| {' | '.join(test)} |\n"
    
    report_content += """
### P1功能测试（用户体验）
| 序号 | 测试项 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|--------|----------|----------|----------|------|------|
| 9 | 移动动画 | 观察方块移动 | 动画流畅 | 待验证 | 待测试 | |
| 10 | 合并动画 | 观察方块合并 | 合并有缩放效果 | 待验证 | 待测试 | |
| 11 | 响应式布局 | 调整窗口大小 | 布局自适应 | 待验证 | 待测试 | |
| 12 | UI元素 | 检查界面显示 | UI元素正常显示 | 待验证 | 待测试 | |

### P2功能测试（数据持久化）
| 序号 | 测试项 | 测试步骤 | 预期结果 | 实际结果 | 状态 | 备注 |
|------|--------|----------|----------|----------|------|------|
| 13 | 最高分保存 | 关闭并重新打开浏览器 | 最高分保持不变 | 待验证 | 待测试 | 需要手动测试 |

## 缺陷报告
### 缺陷列表
"""
    
    if test_results["defects"]:
        report_content += "| 缺陷ID | 缺陷描述 | 严重程度 | 优先级 | 复现步骤 |\n"
        report_content += "|--------|----------|----------|--------|----------|\n"
        for defect in test_results["defects"]:
            report_content += f"| {defect['test_id']} | {defect['description']} | {defect['severity']} | {defect['priority']} | {defect['steps']} |\n"
    else:
        report_content += "暂无缺陷记录\n"
    
    report_content += f"""
## 优化建议

### 性能优化
1. 确保动画帧率达到60FPS
2. 优化JavaScript执行效率
3. 减少重绘和回流操作

### 用户体验优化
1. 添加音效反馈（可选）
2. 增加成就系统（可选）
3. 添加撤销功能（可选）

### 代码优化
1. 考虑使用Web Workers处理复杂计算
2. 添加单元测试覆盖率
3. 优化资源加载顺序

## 测试截图

测试过程中生成的截图列表：
"""
    
    for screenshot in test_results["screenshots"]:
        report_content += f"- {screenshot}\n"
    
    report_content += """
## 测试结论

### 游戏状态评估
- **P0功能（核心玩法）**: 需要完整测试验证
- **P1功能（用户体验）**: 需要完整测试验证
- **P2功能（数据持久化）**: 需要手动测试验证

### 建议
1. 完成所有自动化测试后进行手动验证
2. 测试响应式布局在不同设备上的表现
3. 测试数据持久化在跨浏览器会话中的表现
4. 进行跨浏览器兼容性测试（Chrome、Firefox、Edge、Safari）

### 后续工作
1. 修复发现的缺陷
2. 优化性能和用户体验
3. 添加更多测试用例
4. 准备上线前的回归测试

## 附录

### 测试工具
- **browser-use-0.12.6**: AI驱动的智能浏览器自动化工具
- **截图工具**: 内置截图功能
- **控制台日志**: 需要在浏览器开发者工具中查看

### 相关文档
- 产品需求文档: `2048_PRD.md`
- 游戏文件: `index.html`, `css/style.css`, `js/game.js`

---

**报告生成时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**测试工具版本**: browser-use-0.12.6
"""
    
    # 保存报告
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report_content)
    
    print(f"测试报告已生成: {REPORT_PATH}")
    return report_content

async def main():
    """主测试流程"""
    print("=" * 60)
    print("2048游戏自动化测试")
    print("=" * 60)
    
    try:
        # 初始化浏览器
        print("\n初始化浏览器...")
        browser = Browser(use_cloud=False)
        
        # 初始化Agent
        print("初始化测试Agent...")
        agent = Agent(
            task=f"打开文件 {FILE_URL} 并进行2048游戏功能测试",
            llm=ChatBrowserUse(),
            browser=browser,
        )
        
        # 执行测试
        print("\n开始执行测试...\n")
        
        # 1. 游戏初始化测试
        await test_game_initialization(agent)
        
        # 2. 键盘控制测试
        await test_keyboard_controls(agent)
        
        # 3. 分数计算测试
        await test_score_calculation(agent)
        
        # 4. 新游戏功能测试
        await test_new_game(agent)
        
        # 5. 动画效果测试
        await test_animations(agent)
        
        # 6. 响应式布局测试
        await test_responsive_design(agent)
        
        # 7. UI元素测试
        await test_ui_elements(agent)
        
        # 8. 游戏逻辑测试
        await test_game_logic(agent)
        
        # 关闭浏览器
        await browser.close()
        
        # 生成报告
        print("\n生成测试报告...")
        report = await generate_report()
        
        print("\n" + "=" * 60)
        print("测试完成！")
        print("=" * 60)
        
        return test_results
        
    except Exception as e:
        print(f"\n测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        
        # 生成错误报告
        add_defect("DEF999", f"测试脚本执行错误: {e}", "Critical", "High", traceback.format_exc())
        await generate_report()
        
        return test_results

if __name__ == "__main__":
    results = asyncio.run(main())
    
    # 保存测试结果为JSON（用于后续分析）
    results_json_path = r"c:\Users\Administrator\Desktop\520\test_results.json"
    with open(results_json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n测试结果JSON已保存: {results_json_path}")
