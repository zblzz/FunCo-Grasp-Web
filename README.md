# FIRA-Grasp 匿名项目网站

本目录是可独立部署的静态网站。内容以当前 ICRA_Latex 稿件为准；此次没有修改论文源文件。旧模板已备份到上一级的 web-template-before-redesign-20260907.tar.gz。

## 当前版本

页面使用论文原图、暖白底、淡紫／粉色／薄荷绿点缀和简洁排版。英文文案直接说明方法和实验边界，未将灵巧抓取扩大描述为已经验证的通用操作或手内操作。

包含方法、仿真比较、消融、指长变化、多样性局限及真机结果。所有交互为图片放大与原生折叠说明；没有虚构点云、假视频、示例数据或无效资源按钮。图是从当前论文 PDF 导出的栅格副本，不修改实验内容。全部网页资源同源，不使用外部字体、CDN、分析统计、社交嵌入、远程图片或登录表单。

当前数值：
- seen embodiments 平均成功率 92.40%；unseen embodiments 74.02%。
- w/o FSA 已更新为 33.90%，不是旧版 44.55%；w/o CFA 为 19.40%；同时移除为 0.95%。
- 所有本地评测方法 batch 1；0.16 s 包含编码、生成及优化或 IK。计时排除加载、一次性编译、I/O、仿真；主表耗时是 seen embodiments 的统计。
- 25 槽位／6 个 Diffusion Units；13.647M 总参数。
- ApexHand 84/100，Revo2 68/100，总体 76.00%。

目前没有接入视频、论文下载或代码仓库链接：指定目录未提供演示视频，tex/root.pdf 当前不存在，其他 PDF 多为图件，不能把旧编译稿当作最新版上传。最终材料就绪后再加入真实且匿名的资源链接，不承诺尚未确认的开源时间。

## 文件与发布边界

- index.html：网页内容。
- styles.css：响应式样式。
- site.js：原生图片放大对话框，支持 Escape 和焦点恢复；禁用 JS 仍可阅读正文与打开原图。
- assets/：6 张论文图，不包含源 PDF 的作者或编辑器元数据。
- build.mjs、verify.mjs：发布白名单及静态检查。
- dist/：唯一可以上传给公网的目录。
- .openai/hosting.json：私有预览托管配置，不应放入面向评审的上传包。
- README.md、ANONYMITY.md：本地说明，不随网站发布。

构建及检查：

    node build.mjs
    node verify.mjs

无需安装第三方依赖。若系统未安装 Node.js，可使用本机应用内置的运行环境，或者直接使用此次已生成的 dist/。

本地查看：

    python3 -m http.server 8765 --bind 127.0.0.1 --directory dist

本地预览地址为 http://127.0.0.1:8765/。不要把本地预览或仅本人可见的托管预览放进投稿 PDF。

## 方案 A：Cloudflare Pages 直接上传（网站推荐方案）

这是一种避免公开个人 GitHub 仓库／用户名的部署方式，不是会议官方认证，也不自动保证匿名。

1. 登录 Cloudflare 控制台，进入 Workers & Pages。
2. 选择创建应用，在 Pages 的 Direct Upload / Drag and drop 路径上传。界面标签可能调整，应选择 Pages 静态网站，而非带账户名的 workers.dev 地址。
3. 使用不关联姓名、常用网名、实验室、学校的项目名，例如“grasp-review-”加随机后缀。示例不是已经分配的地址。
4. 上传 dist/ 的内容，或此次生成的 fira-grasp-anonymous-site.zip。压缩包顶层应直接有 index.html。不要上传整个 web/、旧模板备份或完整 LaTeX 工程。
5. 点击部署，平台会生成实际的 HTTPS pages.dev 地址。无需购买域名；不要绑定实验室或个人域名。
6. 关闭非必要访问统计和外部插件。网站不应要求评审注册、登录、申请权限或输入个人信息。
7. 用未登录的无痕窗口、另一台设备／网络检查真实网址、全部图片、放大图片及任何下载链接。检查重定向后的域名和错误页是否带身份信息，再将实际 URL 填入论文。
8. 后续更新重新构建检查，上传新的 dist/。评审阶段建议冻结与投稿材料一致的版本，避免网站与 PDF、视频数据不一致。

官方说明：
https://developers.cloudflare.com/pages/get-started/direct-upload/

当前直接上传支持 ZIP 或目录，单个文件上限 25 MiB。当前页面均小于该限制；以后长视频可能超限，需要另选匿名且可直接访问的媒体托管，并再次检查外部请求与身份泄漏。不要临时改为个人 YouTube／网盘链接。

## 方案 B：匿名代码仓库

如果评审时分享代码，可使用 IEEE RAS 指向的 anonymous.4open.science。由服务生成真实匿名入口，配置需隐藏的作者姓名、邮箱、GitHub 用户名、组织、仓库名、实验室域名等。提交匿名链接，不提交原仓库链接。

自动替换不能替代人工检查：README、文件路径、安装指令、下载地址、注释、提交记录、许可证中的个人身份、子模块、徽章、W&B 链接、输出日志和二进制文件都要核对。遵守第三方许可证，不随意删去别人的法定版权声明。不要在匿名版中留下可反向定位作者的个人版权或引用信息。

服务说明：
https://github.com/tdurieux/anonymous_github
官方匿名要求：
https://www.ieee-ras.org/publications/rules-for-the-double-anonymous-review-process/

## 放进论文

abstract.tex 已有 ANONYMOUS-PROJECT-URL 占位。获得并检查真实公开地址后，只替换占位；目前不要使用私有预览地址，也不要猜一个不存在的匿名地址。

ICRA 2027 官方允许可见的 URL，但不允许嵌入式 PDF 超链接。当前 root.tex 使用 hyperref 的 draft 选项；最终编译后应检查 PDF 是否仍包含活动链接注释。可使用 \\nolinkurl{实际匿名地址} 排版显示地址，不能仅凭 LaTeX 设置就假设最终 PDF 已合规。

完整论文本身必须自洽；网站不能替代应放在 PDF 或随附视频里的关键方法、实验设定和证据。ICRA 2027 官方页面写明完整论文最多 8 页，包括参考文献。历史对话中的 9 页版本并不能据此提交；需核对最终稿，本次未压缩或重新编译论文。

官方投稿／FAQ：
https://2027.ieee-icra.org/contribute/call-for-icra-2027-papers-now-accepting-submissions/

## 匿名的范围

匿名是对评审可见的信息而言，并不意味着托管服务无法知道上传者。IEEE RAS 采用 soft double-anonymous：必要的机器人／设备图可以保留，但作者、机构、实验室标志、人脸及文件元数据应去除，不能链接至会显示作者身份的外部网站。即使材料检查通过，也无法承诺从公开既有工作或硬件推断作者的概率为零。

noindex、robots.txt 与 no-referrer 只是辅助措施，不是访问控制，更不等于已经完成匿名审核。上线检查见 ANONYMITY.md。
