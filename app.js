// Application State & Storage
let cases = JSON.parse(localStorage.getItem('rta_cases')) || [
    {
        id: "RTA-101",
        clientName: "Rajesh Sharma",
        mobileNumber: "9876543210",
        email: "rajesh@example.com",
        panNumber: "ABCDE1234F",
        aadhaarNumber: "", 
        folioNumber: "R00039201",
        companyName: "Reliance Industries Ltd",
        serviceType: "Transmission (Death Case)",
        claimAmount: 450000,
        serviceCharges: 15000,
        advanceReceived: 5000,
        balancePending: 10000,
        caseStatus: "In Process",
        nextFollowUpDate: new Date().toISOString().split('T')[0],
        notes: "Awaiting original death certificate verification."
    }
];

let services = [
    "Transmission (Death Case)",
    "Duplicate Share Certificate",
    "IEPF Claim",
    "Physical to Demat",
    "Dividend Revalidation",
    "Signature Mismatch",
    "PAN / KYC Update"
];

let currentUserRole = "Admin";

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    renderCases();
    renderServices();
    renderReminders();
    renderNasTree();
    initCharts();
});

// Navigation Handling
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

// Role Switcher
function toggleRole() {
    currentUserRole = currentUserRole === "Admin" ? "Staff" : "Admin";
    document.getElementById('role-badge').innerText = `${currentUserRole} Role`;
}

// Auto-Calculate Pending Balance
function calculateBalance() {
    const charges = parseFloat(document.getElementById('serviceCharges').value) || 0;
    const advance = parseFloat(document.getElementById('advanceReceived').value) || 0;
    document.getElementById('balancePending').value = Math.max(0, charges - advance);
}

// Handle New Case Submission
function handleCaseSubmit(e) {
    e.preventDefault();
    
    const newCase = {
        id: `RTA-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: document.getElementById('clientName').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        email: document.getElementById('email').value,
        panNumber: document.getElementById('panNumber').value,
        aadhaarNumber: "", // Omitted / Protected field
        folioNumber: document.getElementById('folioNumber').value,
        companyName: document.getElementById('companyName').value,
        serviceType: document.getElementById('serviceType').value,
        claimAmount: parseFloat(document.getElementById('claimAmount').value) || 0,
        serviceCharges: parseFloat(document.getElementById('serviceCharges').value) || 0,
        advanceReceived: parseFloat(document.getElementById('advanceReceived').value) || 0,
        balancePending: parseFloat(document.getElementById('balancePending').value) || 0,
        caseStatus: document.getElementById('caseStatus').value,
        nextFollowUpDate: document.getElementById('nextFollowUpDate').value,
        notes: document.getElementById('notes').value
    };

    cases.push(newCase);
    localStorage.setItem('rta_cases', JSON.stringify(cases));
    
    alert('Client Case Saved Successfully!');
    document.getElementById('new-case-form').reset();
    updateDashboard();
    renderCases();
    renderNasTree();
    showTab('cases');
}

// Dashboard Metrics Update
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('stat-total').innerText = cases.length;
    document.getElementById('stat-pending').innerText = cases.filter(c => c.caseStatus === 'Pending').length;
    document.getElementById('stat-completed').innerText = cases.filter(c => c.caseStatus === 'Completed').length;
    document.getElementById('stat-today').innerText = cases.filter(c => c.nextFollowUpDate === today).length;
    document.getElementById('stat-overdue').innerText = cases.filter(c => c.nextFollowUpDate < today && c.caseStatus !== 'Completed').length;
    
    const totalRevenue = cases.reduce((sum, c) => sum + (c.advanceReceived || 0), 0);
    document.getElementById('stat-income').innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;
}

// Render Case Table
function renderCases() {
    const tbody = document.getElementById('cases-table-body');
    tbody.innerHTML = cases.map(c => `
        <tr class="hover:bg-slate-800/50 transition-colors">
            <td class="p-3 font-semibold text-white">${c.clientName}</td>
            <td class="p-3">${c.companyName}</td>
            <td class="p-3 font-mono text-xs text-blue-300">${c.folioNumber}</td>
            <td class="p-3">${c.serviceType}</td>
            <td class="p-3 text-yellow-400 font-medium">₹${(c.balancePending || 0).toLocaleString('en-IN')}</td>
            <td class="p-3">${c.nextFollowUpDate}</td>
            <td class="p-3">
                <span class="px-2.5 py-1 text-xs rounded-full ${getStatusBadgeClass(c.caseStatus)}">
                    ${c.caseStatus}
                </span>
            </td>
            <td class="p-3">
                <button onclick="deleteCase('${c.id}')" class="text-red-400 hover:text-red-300">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Completed': return 'bg-green-900/60 text-green-300 border border-green-700';
        case 'In Process': return 'bg-blue-900/60 text-blue-300 border border-blue-700';
        case 'Pending': return 'bg-yellow-900/60 text-yellow-300 border border-yellow-700';
        default: return 'bg-red-900/60 text-red-300 border border-red-700';
    }
}

function deleteCase(id) {
    if (currentUserRole !== 'Admin') {
        alert('Only Admin role can delete cases.');
        return;
    }
    cases = cases.filter(c => c.id !== id);
    localStorage.setItem('rta_cases', JSON.stringify(cases));
    renderCases();
    updateDashboard();
}

// Services Render
function renderServices() {
    const list = document.getElementById('service-list');
    list.innerHTML = services.map((s, index) => `
        <li class="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center cursor-move">
            <span><i class="fa-solid fa-grip-lines mr-3 text-slate-500"></i>${s}</span>
            <span class="text-xs text-slate-500">SLA: 15-30 Days</span>
        </li>
    `).join('');

    new Sortable(list, { animation: 150 });
}

// TrueNAS Storage View
function renderNasTree() {
    const tree = document.getElementById('nas-tree-view');
    tree.innerHTML = cases.map(c => `
        <div class="mb-2">
            <div>📂 /Clients/${c.clientName.replace(/\s+/g, '_')}_${c.folioNumber}/</div>
            <div class="pl-6 text-slate-400">📄 PAN.pdf</div>
            <div class="pl-6 text-slate-400">📄 Aadhaar.pdf</div>
            <div class="pl-6 text-slate-400">📄 ClaimForm.pdf</div>
        </div>
    `).join('');
}

// Render Reminders
function renderReminders() {
    const list = document.getElementById('reminders-list');
    list.innerHTML = cases.map(c => `
        <div class="p-4 bg-slate-950 border-l-4 border-blue-500 rounded-r-lg flex justify-between items-center">
            <div>
                <h4 class="font-bold text-white">${c.clientName} - ${c.serviceType}</h4>
                <p class="text-sm text-slate-400">${c.notes || 'No follow-up notes recorded.'}</p>
            </div>
            <div class="text-right">
                <span class="text-sm font-semibold text-yellow-400">${c.nextFollowUpDate}</span>
            </div>
        </div>
    `).join('');
}

// Chart Initializer
function initCharts() {
    const ctx1 = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Process', 'Completed', 'Rejected'],
            datasets: [{
                data: [
                    cases.filter(c => c.caseStatus === 'Pending').length,
                    cases.filter(c => c.caseStatus === 'In Process').length,
                    cases.filter(c => c.caseStatus === 'Completed').length,
                    cases.filter(c => c.caseStatus === 'Rejected').length
                ],
                backgroundColor: ['#eab308', '#3b82f6', '#22c55e', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx2 = document.getElementById('servicesChart').getContext('2d');
    new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Transmission', 'Duplicate Cert', 'IEPF Claim', 'Physical to Demat'],
            datasets: [{
                label: 'Active Cases',
                data: [12, 8, 15, 5],
                backgroundColor: '#3b82f6'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// CSV Export Engine
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Client Name,Company,Folio,Service,Status,Balance Pending\n";
    cases.forEach(c => {
        csvContent += `"${c.clientName}","${c.companyName}","${c.folioNumber}","${c.serviceType}","${c.caseStatus}","${c.balancePending}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "RTA_Cases_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}