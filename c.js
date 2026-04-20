
    // ==========================================
    // JS 模組 1：系統常數與資料庫設定
    // ==========================================
    
    // Google Apps Script 的後台 API 網址，負責將用戶的蓋印和領獎數據傳回 Google Sheet 試算表
    //const API_URL = "https://script.google.com/macros/s/AKfycbztJOpwadOqZmgbVMZawxW7RvoaihSDERjWT3A7CtVOp1b7CA2j4ydAluv4udBWbUCk/exec"; 
    const API_URL = "https://script.google.com/macros/s/AKfycbwhlFCOQkSlELkFcFZVD6fQU_GEpnmuaaXRg8rALlsW4gvXeSWSTcUsc612IosrFEns/exec"; 

    // 密碼鹽值 (可更改此數字來調整動態密碼的偏移量，保持不變以相容 Edward 原有設定)
    const SALT = 0; 
    //const SALT = 1111; 

    // 定義 16 個環保攤位的資料庫 (ID、圖標、名稱、環保小知識)
    // 修改攤位名稱或知識內容
   
    const STALLS = [
        { id: 'QR1', icon: '💰', name: '1: 低碳智慧收費系統', tip: '使用電子支付，減少紙幣製造產生的碳足跡。' },
        { id: 'QR2', icon: '🚉', name: '2: 綠智通勤樞紐', tip: '多搭巴士地鐵，每公里可減少約 150g 碳排放。' },
        { id: 'QR3', icon: '👕', name: '3: 衣物回收 你要知', tip: '回收舊衣能節省大量水資源，讓資源循環再生。' },
        { id: 'QR4', icon: '🔌', name: '4: 環保斷線危機', tip: '拔掉待機電器插頭，每年可節省約 10% 電力。' },
        { id: 'QR5', icon: '🎚️', name: '5: 智惜讀錶', tip: '實時監察用電量，有助識別不必要的能源消耗。' },
        { id: 'QR6', icon: '🗑️', name: '6: A6 回收垃圾桶', tip: '正確分類回收，能大幅減輕堆填區的負荷。' },
        { id: 'QR7', icon: '♻️', name: '7: 垃圾終結者：分類反擊', tip: '回收前請先妥善處理，能提升回收再造的成功率。' },
        { id: 'QR8', icon: '🎓', name: '8: 綠色教育角', tip: '學習環保知識，是守護地球的第一步。' },
        { id: 'QR9', icon: '🌏', name: '9: 綠惜地球', tip: '保護生物多樣性，維持生態平衡，人人有責。' },
        { id: 'QR10', icon: '⛑️', name: '10: 職安特工隊', tip: '在工作和學習中注重安全健康，實現真正的可持續發展。' },
        { id: 'QR11', icon: '💻', name: '11: 妥善回收「四電一腦」', tip: '舊電器含重金屬，必須交由持牌回收商妥善處理。' },
        { id: 'QR12', icon: '🧃', name: '12: 清潔紙包盒回收', tip: '洗淨並剪開紙包盒回收，可轉化為再生紙漿。' },
        { id: 'QR13', icon: '🧩', name: '13: 綠．轉．七巧新玩', tip: '利用廢物製作玩具，既環保又能激發創意。' },
        { id: 'QR14', icon: '📜', name: '14: 再造紙 DIY', tip: '回收廢紙造紙，能減少約 70% 的空氣污染。' },
        { id: 'QR15', icon: '🤖', name: '15: 迷你 WEEE Hero 組裝', tip: '認識電子廢物回收，人人都能成為環保英雄。' },
        { id: 'QR16', icon: '🚌', name: '16: 喵巴士回收車', tip: '流動回收站深入社區，讓減廢變得更方便。' }
    ];
    // ==========================================
    // JS 模組 2：用戶狀態管理 (LocalStorage)
    // ==========================================
    
    // 獲取或創建使用者的唯一隨機 ID (用來在 Google Sheet 追蹤是哪位使用者)
    let userId = localStorage.getItem('vtc_user_id') || ('U' + Date.now());
    localStorage.setItem('vtc_user_id', userId);
    
    // 從本地緩存讀取已收集的印花陣列
    let myStamps = JSON.parse(localStorage.getItem('vtc_stamps_2026')) || [];
    
    // 從本地緩存讀取已領取的禮品記錄陣列（防止重複領獎）
    let redeemedHistory = JSON.parse(localStorage.getItem('vtc_redeemed_history')) || [];
    
    // 控制是否已經解鎖 iOS/Android 的音效播放限制（移動端必須經由點擊才能放音效）
    let audioUnlocked = false;

    // ==========================================
    // JS 模組 3：視覺效果與環境初始化 (新增綠色動畫)
    // ==========================================
    // 定時更新時鐘
    function updateClock() {
        const now = new Date();
        
        // 獲取年、月、日
        const year = now.getFullYear();
        // getMonth() 是從 0 開始的（0 = 1月），所以要 +1
        // padStart(2, '0') 確保不足兩位時補 0
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // 獲取時間（HH:mm:ss）
        const timeStr = now.toLocaleTimeString('zh-HK', { hour12: false });
        
        // 組合格式：YYYY-MM-DD
        const dateStr = `${year}-${month}-${day}`;
        
        document.getElementById('live-clock').innerText = `📅 ${dateStr} | 🕒 ${timeStr}`;
    }
    setInterval(updateClock, 1000);

    
    // 產生背景漂浮綠點 (優化：限制在 10% - 90% 寬度)
    function createDots() {
        const bg = document.getElementById('bgDots');
        for(let i=0; i<15; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            // 邏輯：10 + (隨機 0-80) = 區間 10% 到 90%
            dot.style.left = (Math.random() * 80 + 10) + 'vw';
            
            dot.style.width = dot.style.height = (Math.random() * 15 + 5) + 'px';
            dot.style.animationDelay = (Math.random() * 5) + 's';
            bg.appendChild(dot);
        }
    }

    // 產生隨機飄落的樹葉 (優化：限制在 10% - 90% 寬度)
    function createLeaves() {
        const bg = document.getElementById('bgDots');
        //const leafEmojis = ['🍃', '🍂', '🍁', '🌱','🌼', '☘️', '🌿', '🌸']; 
        const leafEmojis = ['🍃', '🌱','🌼', '☘️', '🌿', '🌸'];
        
        for(let i=0; i<8; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            leaf.innerText = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
            
            // 邏輯：同樣限制在 10% 到 90% 之間
            leaf.style.left = (Math.random() * 80 + 10) + 'vw';
            
            leaf.style.animationDuration = (Math.random() * 5 + 5) + 's';
            leaf.style.animationDelay = (Math.random() * 3) + 's';
            bg.appendChild(leaf);
        }
    }

    // 解除移動裝置對音訊自動播放的限制
    function unlockAudio() {
        if (audioUnlocked) return;  // 確保這件事一輩子只做一次
        
	const s1 = document.getElementById('stampAudio');
        const s2 = document.getElementById('giftAudio');
        
	s1.load();
	s2.load();

	//s1.play().then(() => { s1.pause(); s1.currentTime = 0; }).catch(()=>{});
        //s2.play().then(() => { s2.pause(); s2.currentTime = 0; }).catch(()=>{});
        
	audioUnlocked = true;
    }

    // ==========================================
    // JS 模組 4：主畫面渲染邏輯 (網格與按鈕狀態)
    // ==========================================
    
    function render() {
        const grid = document.getElementById('mainGrid');
        grid.innerHTML = ''; // 清空現有網格
        
        // 渲染攤位印花
        STALLS.forEach(s => {
            const isDone = myStamps.includes(s.id); // 檢查該攤位是否已完成
            grid.innerHTML += `
                <div class="stamp-box" onclick="showTooltip('${s.id}')">
                    <div class="stamp ${isDone ? 'active' : ''}">${isDone ? s.icon : ''}</div>
                    <div class="stall-name">${s.name}</div>
                </div>`;
        });
        
        // 更新進度條與文字
        const count = Math.min(myStamps.length, 16);
        document.getElementById('progText').innerText = `我的印花進度：${count} / 16`;
        document.getElementById('pBar').style.width = (count / 16 * 100) + '%';

        // 更新 3 個領獎按鈕的狀態 (2, 5, 8個印花)
        [2, 5, 8].forEach(lv => {
            const btn = document.getElementById(`btn-${lv}`);
            const status = document.getElementById(`status-${lv}`);
            if (redeemedHistory.includes(lv)) {
                btn.className = "btn-prize state-done"; status.innerText = "已領取 ✓";
            } else if (count >= lv) {
                btn.className = "btn-prize state-ready"; status.innerText = "點擊領取";
            } else {
                btn.className = "btn-prize state-locked"; status.innerText = `差 ${lv - count} 個印花`;
            }
        });
    }

    // ==========================================
    // JS 模組 5：彈出視窗與業務邏輯 (驗證、領獎)
    // ==========================================
    
    // 點擊未收集印花，打開驗證密碼的視窗
    function openVerifyModal(id) {        

        const s = STALLS.find(x => x.id === id);
        document.getElementById('modalIcon').innerText = s.icon;
        document.getElementById('modalTitle').innerText = s.name;
        document.getElementById('ecoTip').innerHTML = `<b>💡 環保小知識：</b><br>${s.tip}`;
        document.getElementById('modalDesc').innerText = "請輸入工作人員提供的密碼以獲取印花。";
        
        document.getElementById('verifyArea').style.display = 'block';
        document.getElementById('redeemArea').style.display = 'none';
        document.getElementById('uiModal').style.display = 'block';
        
        // 清空之前的輸入內容
        document.getElementById('vCodeInput').value = "";

        // 綁定確認蓋印按鈕的點擊事件
        document.getElementById('confirmBtn').onclick = () => {
            const val = document.getElementById('vCodeInput').value;
            if (validate(val, id)) {
                

                if (!myStamps.includes(id)) {
                    myStamps.push(id);
                    localStorage.setItem('vtc_stamps_2026', JSON.stringify(myStamps));

                    closeModal(); 
                    render(); // 更新進度畫面
                    triggerEffect('stamp'); // 觸發特效與音效

                    sendToSheet('log', id); // 非同步發送日誌至後台
                }
                
            } else { 
                alert("密碼錯誤！請向工作人員索取正確密碼。");             
            }
        };
    }

    // 點擊已收集印花，顯示提示視窗（查看小知識）
    function showTooltip(id) {
        if (!myStamps.includes(id)) {
            openVerifyModal(id);
            return;
        }
        const s = STALLS.find(x => x.id === id);
        document.getElementById('modalIcon').innerText = s.icon;
        document.getElementById('modalTitle').innerText = s.name;
        document.getElementById('ecoTip').innerHTML = `<b>💡 環保小知識：</b><br>${s.tip}`;
        document.getElementById('modalDesc').innerText = "✅ 您已成功收集此攤位的印花！";
        
        document.getElementById('verifyArea').style.display = 'none';
        document.getElementById('redeemArea').style.display = 'none';
        document.getElementById('uiModal').style.display = 'block';
    }

    // 打開領獎確認視窗
    function openRedeemModal(lv) {
        if (myStamps.length < lv || redeemedHistory.includes(lv)) return; // 雙重防呆
        
        document.getElementById('modalIcon').innerText = "🎁";
        document.getElementById('modalTitle').innerText = "領取嘉年華禮品";
        document.getElementById('ecoTip').innerText =  "💡 太棒了！感謝你為地球出一分力! 快去換領你的綠色禮品吧！";
        document.getElementById('modalDesc').innerText = "請輸入工作人員提供的密碼以換領禮品。";
        
        document.getElementById('verifyArea').style.display = 'none';
        document.getElementById('redeemArea').style.display = 'block';
        document.getElementById('uiModal').style.display = 'block';
        
        // 清空之前的輸入內容
        document.getElementById('vRedeemInput').value = "";

        // 綁定確認蓋印按鈕的點擊事件
        document.getElementById('redeemConfirmBtn').onclick = () => {
            const val = document.getElementById('vRedeemInput').value;
            
            // Special password for redemption
            if (val === "503") {
        
                if (!redeemedHistory.includes(lv)) {
                    redeemedHistory.push(lv);
                    localStorage.setItem('vtc_redeemed_history', JSON.stringify(redeemedHistory));

                    closeModal(); 
                    render(); // 更新進度畫面
                    triggerEffect('gift'); // 大獎特效  

                    sendToSheet('redeem', lv); // 非同步發送日誌至後台
                }

            } else { 
                alert("密碼錯誤！請向工作人員索取正確密碼。");                
            }            
        };
    }

    // ==========================================
    // JS 模組 6：核心工具函數 (時間驗證、API、特效)
    // ==========================================
    
    // 動態密碼驗證邏輯：Edward 原始的「當前小時 + 分鐘 + SALT」算法
    /*
    function validate(code, stallId) {
        
        // 優先檢查萬能密碼
        if (code === "503") return true;

        const now = new Date();
        const currentM = now.getMinutes(); 
        const stallNum = parseInt(stallId.replace('QR', '')) || 0;
        
        // 2. 攤位專屬前綴 (1-16 號)
        let prefix = "";
        if (stallNum === 1) prefix = "12";
        else if (stallNum === 2) prefix = "22";
        else if (stallNum === 3) prefix = "34";
        else if (stallNum === 4) prefix = "44";
        else if (stallNum === 5) prefix = "56";
        else if (stallNum === 6) prefix = "66";
        else if (stallNum === 7) prefix = "78";
        else if (stallNum === 8) prefix = "88";
        else if (stallNum === 9) prefix = "90";
        else if (stallNum === 10) prefix = "00";
        else if (stallNum === 11) prefix = "12";
        else if (stallNum === 12) prefix = "22";
        else if (stallNum === 13) prefix = "34";
        else if (stallNum === 14) prefix = "44";
        else if (stallNum === 15) prefix = "56";
        else if (stallNum === 16) prefix = "66";
        else prefix = "99"; // 備用

        // 3. 基本格式檢查
        if (code.length !== 4 || !code.startsWith(prefix)) return false;

        // 4. 分鐘誤差檢查 (±3 分鐘)
        const inputM = parseInt(code.substring(2));
        const diff = Math.abs(inputM - currentM);
        
        // 跨小時處理 (例如：現在 01 分，輸入 59 分)
        const isNearEdge = diff >= 57; 

        return diff <= 3 || isNearEdge;
    }
    */

    function validate(code, stallId) {
        // 1. 萬能管理員密碼
        if (code === "503") return true;

        // 2. 基本校驗：如果輸入不是 4 位數，直接判斷失敗
        if (!code || code.length !== 4) return false;

        // 3. 獲取攤位編號
        const stallNum = parseInt(stallId.replace('QR', '')) || 0;
        
        // 4. 定義 16 個攤位的固定密碼
        // 這裡你可以隨意修改這些數字，只要告訴工作人員即可
        let correctCode = "";
        
        switch(stallNum) {
            case 1:  correctCode = "1369"; break;
            case 2:  correctCode = "2585"; break;
            case 3:  correctCode = "3815"; break;
            case 4:  correctCode = "4964"; break;
            case 5:  correctCode = "5893"; break;
            case 6:  correctCode = "6956"; break;
            case 7:  correctCode = "7945"; break;
            case 8:  correctCode = "8053"; break;
            case 9:  correctCode = "9523"; break;
            case 10: correctCode = "1683"; break;
            case 11: correctCode = "1189"; break;
            case 12: correctCode = "2286"; break;
            case 13: correctCode = "3389"; break;
            case 14: correctCode = "4434"; break;
            case 15: correctCode = "5596"; break;
            case 16: correctCode = "6672"; break;
            default: return false; // 無效攤位
        }

        // 4. 比對密碼
        return code === correctCode;
    }

    /*
    // 將數據發送到 Google Sheet（不卡住瀏覽器 UI 的隱形 GET 請求）
    function sendToSheet(action, val) {
        const url = `${API_URL}?action=${action}&${action==='log'?'id':'lv'}=${encodeURIComponent(val)}&uid=${userId}`;
        new Image().src = url; // 透過 new Image 送出請求，完美繞過跨域 CORS 阻擋
    }
    */

    // new-add (better version for concurrent requests)
    function sendToSheet(action, val) {
        // 1. 構建基礎 URL
        const paramName = (action === 'log' ? 'id' : 'lv');
        const url = `${API_URL}?action=${action}&${paramName}=${encodeURIComponent(val)}&uid=${userId}`;

        // 2. 隨機延遲 (Jitter)：0 到 3000 毫秒
        // 這是解決 300 人同時併發最有效的前端手段
        const jitter = Math.floor(Math.random() * 3000);

        setTimeout(() => {
            // 3. 使用 fetch 並開啟 keepalive
            // mode: 'no-cors' 模擬你原本 new Image() 的效果，不理會回傳值，只求送出
            fetch(url, { 
                mode: 'no-cors',
                keepalive: true 
            })
            .then(() => console.log(`Data sent (action: ${action})`))
            .catch(err => console.warn("Background log failed, but it's okay.", err));
            
        }, jitter);
    }

    // 觸發音效與 Canvas Confetti 撒紙屑特效
    function triggerEffect(type) {
        const sound = document.getElementById(type === 'stamp' ? 'stampAudio' : 'giftAudio');
        sound.play().catch(()=>{}); // 容錯機制
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }


    // 修改後的發送數據函數


    // ==========================================
    // JS 模組 7：介面切換控制與生命週期
    // ==========================================
    
    // 頁籤切換（印花 vs 地圖）
    function switchTab(t) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
        document.getElementById('tab-' + t).classList.add('active-tab');
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('nav-' + t).classList.add('active');
        
        //unlockAudio(); // 使用者主動交互，藉此解除自動播放限制
    }

    // 關閉 Modal 彈窗
    function closeModal() {
        document.getElementById('uiModal').style.display = 'none';
        document.getElementById('vCodeInput').value = ''; // 清空密碼欄位
    }

    // ==========================================
    // [新增] JS 模組 8：人機對話窗口邏輯
    // ==========================================
    
    // 打開或關閉右下角的對話視窗
    function toggleChat() {
        const modal = document.getElementById('chatModal');
        modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
        //unlockAudio();
    }

    // 模擬對話回覆
    function askBot(question) {
        const replyArea = document.getElementById('botReply');
        replyArea.innerText = "⏳ 思考中...";
        
        // 延遲 800ms 假裝在思考，增加擬真度
        setTimeout(() => {
            if (question.includes('印花')) {
                replyArea.innerText = "去攤位參觀和完成活動，向工作人員攞密碼輸入就可以蓋印！";
            } else if (question.includes('禮品')) {
                replyArea.innerText = "禮品換領處設喺大堂，只要你集齊 2個、5個 或 8個 印花，就可以去換領豐富嘅綠色禮品！";
            } else if (question.includes('貼士')) {
                const tips = [
                    "自備水樽，每日可以減少棄置一個即棄膠樽！🫙",
                    "離開房間時熄燈熄冷氣，減少碳排放！💡",
                    "試吓多選擇步行，是最健康的環保方式！🚶"
                ];
                replyArea.innerText = "環保小貼士：" + tips[Math.floor(Math.random() * tips.length)];
            }
        }, 800);
    }

    // ==========================================
    // 系統主初始化
    // ==========================================
    function init() {
        createDots();   // 啟動背景點動畫
        createLeaves(); // 啟動樹葉落葉動畫
        
        // 檢查 URL 有無帶入掃描 QR Code 的參數（例如 ?id=QR1）
        /* https://cesdovtc.github.io/green_carnival/index.html?id=QR1 */
        
        const qid = new URLSearchParams(window.location.search).get('id');
        if (qid && STALLS.some(s => s.id === qid)) {
            setTimeout(() => { 
                myStamps.includes(qid) ? showTooltip(qid) : openVerifyModal(qid); 
            }, 500); // 延遲半秒等畫面穩定後再彈出
        }
        
        render(); // 執行畫面初次繪製

	    unlockAudio(); // 使用者主動交互，藉此解除自動播放限制
    }

    // 當整個 DOM 下載完成後即刻啟動
    init();
