@echo off
chcp 65001 >nul
title Complex Plane Explorer
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo 未找到 npm。请先安装 Node.js，然后重新打开此启动文件。
  pause
  exit /b 1
)
if not exist "node_modules\.bin\vite.cmd" (
  echo 首次运行，正在安装项目依赖，请保持联网并稍候……
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo 依赖安装未完成，请保留本窗口中的错误提示。
    pause
    exit /b 1
  )
)
echo 正在启动实验室，浏览器将自动打开。
echo 使用网页期间请保持本窗口打开；关闭窗口将停止网站。
echo.
call npm run dev -- --open
pause
