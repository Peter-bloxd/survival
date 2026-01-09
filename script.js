import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyBC92jwiCLsfG6bE4k2Jo4KQSiI-A_gxII",
    authDomain: "bloxd-survival.firebaseapp.com",
    projectId: "bloxd-survival",
    storageBucket: "bloxd-survival.firebasestorage.app",
    messagingSenderId: "60666065786",
    appId: "1:60666065786:web:bdc3131accaceb0180dcc3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = JSON.parse(localStorage.getItem('SURVIVAL_USER_V3'));
let authMode = 'login';

// 1. 初始化界面
function init() {
    updateAuthUI();
}

// 2. 身份认证 (唯一 ID 检查)
window.handleAuth = () => {
    const id = document.getElementById('a-id').value.trim();
    const pw = document.getElementById('a-pw').value;
    const nick = document.getElementById('a-nick').value.trim();

    if(!id || !pw) return showTip("⚠️ 请输入完整 ID 和密码");

    if(authMode === 'reg') {
        if(!nick) return showTip("⚠️ 注册需要填写游戏昵称");
        // 关键逻辑：唯一 ID 验证 (检查本地库)
        if(localStorage.getItem('DB_USER_' + id)) {
            return showTip("❌ 此 ID 已被注册，请更换一个");
        }
        const newUser = { id, pw, nick };
        localStorage.setItem('DB_USER_' + id, JSON.stringify(newUser));
        doLogin(newUser);
    } else {
        const saved = localStorage.getItem('DB_USER_' + id);
        if(!saved) return showTip("🔍 账号不存在，请点击注册");
        const user = JSON.parse(saved);
        if(user.pw !== pw) return showTip("🚫 密码错误，请重试");
        doLogin(user);
    }
};

function doLogin(userData) {
    localStorage.setItem('SURVIVAL_USER_V3', JSON.stringify(userData));
    currentUser = userData;
    showTip(`✨ 欢迎回来, ${userData.nick}`);
    closeModal();
    updateAuthUI();
}

// 3. 聊天逻辑 (跨设备同步)
window.openChat = () => {
    if(!currentUser) return showTip("🔒 请先登录社区后再进入聊天室");
    document.getElementById('chat-panel').style.display = 'flex';
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(50));
    onSnapshot(q, (sn) => {
        const box = document.getElementById('chat-msgs');
        box.innerHTML = '';
        sn.forEach(doc => {
            const d = doc.data();
            const div = document.createElement('div');
            div.className = 'msg-bubble';
            div.innerHTML = `<b>${d.user}</b> ${d.text}`;
            box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
    });
};

window.sendMsg = async () => {
    const input = document.getElementById('m-input');
    if(!input.value.trim()) return;
    try {
        await addDoc(collection(db, "messages"), {
            text: input.value,
            user: currentUser.nick,
            createdAt: serverTimestamp()
        });
        input.value = '';
    } catch(e) { showTip("发送失败，请检查数据库配置"); }
};

// 4. UI 辅助功能
window.setTab = (m) => {
    authMode = m;
    document.getElementById('t-login').className = m === 'login' ? 'active' : '';
    document.getElementById('t-reg').className = m === 'reg' ? 'active' : '';
    document.getElementById('nick-field').style.display = m === 'reg' ? 'block' : 'none';
};

window.togglePw = () => {
    const el = document.getElementById('a-pw');
    el.type = el.type === 'password' ? 'text' : 'password';
};

window.showTip = (txt) => {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast'; t.innerText = txt;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(), 500); }, 3000);
};

window.updateAuthUI = () => {
    const ui = document.getElementById('auth-ui');
    if(currentUser) {
        ui.innerHTML = `<span style="margin-right:20px; color:#8b949e">生存者: ${currentUser.nick}</span><button class="submit-btn" style="width:auto; padding:8px 20px" onclick="logout()">退出</button>`;
    } else {
        ui.innerHTML = `<button class="submit-btn" style="width:auto; padding:8px 20px" onclick="openModal()">登录/注册</button>`;
    }
};

window.logout = () => { localStorage.removeItem('SURVIVAL_USER_V3'); location.reload(); };
window.openModal = () => document.getElementById('modal-overlay').style.display = 'block';
window.closeModal = () => document.getElementById('modal-overlay').style.display = 'none';
window.closeChat = () => document.getElementById('chat-panel').style.display = 'none';

init();
