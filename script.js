// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentUser = null;
let users = {};
let upgrades = {
    autoclicker: { price: 10, count: 0, income: 1 },
    multiplier: { price: 50, count: 0, multiplier: 2 },
    megaclicker: { price: 100, count: 0, bonus: 5 },
    bank: { price: 500, count: 0, interest: 0.02 }
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    initializeApp();
    setupEventListeners();
    startAutoClicker();
    loadTestUsers(); // Добавляем тестовых пользователей
});

// Загружаем тестовых пользователей
function loadTestUsers() {
    const testUsers = {
        'user1': { password: '123', balance: 1000, history: [], upgrades: {}, transfers: [] },
        'user2': { password: '123', balance: 500, history: [], upgrades: {}, transfers: [] },
        'admin': { password: 'admin', balance: 10000, history: [], upgrades: {}, transfers: [] }
    };
    
    // Добавляем тестовых пользователей, если их нет
    for (const [username, data] of Object.entries(testUsers)) {
        if (!users[username]) {
            users[username] = data;
        }
    }
    
    saveUsers();
}

// ==================== СИСТЕМА АВТОРИЗАЦИИ ====================
function initializeApp() {
    checkAuth();
    updateHeaderBalance();
}

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUserData();
    updateUsersList();
    loadUserHistory();
    loadTransfers();
}

// ==================== РЕГИСТРАЦИЯ И ВХОД ====================
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    document.getElementById('clickButton').addEventListener('click', handleClick);
}

function showTab(tabName) {
    // Переключаем активные табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(tabName === 'login' ? 'Вход' : 'Регистрация')) {
            btn.classList.add('active');
        }
    });
    
    // Показываем активную форму
    document.getElementById('loginForm').classList.toggle('active', tabName === 'login');
    document.getElementById('registerForm').classList.toggle('active', tabName === 'register');
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showNotification('Заполните все поля!', 'error');
        return;
    }
    
    if (users[username] && users[username].password === password) {
        currentUser = {
            username: username,
            ...users[username]
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification(`Добро пожаловать, ${username}!`, 'success');
        showMainApp();
    } else {
        showNotification('Неверный логин или пароль!', 'error');
    }
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!username || !password) {
        showNotification('Заполните все поля!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают!', 'error');
        return;
    }
    
    if (users[username]) {
        showNotification('Пользователь уже существует!', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Логин должен быть минимум 3 символа!', 'error');
        return;
    }
    
    if (password.length < 3) {
        showNotification('Пароль должен быть минимум 3 символа!', 'error');
        return;
    }
    
    // Создаем нового пользователя
    users[username] = {
        password: password,
        balance: 100, // Стартовый баланс
        history: [],
        upgrades: {},
        transfers: []
    };
    
    saveUsers();
    showNotification('Регистрация успешна! Авторизуйтесь.', 'success');
    showTab('login');
    
    // Очищаем форму
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regConfirmPassword').value = '';
}

function logout() {
    if (confirm('Выйти из аккаунта?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showAuthScreen();
        showNotification('Вы вышли из системы', 'warning');
    }
}

// ==================== КЛИКЕР ====================
function handleClick() {
    if (!currentUser) return;
    
    // Анимация кнопки
    const clickBtn = document.getElementById('clickButton');
    clickBtn.classList.add('click-animation');
    setTimeout(() => clickBtn.classList.remove('click-animation'), 200);
    
    // Расчет дохода за клик
    let clickValue = 1;
    
    if (currentUser.upgrades?.multiplier) {
        clickValue *= Math.pow(upgrades.multiplier.multiplier, currentUser.upgrades.multiplier.count);
    }
    
    if (currentUser.upgrades?.megaclicker) {
        clickValue += upgrades.megaclicker.bonus * currentUser.upgrades.megaclicker.count;
    }
    
    // Добавляем деньги
    currentUser.balance += clickValue;
    
    // Записываем в историю
    addHistory('click', clickValue, 'Клик');
    
    // Обновляем данные
    updateUserData();
    saveUsers();
    
    // Всплывающее сообщение
    showClickEffect(clickValue);
}

function showClickEffect(amount) {
    const effect = document.createElement('div');
    effect.textContent = `+${amount} ⚡`;
    effect.style.position = 'fixed';
    effect.style.color = '#4cc9f0';
    effect.style.fontWeight = 'bold';
    effect.style.fontSize = '1.5rem';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '1000';
    effect.style.animation = 'floatUp 1s ease-out forwards';
    
    // Позиционируем возле кнопки
    const clickBtn = document.getElementById('clickButton');
    const rect = clickBtn.getBoundingClientRect();
    effect.style.left = `${rect.left + rect.width / 2}px`;
    effect.style.top = `${rect.top}px`;
    
    document.body.appendChild(effect);
    
    // Удаляем через 1 секунду
    setTimeout(() => effect.remove(), 1000);
}

// Добавляем анимацию в CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateY(-50px);
        }
    }
`;
document.head.appendChild(style);

// ==================== АВТОКЛИКЕР ====================
function startAutoClicker() {
    setInterval(() => {
        if (!currentUser) return;
        
        const autoClickers = currentUser.upgrades?.autoclicker?.count || 0;
        if (autoClickers > 0) {
            const income = autoClickers * upgrades.autoclicker.income;
            currentUser.balance += income;
            
            if (income > 0) {
                addHistory('autoclick', income, 'Автокликер');
