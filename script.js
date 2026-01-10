import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* 保持你的配置不变 */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let user = JSON.parse(localStorage.getItem('SURVIVAL_FINAL_V1'));
let mode = 'login';

// --- 交易行逻辑 ---
window.openMarket = () => {
    if(!user) return showTip("⚠️ 请先同步身份", "error");
    document.getElementById('market-modal').style.display = 'block';
    
    // 监听实时市场数据
    onSnapshot(collection(db, "market"), (sn) => {
        const list = document.getElementById('market-list');
        list.innerHTML = '';
        sn.forEach(d => {
            const item = d.data();
            const div = document.createElement('div');
            div.className = 'market-item';
            div.innerHTML = `
                <span>📦 ${item.name}</span>
                <span class="price">💎 ${item.price} 绿宝石</span>
                <span style="font-size:10px; color:#666">卖家: ${item.seller}</span>
                ${item.seller === user.nick ? `<button onclick="removeItem('${d.id}')" style="color:red">下架</button>` : `<button onclick="buyItem()">购买</button>`}
            `;
            list.appendChild(div);
        });
    });
};

window.postItem = async () => {
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;
    if(!name || !price) return;
    await addDoc(collection(db, "market"), {
        name, price, seller: user.nick, createdAt: serverTimestamp()
    });
    showTip("✅ 物品已成功上架交易行");
};

window.removeItem = async (id) => {
    await deleteDoc(doc(db, "market", id));
    showTip("📦 物品已撤回仓库");
};

// --- 身份同步 (唯一性检查) ---
window.handleAuth = () => {
    const id = document.getElementById('a-id').value.trim();
    const pw = document.getElementById('a-pw').value;
    const nick = document.getElementById('a-nick').value;

    if(mode === 'reg') {
        if(localStorage.getItem('ID_DATA_' + id)) return showTip("❌ ID 已被占用", "error");
        const data = { id, pw, nick };
        localStorage.setItem('ID_DATA_' + id, JSON.stringify(data));
        saveUser(data);
    } else {
        const saved = localStorage.getItem('ID_DATA_' + id);
        if(!saved) return showTip("❓ 账号不存在");
        const data = JSON.parse(saved);
        if(data.pw !== pw) return showTip("🚫 密码错误");
        saveUser(data);
    }
};

function saveUser(data) {
    localStorage.setItem('SURVIVAL_FINAL_V1', JSON.stringify(data));
    user = data;
    location.reload();
}

// --- 通用辅助 ---
window.showTip = (msg) => {
    const box = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast-item';
    el.innerText = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3500);
};

window.openChat = () => { /* 保持之前的代码，样式会自动应用新 CSS */ };
window.openWiki = () => document.getElementById('wiki-modal').style.display = 'block';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

// 初始化
if(user) {
    document.getElementById('auth-ui').innerHTML = `<span>欢迎, ${user.nick}</span> <button class="logout" onclick="localStorage.removeItem('SURVIVAL_FINAL_V1');location.reload()">登出</button>`;
} else {
    document.getElementById('auth-ui').innerHTML = `<button onclick="document.getElementById('auth-modal').style.display='block'">同步身份</button>`;
}
