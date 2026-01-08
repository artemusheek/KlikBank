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
                updateUserData();
                saveUsers();
            }
        }
    }, 1000); // Каждую секунду
}

// ==================== МАГАЗИН ====================
function buyUpgrade(type) {
    if (!currentUser) return;
    
    const upgrade = upgrades[type];
    if (!upgrade) return;
    
    // Получаем текущее количество улучшений
    const currentCount = currentUser.upgrades?.[type]?.count || 0;
    const price = upgrade.price * (currentCount + 1); // Цена растет с каждым улучшением
    
    if (currentUser.balance < price) {
        showNotification('Недостаточно средств!', 'error');
        return;
    }
    
    // Покупка
    currentUser.balance -= price;
    
    // Обновляем счетчик улучшений
    if (!currentUser.upgrades) currentUser.upgrades = {};
    if (!currentUser.upgrades[type]) currentUser.upgrades[type] = { count: 0 };
    currentUser.upgrades[type].count++;
    
    // Записываем в историю
    addHistory('upgrade', -price, `Куплено улучшение: ${getUpgradeName(type)}`);
    
    // Обновляем интерфейс
    updateUserData();
    updateShopPrices();
    saveUsers();
    
    showNotification(`Улучшение "${getUpgradeName(type)}" куплено!`, 'success');
}

function getUpgradeName(type) {
    const names = {
        autoclicker: 'Автокликер',
        multiplier: 'Усиленный клик',
        megaclicker: 'Мега кликер',
        bank: 'Банковский счет'
    };
    return names[type] || type;
}

function updateShopPrices() {
    if (!currentUser) return;
    
    for (const [type, data] of Object.entries(upgrades)) {
        const currentCount = currentUser.upgrades?.[type]?.count || 0;
        const price = data.price * (currentCount + 1);
        
        const element = document.getElementById(`${type}Price`);
        if (element) {
            element.textContent = price;
        }
    }
}

// ==================== ПЕРЕВОДЫ ====================
function makeTransfer() {
    if (!currentUser) return;
    
    const toUser = document.getElementById('transferTo').value;
    const amount = parseInt(document.getElementById('transferAmount').value);
    const comment = document.getElementById('transferComment').value.trim();
    
    // Валидация
    if (!toUser) {
        showNotification('Выберите получателя!', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showNotification('Введите корректную сумму!', 'error');
        return;
    }
    
    if (amount > currentUser.balance) {
        showNotification('Недостаточно средств!', 'error');
        return;
    }
    
    if (toUser === currentUser.username) {
        showNotification('Нельзя перевести себе!', 'error');
        return;
    }
    
    if (!users[toUser]) {
        showNotification('Получатель не найден!', 'error');
        return;
    }
    
    // Выполняем перевод
    currentUser.balance -= amount;
    users[toUser].balance += amount;
    
    // Записываем переводы
    const transferData = {
        from: currentUser.username,
        to: toUser,
        amount: amount,
        comment: comment || 'Без комментария',
        date: new Date().toISOString()
    };
    
    // Сохраняем у отправителя и получателя
    if (!currentUser.transfers) currentUser.transfers = [];
    if (!users[toUser].transfers) users[toUser].transfers = [];
    
    currentUser.transfers.push({...transferData, type: 'outgoing'});
    users[toUser].transfers.push({...transferData, type: 'incoming'});
    
    // Записываем в историю
    addHistory('transfer', -amount, `Перевод ${toUser}: ${comment}`);
    addUserHistory(toUser, 'transfer', amount, `Перевод от ${currentUser.username}: ${comment}`);
    
    // Обновляем интерфейс
    updateUserData();
    loadTransfers();
    saveUsers();
    
    // Очищаем форму
    document.getElementById('transferAmount').value = '';
    document.getElementById('transferComment').value = '';
    
    showNotification(`Перевод ${amount} ⚡ пользователю ${toUser} выполнен!`, 'success');
}

function loadTransfers() {
    if (!currentUser) return;
    
    const transfersList = document.getElementById('transfersList');
    transfersList.innerHTML = '';
    
    const userTransfers = currentUser.transfers || [];
    
    if (userTransfers.length === 0) {
        transfersList.innerHTML = '<p class="empty-state">Нет переводов</p>';
        return;
    }
    
    // Сортируем по дате (новые сверху)
    userTransfers.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Показываем последние 10 переводов
    userTransfers.slice(0, 10).forEach(transfer => {
        const transferEl = document.createElement('div');
        transferEl.className = `transfer-item ${transfer.type === 'outgoing' ? 'debit' : 'credit'}`;
        
        transferEl.innerHTML = `
            <div class="transfer-header">
                <span>${transfer.type === 'outgoing' ? '👤 ' + transfer.to : '👤 ' + transfer.from}</span>
                <span class="transfer-amount">${transfer.type === 'outgoing' ? '-' : '+'}${transfer.amount} ⚡</span>
            </div>
            <div class="transfer-comment">${transfer.comment}</div>
            <div class="transfer-date">${new Date(transfer.date).toLocaleDateString()}</div>
        `;
        
        transfersList.appendChild(transferEl);
    });
    
    // Обновляем список пользователей для перевода
    updateTransferUsersList();
}

function updateTransferUsersList() {
    const select = document.getElementById('transferTo');
    select.innerHTML = '<option value="">Выберите пользователя</option>';
    
    Object.keys(users).forEach(username => {
        if (username !== currentUser.username) {
            const option = document.createElement('option');
            option.value = username;
            option.textContent = `${username} (${users[username].balance} ⚡)`;
            select.appendChild(option);
        }
    });
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================
function updateUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    const usersArray = Object.entries(users)
        .sort((a, b) => b[1].balance - a[1].balance);
    
    if (usersArray.length === 0) {
        usersList.innerHTML = '<p class="empty-state">Нет пользователей</p>';
        return;
    }
    
    usersArray.forEach(([username, data]) => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        // Генерируем цвет аватарки на основе имени
        const colors = ['#4361ee', '#7209b7', '#f72585', '#4cc9f0', '#f8961e'];
        const colorIndex = username.length % colors.length;
        const firstLetter = username.charAt(0).toUpperCase();
        
        userCard.innerHTML = `
            <div class="user-avatar" style="background: ${colors[colorIndex]}">
                ${firstLetter}
            </div>
            <div class="user-info">
                <h4>${username} ${username === currentUser.username ? '(Вы)' : ''}</h4>
                <p class="user-balance">${data.balance} ⚡</p>
                <small>Улучшений: ${Object.keys(data.upgrades || {}).length}</small>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
}

// ==================== ИСТОРИЯ ====================
function addHistory(type, amount, description) {
    if (!currentUser.history) currentUser.history = [];
    
    currentUser.history.push({
        type: type,
        amount: amount,
        description: description,
        date: new Date().toISOString()
    });
    
    // Ограничиваем историю 50 записями
    if (currentUser.history.length > 50) {
        currentUser.history = currentUser.history.slice(-50);
    }
}

function addUserHistory(username, type, amount, description) {
    if (!users[username].history) users[username].history = [];
    
    users[username].history.push({
        type: type,
        amount: amount,
        description: description,
        date: new Date().toISOString()
    });
}

function loadUserHistory() {
    if (!currentUser) return;
    
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    const history = currentUser.history || [];
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">История операций пуста</p>';
        return;
    }
    
    // Сортируем по дате (новые сверху)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    history.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const icon = record.type === 'click' ? 'fa-mouse-pointer' : 
                    record.type === 'transfer' ? 'fa-exchange-alt' : 
                    record.type === 'upgrade' ? 'fa-shopping-cart' : 
                    'fa-coins';
        
        const typeClass = record.type === 'click' ? 'click' : 
                         record.type === 'transfer' ? 'transfer' : 'upgrade';
        
        historyItem.innerHTML = `
            <div class="history-type ${typeClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="history-details">
                <div>${record.description}</div>
                <div class="history-time">${new Date(record.date).toLocaleString()}</div>
            </div>
            <div class="history-amount ${record.amount > 0 ? 'positive' : 'negative'}">
                ${record.amount > 0 ? '+' : ''}${record.amount} ⚡
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUserData() {
    if (!currentUser) return;
    
    // Обновляем баланс
    document.getElementById('balanceDisplay').textContent = `${currentUser.balance} ⚡`;
    document.getElementById('headerBalance').querySelector('span').textContent = currentUser.balance;
    
    // Расчет дохода за клик
    let perClick = 1;
    if (currentUser.upgrades?.multiplier) {
        perClick *= Math.pow(upgrades.multiplier.multiplier, currentUser.upgrades.multiplier.count);
    }
    if (currentUser.upgrades?.megaclicker) {
        perClick += upgrades.megaclicker.bonus * currentUser.upgrades.megaclicker.count;
    }
    
    document.getElementById('perClickDisplay').textContent = `${perClick} ⚡`;
    document.getElementById('clickValue').textContent = perClick;
    
    // Автокликеры
    const autoClickers = currentUser.upgrades?.autoclicker?.count || 0;
    document.getElementById('autoClickersDisplay').textContent = autoClickers;
    document.getElementById('autoIncome').textContent = autoClickers * upgrades.autoclicker.income;
    
    // Обновляем цены в магазине
    updateShopPrices();
}

function updateHeaderBalance() {
    const balanceEl = document.getElementById('headerBalance');
    if (currentUser) {
        balanceEl.style.display = 'block';
        balanceEl.querySelector('span').textContent = currentUser.balance;
    } else {
        balanceEl.style.display = 'none';
    }
}

// ==================== НАВИГАЦИЯ ====================
function showSection(sectionId) {
    // Скрываем все секции
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем нужную секцию
    document.getElementById(sectionId + 'Section').classList.remove('hidden');
    
    // Активируем кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.textContent.includes(getSectionName(sectionId))) {
            btn.classList.add('active');
        }
    });
}

function getSectionName(sectionId) {
    const names = {
        clicker: 'Кликер',
        transfers: 'Переводы',
        shop: 'Магазин',
        users: 'Пользователи',
        history: 'История'
    };
    return names[sectionId] || sectionId;
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type, 'show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==================== СОХРАНЕНИЕ ДАННЫХ ====================
function saveUsers() {
    if (currentUser) {
        users[currentUser.username] = {...currentUser};
        delete users[currentUser.username].username; // Убираем дублирование
    }
    localStorage.setItem('klikbankUsers', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUsers() {
    const savedUsers = localStorage.getItem('klikbankUsers');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
}
