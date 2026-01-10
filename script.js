import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* 填入你之前的 Firebase 配置 */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let user = JSON.parse(localStorage.getItem('SURVIVAL_FINAL_V1'));
let authMode = 'login';

// --- 初始化 UI ---
function init() {
    const ui = document.getElementById('auth-ui');
    if(user) {
        ui.innerHTML = `<span>欢迎, ${user.nick}</span> <button onclick="logout()">退出</button>`;
    } else {
        ui.innerHTML = `<button class="prime-btn" style="padding:8px 15px; width:auto; margin:0" onclick="togglePanel('auth-modal')">登录 / 注册</button>`;
    }
}

// --- 身份验证逻辑 (不乱删，保留 ID 唯一性) ---
window.switchAuth = (m) => {
    authMode = m;
    document.getElementById('tab-login').className = m === 'login' ? 'active' : '';
    document.getElementById('tab-reg').className = m === 'reg' ? 'active' : '';
    document.getElementById('reg-nick-group').style.display = m === 'reg' ? 'block' : 'none';
};

window.handleAuth = () => {
    const id = document.getElementById('a-id').value.trim();
    const pw = document.getElementById('a-pw').value;
    const nick = document.getElementById('a-nick').value.trim();

    if(authMode === 'reg') {
        if(!id || !pw || !nick) return showTip("⚠️ 请填写完整资料");
        if(localStorage.getItem('STORED_ID_' + id)) return showTip("❌ 此 ID 已被注册");
        const userData = { id, pw, nick };
        localStorage.setItem('STORED_ID_' + id, JSON.stringify(userData));
        loginSuccess(userData);
    } else {
        const saved = localStorage.getItem('STORED_ID_' + id);
        if(!saved) return showTip("🔍 ID 不存在");
        const data = JSON.parse(saved);
        if(data.pw !== pw) return showTip("🚫 密码错误");
        loginSuccess(data);
    }
};

function loginSuccess(data) {
    localStorage.setItem('SURVIVAL_FINAL_V1', JSON.stringify(data));
    location.reload();
}

window.logout = () => { localStorage.removeItem('SURVIVAL_FINAL_V1'); location.reload(); };

// --- 交易行逻辑 (实时上架/下架) ---
window.postItem = async () => {
    if(!user) return showTip("🔒 请先登录");
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    if(!name || !price) return;
    await addDoc(collection(db, "market"), { name, price, seller: user.nick, sellerId: user.id, createdAt: serverTimestamp() });
    showTip("✅ 物品上架成功！");
};

onSnapshot(collection(db, "market"), (sn) => {
    const list = document.getElementById('market-list');
    list.innerHTML = '';
    sn.forEach(d => {
        const item = d.data();
        const div = document.createElement('div');
        div.className = 'market-item-row'; 
        div.style = "background:#161b22; padding:12px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #30363d;";
        div.innerHTML = `
            <div><b>${item.name}</b> <br> <small style="color:var(--neon)">💎 ${item.price} 绿宝石</small></div>
            ${item.sellerId === user?.id ? `<button onclick="removeItem('${d.id}')" style="background:#ff4757; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer">下架</button>` : `<span style="font-size:10px; color:#666">卖家: ${item.seller}</span>`}
        `;
        list.appendChild(div);
    });
});

window.removeItem = async (id) => { await deleteDoc(doc(db, "market", id)); showTip("📦 物品已撤回"); };

// --- 聊天室逻辑 ---
window.sendMsg = async () => {
    if(!user) return showTip("🔒 请先登录");
    const input = document.getElementById('m-input');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "messages"), { text: input.value, user: user.nick, createdAt: serverTimestamp() });
    input.value = '';
};

onSnapshot(query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(50)), (sn) => {
    const box = document.getElementById('chat-msgs');
    box.innerHTML = '';
    sn.forEach(d => {
        const m = d.data();
        const div = document.createElement('div'); div.className = 'msg';
        div.innerHTML = `<b>${m.user}</b> ${m.text}`; box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
});

// --- UI 控制 ---
window.togglePanel = (id) => {
    const el = document.getElementById(id);
    const isDisplay = window.getComputedStyle(el).display !== 'none';
    el.style.display = isDisplay ? 'none' : (id.includes('modal') ? 'block' : 'flex');
};

window.showTip = (msg) => {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.style = "background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); padding:15px 25px; border-radius:10px; border-left:4px solid var(--neon); margin-bottom:10px; animation: slideIn 0.3s forwards;";
    t.innerText = msg; c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(), 500); }, 3000);
};

init();
