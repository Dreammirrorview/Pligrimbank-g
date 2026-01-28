// Pilgrims Coin Platform - Dashboard JavaScript

// Global variables
let currentUser = null;
let miningInterval = null;
let isMining = false;
let miningProgress = 0;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    initializeMining();
    initializeForms();
    updateDisplays();
});

// Load user data from localStorage
function loadUserData() {
    const userStr = localStorage.getItem('pilgrimUser');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        document.getElementById('userName').textContent = currentUser.fullName;
        
        // Generate wallet addresses if not exist
        if (!currentUser.coinWalletAddress) {
            currentUser.coinWalletAddress = generateWalletAddress();
        }
        if (!currentUser.cashWalletAddress) {
            currentUser.cashWalletAddress = generateWalletAddress();
        }
        saveUserData();
    }
}

// Save user data to localStorage
function saveUserData() {
    if (currentUser) {
        localStorage.setItem('pilgrimUser', JSON.stringify(currentUser));
    }
}

// Generate wallet address
function generateWalletAddress() {
    return '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

// Update all displays
function updateDisplays() {
    if (!currentUser) return;
    
    // Update coin balance
    const coinBalance = currentUser.pilgrimCoin || 0;
    document.getElementById('coinBalance').textContent = coinBalance.toFixed(8);
    document.getElementById('walletCoinBalance').textContent = coinBalance.toFixed(8);
    document.getElementById('minedCoins').textContent = coinBalance.toFixed(8);
    
    // Update cash balance
    const cashBalance = currentUser.pilgrimCash || 0;
    document.getElementById('cashBalance').textContent = '$' + cashBalance.toFixed(2);
    document.getElementById('walletCashBalance').textContent = '$' + cashBalance.toFixed(2);
    document.getElementById('minedCash').textContent = '$' + cashBalance.toFixed(2);
    
    // Update account info
    document.getElementById('accountNumber').textContent = currentUser.accountNumber || 'N/A';
    document.getElementById('serialNumber').textContent = currentUser.serialNumber || 'N/A';
    document.getElementById('userEmail').textContent = currentUser.email || 'N/A';
    document.getElementById('userPhone').textContent = currentUser.phone || 'N/A';
    
    // Update wallet addresses
    document.getElementById('coinWalletAddress').textContent = currentUser.coinWalletAddress || 'N/A';
    document.getElementById('cashWalletAddress').textContent = currentUser.cashWalletAddress || 'N/A';
    document.getElementById('receiveCoinAddress').textContent = currentUser.coinWalletAddress || 'N/A';
    document.getElementById('receiveCashAddress').textContent = currentUser.cashWalletAddress || 'N/A';
    
    // Update profile
    document.getElementById('profileFullName').value = currentUser.fullName || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAccountNumber').value = currentUser.accountNumber || '';
    document.getElementById('profileSerialNumber').value = currentUser.serialNumber || '';
    document.getElementById('profileBVN').value = currentUser.bvn || '';
    document.getElementById('profileNIN').value = currentUser.nin || '';
    document.getElementById('profileAddress').value = currentUser.address || '';
    
    // Update transaction table
    updateTransactionTable();
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Mining functions
function initializeMining() {
    // Check if mining was in progress
    const miningState = localStorage.getItem('miningState');
    if (miningState === 'active') {
        startMining(true);
    }
}

function startMining(resume = false) {
    if (isMining) return;
    
    isMining = true;
    document.getElementById('miningStatus').textContent = resume ? 'Resumed' : 'Started';
    localStorage.setItem('miningState', 'active');
    
    miningInterval = setInterval(() => {
        if (!currentUser) return;
        
        // Increment coin by 0.00000001
        const coinIncrement = 0.00000001;
        currentUser.pilgrimCoin = (currentUser.pilgrimCoin || 0) + coinIncrement;
        
        // Calculate cash (0.5 USD per 1.0 coin)
        const cashIncrement = coinIncrement * 0.5;
        currentUser.pilgrimCash = (currentUser.pilgrimCash || 0) + cashIncrement;
        
        // Update progress
        miningProgress = (miningProgress + 0.1) % 100;
        document.getElementById('miningProgress').style.width = miningProgress + '%';
        
        // Save and update displays
        saveUserData();
        updateDisplays();
        
    }, 1000); // Every second
}

function pauseMining() {
    if (!isMining) return;
    
    clearInterval(miningInterval);
    isMining = false;
    document.getElementById('miningStatus').textContent = 'Paused';
    localStorage.setItem('miningState', 'paused');
}

function stopMining() {
    pauseMining();
    document.getElementById('miningStatus').textContent = 'Stopped';
    localStorage.setItem('miningState', 'stopped');
    miningProgress = 0;
    document.getElementById('miningProgress').style.width = '0%';
}

// Generate new wallet addresses
function generateCoinAddress() {
    if (!currentUser) return;
    currentUser.coinWalletAddress = generateWalletAddress();
    saveUserData();
    updateDisplays();
    alert('New Pilgrims Coin wallet address generated!');
}

function generateCashAddress() {
    if (!currentUser) return;
    currentUser.cashWalletAddress = generateWalletAddress();
    saveUserData();
    updateDisplays();
    alert('New Pilgrims Cash wallet address generated!');
}

// Copy address
function copyAddress(elementId) {
    const address = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(address).then(() => {
        alert('Address copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy address');
    });
}

// Initialize forms
function initializeForms() {
    // Send form
    document.getElementById('sendForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currency = document.getElementById('sendCurrency').value;
        const recipient = document.getElementById('recipientAddress').value;
        const amount = parseFloat(document.getElementById('sendAmount').value);
        const description = document.getElementById('sendDescription').value;
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        // Check balance
        if (currency === 'pilgrim-coin' && amount > currentUser.pilgrimCoin) {
            alert('Insufficient Pilgrims Coin balance');
            return;
        }
        if (currency === 'pilgrim-cash' && amount > currentUser.pilgrimCash) {
            alert('Insufficient Pilgrims Cash balance');
            return;
        }
        
        // Deduct from balance
        if (currency === 'pilgrim-coin') {
            currentUser.pilgrimCoin -= amount;
        } else if (currency === 'pilgrim-cash') {
            currentUser.pilgrimCash -= amount;
        }
        
        // Add transaction
        const transaction = {
            id: generateTransactionId(),
            date: new Date().toISOString(),
            type: 'send',
            currency: currency,
            recipient: recipient,
            amount: amount,
            description: description,
            status: 'completed'
        };
        
        currentUser.transactions.push(transaction);
        saveUserData();
        updateDisplays();
        
        alert('Transaction successful! Transaction ID: ' + transaction.id);
        this.reset();
    });
    
    // Exchange form
    document.getElementById('exchangeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const amount = parseFloat(document.getElementById('exchangeAmount').value);
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        // Simple exchange rates (in real app, these would come from API)
        const rates = {
            'pilgrim-coin': 0.5,
            'pilgrim-cash': 1.0,
            'bitcoin': 45000,
            'ethereum': 3000
        };
        
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        const receiveAmount = (amount * fromRate) / toRate;
        
        // Add transaction
        const transaction = {
            id: generateTransactionId(),
            date: new Date().toISOString(),
            type: 'exchange',
            from: fromCurrency,
            to: toCurrency,
            amount: amount,
            received: receiveAmount,
            status: 'completed'
        };
        
        currentUser.transactions.push(transaction);
        saveUserData();
        updateDisplays();
        
        alert('Exchange successful! You received: ' + receiveAmount.toFixed(8) + ' ' + toCurrency);
        this.reset();
    });
    
    // Buy form
    document.getElementById('buyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('buyAmount').value);
        const receiveCoins = amount / 0.5; // 1 coin = $0.50
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        // Add coins
        currentUser.pilgrimCoin = (currentUser.pilgrimCoin || 0) + receiveCoins;
        
        // Add transaction
        const transaction = {
            id: generateTransactionId(),
            date: new Date().toISOString(),
            type: 'buy',
            amount: amount,
            received: receiveCoins,
            status: 'completed'
        };
        
        currentUser.transactions.push(transaction);
        saveUserData();
        updateDisplays();
        
        alert('Purchase successful! You received: ' + receiveCoins.toFixed(8) + ' Pilgrims Coins');
        this.reset();
    });
    
    // Sell form
    document.getElementById('sellForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('sellAmount').value);
        const receiveUSD = amount * 0.5; // 1 coin = $0.50
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        if (amount > currentUser.pilgrimCoin) {
            alert('Insufficient Pilgrims Coin balance');
            return;
        }
        
        // Deduct coins
        currentUser.pilgrimCoin -= amount;
        
        // Add cash
        currentUser.pilgrimCash = (currentUser.pilgrimCash || 0) + receiveUSD;
        
        // Add transaction
        const transaction = {
            id: generateTransactionId(),
            date: new Date().toISOString(),
            type: 'sell',
            amount: amount,
            received: receiveUSD,
            status: 'completed'
        };
        
        currentUser.transactions.push(transaction);
        saveUserData();
        updateDisplays();
        
        alert('Sale successful! You received: $' + receiveUSD.toFixed(2) + ' USD');
        this.reset();
    });
    
    // Bank transfer form
    document.getElementById('bankTransferForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bank = document.getElementById('selectBank').value;
        const accountNumber = document.getElementById('bankAccountNumber').value;
        const accountName = document.getElementById('bankAccountName').value;
        const amount = parseFloat(document.getElementById('bankAmount').value);
        const description = document.getElementById('bankDescription').value;
        
        if (!currentUser) {
            alert('Please login first');
            return;
        }
        
        if (amount > currentUser.pilgrimCash) {
            alert('Insufficient Pilgrims Cash balance');
            return;
        }
        
        // Deduct from cash
        currentUser.pilgrimCash -= amount;
        
        // Add transaction
        const transaction = {
            id: generateTransactionId(),
            date: new Date().toISOString(),
            type: 'bank-transfer',
            bank: bank,
            accountNumber: accountNumber,
            accountName: accountName,
            amount: amount,
            description: description,
            status: 'processing'
        };
        
        currentUser.transactions.push(transaction);
        saveUserData();
        updateDisplays();
        
        alert('Bank transfer initiated! Transaction ID: ' + transaction.id + '\nYour transfer will be processed within 5 minutes.');
        this.reset();
    });
    
    // Card form
    document.getElementById('cardForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Card added successfully! You can now use this card for deposits and withdrawals.');
        this.reset();
    });
}

// Generate transaction ID
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Update transaction table
function updateTransactionTable() {
    const tableBody = document.getElementById('transactionTable');
    
    if (!currentUser || !currentUser.transactions || currentUser.transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions yet</td></tr>';
        return;
    }
    
    const sortedTransactions = [...currentUser.transactions].reverse().slice(0, 10);
    
    tableBody.innerHTML = sortedTransactions.map(tx => {
        const date = new Date(tx.date).toLocaleDateString() + ' ' + new Date(tx.date).toLocaleTimeString();
        let amountDisplay = '';
        
        if (tx.type === 'send') {
            amountDisplay = '<span style="color: #f44336;">-' + tx.amount + ' ' + tx.currency + '</span>';
        } else if (tx.type === 'buy') {
            amountDisplay = '<span style="color: #4caf50;">+$' + tx.amount + '</span>';
        } else if (tx.type === 'sell') {
            amountDisplay = '<span style="color: #4caf50;">+$' + tx.received.toFixed(2) + '</span>';
        } else if (tx.type === 'bank-transfer') {
            amountDisplay = '<span style="color: #f44336;">-' + tx.amount + ' NGN</span>';
        } else {
            amountDisplay = tx.amount + ' ' + (tx.currency || '');
        }
        
        const statusClass = tx.status === 'completed' ? 'success' : tx.status === 'processing' ? 'warning' : 'danger';
        
        return `
            <tr>
                <td>${date}</td>
                <td style="text-transform: capitalize;">${tx.type}</td>
                <td>${tx.description || tx.recipient || tx.to || '-'}</td>
                <td>${amountDisplay}</td>
                <td><span class="alert alert-${statusClass}" style="padding: 0.25rem 0.5rem; display: inline-block;">${tx.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Edit profile
function editProfile() {
    const newAddress = prompt('Enter new address:');
    if (newAddress) {
        currentUser.address = newAddress;
        saveUserData();
        updateDisplays();
        alert('Profile updated successfully!');
    }
}

// Logout
function logout() {
    localStorage.removeItem('pilgrimUser');
    window.location.href = 'index.html';
}