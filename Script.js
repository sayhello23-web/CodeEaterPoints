// ============ INITIALIZE ============
function init() {
    if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
    if (!localStorage.getItem('codes')) localStorage.setItem('codes', JSON.stringify([]));
    if (!localStorage.getItem('currentUser')) localStorage.setItem('currentUser', JSON.stringify(null));
    drawWheel();
}

function getUsers() { return JSON.parse(localStorage.getItem('users')); }
function saveUsers(u) { localStorage.setItem('users', JSON.stringify(u)); }
function getCodes() { return JSON.parse(localStorage.getItem('codes')); }
function saveCodes(c) { localStorage.setItem('codes', JSON.stringify(c)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('currentUser')); }
function setCurrentUser(u) { localStorage.setItem('currentUser', JSON.stringify(u)); }

function generateUID() {
    return 'UID' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============ TAB NAVIGATION ============
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    const btns = document.querySelectorAll('.tab-btn');
    const idx = { login: 0, signup: 1, redeem: 2, wheel: 3, dashboard: 4, admin: 5 };
    if (btns[idx[tab]]) btns[idx[tab]].classList.add('active');
    if (tab === 'dashboard') loadDashboard();
}

// ============ SIGNUP ============
function signup() {
    let name = document.getElementById('signupName').value.trim();
    let phone = document.getElementById('signupPhone').value.trim();
    let email = document.getElementById('signupEmail').value.trim();
    let msg = document.getElementById('signupMsg');
    
    if (!name || !phone || !email) {
        msg.innerHTML = '<div class="message-error">❌ Fill all fields</div>';
        return;
    }
    
    let users = getUsers();
    if (users.find(u => u.phone === phone)) {
        msg.innerHTML = '<div class="message-error">❌ Phone already registered</div>';
        return;
    }
    
    let newUser = {
        uid: generateUID(),
        name: name,
        phone: phone,
        email: email,
        points: 90,
        redCoins: 0,
        coins: 0,
        tokens: 0,
        active: true,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);
    msg.innerHTML = `<div class="message-success">✅ Welcome! +90 points! UID: ${newUser.uid}</div>`;
    setTimeout(() => { switchTab('dashboard'); loadDashboard(); }, 2000);
}

// ============ LOGIN ============
function login() {
    let input = document.getElementById('loginInput').value.trim();
    let msg = document.getElementById('loginMsg');
    
    if (!input) {
        msg.innerHTML = '<div class="message-error">❌ Enter Phone or UID</div>';
        return;
    }
    
    let users = getUsers();
    let user = users.find(u => u.phone === input || u.uid === input);
    
    if (!user) {
        msg.innerHTML = '<div class="message-error">❌ User not found. Sign up first.</div>';
        return;
    }
    
    if (!user.active) {
        msg.innerHTML = '<div class="message-error">❌ Account deactivated. Contact admin.</div>';
        return;
    }
    
    setCurrentUser(user);
    msg.innerHTML = '<div class="message-success">✅ Login successful!</div>';
    setTimeout(() => { switchTab('dashboard'); loadDashboard(); }, 1500);
}

// ============ REDEEM CODE ============
function redeemCode() {
    let user = getCurrentUser();
    if (!user) {
        document.getElementById('redeemMsg').innerHTML = '<div class="message-error">❌ Login first</div>';
        switchTab('login');
        return;
    }
    
    let code = document.getElementById('redeemCodeInput').value.trim().toUpperCase();
    let msg = document.getElementById('redeemMsg');
    
    if (!code) {
        msg.innerHTML = '<div class="message-error">❌ Enter code</div>';
        return;
    }
    
    let codes = getCodes();
    let found = codes.find(c => c.code === code);
    
    if (!found) {
        msg.innerHTML = '<div class="message-error">❌ Invalid code</div>';
        return;
    }
    
    if (found.claimed) {
        msg.innerHTML = '<div class="message-error">❌ Code already claimed</div>';
        return;
    }
    
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].points += found.points;
    found.claimed = true;
    found.claimedBy = user.uid;
    found.claimedAt = new Date().toISOString();
    
    saveUsers(users);
    saveCodes(codes);
    setCurrentUser(users[idx]);
    
    msg.innerHTML = `<div class="message-success">✅ +${found.points} points added! New total: ${users[idx].points}</div>`;
    document.getElementById('redeemCodeInput').value = '';
    loadDashboard();
}

// ============ SPINNING WHEEL ============
const SEGMENTS = [
    { name: "30 Try Again", points: 0, type: "try" },
    { name: "5 Better Luck", points: 0, type: "try" },
    { name: "300 Points", points: 300, type: "points" },
    { name: "5 Coins", points: 5, type: "coins" },
    { name: "50 Points", points: 50, type: "points" },
    { name: "20 Points", points: 20, type: "points" },
    { name: "30 Try Again", points: 0, type: "try" },
    { name: "5 Better Luck", points: 0, type: "try" }
];

let spinning = false;

function drawWheel() {
    let canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let width = 300, height = 300;
    canvas.width = width;
    canvas.height = height;
    
    let colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78', '#4299e1', '#9f7aea', '#ed64a6', '#a0aec0'];
    let anglePer = (Math.PI * 2) / SEGMENTS.length;
    
    for (let i = 0; i < SEGMENTS.length; i++) {
        let start = i * anglePer;
        let end = start + anglePer;
        ctx.beginPath();
        ctx.moveTo(width/2, height/2);
        ctx.arc(width/2, height/2, width/2, start, end);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.save();
        ctx.translate(width/2, height/2);
        ctx.rotate(start + anglePer/2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(SEGMENTS[i].name.substring(0, 12), 70, 10);
        ctx.restore();
    }
    
    ctx.beginPath();
    ctx.arc(width/2, height/2, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#2d3748';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('SPIN', width/2 - 25, height/2 + 8);
}

function spinWheel() {
    let user = getCurrentUser();
    if (!user) {
        alert('Login first');
        switchTab('login');
        return;
    }
    
    if (spinning) {
        alert('Already spinning!');
        return;
    }
    
    if (user.points < 360) {
        document.getElementById('wheelResult').innerHTML = `<div class="message-error">❌ Need 360 points! You have ${user.points}</div>`;
        return;
    }
    
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].points -= 360;
    saveUsers(users);
    setCurrentUser(users[idx]);
    
    spinning = true;
    let spinStart = Date.now();
    let spinDuration = 2000;
    let targetSegment = Math.floor(Math.random() * SEGMENTS.length);
    let totalSpins = 5;
    let finalAngle = (totalSpins * 360) + (targetSegment * 45) + (Math.random() * 45);
    
    function animateSpin() {
        let elapsed = Date.now() - spinStart;
        let progress = Math.min(1, elapsed / spinDuration);
        let easeOut = 1 - Math.pow(1 - progress, 3);
        let currentAngle = finalAngle * easeOut;
        
        let canvas = document.getElementById('wheelCanvas');
        if (!canvas) return;
        let ctx = canvas.getContext('2d');
        let width = 300, height = 300;
        ctx.clearRect(0, 0, width, height);
        
        let colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78', '#4299e1', '#9f7aea', '#ed64a6', '#a0aec0'];
        let anglePer = (Math.PI * 2) / SEGMENTS.length;
        
        for (let i = 0; i < SEGMENTS.length; i++) {
            let start = i * anglePer + (currentAngle * Math.PI / 180);
            let end = start + anglePer;
            ctx.beginPath();
            ctx.moveTo(width/2, height/2);
            ctx.arc(width/2, height/2, width/2, start, end);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            ctx.translate(width/2, height/2);
            ctx.rotate(start + anglePer/2);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(SEGMENTS[i].name.substring(0, 10), 65, 8);
            ctx.restore();
        }
        
        ctx.beginPath();
        ctx.arc(width/2, height/2, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#2d3748';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('SPIN', width/2 - 22, height/2 + 8);
        
        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            let reward = SEGMENTS[targetSegment];
            let users2 = getUsers();
            let idx2 = users2.findIndex(u => u.uid === user.uid);
            
            if (reward.type === 'points' && reward.points > 0) {
                users2[idx2].points += reward.points;
                document.getElementById('wheelResult').innerHTML = `<div class="message-success">🎉 You won ${reward.points} Points!</div>`;
            } else if (reward.type === 'coins' && reward.points > 0) {
                users2[idx2].coins = (users2[idx2].coins || 0) + reward.points;
                document.getElementById('wheelResult').innerHTML = `<div class="message-success">🎉 You won ${reward.points} Coins!</div>`;
            } else {
                document.getElementById('wheelResult').innerHTML = `<div class="message-error">😢 ${reward.name}! No reward.</div>`;
            }
            
            saveUsers(users2);
            setCurrentUser(users2[idx2]);
            loadDashboard();
            spinning = false;
        }
    }
    
    requestAnimationFrame(animateSpin);
}

// ============ DASHBOARD ============
function loadDashboard() {
    let user = getCurrentUser();
    if (!user) {
        document.getElementById('dashName').innerText = '—';
        document.getElementById('dashPhone').innerText = '—';
        document.getElementById('dashUID').innerText = '—';
        document.getElementById('dashPoints').innerText = '0';
        document.getElementById('dashRedCoins').innerText = '0';
        document.getElementById('dashCoins').innerText = '0';
        document.getElementById('dashTokens').innerText = '0';
        return;
    }
    document.getElementById('dashName').innerText = user.name;
    document.getElementById('dashPhone').innerText = user.phone;
    document.getElementById('dashUID').innerText = user.uid;
    document.getElementById('dashPoints').innerText = user.points;
    document.getElementById('dashRedCoins').innerText = user.redCoins || 0;
    document.getElementById('dashCoins').innerText = user.coins || 0;
    document.getElementById('dashTokens').innerText = user.tokens || 0;
}

function convertP2RC() {
    let user = getCurrentUser();
    if (!user) { alert('Login first'); return; }
    if (user.points < 1200) { alert('Need 1200 points'); return; }
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].points -= 1200;
    users[idx].redCoins = (users[idx].redCoins || 0) + 4;
    saveUsers(users);
    setCurrentUser(users[idx]);
    loadDashboard();
    alert('✅ 1200 Points → 4 Red Coins');
}

function convertRC2C() {
    let user = getCurrentUser();
    if (!user) { alert('Login first'); return; }
    if ((user.redCoins || 0) < 22) { alert('Need 22 Red Coins'); return; }
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].redCoins -= 22;
    users[idx].coins = (users[idx].coins || 0) + 3;
    saveUsers(users);
    setCurrentUser(users[idx]);
    loadDashboard();
    alert('✅ 22 Red Coins → 3 Coins');
}

function convertP2C() {
    let user = getCurrentUser();
    if (!user) { alert('Login first'); return; }
    if (user.points < 15000) { alert('Need 15000 points'); return; }
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].points -= 15000;
    users[idx].coins = (users[idx].coins || 0) + 8;
    saveUsers(users);
    setCurrentUser(users[idx]);
    loadDashboard();
    alert('✅ 15000 Points → 8 Coins');
}

function convertC2T() {
    let user = getCurrentUser();
    if (!user) { alert('Login first'); return; }
    if ((user.coins || 0) < 25) { alert('Need 25 Coins'); return; }
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === user.uid);
    users[idx].coins -= 25;
    users[idx].tokens = (users[idx].tokens || 0) + 1;
    saveUsers(users);
    setCurrentUser(users[idx]);
    loadDashboard();
    alert('✅ 25 Coins → 1 Token');
}

function logout() {
    setCurrentUser(null);
    switchTab('login');
    document.getElementById('loginInput').value = '';
}

// ============ ADMIN ============
function adminLogin() {
    let pwd = document.getElementById('adminPwd').value;
    if (pwd === 'CodeEater2025') {
        document.getElementById('adminLoginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadAdminStats();
        loadAllCodes();
        loadAllUsers();
    } else {
        document.getElementById('adminMsg').innerHTML = '<div class="message-error">Wrong password</div>';
    }
}

function adminLogout() {
    document.getElementById('adminLoginArea').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminPwd').value = '';
}

function loadAdminStats() {
    let users = getUsers();
    document.getElementById('totalUsers').innerText = users.length;
    document.getElementById('activeUsers').innerText = users.filter(u => u.active).length;
    document.getElementById('deactivatedUsers').innerText = users.filter(u => !u.active).length;
}

function generateCode() {
    let type = document.getElementById('codeType').value;
    let points = parseInt(document.getElementById('codePoints').value);
    
    if (!points || points <= 0) { alert('Enter valid points'); return; }
    if (type === 'number' && (points < 1 || points > 40)) { alert('Number codes: 1-40 points'); return; }
    if (type === 'alphanum' && (points < 10 || points > 200)) { alert('Alpha codes: 10-200 points'); return; }
    
    let code = '';
    if (type === 'number') {
        code = Math.floor(Math.random() * 900000000) + 100000000;
        code = code.toString();
    } else {
        let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 11; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    let codes = getCodes();
    codes.push({ code, points, type, claimed: false, claimedBy: null, claimedAt: null, createdAt: new Date().toISOString() });
    saveCodes(codes);
    
    document.getElementById('newCodeResult').innerHTML = `<div class="code-display">✅ New Code!<br><code>${code}</code><br>${points} points</div>`;
    document.getElementById('codePoints').value = '';
    loadAllCodes();
}

function loadAllCodes() {
    let codes = getCodes();
    let container = document.getElementById('allCodesList');
    if (codes.length === 0) { container.innerHTML = '<p>No codes</p>'; return; }
    let html = '';
    for (let i = codes.length - 1; i >= 0; i--) {
        let c = codes[i];
        let status = c.claimed ? 'claimed' : 'unclaimed';
        let statusText = c.claimed ? '✅ Claimed' : '🟢 Unclaimed';
        html += `<div class="code-item"><div><strong>${c.code}</strong><br><small>${c.points} pts | ${c.type}</small></div><div class="code-status-${status}">${statusText}</div></div>`;
    }
    container.innerHTML = html;
}

function loadAllUsers() {
    let users = getUsers();
    let container = document.getElementById('allUsersList');
    if (users.length === 0) { container.innerHTML = '<p>No users</p>'; return; }
    let html = '';
    for (let i = 0; i < users.length; i++) {
        let u = users[i];
        let status = u.active ? 'active' : 'inactive';
        let statusText = u.active ? '🟢 Active' : '🔴 Inactive';
        html += `<div class="user-item"><div><strong>${u.name}</strong><br><small>📱 ${u.phone} | 🆔 ${u.uid}</small><br><small>💰 ${u.points} pts | 🪙 ${u.coins || 0} coins</small></div><div class="user-status-${status}">${statusText}</div></div>`;
    }
    container.innerHTML = html;
}

function manageUser() {
    let target = document.getElementById('targetUser').value.trim();
    let action = document.getElementById('userAction').value;
    let amount = parseInt(document.getElementById('userAmount').value) || 0;
    
    if (!target) { alert('Enter UID or Phone'); return; }
    let users = getUsers();
    let idx = users.findIndex(u => u.uid === target || u.phone === target);
    if (idx === -1) { alert('User not found'); return; }
    
    if (action === 'activate') { users[idx].active = true; alert(`✅ ${users[idx].name} activated`); }
    else if (action === 'deactivate') { users[idx].active = false; alert(`⚠️ ${users[idx].name} deactivated`); }
    else if (action === 'addPoints') { if (!amount) { alert('Enter amount'); return; } users[idx].points += amount; alert(`✅ Added ${amount} points`); }
    else if (action === 'deductPoints') { if (!amount) { alert('Enter amount'); return; } users[idx].points -= amount; alert(`✅ Deducted ${amount} points`); }
    
    saveUsers(users);
    loadAllUsers();
    loadAdminStats();
    document.getElementById('targetUser').value = '';
    document.getElementById('userAmount').value = '';
}

// ============ INITIALIZE ============
init();
console.log('✅ CodeEater Ready! Admin: CodeEater2025');
