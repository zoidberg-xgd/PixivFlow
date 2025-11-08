#!/usr/bin/env node

/**
 * PixivFlow - 自动生成社交预览图片
 * 使用 Puppeteer 自动截图预览模板
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了 puppeteer
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('❌ 错误: 未安装 puppeteer');
  console.log('');
  console.log('📦 请先安装 puppeteer:');
  console.log('   npm install --save-dev puppeteer');
  console.log('');
  console.log('或者使用手动截图方法:');
  console.log('   1. 打开 .github/social-preview.html');
  console.log('   2. 使用浏览器开发者工具截图');
  console.log('   3. 保存为 1280x640 像素的 PNG 或 JPG');
  process.exit(1);
}

async function capturePreview() {
  const htmlPath = path.join(__dirname, 'social-preview.html');
  const outputPath = path.join(__dirname, 'social-preview.png');
  
  // 检查 HTML 文件是否存在
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ 错误: 找不到预览模板文件: ${htmlPath}`);
    process.exit(1);
  }

  console.log('🚀 正在启动浏览器...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 设置视口大小为 1280x640
    await page.setViewport({
      width: 1280,
      height: 640,
      deviceScaleFactor: 1
    });

    // 加载 HTML 文件
    const fileUrl = `file://${htmlPath}`;
    console.log(`📄 正在加载预览模板: ${fileUrl}`);
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 等待页面完全加载（使用 Promise 替代废弃的 waitForTimeout）
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 等待预览容器元素加载
    await page.waitForSelector('.preview-container', { timeout: 5000 });

    // 确保说明框已隐藏（避免出现在截图中）
    await page.evaluate(() => {
      const instructions = document.getElementById('instructions');
      if (instructions) {
        instructions.style.display = 'none';
      }
    });

    // 截图预览容器
    console.log('📸 正在截图...');
    const element = await page.$('.preview-container');
    if (element) {
      // 获取元素的位置和尺寸
      const box = await element.boundingBox();
      if (box) {
        // 确保截图为 1280x640
        await element.screenshot({
          path: outputPath,
          // 如果元素尺寸不是 1280x640，使用 clip 调整
          clip: box.width === 1280 && box.height === 640 ? undefined : {
            x: 0,
            y: 0,
            width: 1280,
            height: 640
          }
        });
      } else {
        await element.screenshot({ path: outputPath });
      }
    } else {
      // 如果找不到元素，截取整个页面
      await page.screenshot({
        path: outputPath,
        width: 1280,
        height: 640,
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 640
        }
      });
    }

    console.log(`✅ 预览图片已生成: ${outputPath}`);
    console.log('');
    console.log('📤 下一步:');
    console.log('   1. 访问: https://github.com/zoidberg-xgd/pixivflow/settings');
    console.log('   2. 找到 "Social preview" 部分');
    console.log('   3. 上传生成的图片: social-preview.png');
    
  } catch (error) {
    console.error('❌ 截图失败:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// 运行截图
capturePreview().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});

