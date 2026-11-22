# 复数几何交互实验室 / Complex Plane Explorer

面向学习复数乘法的学生。拖动复平面上的点，观察乘法带来的旋转与伸缩，并在代数、三角和矩阵表示之间切换。

An interactive lab for learning complex multiplication. Drag points to explore rotation and scaling on the complex plane, and switch between algebraic, trigonometric, and matrix representations.

React + TypeScript + Vite，无后端、无数据库、无 API 密钥。所有资源本地提供。

## 本地运行

Windows 用户可以直接双击同目录的 `启动实验室.cmd`，启动后会自动打开浏览器。使用期间保持终端窗口打开；关闭窗口会停止服务。若依赖缺失，启动文件会先联网安装依赖。

在 GitHub 上可通过 Code → Download ZIP 下载源码，解压后在项目目录打开 PowerShell。也可以先克隆仓库：

```powershell
git clone https://github.com/Bohese1379A/complex-plane-explorer.git
cd complex-plane-explorer
```

在项目目录安装依赖并启动：

```powershell
npm ci
npm run dev
```

打开终端显示的本地地址（通常为 http://127.0.0.1:5173）。需要 Node.js 20.19+ 或 22.12+；数学测试使用 Node.js 22.18+ 或 24。

```powershell
npm test
npm run build
npm run preview
```

`dist/` 为构建后的静态站点，需通过 HTTP 服务访问。不要直接双击 index.html。

## 实验导航

启动后从页面顶部选择实验。

- 复数乘法：拖动复数点，观察伸缩、旋转和网格变换。
- 围道积分：拖动圆或椭圆包围极点，用播放按钮或进度滑块观察累计积分。
- 复导数探针：切换指数函数或共轭函数，改变位移 h 的方向和长度，比较各方向的差商。
- 傅里叶调音台：混合两条正弦波，调节振幅、频率、相位、观察时长和窗函数，比较波形与单边振幅谱。

详见 [验证记录](VALIDATION.md)。


## 操作

- 拖动蓝色 z₁、橙色 z₂，或输入实部与虚部，两者同步。数值输入范围为 ±10⁶，显示采用四舍五入，计算保留浮点精度。
- 点可通过 Tab 聚焦，方向键调整 0.1，Shift + 方向键调整 0.5。
- 拖动空白处平移、滚轮或双指缩放。右上角提供缩放、适应所有向量和视图复位。
- 预设自动播放；暂停后可继续；播放结束后再次开始会重播。进度条可手动探索。播放时复数仍可调整。
- 实心绿色点始终表示真实乘积；播放时虚线绿色向量及绿色网格显示当前中间变换。重置恢复复数、显示选项、速度和视图。
- 代数、三角、矩阵标签可切换；底部有知识总结与三道可反馈选择题。

## 数学约定

乘法严格使用 `(ac − bd, ad + bc)`，角度使用 `atan2`，主辐角采用 (−π, π]。辐角加法按模 2π 成立。只有实部和虚部均为零时才判定零复数，不以显示精度判零。

动画参数 t∈[0,1]，缩放 `s(t)=1+(|z₂|−1)t`，旋转 `θ(t)=t Arg(z₂)`，将相同矩阵应用于向量与整个网格。终点使用原始乘数分量，避免三角函数带来的端点残差。乘数为零时采用纯收缩路径，终点为零矩阵，不为零指定辐角。

输入和计算采用 JavaScript 双精度浮点数；公式面板显示近似值，不是符号运算系统。
