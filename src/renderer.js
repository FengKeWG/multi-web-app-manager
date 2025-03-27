document.addEventListener('DOMContentLoaded', async function () {

    // 修改为你的网站
    const PREDEFINED_PROFILES = [
        { id: 'deepseek', name: 'DeepSeek', url: 'https://chataiapi.com/detail' },
        { id: 'gemini', name: 'Gemini', url: 'https://chataiapi.com/detail' },
        { id: 'ai', name: '小爱AI', url: 'https://xiaoai.plus/detail' },
        { id: 'xf', name: '讯飞', url: 'https://console.xfyun.cn/services/bm4' },
        { id: 'bigmodel', name: '质谱', url: 'https://open.bigmodel.cn/finance/resourcepack?tab=my' },
    ];

    const tabsContainer = document.getElementById('tabs');
    const webviewContainer = document.getElementById('webviewContainer');
    const nightModeButton = document.getElementById('night-mode-btn');

    // 夜间模式状态
    let nightModeEnabled = false;

    let nightModeIntensity = 85;
    let nightModeBrightness = 110;
    let nightModeContrast = 110;

    // 网站夜间模式设置
    let siteNightModes = {};

    // 当前选中的标签ID
    let currentProfileId = null;

    // 加载全局夜间模式设置
    async function loadNightModeSettings() {
        try {
            // 加载全局夜间模式状态
            if (window.electronAPI.getNightModeState) {
                nightModeEnabled = await window.electronAPI.getNightModeState() || false;
            }

            // 加载夜间模式参数设置
            if (window.electronAPI.getNightModeSettings) {
                const settings = await window.electronAPI.getNightModeSettings();
                if (settings) {
                    nightModeIntensity = settings.intensity || 85;
                    nightModeBrightness = settings.brightness || 110;
                    nightModeContrast = settings.contrast || 110;
                }
            }

            // 加载每个网站的夜间模式设置
            if (window.electronAPI.getAllSiteNightModes) {
                siteNightModes = await window.electronAPI.getAllSiteNightModes() || {};
            }

            // 应用夜间模式样式
            applyNightModeStyle();
            updateNightModeUI();
        } catch (error) {
            console.error('加载夜间模式设置失败', error);
        }
    }

    // 初始加载设置
    await loadNightModeSettings();

    // 更新夜间模式UI
    function updateNightModeUI() {
        // 更新按钮状态
        if (nightModeEnabled) {
            nightModeButton.classList.add('active');
            nightModeButton.textContent = '🌙'; // 夜间模式开启时显示月亮
            nightModeButton.title = '切换到日间模式';
        } else {
            nightModeButton.classList.remove('active');
            nightModeButton.textContent = '☀️'; // 日间模式开启时显示太阳
            nightModeButton.title = '切换到夜间模式';
        }

        // 更新所有webview
        document.querySelectorAll('webview').forEach(webview => {
            const profileId = webview.id.replace('webview-', '');
            const siteSetting = siteNightModes[profileId];

            // 如果网站有特定设置，使用该设置；否则使用全局设置
            const shouldApplyNightMode = siteSetting !== undefined ? siteSetting : nightModeEnabled;

            if (shouldApplyNightMode) {
                webview.classList.add('night-mode');
            } else {
                webview.classList.remove('night-mode');
            }
        });
    }

    // 动态应用夜间模式样式
    function applyNightModeStyle() {
        const styleEl = document.getElementById('night-mode-dynamic-style') || document.createElement('style');
        styleEl.id = 'night-mode-dynamic-style';

        styleEl.textContent = `
        webview.night-mode {
          filter: invert(${nightModeIntensity}%) hue-rotate(180deg) brightness(${nightModeBrightness}%) contrast(${nightModeContrast}%);
        }
        
        webview.night-mode img,
        webview.night-mode video,
        webview.night-mode canvas {
          filter: invert(100%) hue-rotate(180deg) brightness(100%);
        }
      `;

        if (!document.getElementById('night-mode-dynamic-style')) {
            document.head.appendChild(styleEl);
        }
    }

    // 添加窗口控制功能
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('maximize-btn').addEventListener('click', async () => {
        const isMaximized = await window.electronAPI.maximizeWindow();
        document.getElementById('maximize-btn').innerText = isMaximized ? '❐' : '□';
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });

    // 夜间模式切换功能
    nightModeButton.addEventListener('click', async () => {
        nightModeEnabled = !nightModeEnabled;

        // 保存夜间模式状态
        if (window.electronAPI.saveNightModeState) {
            try {
                await window.electronAPI.saveNightModeState(nightModeEnabled);
            } catch (error) {
                console.error('保存夜间模式状态失败', error);
            }
        }

        updateNightModeUI();
    });

    // 夜间模式右键菜单
    nightModeButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        // 首先删除可能存在的旧菜单
        const oldDialog = document.querySelector('.settings-dialog');
        if (oldDialog) {
            document.body.removeChild(oldDialog);
        }

        // 创建菜单对话框
        const settingsDialog = document.createElement('div');
        settingsDialog.className = 'settings-dialog';
        settingsDialog.style.position = 'fixed';
        settingsDialog.style.top = '50px';
        settingsDialog.style.right = '10px';
        settingsDialog.style.backgroundColor = '#2a2a2a';
        settingsDialog.style.border = '1px solid #444';
        settingsDialog.style.padding = '15px';
        settingsDialog.style.zIndex = '1000';
        settingsDialog.style.borderRadius = '5px';
        settingsDialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        settingsDialog.style.width = '300px';
        settingsDialog.style.maxHeight = '500px';
        settingsDialog.style.overflowY = 'auto';

        // 添加初始动画效果
        settingsDialog.style.opacity = '0';
        settingsDialog.style.transform = 'translateY(-10px)';
        settingsDialog.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

        // 创建标题
        const title = document.createElement('h3');
        title.style.margin = '0 0 15px 0';
        title.style.color = '#fff';
        title.style.borderBottom = '1px solid #444';
        title.style.paddingBottom = '10px';
        title.textContent = '夜间模式设置';
        settingsDialog.appendChild(title);

        // 网站特定设置部分
        const siteSettings = document.createElement('div');

        // 为每个网站创建单独的设置
        PREDEFINED_PROFILES.forEach(profile => {
            const siteContainer = document.createElement('div');
            siteContainer.style.display = 'flex';
            siteContainer.style.justifyContent = 'space-between';
            siteContainer.style.alignItems = 'center';
            siteContainer.style.marginBottom = '8px';
            siteContainer.style.padding = '5px';
            siteContainer.style.borderRadius = '3px';

            // 标记当前选中的网站
            if (currentProfileId === profile.id) {
                siteContainer.style.backgroundColor = '#3a3a3a';
            }

            const siteName = document.createElement('span');
            siteName.style.color = '#ddd';
            siteName.textContent = profile.name;

            const optionsContainer = document.createElement('div');

            // 使用全局设置选项
            const useGlobalOption = document.createElement('label');
            useGlobalOption.style.marginRight = '10px';
            useGlobalOption.style.color = '#bbb';
            useGlobalOption.style.cursor = 'pointer';

            const useGlobalRadio = document.createElement('input');
            useGlobalRadio.type = 'radio';
            useGlobalRadio.name = `night-mode-${profile.id}`;
            useGlobalRadio.value = 'global';
            useGlobalRadio.style.marginRight = '5px';
            useGlobalRadio.checked = siteNightModes[profile.id] === undefined;

            useGlobalOption.appendChild(useGlobalRadio);
            useGlobalOption.appendChild(document.createTextNode('全局'));

            // 始终开启选项
            const alwaysOnOption = document.createElement('label');
            alwaysOnOption.style.marginRight = '10px';
            alwaysOnOption.style.color = '#bbb';
            alwaysOnOption.style.cursor = 'pointer';

            const alwaysOnRadio = document.createElement('input');
            alwaysOnRadio.type = 'radio';
            alwaysOnRadio.name = `night-mode-${profile.id}`;
            alwaysOnRadio.value = 'on';
            alwaysOnRadio.style.marginRight = '5px';
            alwaysOnRadio.checked = siteNightModes[profile.id] === true;

            alwaysOnOption.appendChild(alwaysOnRadio);
            alwaysOnOption.appendChild(document.createTextNode('开'));

            // 始终关闭选项
            const alwaysOffOption = document.createElement('label');
            alwaysOffOption.style.color = '#bbb';
            alwaysOffOption.style.cursor = 'pointer';

            const alwaysOffRadio = document.createElement('input');
            alwaysOffRadio.type = 'radio';
            alwaysOffRadio.name = `night-mode-${profile.id}`;
            alwaysOffRadio.value = 'off';
            alwaysOffRadio.style.marginRight = '5px';
            alwaysOffRadio.checked = siteNightModes[profile.id] === false;

            alwaysOffOption.appendChild(alwaysOffRadio);
            alwaysOffOption.appendChild(document.createTextNode('关'));

            optionsContainer.appendChild(useGlobalOption);
            optionsContainer.appendChild(alwaysOnOption);
            optionsContainer.appendChild(alwaysOffOption);

            siteContainer.appendChild(siteName);
            siteContainer.appendChild(optionsContainer);
            siteSettings.appendChild(siteContainer);

            // 添加选项改变事件
            [useGlobalRadio, alwaysOnRadio, alwaysOffRadio].forEach(radio => {
                radio.addEventListener('change', async (e) => {
                    if (e.target.checked) {
                        let value;
                        switch (e.target.value) {
                            case 'on':
                                value = true;
                                break;
                            case 'off':
                                value = false;
                                break;
                            case 'global':
                            default:
                                value = undefined;
                                break;
                        }

                        // 更新内存中的网站设置
                        if (value === undefined) {
                            delete siteNightModes[profile.id];
                        } else {
                            siteNightModes[profile.id] = value;
                        }

                        // 保存设置到存储
                        if (window.electronAPI.saveSiteNightMode) {
                            await window.electronAPI.saveSiteNightMode(profile.id, value === undefined ? null : value);
                        }

                        // 立即应用设置
                        updateNightModeUI();
                    }
                });
            });
        });

        settingsDialog.appendChild(siteSettings);
        document.body.appendChild(settingsDialog);

        // 启动动画效果
        setTimeout(() => {
            settingsDialog.style.opacity = '1';
            settingsDialog.style.transform = 'translateY(0)';
        }, 10);

        // 阻止右键菜单上的点击事件冒泡
        e.stopPropagation();

        // 关闭对话框的函数
        function closeSettingsDialog() {
            // 添加关闭动画
            settingsDialog.style.opacity = '0';
            settingsDialog.style.transform = 'translateY(-10px)';

            // 等待动画完成后移除对话框
            setTimeout(() => {
                if (document.body.contains(settingsDialog)) {
                    document.body.removeChild(settingsDialog);
                }
            }, 200);
        }

        // 阻止点击菜单事件冒泡
        settingsDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 创建一个遮罩层来捕获所有点击事件
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // 点击遮罩层关闭菜单
        overlay.addEventListener('click', () => {
            closeSettingsDialog();
            document.body.removeChild(overlay);
        });
    });

    // 渲染标签页
    function renderTabs() {
        tabsContainer.innerHTML = '';

        PREDEFINED_PROFILES.forEach(profile => {
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.id = `tab-${profile.id}`;
            tab.textContent = profile.name;
            tab.addEventListener('click', () => selectTab(profile.id));

            tabsContainer.appendChild(tab);

            // 创建webview元素
            if (!document.getElementById(`webview-${profile.id}`)) {
                const webview = document.createElement('webview');
                webview.id = `webview-${profile.id}`;
                webview.setAttribute('src', profile.url);
                webview.setAttribute('partition', `persist:${profile.id}`);
                webview.setAttribute('allowpopups', 'true');
                webview.setAttribute('disablewebsecurity', 'false');
                webview.setAttribute('webpreferences', 'allowRunningInsecureContent=false');

                // 监听webview加载完成事件，保存cookies
                webview.addEventListener('dom-ready', () => {
                    saveCookies(profile.id, webview);
                });

                webviewContainer.appendChild(webview);
            }
        });

        // 默认选中第一个标签页
        if (PREDEFINED_PROFILES.length > 0) {
            selectTab(PREDEFINED_PROFILES[0].id);
        }

        // 更新夜间模式应用状态
        updateNightModeUI();
    }

    // 选择标签页
    function selectTab(profileId) {
        // 记录当前选中的标签
        currentProfileId = profileId;

        // 移除所有活动标记
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('webview').forEach(webview => webview.classList.remove('active'));

        // 添加活动标记到选中的标签和webview
        document.getElementById(`tab-${profileId}`).classList.add('active');
        document.getElementById(`webview-${profileId}`).classList.add('active');
    }

    // 保存cookies
    async function saveCookies(profileId, webview) {
        try {
            const cookies = await webview.executeJavaScript(`document.cookie`);
            if (cookies) {
                await window.electronAPI.saveCookies(profileId, cookies);
                console.log(`保存cookies: ${profileId}`);
            }
        } catch (error) {
            console.error(`保存cookies失败: ${profileId}`, error);
        }
    }

    // 初始化渲染
    renderTabs();
});