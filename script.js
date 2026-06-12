const canvas = document.getElementById('fsCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false;
let animationTick = 0;

// --- GERENCIADOR DE ÁUDIO NATIVO ---
const sfx = {
    bgm: new Audio('bgm.mp3'),
    engine: new Audio('motor.mp3'),
    cash: new Audio('dinheiro.mp3'),
    water: new Audio('agua.mp3'),
    animals: {
        cow: new Audio('vaca.mp3'),
        pig: new Audio('porco.mp3'),
        hen: new Audio('galinha.mp3'),
        horse: new Audio('cavalo.mp3')
    }
};

// Configurações otimizadas de volume e repetição manual anti-pausa
sfx.bgm.loop = true;
sfx.bgm.volume = 0.6; 
sfx.engine.loop = false; // Controle de tempo perfeito por script
sfx.engine.volume = 0.12; // Volume suavizado do motor
sfx.water.loop = true;
sfx.water.volume = 0.5;

// CORREÇÃO: Ajuste de volume dos efeitos sonoros dos animais (mais baixos e suaves)
sfx.animals.cow.volume = 0.12;
sfx.animals.pig.volume = 0.12;
sfx.animals.hen.volume = 0.10;
sfx.animals.horse.volume = 0.12;

// Correção do loop do motor sem engasgos
sfx.engine.addEventListener('timeupdate', function() {
    if (this.duration && this.currentTime > this.duration - 0.4) {
        this.currentTime = 0.1;
        this.play().catch(e => {});
    }
});

/**
 * Ativa a trilha sonora do menu inicial após interação do usuário.
 */
function activateMenuMusic() {
    sfx.bgm.play()
        .then(() => {
            document.removeEventListener('click', activateMenuMusic);
            document.removeEventListener('touchstart', activateMenuMusic);
        })
        .catch(e => console.log("Aguardando interação inicial para tocar BGM..."));
}
document.addEventListener('click', activateMenuMusic);
document.addEventListener('touchstart', activateMenuMusic);

/**
 * Redimensiona o canvas para preencher a tela inteira.
 */
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

document.getElementById('btn-start').addEventListener('click', startGame);

/**
 * Esconde a tela de menu, exibe a interface principal e inicia o laço do simulador.
 */
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'block';
    resize();
    gameRunning = true;
    
    sfx.bgm.play().catch(e => {});
    createOnScreenControls();
    requestAnimationFrame(gameLoop);
}

/**
 * Constrói os botões e direcionais virtuais da interface móvel e mapeia seus cliques.
 */
function createOnScreenControls() {
    if (document.getElementById('onscreen-controls')) return;

    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'onscreen-controls';
    controlsDiv.style.position = 'fixed';
    controlsDiv.style.bottom = '20px';
    controlsDiv.style.left = '0';
    controlsDiv.style.width = '100%';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.justifyContent = 'space-between';
    controlsDiv.style.alignItems = 'flex-end';
    controlsDiv.style.padding = '0 20px';
    controlsDiv.style.boxSizing = 'border-box';
    controlsDiv.style.zIndex = '9999';
    controlsDiv.style.pointerEvents = 'none'; 

    const leftContainer = document.createElement('div');
    leftContainer.style.display = 'grid';
    leftContainer.style.gridTemplateColumns = 'repeat(3, 55px)';
    leftContainer.style.gridTemplateRows = 'repeat(2, 55px)';
    leftContainer.style.gap = '8px';
    leftContainer.style.pointerEvents = 'auto';

    const rightContainer = document.createElement('div');
    rightContainer.style.display = 'flex';
    rightContainer.style.flexDirection = 'column';
    rightContainer.style.gap = '10px';
    rightContainer.style.pointerEvents = 'auto';

    function createMovementBtn(text, key, gridArea) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.width = '55px';
        btn.style.height = '55px';
        btn.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
        btn.style.color = '#fff';
        btn.style.border = '2px solid rgba(255, 255, 255, 0.7)';
        btn.style.borderRadius = '12px';
        btn.style.fontSize = '20px';
        btn.style.fontWeight = 'bold';
        btn.style.userSelect = 'none';
        if (gridArea) btn.style.gridArea = gridArea;

        const pressStart = (e) => {
            e.preventDefault();
            keys[key.toLowerCase()] = true;
            btn.style.backgroundColor = 'rgba(0, 230, 118, 0.8)';
        };
        const pressEnd = (e) => {
            e.preventDefault();
            keys[key.toLowerCase()] = false;
            btn.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
        };

        btn.addEventListener('touchstart', pressStart);
        btn.addEventListener('touchend', pressEnd);
        btn.addEventListener('mousedown', pressStart);
        btn.addEventListener('mouseup', pressEnd);
        btn.addEventListener('mouseleave', pressEnd);

        return btn;
    }

    function createActionBtn(text, key, color) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        btn.style.color = color || '#fff';
        btn.style.border = `2px solid ${color || '#fff'}`;
        btn.style.borderRadius = '8px';
        btn.style.fontSize = '12px';
        btn.style.fontWeight = 'bold';
        btn.style.userSelect = 'none';
        btn.style.cursor = 'pointer';

        const triggerAction = (e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
            setTimeout(() => {
                window.dispatchEvent(new KeyboardEvent('keyup', { key: key }));
            }, 50);
        };

        btn.addEventListener('touchstart', triggerAction);
        btn.addEventListener('mousedown', triggerAction);
        return btn;
    }

    const btnUp = createMovementBtn('▲', 'w', '1 / 2 / 2 / 3');
    const btnLeft = createMovementBtn('◀', 'a', '2 / 1 / 3 / 2');
    const btnDown = createMovementBtn('▼', 's', '2 / 2 / 3 / 3');
    const btnRight = createMovementBtn('▶', 'd', '2 / 3 / 3 / 4');

    leftContainer.appendChild(btnUp);
    leftContainer.appendChild(btnLeft);
    leftContainer.appendChild(btnDown);
    leftContainer.appendChild(btnRight);

    const actionRow = document.createElement('div');
    actionRow.style.display = 'flex';
    actionRow.style.gap = '8px';
    actionRow.style.justifyContent = 'flex-end';
    actionRow.appendChild(createActionBtn('Implemento (G)', 'g', '#ffee58'));
    actionRow.appendChild(createActionBtn('Descarregar / Vender (V)', 'v', '#00e676'));

    const vehicleRow = document.createElement('div');
    vehicleRow.style.display = 'flex';
    vehicleRow.style.gap = '6px';
    vehicleRow.appendChild(createActionBtn('Trator', 'u', '#00e676'));
    vehicleRow.appendChild(createActionBtn('Colheit.', 'h', '#ffb300'));
    vehicleRow.appendChild(createActionBtn('Caçamba', 'k', '#00b0ff'));
    vehicleRow.appendChild(createActionBtn('Boiadeiro', 'j', '#4fc3f7'));

    rightContainer.appendChild(actionRow);
    rightContainer.appendChild(vehicleRow);

    controlsDiv.appendChild(leftContainer);
    controlsDiv.appendChild(rightContainer);

    const wrapper = document.getElementById('game-wrapper') || document.body;
    wrapper.appendChild(controlsDiv);
}

let preparedTilesCount = 0;
let plantedTilesCount = 0;

/**
 * Atualiza o texto do painel central informando o progresso da lavoura.
 */
function updatePanelDisplay() {
    let txt = document.getElementById('mission-txt');
    if (!txt) return;
    txt.innerText = "Solo Arado: " + preparedTilesCount + " blocos | Semeado: " + plantedTilesCount + " blocos";
}

const MAP_W = 4800;
const MAP_H = 4800;
const TILE_SIZE = 100;
const ROWS = 48;
const COLS = 48;

let farmGrid = [];
let cropGrid = []; 
let cropTimerGrid = [];

for (let r = 0; r < ROWS; r++) {
    farmGrid[r] = [];
    cropGrid[r] = [];
    cropTimerGrid[r] = [];
    for (let c = 0; c < COLS; c++) {
        farmGrid[r][c] = 0;
        cropGrid[r][c] = 0;
        cropTimerGrid[r][c] = 0;
    }
}

let dam = { x: 3500, y: 800, r: 280 }; 
let lakeTimeLeft = 12.0; 
let isInsideLake = false;

let sellZone = { x: 2300, y: 3900, w: 450, h: 240 };
let siloCommercial = { x: 1800, y: 600, r: 65 };
let siloFactory = { x: 2300, y: 600, r: 65 };

let enclosures = {
    cow:   { x1: 200,  y1: 1200, x2: 900,  y2: 2200, label: "PASTO DAS VACAS" },
    pig:   { x1: 1000, y1: 1200, x2: 1700, y2: 2200, label: "PIQUETE DOS PORCOS" },
    hen:   { x1: 200,  y1: 2400, x2: 900,  y2: 3400, label: "GALINHEIRO LIVRE" },
    horse: { x1: 1000, y1: 2400, x2: 1700, y2: 3400, label: "COCHEIRAS / HARAS" }
};

let trees = [];
let fishes = [];

/**
 * Cria a disposição estática inicial e elementos do mapa como lagos, árvores e peixes.
 */
function initScenario() {
    for(let c = 0; c < COLS; c++) farmGrid[9][c] = 1;
    for(let r = 9; r < 42; r++) farmGrid[r][20] = 1;
    
    for (let i = 0; i < 50; i++) {
        let tx = Math.random() * (MAP_W - 200) + 100;
        let ty = Math.random() * (MAP_H - 200) + 100;
        if (Math.hypot(tx - dam.x, ty - dam.y) > dam.r + 50 && ty > 600) {
            trees.push({ x: tx, y: ty, size: Math.random() * 10 + 15 });
        }
    }
    for (let i = 0; i < 20; i++) {
        let angle = Math.random() * Math.PI * 2;
        let radius = Math.random() * (dam.r - 40);
        fishes.push({ x: dam.x + Math.cos(angle) * radius, y: dam.y + Math.sin(angle) * radius, speed: 0.8, angle: Math.random() * Math.PI * 2, turnTimer: 40 });
    }
}
initScenario();

let wallet = 10000;
let activeVehicle = "tractor"; 

let tractor = { x: 1950, y: 1100, w: 90, h: 54, speed: 0, maxSpeed: 6.5, accel: 0.18, decel: 0.12, angle: 0, steerSpeed: 0.042, currentImplement: "grade" };
let harvester = { x: 2100, y: 1100, w: 110, h: 64, speed: 0, maxSpeed: 4.8, accel: 0.12, decel: 0.10, angle: 0, steerSpeed: 0.035, tankCapacity: 0 };
let tipperTruck = { x: 2250, y: 1100, w: 125, h: 56, speed: 0, maxSpeed: 8.5, accel: 0.22, decel: 0.12, angle: 0, steerSpeed: 0.038, grainLoad: 0, maxCapacity: 100 };
let cattleTruck = { x: 2400, y: 1100, w: 135, h: 58, speed: 0, maxSpeed: 8.0, accel: 0.20, decel: 0.14, angle: 0, steerSpeed: 0.038, loadedAnimals: [], maxCapacity: 6 };

let animals = [];

/**
 * Cria a população inicial de gado, porcos, galinhas e cavalos nos respectivos piquetes.
 */
function spawnAnimals() {
    animals = [];
    for(let i=0; i<6; i++) createAnimal('cow', enclosures.cow);
    for(let i=0; i<6; i++) createAnimal('pig', enclosures.pig);
    for(let i=0; i<8; i++) createAnimal('hen', enclosures.hen);
    for(let i=0; i<5; i++) createAnimal('horse', enclosures.horse);
}

function createAnimal(type, enc) {
    let spots = [];
    if(type === 'cow') {
        for(let s=0; s<4; s++) spots.push({ rx: (Math.random()-0.5)*18, ry: (Math.random()-0.5)*10, r: Math.random()*4 + 3 });
    }
    animals.push({
        x: enc.x1 + 50 + Math.random() * (enc.x2 - enc.x1 - 100),
        y: enc.y1 + 50 + Math.random() * (enc.y2 - enc.y1 - 100),
        type: type,
        enc: enc,
        speed: type === 'hen' ? 0.6 : type === 'horse' ? 0.7 : 0.4,
        angle: Math.random() * Math.PI * 2,
        limbCycle: Math.random() * 10,
        spots: spots,
        weight: 20 + Math.random() * 20 
    });
}
spawnAnimals();

let keys = {};
window.addEventListener('keydown', e => {
    if(!gameRunning) return;
    keys[e.key.toLowerCase()] = true;
    
    if(e.key.toLowerCase() === 'u') { activeVehicle = "tractor"; updateHUDLabels(); }
    if(e.key.toLowerCase() === 'h') { activeVehicle = "harvester"; updateHUDLabels(); }
    if(e.key.toLowerCase() === 'k') { activeVehicle = "tipper"; updateHUDLabels(); }
    if(e.key.toLowerCase() === 'j') { activeVehicle = "cattle"; updateHUDLabels(); }
    
    if(e.key.toLowerCase() === 'g' && activeVehicle === "tractor") {
        tractor.currentImplement = tractor.currentImplement === "grade" ? "plantadeira" : "grade";
        updateHUDLabels();
    }
    if(e.key.toLowerCase() === 'v') handleActionTrigger();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

/**
 * Atualiza as strings visuais e cores do HUD superior para refletir o maquinário ativo.
 */
function updateHUDLabels() {
    let vTxt = document.getElementById('vehicle-txt');
    let iTxt = document.getElementById('implement-txt');
    if(!vTxt || !iTxt) return;

    if (activeVehicle === "tractor") {
        vTxt.innerText = "TRATOR JD 7R"; vTxt.style.color = "#00e676";
        iTxt.innerText = tractor.currentImplement === "grade" ? "Grade Aradora" : "Plantadeira Pro";
    } else if (activeVehicle === "harvester") {
        vTxt.innerText = "COLHEITADEIRA CASE AXIAL"; vTxt.style.color = "#ffb300";
        iTxt.innerText = "Depósito: " + harvester.tankCapacity + "%";
    } else if (activeVehicle === "tipper") {
        vTxt.innerText = "CAMIÃO CAÇAMBEIRO"; vTxt.style.color = "#00b0ff";
        iTxt.innerText = "Milho: " + tipperTruck.grainLoad + "%";
    } else if (activeVehicle === "cattle") {
        vTxt.innerText = "CAMIÃO BOIADEIRO"; vTxt.style.color = "#4fc3f7";
        iTxt.innerText = "Carga: " + cattleTruck.loadedAnimals.length + "/" + cattleTruck.maxCapacity;
    }
    document.getElementById('truck-cargo-txt').innerText = "Carga: " + cattleTruck.loadedAnimals.length + "/" + cattleTruck.maxCapacity + " Animais";
    updatePanelDisplay();
}

/**
 * Retorna o objeto de dados correspondente ao veículo ativo selecionado.
 */
function getActiveObject() {
    if (activeVehicle === "tractor") return tractor;
    if (activeVehicle === "harvester") return harvester;
    if (activeVehicle === "tipper") return tipperTruck;
    return cattleTruck;
}

/**
 * Processa a aceleração, frenagem, rotação e deslocamento do maquinário ativo em uso.
 */
function processVehiclePhysics() {
    let v = getActiveObject();
    if (keys['w'] || keys['arrowup']) v.speed = Math.min(v.speed + v.accel, v.maxSpeed);
    else if (keys['s'] || keys['arrowdown']) v.speed = Math.max(v.speed - v.accel, -v.maxSpeed * 0.4);
    else {
        if (v.speed > 0) v.speed = Math.max(0, v.speed - v.decel);
        if (v.speed < 0) v.speed = Math.min(0, v.speed + v.decel);
    }

    if (Math.abs(v.speed) > 0.5) {
        if (sfx.engine.paused) sfx.engine.play().catch(e => {});
    } else {
        if (!sfx.engine.paused) sfx.engine.pause();
    }

    if (Math.abs(v.speed) > 0.1) {
        const dir = v.speed > 0 ? 1 : -1;
        if (keys['a'] || keys['arrowleft']) v.angle -= v.steerSpeed * dir;
        if (keys['d'] || keys['arrowright']) v.angle += v.steerSpeed * dir;
    }
    v.x += Math.cos(v.angle) * v.speed; v.y += Math.sin(v.angle) * v.speed;
    v.x = Math.max(60, Math.min(MAP_W - 60, v.x)); v.y = Math.max(60, Math.min(MAP_H - 60, v.y));
    
    // CORREÇÃO: Executa cálculo de colisão física e empurrões mútuos entre os maquinários
    resolveVehicleCollisions();
    
    checkCollisionsAndOperations();
}

/**
 * Nova função responsável por gerenciar colisões rígidas e repulsão de veículos.
 */
function resolveVehicleCollisions() {
    const vList = [
        { obj: tractor, r: 42 },
        { obj: harvester, r: 52 },
        { obj: tipperTruck, r: 54 },
        { obj: cattleTruck, r: 58 }
    ];
    
    for (let i = 0; i < vList.length; i++) {
        for (let j = i + 1; j < vList.length; j++) {
            let v1 = vList[i].obj;
            let v2 = vList[j].obj;
            let r1 = vList[i].r;
            let r2 = vList[j].r;
            
            let dx = v2.x - v1.x;
            let dy = v2.y - v1.y;
            let dist = Math.hypot(dx, dy);
            let minDist = r1 + r2;
            
            if (dist < minDist) {
                let overlap = minDist - dist;
                
                if (dist === 0) { dx = 1; dy = 0; dist = 1; }
                
                let nx = dx / dist;
                let ny = dy / dist;
                
                v1.x -= nx * (overlap * 0.5);
                v1.y -= ny * (overlap * 0.5);
                v2.x += nx * (overlap * 0.5);
                v2.y += ny * (overlap * 0.5);
                
                v1.speed *= 0.4;
                v2.speed *= 0.4;
            }
        }
    }
    
    vList.forEach(vItem => {
        vItem.obj.x = Math.max(60, Math.min(MAP_W - 60, vItem.obj.x));
        vItem.obj.y = Math.max(60, Math.min(MAP_H - 60, vItem.obj.y));
    });
}

/**
 * Valida a interação de proximidade para colheita, aração, transbordo de grãos e embarque animal.
 */
function checkCollisionsAndOperations() {
    let activeObj = getActiveObject();
    let col = Math.floor(activeObj.x / TILE_SIZE);
    let row = Math.floor(activeObj.y / TILE_SIZE);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;

    let distToLake = Math.hypot(activeObj.x - dam.x, activeObj.y - dam.y);
    isInsideLake = (distToLake < dam.r);

    if (activeVehicle === "tractor" && Math.abs(tractor.speed) > 0.5) {
        if (tractor.currentImplement === "grade" && farmGrid[row][col] === 0) {
            farmGrid[row][col] = 6; preparedTilesCount++; updatePanelDisplay();
        }
        if (tractor.currentImplement === "plantadeira" && farmGrid[row][col] === 6) {
            farmGrid[row][col] = 7; cropGrid[row][col] = 1; plantedTilesCount++; updatePanelDisplay();
        }
    }

    if (activeVehicle === "harvester" && farmGrid[row][col] === 7 && cropGrid[row][col] === 3) {
        if (Math.abs(harvester.speed) > 0.5) {
            farmGrid[row][col] = 0; cropGrid[row][col] = 0; 
            harvester.tankCapacity = Math.min(100, harvester.tankCapacity + 4); updateHUDLabels();
        }
    }

    if (harvester.tankCapacity > 0 && tipperTruck.grainLoad < tipperTruck.maxCapacity) {
        let distHarvesterToTruck = Math.hypot(harvester.x - tipperTruck.x, harvester.y - tipperTruck.y);
        if (distHarvesterToTruck < 140) {
            harvester.tankCapacity -= 1;
            tipperTruck.grainLoad += 1;
            updateHUDLabels();
        }
    }

    if (activeVehicle === "cattle" && cattleTruck.loadedAnimals.length < cattleTruck.maxCapacity) {
        for (let i = animals.length - 1; i >= 0; i--) {
            let animal = animals[i];
            if (Math.hypot(cattleTruck.x - animal.x, cattleTruck.y - animal.y) < 130) {
                cattleTruck.loadedAnimals.push({ type: animal.type, weight: animal.weight });
                
                let animalSound = sfx.animals[animal.type];
                if (animalSound) {
                    animalSound.currentTime = 0; 
                    animalSound.play().catch(e => {});
                }

                animals.splice(i, 1);
                showToast("Embarcado: " + animal.type.toUpperCase() + " (Engorda: " + Math.floor(animal.weight) + "%)");
                updateHUDLabels();
            }
        }
    }
}

/**
 * Direciona o comando de ação genérica 'V' para venda de grãos ou gado.
 */
function handleActionTrigger() {
    if (activeVehicle === "cattle") {
        trySellCattle();
    } else if (activeVehicle === "tipper") {
        trySellGrain();
    }
}

/**
 * Executa a descarga comercial do milho se o caminhão caçamba estiver na proximidade dos Silos do norte.
 */
function trySellGrain() {
    if (tipperTruck.grainLoad > 0) {
        let distToCommercial = Math.hypot(tipperTruck.x - siloCommercial.x, tipperTruck.y - siloCommercial.y);
        let distToFactory = Math.hypot(tipperTruck.x - siloFactory.x, tipperTruck.y - siloFactory.y);

        if (distToCommercial < 130 || distToFactory < 130) {
            let pricePerPercent = distToCommercial < 130 ? 45 : 55; 
            let totalPayout = tipperTruck.grainLoad * pricePerPercent;
            
            wallet += totalPayout;
            sfx.cash.currentTime = 0;
            sfx.cash.play().catch(e => {});

            showToast("Milho Descarregado! Faturamento: +R$ " + totalPayout.toLocaleString('pt-BR'));
            tipperTruck.grainLoad = 0;
            
            updateHUD(); updateHUDLabels();
        } else {
            showToast("Pare o camião perto de um dos Silos redondos no norte!");
        }
    } else {
        showToast("A caçamba está vazia!");
    }
}

/**
 * Efetiva a venda do gado transportado caso o caminhão boiadeiro repouse na área interna do frigorífico.
 */
function trySellCattle() {
    if (cattleTruck.loadedAnimals.length > 0) {
        if (cattleTruck.x >= sellZone.x && cattleTruck.x <= sellZone.x + sellZone.w &&
            cattleTruck.y >= sellZone.y && cattleTruck.y <= sellZone.y + sellZone.h) {
            
            let totalPayout = 0;
            cattleTruck.loadedAnimals.forEach(anim => {
                let basePrice = 0;
                if (anim.type === 'cow') basePrice = 2500;
                else if (anim.type === 'pig') basePrice = 1200;
                else if (anim.type === 'hen') basePrice = 150;
                else if (anim.type === 'horse') basePrice = 4000;
                totalPayout += basePrice * (anim.weight / 100);
            });

            totalPayout = Math.floor(totalPayout);
            wallet += totalPayout;
            
            sfx.cash.currentTime = 0;
            sfx.cash.play().catch(e => {});

            showToast("Venda Concluída! Faturamento: +R$ " + totalPayout.toLocaleString('pt-BR'));
            
            cattleTruck.loadedAnimals = [];
            updateHUD(); updateHUDLabels(); spawnAnimals();
        } else {
            showToast("Pare o camião dentro da área amarela do Frigorífico!");
        }
    }
}

/**
 * Atualiza o painel do mostrador de saldo financeiro do produtor.
 */
function updateHUD() {
    let mTxt = document.getElementById('money-txt');
    if (mTxt) mTxt.innerText = "R$ " + wallet.toLocaleString('pt-BR');
}

/**
 * Dispara e projeta o toast de notificações temporárias flutuantes.
 */
function showToast(text) {
    let t = document.getElementById('sales-toast'); if(!t) return;
    t.innerText = text; t.style.display = 'block'; 
    setTimeout(() => t.style.display = 'none', 4000);
}

/**
 * Loop dinâmico secundário encarregado do crescimento vegetal, IA animal e temporizador do motor afogado.
 */
function updateSimulationValues() {
    if(!gameRunning) return;
    animationTick += 0.1;

    let warningBox = document.getElementById('lake-warning');
    let timerSpan = document.getElementById('lake-timer');
    
    if (isInsideLake) {
        warningBox.style.display = 'block';
        lakeTimeLeft -= 0.016; 
        if (lakeTimeLeft < 0) lakeTimeLeft = 0;
        timerSpan.innerText = lakeTimeLeft.toFixed(1);

        if (sfx.water.paused) sfx.water.play().catch(e => {});

        if (lakeTimeLeft <= 0) {
            let activeObj = getActiveObject();
            wallet = Math.max(0, wallet - 5000); 
            showToast("O Motor Fundiu na Água! Guincho cobrou R$ 5.000 de conserto.");
            activeObj.x = 1950; activeObj.y = 1100; activeObj.speed = 0;
            lakeTimeLeft = 12.0; warningBox.style.display = 'none'; isInsideLake = false;
            updateHUD();
        }
    } else {
        warningBox.style.display = 'none';
        lakeTimeLeft = 12.0; 
        
        if (!sfx.water.paused) sfx.water.pause();
    }

    animals.forEach(a => {
        a.limbCycle += 0.15;
        if (a.weight < 100) a.weight += 0.015; 

        if(Math.random() < 0.02) a.angle += (Math.random() - 0.5) * 1.8;
        a.x += Math.cos(a.angle) * a.speed;
        a.y += Math.sin(a.angle) * a.speed;

        if (a.x < a.enc.x1 + 15) { a.x = a.enc.x1 + 15; a.angle += Math.PI; }
        if (a.x > a.enc.x2 - 15) { a.x = a.enc.x2 - 15; a.angle += Math.PI; }
        if (a.y < a.enc.y1 + 15) { a.y = a.enc.y1 + 15; a.angle += Math.PI; }
        if (a.y > a.enc.y2 - 15) { a.y = a.enc.y2 - 15; a.angle += Math.PI; }
    });

    fishes.forEach(fish => {
        fish.turnTimer--;
        if (fish.turnTimer <= 0) { fish.angle += (Math.random() - 0.5) * 1.5; fish.turnTimer = 50; }
        let nx = fish.x + Math.cos(fish.angle) * fish.speed;
        let ny = fish.y + Math.sin(fish.angle) * fish.speed;
        if (Math.hypot(nx - dam.x, ny - dam.y) < dam.r - 20) { fish.x = nx; fish.y = ny; } else { fish.angle += Math.PI; }
    });

    for(let r = 0; r < ROWS; r++) {
        for(let c = 0; c < COLS; c++) {
            if (farmGrid[r][c] === 7 && cropGrid[r][c] < 3) {
                cropTimerGrid[r][c]++;
                if (cropTimerGrid[r][c] > 250) { cropGrid[r][c]++; cropTimerGrid[r][c] = 0; }
            }
        }
    }
}

/**
 * Renderiza todo o cenário 2D no Canvas, aplicando a câmera com base na posição do veículo ativo.
 */
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeObj = getActiveObject();
    let camX = canvas.width / 2 - activeObj.x;
    let camY = canvas.height / 2 - activeObj.y;

    ctx.save(); ctx.translate(camX, camY);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let x = c * TILE_SIZE; let y = r * TILE_SIZE;
            if (x < activeObj.x - canvas.width && x > activeObj.x + canvas.width) continue;
            
            switch (farmGrid[r][c]) {
                case 0: ctx.fillStyle = "#2e5c30"; break; 
                case 1: ctx.fillStyle = "#42322f"; break; 
                case 6: ctx.fillStyle = "#4e3629"; break; 
                case 7: ctx.fillStyle = "#3a251a"; break; 
            }
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            if (farmGrid[r][c] === 7) {
                let stage = cropGrid[r][c];
                ctx.fillStyle = stage === 1 ? "#66bb6a" : stage === 2 ? "#388e3c" : "#fbc02d";
                for (let i = 15; i < TILE_SIZE; i += 25) ctx.fillRect(x + i, y + 15, 6, TILE_SIZE - 30);
            }
        }
    }

    ctx.lineWidth = 4;
    for (let key in enclosures) {
        let enc = enclosures[key];
        ctx.fillStyle = "rgba(46, 117, 50, 0.3)";
        ctx.fillRect(enc.x1, enc.y1, enc.x2 - enc.x1, enc.y2 - enc.y1);
        ctx.strokeStyle = "#5d4037";
        ctx.strokeRect(enc.x1, enc.y1, enc.x2 - enc.x1, enc.y2 - enc.y1);
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(enc.x1 + 10, enc.y1 + 10, 160, 22);
        ctx.fillStyle = "#ffb300"; ctx.font = "bold 11px Arial";
        ctx.fillText(enc.label, enc.x1 + 18, enc.y1 + 25);
    }

    ctx.fillStyle = "#78909c"; ctx.beginPath(); ctx.arc(siloCommercial.x, siloCommercial.y, siloCommercial.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#b0bec5"; ctx.beginPath(); ctx.arc(siloCommercial.x, siloCommercial.y, siloCommercial.r - 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#263238"; ctx.font = "bold 11px Arial"; ctx.fillText("SILO GRÃOS", siloCommercial.x - 36, siloCommercial.y + 4);

    ctx.fillStyle = "#5e35b1"; ctx.beginPath(); ctx.arc(siloFactory.x, siloFactory.y, siloFactory.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#7e57c2"; ctx.beginPath(); ctx.arc(siloFactory.x, siloFactory.y, siloFactory.r - 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px Arial"; ctx.fillText("FÁB_RAÇÃO", siloFactory.x - 32, siloFactory.y + 4);

    ctx.fillStyle = "#263238"; ctx.fillRect(sellZone.x, sellZone.y, sellZone.w, sellZone.h);
    ctx.strokeStyle = "#ffb300"; ctx.lineWidth = 5; ctx.strokeRect(sellZone.x+10, sellZone.y+10, sellZone.w-20, sellZone.h-20);
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.fillText("ZONA DE DESCARGA - INDÚSTRIA DE CARNES [V]", sellZone.x + 30, sellZone.y + 45);

    let waveRadius = dam.r + Math.sin(animationTick * 0.4) * 5;
    ctx.fillStyle = "#0288d1"; ctx.beginPath(); ctx.arc(dam.x, dam.y, waveRadius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#01579b"; ctx.beginPath(); ctx.arc(dam.x, dam.y, waveRadius * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 3; ctx.stroke();

    fishes.forEach(f => {
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.angle);
        ctx.fillStyle = "#ff7043"; ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    });

    trees.forEach(t => {
        ctx.fillStyle = "#4e342e"; ctx.fillRect(t.x - 4, t.y, 8, t.size);
        ctx.fillStyle = "#0e4611"; ctx.beginPath(); ctx.arc(t.x, t.y - 6, t.size, 0, Math.PI*2); ctx.fill();
    });

    animals.forEach(a => {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
        let swing = Math.sin(a.limbCycle) * 4;

        ctx.save(); ctx.rotate(-a.angle);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(-15, -25, 30, 4);
        ctx.fillStyle = a.weight > 80 ? "#00e676" : a.weight > 50 ? "#ffee58" : "#ff1744";
        ctx.fillRect(-15, -25, 30 * (a.weight / 100), 4);
        ctx.restore();

        if (a.type === 'cow') {
            ctx.fillStyle = "#111"; ctx.fillRect(-12, -14 + swing, 5, 4); ctx.fillRect(8, -14 - swing, 5, 4);
            ctx.fillRect(-12, 10 - swing, 5, 4); ctx.fillRect(8, 10 + swing, 5, 4);
            ctx.fillStyle = "#F5F5F5"; ctx.beginPath(); ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111"; a.spots.forEach(s => { ctx.beginPath(); ctx.arc(s.rx, s.ry, s.r, 0, Math.PI*2); ctx.fill(); });
            ctx.fillStyle = "#F5F5F5"; ctx.beginPath(); ctx.arc(22, 0, 7, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = "#FFA4A2"; ctx.beginPath(); ctx.ellipse(25, 0, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); 
        } else if (a.type === 'pig') {
            ctx.fillStyle = "#E08080"; ctx.fillRect(-8, -10 + swing, 4, 3); ctx.fillRect(6, -10 - swing, 4, 3);
            ctx.fillRect(-8, 7 - swing, 4, 3); ctx.fillRect(6, 7 + swing, 4, 3);
            ctx.fillStyle = "#FFB6C1"; ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#FFB6C1"; ctx.beginPath(); ctx.arc(16, 0, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#E08080"; ctx.beginPath(); ctx.ellipse(19, 0, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        } else if (a.type === 'hen') {
            ctx.fillStyle = "#ffb300"; ctx.fillRect(0, -5 + swing, 2, 2); ctx.fillRect(0, 3 - swing, 2, 2);
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ff1744"; ctx.beginPath(); ctx.arc(7, 0, 2, 0, Math.PI * 2); ctx.fill();
        } else if (a.type === 'horse') {
            ctx.fillStyle = "#3e2723"; ctx.fillRect(-14, -12 + swing, 4, 4); ctx.fillRect(10, -12 - swing, 4, 4);
            ctx.fillRect(-14, 8 - swing, 4, 4); ctx.fillRect(10, 8 + swing, 4, 4);
            ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.arc(24, 0, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#212121"; ctx.fillRect(-22, -2, 6, 4);
        }
        ctx.restore();
    });

    drawTractor(tractor);
    drawHarvester(harvester);
    drawTipper(tipperTruck);
    drawCattleTruck(cattleTruck);

    ctx.restore(); 
}

function drawTractor(t) {
    ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle);
    if (t.currentImplement === "grade") {
        ctx.fillStyle = "#555"; ctx.fillRect(-45, -20, 15, 40);
        ctx.fillStyle = "#999"; ctx.fillRect(-40, -18, 5, 36);
    } else {
        ctx.fillStyle = "#c62828"; ctx.fillRect(-50, -25, 20, 50);
        ctx.fillStyle = "#444"; ctx.fillRect(-45, -22, 10, 44);
    }
    ctx.fillStyle = "#1b5e20"; ctx.fillRect(-25, -15, 50, 30);
    ctx.fillStyle = "#ffe082"; ctx.fillRect(15, -10, 10, 20); 
    ctx.fillStyle = "#111";
    ctx.fillRect(-20, -22, 16, 8); ctx.fillRect(-20, 14, 16, 8);
    ctx.fillRect(10, -20, 12, 6); ctx.fillRect(10, 14, 12, 6);
    ctx.restore();
}

function drawHarvester(h) {
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.angle);
    ctx.fillStyle = "#d32f2f"; ctx.fillRect(40, -35, 15, 70);
    ctx.fillStyle = "#111"; ctx.fillRect(45, -33, 5, 66);
    ctx.fillStyle = "#b71c1c"; ctx.fillRect(-30, -20, 70, 40);
    ctx.fillStyle = "#333"; ctx.fillRect(-15, -15, 30, 30);
    if (h.tankCapacity > 0) {
        ctx.fillStyle = "#fbc02d"; 
        let fillH = (h.tankCapacity / 100) * 26;
        ctx.fillRect(-13, -13, 26, fillH);
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(-25, -28, 20, 10); ctx.fillRect(-25, 18, 20, 10);
    ctx.fillRect(15, -26, 15, 8); ctx.fillRect(15, 18, 15, 8);
    ctx.restore();
}

function drawTipper(tr) {
    ctx.save(); ctx.translate(tr.x, tr.y); ctx.rotate(tr.angle);
    ctx.fillStyle = "#0277bd"; ctx.fillRect(25, -15, 25, 30);
    ctx.fillStyle = "#eceff1"; ctx.fillRect(-40, -18, 60, 36);
    
    if (tr.grainLoad > 0) {
        ctx.fillStyle = "#fbc02d";
        let fillW = (tr.grainLoad / tr.maxCapacity) * 56;
        ctx.fillRect(-38, -16, fillW, 32);
    }
    
    ctx.fillStyle = "#111";
    ctx.fillRect(30, -20, 12, 6); ctx.fillRect(30, 14, 12, 6);
    ctx.fillRect(-30, -22, 16, 8); ctx.fillRect(-30, 14, 16, 8);
    ctx.fillRect(-10, -22, 16, 8); ctx.fillRect(-10, 14, 16, 8);
    ctx.restore();
}

function drawCattleTruck(ct) {
    ctx.save(); ctx.translate(ct.x, ct.y); ctx.rotate(ct.angle);
    ctx.fillStyle = "#006064"; ctx.fillRect(30, -15, 25, 30);
    ctx.fillStyle = "#455a64"; ctx.fillRect(-45, -20, 70, 40);
    ctx.fillStyle = "#90a4ae"; 
    for (let i = -40; i < 20; i += 10) ctx.fillRect(i, -20, 2, 40);
    ctx.fillRect(-45, -20, 70, 2); ctx.fillRect(-45, 18, 70, 2);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial";
    ctx.fillText(ct.loadedAnimals.length + "/" + ct.maxCapacity, -18, 4);
    ctx.fillStyle = "#111";
    ctx.fillRect(35, -20, 12, 6); ctx.fillRect(35, 14, 12, 6);
    ctx.fillRect(-35, -24, 16, 8); ctx.fillRect(-35, 16, 16, 8);
    ctx.fillRect(-15, -24, 16, 8); ctx.fillRect(-15, 16, 16, 8);
    ctx.restore();
}

/**
 * Núcleo do laço do jogo executado a cada frame através da API requestAnimationFrame.
 */
function gameLoop() {
    if (gameRunning) {
        processVehiclePhysics();
        updateSimulationValues();
        render();
    }
    requestAnimationFrame(gameLoop);
}
