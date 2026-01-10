import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* 保持你原来的配置 */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 交易行实时刷新
window.openMarket = () => {
    document.getElementById('market-modal').style.display = 'block';
    onSnapshot(collection(db, "market"), (sn) => {
        const list = document.getElementById('market-list');
        list.innerHTML = '';
        sn.forEach(d => {
            const item = d.data();
            const div = document.createElement('div');
            div.className = 'market-item';
            div.innerHTML = `
                <span><b>${item.name}</b> - 💎 ${item.price}</span>
                <button onclick="removeItem('${d.id}')" style="background:red; border:none; color:white; border-radius:4px; cursor:pointer">下架</button>
            `;
            list.appendChild(div);
        });
    });
};

window.postMarket = async () => {
    const name = document.getElementById('m-name').value;
    const price = document.getElementById('m-price').value;
    if(!name || !price) return alert("请填写完整");
    await addDoc(collection(db, "market"), { name, price, createdAt: serverTimestamp() });
    alert("上架成功！");
};

window.removeItem = async (id) => {
    await deleteDoc(doc(db, "market", id));
};

window.openModal = (id) => document.getElementById(id).style.display = 'block';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
