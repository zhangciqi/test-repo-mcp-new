import asyncio
import sys
from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI

async def test_2048_game():
    print("🔍 开始测试2048游戏部署...")

    # 初始化浏览器
    browser = Browser()

    # 创建Agent
    agent = Agent(
        task="""请访问2048游戏网站并执行以下测试任务：

        1. 首先访问页面并截图（保存为 homepage.png）
        2. 检查页面是否正常加载（检查标题是否包含2048）
        3. 检查4x4游戏网格是否显示
        4. 检查分数显示是否正常
        5. 检查是否有新游戏按钮
        6. 如果可能，尝试按方向键进行游戏
        7. 截图记录测试结果（保存为 game_test.png）
        8. 检查控制台是否有错误

        请提供详细的测试报告。""",
        llm=ChatOpenAI(model="gpt-4"),
        browser=browser,
    )

    # 运行Agent
    result = await agent.run()
    print(f"\n✅ 测试完成！结果: {result}")

    # 关闭浏览器
    await browser.close()

if __name__ == "__main__":
    try:
        asyncio.run(test_2048_game())
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        sys.exit(1)
