import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Heart, Coins, Zap, Target, Flame, Snowflake, Bomb } from 'lucide-react';

const TowerDefenseGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [gold, setGold] = useState(120);
  const [lives, setLives] = useState(25);
  const [wave, setWave] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedTower, setSelectedTower] = useState(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const towersRef = useRef([]);
  const enemiesRef = useRef([]);
  const projectilesRef = useRef([]);
  const animationRef = useRef(null);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;

  const path = [
    { x: -20, y: 100 },
    { x: 150, y: 100 },
    { x: 150, y: 250 },
    { x: 300, y: 250 },
    { x: 300, y: 100 },
    { x: 450, y: 100 },
    { x: 450, y: 350 },
    { x: 250, y: 350 },
    { x: 250, y: 500 },
    { x: 500, y: 500 },
    { x: 500, y: 200 },
    { x: 700, y: 200 },
    { x: 700, y: 450 },
    { x: 600, y: 450 },
    { x: 600, y: 600 },
    { x: 850, y: 600 },
    { x: 850, y: 350 },
    { x: 950, y: 350 },
    { x: 950, y: 550 },
    { x: 1020, y: 550 }
  ];

  const enemyTypes = {
    normal: { color: '#ef4444', size: 12, speed: 1, health: 40, reward: 12, name: 'Normal', icon: '👾' },
    fast: { color: '#f97316', size: 10, speed: 2, health: 25, reward: 18, name: 'Hızlı', icon: '⚡' },
    tank: { color: '#8b5cf6', size: 16, speed: 0.6, health: 120, reward: 30, name: 'Tank', icon: '🛡️' },
    boss: { color: '#dc2626', size: 20, speed: 0.8, health: 250, reward: 60, name: 'Boss', icon: '👹' }
  };

  const towerTypes = {
    basic: { 
      cost: 50, 
      damage: 12, 
      range: 120, 
      fireRate: 900, 
      color: '#3b82f6', 
      name: 'Temel',
      level: 1,
      upgradeCost: 40,
      maxLevel: 5,
      icon: Target,
      projectileColor: '#60a5fa'
    },
    sniper: { 
      cost: 100, 
      damage: 50, 
      range: 220, 
      fireRate: 2200, 
      color: '#8b5cf6', 
      name: 'Keskin',
      level: 1,
      upgradeCost: 75,
      maxLevel: 5,
      icon: Zap,
      projectileColor: '#a78bfa'
    },
    rapid: { 
      cost: 80, 
      damage: 6, 
      range: 100, 
      fireRate: 300, 
      color: '#ef4444', 
      name: 'Hızlı',
      level: 1,
      upgradeCost: 55,
      maxLevel: 5,
      icon: Flame,
      projectileColor: '#f87171'
    },
    freeze: { 
      cost: 120, 
      damage: 4, 
      range: 140, 
      fireRate: 1400, 
      color: '#06b6d4', 
      name: 'Donduran',
      level: 1,
      upgradeCost: 80,
      maxLevel: 5,
      icon: Snowflake,
      projectileColor: '#22d3ee'
    },
    explosive: {
      cost: 150,
      damage: 35,
      range: 110,
      fireRate: 1700,
      color: '#f59e0b',
      name: 'Patlayıcı',
      level: 1,
      upgradeCost: 90,
      maxLevel: 5,
      icon: Bomb,
      projectileColor: '#fbbf24'
    }
  };

  const distance = (x1, y1, x2, y2) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const checkCanPlaceTower = useCallback((x, y) => {
    if (!selectedTower) return false;
    if (gold < towerTypes[selectedTower]?.cost) return false;
    
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      const minX = Math.min(p1.x, p2.x) - 45;
      const maxX = Math.max(p1.x, p2.x) + 45;
      const minY = Math.min(p1.y, p2.y) - 45;
      const maxY = Math.max(p1.y, p2.y) + 45;
      
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return false;
      }
    }

    const tooClose = towersRef.current.some(t => distance(t.x, t.y, x, y) < 60);
    if (tooClose) return false;

    if (x < 30 || x > CANVAS_WIDTH - 30 || y < 30 || y > CANVAS_HEIGHT - 30) {
      return false;
    }

    return true;
  }, [selectedTower, gold]);

  const drawPath = (ctx) => {
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#64748b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 90;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 70;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🏁 BAŞLANGIÇ', 10, 85);
    
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.fillText('🏠 ÜS', 920, 585);
    ctx.shadowBlur = 0;
  };

  const drawStaticCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawPath(ctx);

    towersRef.current.forEach(tower => {
      ctx.strokeStyle = tower.color + '30';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tower base
      const gradient = ctx.createRadialGradient(tower.x, tower.y, 5, tower.x, tower.y, 20);
      gradient.addColorStop(0, tower.color);
      gradient.addColorStop(1, tower.color + 'AA');
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = tower.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tower top
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Icon representation
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Level stars
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px Arial';
      ctx.shadowBlur = 3;
      ctx.shadowColor = '#000';
      ctx.fillText('★'.repeat(tower.level), tower.x - (tower.level * 7), tower.y + 32);
      ctx.shadowBlur = 0;

      if (selectedUpgrade === tower.id && tower.level < tower.maxLevel) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 16px Arial';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#000';
        ctx.fillText(`↑ ${tower.upgradeCost}💰`, tower.x - 30, tower.y - 30);
        ctx.shadowBlur = 0;
      }
    });

    if (selectedTower && (gameState === 'waveComplete' || gameState === 'menu') && mousePos.x > 0) {
      const towerType = towerTypes[selectedTower];
      const canPlace = checkCanPlaceTower(mousePos.x, mousePos.y);
      
      ctx.strokeStyle = canPlace ? towerType.color + '60' : '#ef444460';
      ctx.fillStyle = canPlace ? towerType.color + '15' : '#ef444415';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, towerType.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      
      const gradient = ctx.createRadialGradient(mousePos.x, mousePos.y, 5, mousePos.x, mousePos.y, 20);
      gradient.addColorStop(0, canPlace ? towerType.color : '#ef4444');
      gradient.addColorStop(1, (canPlace ? towerType.color : '#ef4444') + 'AA');
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 15;
      ctx.shadowColor = canPlace ? towerType.color : '#ef4444';
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = canPlace ? '#22c55e' : '#ef4444';
      ctx.font = 'bold 16px Arial';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#000';
      const text = canPlace ? '✓ YERLEŞTİR' : '✗ KONULAMAZ';
      ctx.fillText(text, mousePos.x - 55, mousePos.y - 35);
      ctx.shadowBlur = 0;
    }
  }, [mousePos, selectedTower, selectedUpgrade, gameState, checkCanPlaceTower]);

  const spawnWave = useCallback((waveNum) => {
    const newEnemies = [];
    let spawnDelay = 0;

    const normalCount = 4 + waveNum * 2;
    for (let i = 0; i < normalCount; i++) {
      const baseEnemy = enemyTypes.normal;
      newEnemies.push({
        id: Date.now() + Math.random(),
        x: path[0].x,
        y: path[0].y,
        pathIndex: 0,
        type: 'normal',
        health: baseEnemy.health + waveNum * 12,
        maxHealth: baseEnemy.health + waveNum * 12,
        speed: baseEnemy.speed + waveNum * 0.07,
        reward: baseEnemy.reward + Math.floor(waveNum * 2),
        color: baseEnemy.color,
        size: baseEnemy.size,
        name: baseEnemy.name,
        icon: baseEnemy.icon,
        spawnTime: Date.now() + spawnDelay
      });
      spawnDelay += 650;
    }

    if (waveNum >= 2) {
      const fastCount = 1 + Math.floor(waveNum / 2);
      for (let i = 0; i < fastCount; i++) {
        const baseEnemy = enemyTypes.fast;
        newEnemies.push({
          id: Date.now() + Math.random() + 0.1,
          x: path[0].x,
          y: path[0].y,
          pathIndex: 0,
          type: 'fast',
          health: baseEnemy.health + waveNum * 8,
          maxHealth: baseEnemy.health + waveNum * 8,
          speed: baseEnemy.speed + waveNum * 0.1,
          reward: baseEnemy.reward + Math.floor(waveNum * 3),
          color: baseEnemy.color,
          size: baseEnemy.size,
          name: baseEnemy.name,
          icon: baseEnemy.icon,
          spawnTime: Date.now() + spawnDelay
        });
        spawnDelay += 550;
      }
    }

    if (waveNum >= 3) {
      const tankCount = Math.floor(waveNum / 3);
      for (let i = 0; i < tankCount; i++) {
        const baseEnemy = enemyTypes.tank;
        newEnemies.push({
          id: Date.now() + Math.random() + 0.2,
          x: path[0].x,
          y: path[0].y,
          pathIndex: 0,
          type: 'tank',
          health: baseEnemy.health + waveNum * 35,
          maxHealth: baseEnemy.health + waveNum * 35,
          speed: baseEnemy.speed + waveNum * 0.03,
          reward: baseEnemy.reward + Math.floor(waveNum * 5),
          color: baseEnemy.color,
          size: baseEnemy.size,
          name: baseEnemy.name,
          icon: baseEnemy.icon,
          spawnTime: Date.now() + spawnDelay
        });
        spawnDelay += 1100;
      }
    }

    if (waveNum % 5 === 0) {
      const baseEnemy = enemyTypes.boss;
      newEnemies.push({
        id: Date.now() + Math.random() + 0.3,
        x: path[0].x,
        y: path[0].y,
        pathIndex: 0,
        type: 'boss',
        health: baseEnemy.health + waveNum * 60,
        maxHealth: baseEnemy.health + waveNum * 60,
        speed: baseEnemy.speed + waveNum * 0.04,
        reward: baseEnemy.reward + Math.floor(waveNum * 12),
        color: baseEnemy.color,
        size: baseEnemy.size,
        name: baseEnemy.name,
        icon: baseEnemy.icon,
        spawnTime: Date.now() + spawnDelay
      });
    }
    
    enemiesRef.current = newEnemies;
  }, []);

  const startWave = () => {
    const nextWave = wave + 1;
    setWave(nextWave);
    spawnWave(nextWave);
    setGameState('playing');
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawStaticCanvas();

    const now = Date.now();

    enemiesRef.current = enemiesRef.current.filter(enemy => {
      if (enemy.spawnTime > now) {
        return true;
      }

      const target = path[enemy.pathIndex + 1];
      if (target) {
        const dx = target.x - enemy.x;
        const dy = target.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          enemy.pathIndex++;
        } else {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
        }
      } else {
        setLives(l => Math.max(0, l - 1));
        return false;
      }

      if (enemy.health <= 0) {
        setGold(g => g + enemy.reward);
        setScore(s => s + enemy.reward * 10);
        return false;
      }

      // Enemy body
      ctx.fillStyle = enemy.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Enemy icon
      ctx.font = `${enemy.size * 1.5}px Arial`;
      ctx.fillText(enemy.icon, enemy.x - enemy.size * 0.7, enemy.y + enemy.size * 0.5);

      // Health bar
      const barWidth = enemy.size * 3;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth, 5);
      
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth * healthPercent, 5);

      if (enemy.type !== 'normal') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#000';
        ctx.fillText(enemy.name, enemy.x - 18, enemy.y - enemy.size - 15);
        ctx.shadowBlur = 0;
      }

      return true;
    });

    if (enemiesRef.current.length === 0 && gameState === 'playing') {
      setGameState('waveComplete');
    }

    towersRef.current = towersRef.current.map(tower => {
      if (now - (tower.lastShot || 0) < tower.fireRate) {
        return tower;
      }

      const target = enemiesRef.current.find(enemy => 
        enemy.spawnTime <= now && distance(tower.x, tower.y, enemy.x, enemy.y) <= tower.range
      );

      if (target) {
        projectilesRef.current.push({
          id: Date.now() + Math.random(),
          x: tower.x,
          y: tower.y,
          targetId: target.id,
          damage: tower.damage,
          speed: 8,
          color: tower.projectileColor,
          isExplosive: tower.name === 'Patlayıcı'
        });
        return { ...tower, lastShot: now };
      }

      return tower;
    });

    projectilesRef.current = projectilesRef.current.filter(proj => {
      const target = enemiesRef.current.find(e => e.id === proj.targetId);
      
      if (!target) {
        return false;
      }

      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        const enemyIndex = enemiesRef.current.findIndex(e => e.id === target.id);
        if (enemyIndex !== -1) {
          enemiesRef.current[enemyIndex].health -= proj.damage;
        }

        if (proj.isExplosive) {
          // Explosion effect
          ctx.fillStyle = proj.color + '60';
          ctx.beginPath();
          ctx.arc(target.x, target.y, 60, 0, Math.PI * 2);
          ctx.fill();

          enemiesRef.current.forEach((enemy, idx) => {
            if (enemy.id !== target.id && distance(target.x, target.y, enemy.x, enemy.y) < 60) {
              enemiesRef.current[idx].health -= proj.damage * 0.5;
            }
          });
        }

        return false;
      }

      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;

      // Projectile with glow
      ctx.fillStyle = proj.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.isExplosive ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      return true;
    });

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, drawStaticCanvas]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      drawStaticCanvas();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop, drawStaticCanvas]);

  useEffect(() => {
    if (gameState === 'waveComplete' || gameState === 'menu') {
      drawStaticCanvas();
    }
  }, [mousePos, selectedTower, selectedUpgrade, gameState, drawStaticCanvas]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [lives, gameState]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedTower = towersRef.current.find(t => 
      distance(t.x, t.y, x, y) < 20
    );

    if (clickedTower && (gameState === 'waveComplete' || gameState === 'menu')) {
      if (selectedUpgrade === clickedTower.id) {
        if (gold >= clickedTower.upgradeCost && clickedTower.level < clickedTower.maxLevel) {
          setGold(gold - clickedTower.upgradeCost);
          const towerIndex = towersRef.current.findIndex(t => t.id === clickedTower.id);
          towersRef.current[towerIndex].level++;
          towersRef.current[towerIndex].damage = Math.floor(towersRef.current[towerIndex].damage * 1.45);
          towersRef.current[towerIndex].range = Math.floor(towersRef.current[towerIndex].range * 1.12);
          towersRef.current[towerIndex].fireRate = Math.floor(towersRef.current[towerIndex].fireRate * 0.93);
          towersRef.current[towerIndex].upgradeCost = Math.floor(towersRef.current[towerIndex].upgradeCost * 1.7);
          setSelectedUpgrade(null);
          drawStaticCanvas();
        }
      } else {
        setSelectedUpgrade(clickedTower.id);
        setSelectedTower(null);
        drawStaticCanvas();
      }
      return;
    }

    if (selectedTower && (gameState === 'waveComplete' || gameState === 'menu')) {
      const towerType = towerTypes[selectedTower];
      
      if (!checkCanPlaceTower(x, y)) return;

      towersRef.current.push({ ...towerType, x, y, id: Date.now() + Math.random() });
      setGold(gold - towerType.cost);
      setSelectedTower(null);
      drawStaticCanvas();
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const resetGame = () => {
    setGameState('menu');
    setGold(120);
    setLives(25);
    setWave(0);
    setScore(0);
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    setSelectedTower(null);
    setSelectedUpgrade(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const getWaveInfo = () => {
    const nextWave = wave + 1;
    let info = `${4 + nextWave * 2} Normal`;
    if (nextWave >= 2) info += `, ${1 + Math.floor(nextWave / 2)} Hızlı`;
    if (nextWave >= 3) info += `, ${Math.floor(nextWave / 3)} Tank`;
    if (nextWave % 5 === 0) info += `, 1 BOSS 💀`;
    return info;
  };

  const TowerIcon = ({ type }) => {
    const Icon = towerTypes[type].icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-7xl h-full flex flex-col p-4 gap-3">
        <div className="flex justify-between items-center bg-slate-800 bg-opacity-90 rounded-xl shadow-2xl px-6 py-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            🏰 Kule Savunması
          </h1>
          <div className="flex gap-3 text-white">
            <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg shadow-lg">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">{gold}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg shadow-lg">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="font-bold text-lg">{lives}</span>
            </div>
            <div className="bg-slate-700 px-4 py-2 rounded-lg shadow-lg">
              <span className="font-bold text-lg">Dalga: {wave}</span>
            </div>
            <div className="bg-slate-700 px-4 py-2 rounded-lg shadow-lg">
              <span className="font-bold text-lg">Skor: {score}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {gameState === 'menu' && (
            <div className="flex flex-col items-center gap-4 w-full max-w-6xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseMove={handleMouseMove}
                onClick={handleCanvasClick}
                onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
                className="border-4 border-slate-600 rounded-xl cursor-crosshair shadow-2xl"
              />
              
              <div className="w-full bg-slate-800 bg-opacity-90 rounded-xl p-4 shadow-2xl">
                <div className="text-center text-white mb-4">
                  <h2 className="text-2xl font-bold mb-2">🎮 Hoş Geldiniz!</h2>
                  <p className="text-sm">Düşmanlar soldaki yeşil bayraktan gelip sağdaki kırmızı üsse saldıracak! Kulelerini yerleştir ve yükselt!</p>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-3">
                  {Object.entries(towerTypes).map(([key, tower]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTower(key);
                        setSelectedUpgrade(null);
                      }}
                      disabled={gold < tower.cost}
                      className={`px-3 py-3 rounded-lg font-bold transition transform text-sm flex flex-col items-center gap-1 ${
                        selectedTower === key ? 'ring-4 ring-white scale-105' : ''
                      } ${
                        gold < tower.cost ? 'opacity-40 cursor-not-allowed bg-slate-700' : 'hover:scale-110 cursor-pointer shadow-lg'
                      }`}
                      style={{ backgroundColor: tower.color }}
                    >
                      <TowerIcon type={key} />
                      <div className="text-white font-bold text-xs">{tower.name}</div>
                      <div className="text-yellow-300 text-xs font-bold">{tower.cost}💰</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setGameState('waveComplete')}
                  className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-white text-lg transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Hazırım, Oyuna Başla!
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="text-center text-white bg-slate-800 bg-opacity-95 rounded-2xl p-12 shadow-2xl">
              <h2 className="text-5xl font-bold mb-6 text-red-400">💥 Oyun Bitti!</h2>
              <p className="text-3xl mb-4">Final Skorun: <span className="text-yellow-400">{score}</span></p>
              <p className="text-2xl mb-8">Ulaştığın Dalga: <span className="text-blue-400">{wave}</span></p>
              <button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 px-10 py-4 rounded-lg text-2xl font-bold transition transform hover:scale-105 shadow-lg"
              >
                🔄 Tekrar Oyna
              </button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'waveComplete') && (
            <div className="flex flex-col items-center gap-4 w-full max-w-6xl">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
                className="border-4 border-slate-600 rounded-xl cursor-crosshair shadow-2xl"
              />

              <div className="w-full bg-slate-800 bg-opacity-90 rounded-xl p-4 shadow-2xl">
                {gameState === 'waveComplete' && (
                  <div className="mb-3 bg-blue-900 bg-opacity-60 rounded-lg p-3">
                    <h3 className="text-white font-bold text-base mb-1 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Sonraki Dalga #{wave + 1} - Düşman Bilgisi
                    </h3>
                    <p className="text-blue-200 text-sm">{getWaveInfo()}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-between items-center mb-3">
                  <div className="grid grid-cols-5 gap-2 flex-1">
                    {Object.entries(towerTypes).map(([key, tower]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedTower(key);
                          setSelectedUpgrade(null);
                        }}
                        disabled={gold < tower.cost || gameState === 'playing'}
                        className={`px-3 py-2 rounded-lg font-bold transition transform text-sm flex flex-col items-center gap-1 ${
                          selectedTower === key ? 'ring-4 ring-white scale-105' : ''
                        } ${
                          gold < tower.cost || gameState === 'playing' ? 'opacity-40 cursor-not-allowed bg-slate-700' : 'hover:scale-110 cursor-pointer shadow-lg'
                        }`}
                        style={{ backgroundColor: tower.color }}
                      >
                        <TowerIcon type={key} />
                        <div className="text-white font-bold text-xs">{tower.name}</div>
                        <div className="text-yellow-300 text-xs font-bold">{tower.cost}💰</div>
                      </button>
                    ))}
                  </div>

                  {gameState === 'waveComplete' && (
                    <button
                      onClick={startWave}
                      className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold text-white text-base flex items-center gap-2 transition transform hover:scale-105 shadow-lg"
                    >
                      <Play className="w-5 h-5" />
                      Dalga {wave + 1}
                    </button>
                  )}

                  <button
                    onClick={resetGame}
                    className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition transform hover:scale-105 shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-white text-xs mb-2">
                  <div className="bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                    <span className="text-lg">👾</span>
                    <div>
                      <div className="font-bold">Normal</div>
                      <div className="text-gray-300">Standart</div>
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="font-bold">Hızlı</div>
                      <div className="text-gray-300">Çabuk/Zayıf</div>
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <div className="font-bold">Tank</div>
                      <div className="text-gray-300">Yavaş/Güçlü</div>
                    </div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                    <span className="text-lg">👹</span>
                    <div>
                      <div className="font-bold">Boss</div>
                      <div className="text-gray-300">Her 5 dalga</div>
                    </div>
                  </div>
                </div>

                {gameState === 'waveComplete' && (
                  <div className="text-center">
                    {selectedTower && (
                      <div className="text-blue-400 font-bold text-sm bg-blue-900 bg-opacity-30 py-2 rounded-lg">
                        📍 Haritaya tıklayarak kule yerleştir
                      </div>
                    )}
                    {selectedUpgrade && (
                      <div className="text-green-400 font-bold text-sm bg-green-900 bg-opacity-30 py-2 rounded-lg">
                        ⬆️ Kuleyi yükseltmek için tekrar tıkla (★ seviye atlar)
                      </div>
                    )}
                    {!selectedTower && !selectedUpgrade && (
                      <div className="text-yellow-400 font-bold text-sm bg-yellow-900 bg-opacity-30 py-2 rounded-lg">
                        💡 İpucu: Mevcut kulelere tıklayarak yükseltebilirsin!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TowerDefenseGame;