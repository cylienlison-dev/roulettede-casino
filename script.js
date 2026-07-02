// SYSTÈME DE ROULETTE OFFICIELLE EUROPÉENNE
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// INITIALISATION DU SOLDE DE DÉPART
const STARTING_BALANCE = 1000;
let balance = parseInt(localStorage.getItem('roulette_canvas_balance')) || STARTING_BALANCE;
let currentBet = 0; // Représente la mise totale cumulée
let bets = {};      // Stocke le détail des mises par numéro (ex: { 5: 10, 17: 100 })
let isSpinning = false;
let gameHistory = []; 

// ÉLÉMENTS DE L'INTERFACE
const balanceDisplay = document.getElementById('global-balance');
const statusDisplay = document.getElementById('roulette-status');
const canvas = document.getElementById('roulette-canvas');
const betTargetInput = document.getElementById('bet-target');
const betAmountDisplay = document.getElementById('display-bet-amount');
const spinButton = document.getElementById('spin-btn');
const clearBetButton = document.getElementById('clear-bet-btn');
const chipButtons = document.querySelectorAll('.chip-btn');
const historyContainer = document.getElementById('history-container');

// CONFIGURATION DU CANVAS HAUTE DÉFINITION
const ctx = canvas.getContext('2d');
const size = 800; 
canvas.width = size;
canvas.height = size;
const center = size / 2;

function getNumberColor(num) {
    if (num === 0) return '#15803d'; 
    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return reds.includes(num) ? '#b91c1c' : '#171717'; 
}

function drawWheel() {
    ctx.clearRect(0, 0, size, size);
    
    const totalSegments = WHEEL_NUMBERS.length;
    const arcLength = (Math.PI * 2) / totalSegments;

    // 1. LE BORD EXTÉRIEUR : ACAJOU MULTI-COUCHES
    const woodGradient = ctx.createRadialGradient(center, center, size * 0.42, center, center, size * 0.5);
    woodGradient.addColorStop(0, '#291303');
    woodGradient.addColorStop(0.4, '#451a03');
    woodGradient.addColorStop(0.8, '#78350f');
    woodGradient.addColorStop(0.95, '#451a03');
    woodGradient.addColorStop(1, '#1c0d02');
    ctx.beginPath();
    ctx.arc(center, center, size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = woodGradient;
    ctx.fill();

    // 2. COURONNE EN OR
    ctx.beginPath();
    ctx.arc(center, center, size * 0.42, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
    ctx.stroke();

    // 3. CASES NUMÉROTÉES
    let startAngle = -Math.PI / 2 - (arcLength / 2);

    for (let i = 0; i < totalSegments; i++) {
        const currentAngle = startAngle + (i * arcLength);

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, size * 0.41, currentAngle, currentAngle + arcLength);
        ctx.closePath();
        ctx.fillStyle = getNumberColor(WHEEL_NUMBERS[i]);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(center + Math.cos(currentAngle) * size * 0.41, center + Math.sin(currentAngle) * size * 0.41);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.stroke();

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(currentAngle + arcLength / 2 + Math.PI / 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px monospace";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(WHEEL_NUMBERS[i], 0, -size * 0.35);
        ctx.restore();
    }

    // 4. BAGUE DORÉE COMPTE-TOURS
    ctx.beginPath();
    ctx.arc(center, center, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0f0f';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // 5. LE CÔNE DE LA TOUPIE CENTRALE CHROMÉE
    const coneGradient = ctx.createRadialGradient(center, center, 0, center, center, size * 0.22);
    coneGradient.addColorStop(0, '#ffffff');
    coneGradient.addColorStop(0.2, '#d4d4d8');
    coneGradient.addColorStop(0.5, '#52525b');
    coneGradient.addColorStop(0.8, '#27272a');
    coneGradient.addColorStop(0.9, '#d97706'); 
    coneGradient.addColorStop(1, '#18181b');
    
    ctx.beginPath();
    ctx.arc(center, center, size * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = coneGradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, size * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#71717a';
    ctx.fill();
}

function updateUI() {
    balanceDisplay.innerText = balance.toLocaleString();
    betAmountDisplay.innerText = currentBet.toLocaleString();
    localStorage.setItem('roulette_canvas_balance', balance);
    renderHistory();
}

// SYSTÈME DE SECURITÉ / GAVAGE DE JETONS VIP EN CAS DE FAILLITE
function checkBankruptcy() {
    if (balance === 0 && currentBet === 0 && !isSpinning) {
        statusDisplay.innerHTML = "💸 SOLDE ÉPUISÉ... <span class='text-amber-400 animate-pulse font-bold'>CADEAU DE LA MAISON EN COURS !</span>";
        setTimeout(() => {
            balance = STARTING_BALANCE;
            updateUI();
            statusDisplay.innerHTML = "🎁 <span class='text-yellow-400 font-bold'>BONUS DE FIDÉLITÉ : +1 000 JETONS</span> OFFERTS !";
        }, 2000);
    }
}

// HISTORIQUE STATIQUE
function renderHistory() {
    if (gameHistory.length === 0) return;
    historyContainer.innerHTML = '';
    gameHistory.forEach(num => {
        const bg = getNumberColor(num);
        const badge = document.createElement('span');
        badge.className = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono shadow border border-white/10 text-white shrink-0";
        badge.style.backgroundColor = bg;
        badge.innerText = num;
        historyContainer.appendChild(badge);
    });
}

// SYSTÈME DE SELECTION MULTI-NUMÉROS
chipButtons.forEach(chip => {
    chip.onclick = () => {
        if (isSpinning) return;
        
        // On vérifie d'abord quel numéro est écrit dans la case cible
        const targetNumber = parseInt(betTargetInput.value);
        if (isNaN(targetNumber) || targetNumber < 0 || targetNumber > 36) {
            statusDisplay.innerHTML = "⚠️ <span class='text-red-400 font-bold'>INDIQUEZ UN NUMÉRO (0-36)</span> AVANT DE MISER !";
            return;
        }

        const amount = parseInt(chip.getAttribute('data-amount'));
        
        if (balance >= amount) {
            balance -= amount;
            currentBet += amount;
            
            // On ajoute la mise sur le numéro sélectionné
            if (!bets[targetNumber]) bets[targetNumber] = 0;
            bets[targetNumber] += amount;
            
            updateUI();
            
            // Génère un résumé visuel des jetons placés sur la table
            let summary = Object.entries(bets).map(([num, amt]) => `N°${num}: ${amt}¢`).join(' | ');
            statusDisplay.innerHTML = `✅ <span class='text-emerald-400 font-bold'>Mise acceptée !</span> Table : ${summary}`;
        } else {
            statusDisplay.innerText = "SOLDE INSUFFISANT !";
        }
    };
});

clearBetButton.onclick = () => {
    if (isSpinning) return;
    balance += currentBet;
    currentBet = 0;
    bets = {}; // Vide le tableau de toutes les mises simultanées
    updateUI();
    statusDisplay.innerText = "MISES REPRISES SUR LA TABLE.";
};

spinButton.onclick = () => {
    if (isSpinning) return;

    if (currentBet <= 0) {
        statusDisplay.innerText = "ENGAGEZ UNE MISE AVANT DE LANCER LA ROUE !";
        return;
    }

    isSpinning = true;
    statusDisplay.innerText = "LES JEUX SONT FAITS. RIEN NE VA PLUS...";

    const winningNumber = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
    const winningIndex = WHEEL_NUMBERS.indexOf(winningNumber);
    const segmentAngle = 360 / WHEEL_NUMBERS.length;
    
    const extraSpins = 8;
    const targetDegrees = (extraSpins * 360) + (360 - (winningIndex * segmentAngle));

    canvas.style.transition = "transform 5s cubic-bezier(0.08, 0.8, 0.15, 1)";
    canvas.style.transform = `rotate(${targetDegrees}deg)`;

    setTimeout(() => {
        // Vérification de gain sur le tableau des mises multi-numéros
        if (bets[winningNumber] && bets[winningNumber] > 0) {
            const winnings = bets[winningNumber] * 36; 
            balance += winnings;
            statusDisplay.innerHTML = `🎉 NUMÉRO GAGNANT : <span class="text-green-400 font-black">${winningNumber}</span> ! GAGNÉ SUR CE NUMÉRO (+${winnings} jetons)`;
        } else {
            statusDisplay.innerHTML = `🎲 NUMÉRO GAGNANT : <span class="text-red-400 font-bold">${winningNumber}</span>. PAS DE MISE ICI, PERDU !`;
        }

        gameHistory.unshift(winningNumber);
        if (gameHistory.length > 6) gameHistory.pop();

        // Réinitialisation de la table de jeu pour le prochain tour
        currentBet = 0;
        bets = {}; 
        isSpinning = false;

        const finalAngleNormalized = targetDegrees % 360;
        canvas.style.transition = "none";
        canvas.style.transform = `rotate(${finalAngleNormalized}deg)`;

        updateUI();
        checkBankruptcy();
    }, 5000);
};

// PREMIER RENDU AU CHARGEMENT
drawWheel();
updateUI();
checkBankruptcy();
spinButton.textContent = "Lancer la roue";
