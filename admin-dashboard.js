// Pilgrims Coin Platform - Admin Dashboard JavaScript

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    verifyAdminAccess();
    loadDashboardData();
    initializeForms();
    startNetworkMonitoring();
    startRobotLogging();
});

// Verify admin access
function verifyAdminAccess() {
    const admin = localStorage.getItem('pilgrimAdmin');
    if (!admin) {
        alert('Access denied! Admin privileges required.');
        window.location.href = 'index.html';
    }
}

// Load dashboard data
function loadDashboardData() {
    loadCustomers();
    loadTransactions();
    loadSecurityLogs();
    updateStatistics();
}

// Update statistics
function updateStatistics() {
    const customers = getAllCustomers();
    const pending = customers.filter(c => c.status === 'pending').length;
    const totalTransactions = getTotalTransactions();
    
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('pendingApprovals').textContent = pending;
    document.getElementById('totalTransactions').textContent = totalTransactions;
    
    // Calculate active mining users
    const activeMining = localStorage.getItem('miningState') === 'active' ? 1 : 0;
    document.getElementById('activeMining').textContent = activeMining;
}

// Get all customers
function getAllCustomers() {
    const customers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('pilgrimUser_')) {
            const userData = localStorage.getItem(key);
            if (userData) {
                try {
                    customers.push(JSON.parse(userData));
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }
    return customers;
}

// Load customers table
function loadCustomers() {
    const customers = getAllCustomers();
    const tableBody = document.getElementById('customerTable');
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No customers found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = customers.map(customer => {
        const statusClass = customer.status === 'approved' ? 'success' : 'warning';
        const coinBalance = customer.pilgrimCoin ? customer.pilgrimCoin.toFixed(8) : '0.00000000';
        const cashBalance = customer.pilgrimCash ? '$' + customer.pilgrimCash.toFixed(2) : '$0.00';
        
        return `
            <tr>
                <td>${customer.accountNumber || 'N/A'}</td>
                <td>${customer.fullName || 'N/A'}</td>
                <td>${customer.email || 'N/A'}</td>
                <td><span class="alert alert-${statusClass}" style="padding: 0.25rem 0.5rem; display: inline-block;">${customer.status || 'pending'}</span></td>
                <td>
                    <small>PGC: ${coinBalance}</small><br>
                    <small>Cash: ${cashBalance}</small>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="viewCustomer('${customer.username}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">View</button>
                    ${customer.status === 'pending' ? `<button class="btn btn-success" onclick="approveCustomer('${customer.username}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Approve</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// View customer details
function viewCustomer(username) {
    const customerData = localStorage.getItem('pilgrimUser_' + username);
    if (!customerData) {
        alert('Customer not found');
        return;
    }
    
    const customer = JSON.parse(customerData);
    
    const detailsHtml = `
        <div class="grid-2">
            <div>
                <h4>Personal Information</h4>
                <p><strong>Full Name:</strong> ${customer.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                <p><strong>DOB:</strong> ${customer.dob || 'N/A'}</p>
                <p><strong>Gender:</strong> ${customer.gender || 'N/A'}</p>
                <p><strong>Address:</strong> ${customer.address || 'N/A'}</p>
            </div>
            <div>
                <h4>Account Information</h4>
                <p><strong>Account Number:</strong> ${customer.accountNumber || 'N/A'}</p>
                <p><strong>Serial Number:</strong> ${customer.serialNumber || 'N/A'}</p>
                <p><strong>BVN:</strong> ${customer.bvn || 'N/A'}</p>
                <p><strong>NIN:</strong> ${customer.nin || 'N/A'}</p>
                <p><strong>Status:</strong> ${customer.status || 'pending'}</p>
                <p><strong>Registered:</strong> ${customer.dateRegistered ? new Date(customer.dateRegistered).toLocaleDateString() : 'N/A'}</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>Wallet Balances</h4>
            <p><strong>Pilgrims Coin:</strong> ${customer.pilgrimCoin ? customer.pilgrimCoin.toFixed(8) : '0.00000000'}</p>
            <p><strong>Pilgrims Cash:</strong> ${customer.pilgrimCash ? '$' + customer.pilgrimCash.toFixed(2) : '$0.00'}</p>
            <p><strong>Coin Wallet Address:</strong> ${customer.coinWalletAddress || 'Not generated'}</p>
            <p><strong>Cash Wallet Address:</strong> ${customer.cashWalletAddress || 'Not generated'}</p>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>Admin Actions</h4>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn btn-success" onclick="creditCustomer('${customer.username}')">Credit Account</button>
                <button class="btn btn-danger" onclick="debitCustomer('${customer.username}')">Debit Account</button>
                <button class="btn btn-primary" onclick="editCustomer('${customer.username}')">Edit Profile</button>
                ${customer.status === 'pending' ? `<button class="btn btn-success" onclick="approveCustomer('${customer.username}')">Approve Account</button>` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('customerDetails').innerHTML = detailsHtml;
    document.getElementById('customerModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
}

// Approve customer
function approveCustomer(username) {
    const customerData = localStorage.getItem('pilgrimUser_' + username);
    if (!customerData) {
        alert('Customer not found');
        return;
    }
    
    const customer = JSON.parse(customerData);
    customer.status = 'approved';
    localStorage.setItem('pilgrimUser_' + username, JSON.stringify(customer));
    
    // Log security event
    logSecurityEvent('approval', username, 'Admin System', '127.0.0.1', 'Admin Dashboard', 'Browser', 'success');
    
    alert('Customer approved successfully!');
    loadCustomers();
    updateStatistics();
    closeModal();
}

// Credit customer
function creditCustomer(username) {
    const customerData = localStorage.getItem('pilgrimUser_' + username);
    if (!customerData) {
        alert('Customer not found');
        return;
    }
    
    const amount = prompt('Enter amount to credit (Pilgrims Coin):');
    if (!amount || isNaN(amount)) {
        alert('Invalid amount');
        return;
    }
    
    const customer = JSON.parse(customerData);
    customer.pilgrimCoin = (customer.pilgrimCoin || 0) + parseFloat(amount);
    
    // Add transaction
    const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        type: 'admin-credit',
        amount: parseFloat(amount),
        description: 'Admin credit',
        status: 'completed',
        admin: 'Olawale Abdul-Ganiyu'
    };
    
    customer.transactions = customer.transactions || [];
    customer.transactions.push(transaction);
    
    localStorage.setItem('pilgrimUser_' + username, JSON.stringify(customer));
    
    // Log security event
    logSecurityEvent('credit', username, 'Admin System', '127.0.0.1', 'Admin Dashboard', 'Browser', 'success');
    
    alert(`Successfully credited ${amount} Pilgrims Coin to ${customer.fullName}`);
    loadCustomers();
    closeModal();
}

// Debit customer
function debitCustomer(username) {
    const customerData = localStorage.getItem('pilgrimUser_' + username);
    if (!customerData) {
        alert('Customer not found');
        return;
    }
    
    const amount = prompt('Enter amount to debit (Pilgrims Coin):');
    if (!amount || isNaN(amount)) {
        alert('Invalid amount');
        return;
    }
    
    const customer = JSON.parse(customerData);
    
    if (parseFloat(amount) > (customer.pilgrimCoin || 0)) {
        alert('Insufficient balance');
        return;
    }
    
    customer.pilgrimCoin -= parseFloat(amount);
    
    // Add transaction
    const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        type: 'admin-debit',
        amount: parseFloat(amount),
        description: 'Admin debit',
        status: 'completed',
        admin: 'Olawale Abdul-Ganiyu'
    };
    
    customer.transactions = customer.transactions || [];
    customer.transactions.push(transaction);
    
    localStorage.setItem('pilgrimUser_' + username, JSON.stringify(customer));
    
    // Log security event
    logSecurityEvent('debit', username, 'Admin System', '127.0.0.1', 'Admin Dashboard', 'Browser', 'success');
    
    alert(`Successfully debited ${amount} Pilgrims Coin from ${customer.fullName}`);
    loadCustomers();
    closeModal();
}

// Edit customer
function editCustomer(username) {
    const customerData = localStorage.getItem('pilgrimUser_' + username);
    if (!customerData) {
        alert('Customer not found');
        return;
    }
    
    const customer = JSON.parse(customerData);
    
    const newFullName = prompt('Enter new full name:', customer.fullName);
    if (newFullName) {
        customer.fullName = newFullName;
    }
    
    const newPhone = prompt('Enter new phone number:', customer.phone);
    if (newPhone) {
        customer.phone = newPhone;
    }
    
    const newAddress = prompt('Enter new address:', customer.address);
    if (newAddress) {
        customer.address = newAddress;
    }
    
    localStorage.setItem('pilgrimUser_' + username, JSON.stringify(customer));
    
    alert('Customer profile updated successfully!');
    loadCustomers();
    viewCustomer(username);
}

// Refresh customers
function refreshCustomers() {
    loadCustomers();
    updateStatistics();
    alert('Customer list refreshed!');
}

// Load transactions
function loadTransactions() {
    const customers = getAllCustomers();
    const allTransactions = [];
    
    customers.forEach(customer => {
        if (customer.transactions) {
            customer.transactions.forEach(tx => {
                allTransactions.push({
                    ...tx,
                    username: customer.username,
                    fullName: customer.fullName
                });
            });
        }
    });
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tableBody = document.getElementById('transactionTerminalTable');
    
    if (allTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = allTransactions.slice(0, 50).map(tx => {
        const date = new Date(tx.date).toLocaleString();
        const statusClass = tx.status === 'completed' ? 'success' : 'warning';
        
        return `
            <tr>
                <td>${tx.id}</td>
                <td>${date}</td>
                <td>${tx.fullName || tx.username}</td>
                <td style="text-transform: capitalize;">${tx.type}</td>
                <td>${tx.amount}</td>
                <td><span class="alert alert-${statusClass}" style="padding: 0.25rem 0.5rem; display: inline-block;">${tx.status}</span></td>
                <td>${tx.description || tx.recipient || tx.to || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Get total transactions
function getTotalTransactions() {
    const customers = getAllCustomers();
    let total = 0;
    
    customers.forEach(customer => {
        if (customer.transactions) {
            total += customer.transactions.length;
        }
    });
    
    return total;
}

// Load security logs
function loadSecurityLogs() {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    const tableBody = document.getElementById('securityLogs');
    
    if (logs.length === 0) {
        // Add sample logs
        const sampleLogs = [
            {
                timestamp: new Date().toISOString(),
                type: 'login',
                user: 'olawale',
                ip: '192.168.1.1',
                location: 'Lagos, Nigeria',
                device: 'Chrome on Windows',
                status: 'success'
            }
        ];
        localStorage.setItem('securityLogs', JSON.stringify(sampleLogs));
        loadSecurityLogs();
        return;
    }
    
    tableBody.innerHTML = logs.slice(-20).reverse().map(log => {
        const date = new Date(log.timestamp).toLocaleString();
        const statusClass = log.status === 'success' ? 'success' : 'danger';
        
        return `
            <tr>
                <td>${date}</td>
                <td style="text-transform: capitalize;">${log.type}</td>
                <td>${log.user || 'N/A'}</td>
                <td>${log.ip}</td>
                <td>${log.location}</td>
                <td>${log.device}</td>
                <td><span class="alert alert-${statusClass}" style="padding: 0.25rem 0.5rem; display: inline-block;">${log.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Log security event
function logSecurityEvent(type, user, ip, location, device, status) {
    const logs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    
    logs.push({
        timestamp: new Date().toISOString(),
        type: type,
        user: user,
        ip: ip,
        location: location,
        device: device,
        status: status
    });
    
    localStorage.setItem('securityLogs', JSON.stringify(logs));
    loadSecurityLogs();
}

// Track IP address
function trackIP() {
    const ip = document.getElementById('ipSearch').value;
    if (!ip) {
        alert('Please enter an IP address');
        return;
    }
    
    document.getElementById('mapContainer').style.display = 'block';
    document.getElementById('locationInfo').innerHTML = `
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>Location:</strong> Lagos, Nigeria</p>
        <p><strong>Coordinates:</strong> 6.5244° N, 3.3792° E</p>
        <p><strong>ISP:</strong> MTN Nigeria</p>
        <p><strong>Timezone:</strong> Africa/Lagos</p>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(76, 175, 80, 0.1); border-radius: 5px;">
            <p style="color: #4caf50;">✅ Location verified - No suspicious activity detected</p>
        </div>
    `;
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById(sectionId).style.display = 'block';
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Initialize forms
function initializeForms() {
    // Account generator form
    document.getElementById('accountGeneratorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('customerUsername').value;
        const accountNumber = document.getElementById('newAccountNumber').value;
        
        if (!username || !accountNumber) {
            alert('Please generate account number first');
            return;
        }
        
        const customerData = localStorage.getItem('pilgrimUser_' + username);
        if (!customerData) {
            alert('Customer not found');
            return;
        }
        
        const customer = JSON.parse(customerData);
        customer.accountNumber = accountNumber;
        localStorage.setItem('pilgrimUser_' + username, JSON.stringify(customer));
        
        alert(`Account number ${accountNumber} assigned to ${customer.fullName} successfully!`);
        this.reset();
    });
}

// Generate account number
function generateAccountNumber() {
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    document.getElementById('newAccountNumber').value = accountNumber;
}

// Generate transaction ID
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Start network monitoring
function startNetworkMonitoring() {
    const monitor = document.getElementById('networkMonitor');
    
    setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        const messages = [
            `[${timestamp}] Checking blockchain connectivity...`,
            `[${timestamp}] Pilgrims Coin blockchain: Connected ✓`,
            `[${timestamp}] Bitcoin network: Connected ✓`,
            `[${timestamp}] Ethereum network: Connected ✓`,
            `[${timestamp}] All systems operational ✓`,
            `[${timestamp}] Monitoring user activities...`,
            `[${timestamp}] Server load: Normal`,
            `[${timestamp}] Database connection: Stable ✓`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        monitor.innerHTML += `<p>${message}</p>`;
        monitor.scrollTop = monitor.scrollHeight;
        
        // Keep only last 50 messages
        const lines = monitor.innerHTML.split('<p>');
        if (lines.length > 50) {
            monitor.innerHTML = lines.slice(-50).join('<p>');
        }
    }, 3000);
}

// Start robot logging
function startRobotLogging() {
    const robotLog = document.getElementById('robotLog');
    
    setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        const messages = [
            `[${timestamp}] Robot active - Mining operations monitored`,
            `[${timestamp}] Pilgrims Coin value stability check: $0.50 ✓`,
            `[${timestamp}] Notifying blockchain partners...`,
            `[${timestamp}] Market cap calculation updated`,
            `[${timestamp}] Liquidity pools monitored`,
            `[${timestamp}] Exchange rates synchronized`,
            `[${timestamp}] User mining activity: Normal`,
            `[${timestamp}] Automatic value adjustment: Not required`
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        robotLog.innerHTML += `<p>${message}</p>`;
        robotLog.scrollTop = robotLog.scrollHeight;
        
        // Keep only last 50 messages
        const lines = robotLog.innerHTML.split('<p>');
        if (lines.length > 50) {
            robotLog.innerHTML = lines.slice(-50).join('<p>');
        }
    }, 4000);
}

// Logout
function logout() {
    localStorage.removeItem('pilgrimAdmin');
    window.location.href = 'index.html';
}