// ────────────────────────────────────────────────────────────────
// GameScene.ts — главная игровая сцена.
// Отвечает за: игрока, движение, врагов, автоатаку, XP, level up.
//
// Система спавна — ДИСКРЕТНЫЕ ВОЛНЫ (вариант A прогрессии):
// волна = пачка врагов → всех убил → пауза → следующая волна.
// Пережил все волны локации → победа. Погиб → поражение.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';
import Player from './Player';
import Enemy from './Enemy';
import Boss from './Boss';
import Projectile from './Projectile';
import EnemyProjectile from './EnemyProjectile';
import WeaponManager from './weapons/WeaponManager';
import Arrow from './weapons/Arrow';
import { type WeaponId, WEAPON_ORDER } from './weapons/weaponTypes';
import XPOrb from './XPOrb';
import { ARENA, BOSS_CONFIG, scoreFromRun, xpForLevel } from './config';
import { rollUpgrades, applyUpgrade, resetUpgradeCounts } from './upgrades';
import { EventBus, GameEvents } from './EventBus';
import { getLocation } from './locations';
import type { LocationConfig, WaveConfig } from './locations';
import type { EnemyKind, HudState, RunResult } from './types';

// Пауза между волнами (мс) — «передышка» + объявление следующей волны.
const INTERMISSION_MS = 2500;

export default class GameScene extends Phaser.Scene {
  // ── Сущности ──
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group; // снаряды врагов (огонь босса)
  private orbs!: Phaser.Physics.Arcade.Group;
  private decorSprites: Phaser.GameObjects.Sprite[] = []; // статичный декор арены
  private boss: Boss | null = null; // активный босс (только в боссовой волне)
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private weaponManager!: WeaponManager;
  private arrows!: Phaser.Physics.Arcade.Group;
  private chest: Phaser.GameObjects.Sprite | null = null;
  private chestOpen = false;
  private flasks!: Phaser.Physics.Arcade.Group;

  // ── Текущая локация и волны ──
  private location!: LocationConfig; // какую локацию играем
  private waveIndex = 0; // индекс текущей волны (0-based)
  private enemiesToSpawn = 0; // сколько врагов волны ещё не появилось
  private nextWaveSpawnAt = 0; // тайминг спавна очередного врага волны
  private intermissionUntil = 0; // до какого момента идёт пауза между волнами
  private waveActive = false; // идёт ли бой текущей волны

  // ── Состояние run ──
  private elapsedMs = 0; // прошло времени с начала run
  private kills = 0;
  private running = false; // false во время level-up паузы и после конца run
  private finished = false; // run завершён (победа или смерть)
  private nextAttackAt = 0;
  private hudTick = 0;
  private pendingLevelUps = 0; // отложенные level-up, если выпало несколько за раз
  private vacuuming = false; // автосбор XP-орбов на переходе между волнами

  // ── Ввод ──
  private moveVec = new Phaser.Math.Vector2(0, 0);
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.physics.world.setBounds(0, 0, ARENA.width, ARENA.height);
    this.cameras.main.setBounds(0, 0, ARENA.width, ARENA.height);
    this.cameras.main.setBackgroundColor('#0a0c14');
    // Зум камеры — приближаем картинку, чтобы герой и враги были крупнее.
    // 1.0 = базовый обзор; больше = ближе. 1.7 заметно крупнее, но играбельно.
    this.cameras.main.setZoom(1.7);

    // Группы сущностей.
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.orbs = this.physics.add.group();
    this.arrows = this.physics.add.group();
    this.flasks = this.physics.add.group();

    // WeaponManager — стартуем с мечом. Player установим в beginLocation.
    this.weaponManager = new WeaponManager(this, null, 'sword');
    this.weaponManager.projectiles = this.projectiles;
    this.weaponManager.arrows = this.arrows;
    this.weaponManager.onKill = (e) => this.killEnemy(e);
    this.weaponManager.onKillBoss = () => this.killBoss();

    // Враги расталкиваются друг от друга — чтобы не слипались в один комок
    // при беге к игроку. Коллайдер живёт всю сцену, не в setupCollisions
    // (тот пересоздаётся при рестарте локации — а группа enemies та же).
    this.physics.add.collider(this.enemies, this.enemies);

    this.setupInput();
    this.setupEventBus();

    // НЕ запускаем локацию здесь — ждём START_LOCATION от React (GameContainer).
    // Сигналим React что сцена готова принять событие.
    EventBus.emit(GameEvents.SCENE_READY);
  }

  // ── Настройка ввода с клавиатуры (desktop, ТЗ §11) ──
  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
  }

  // ── Подписка на события от React ──
  private setupEventBus(): void {
    // Сохраняем ссылки на хэндлеры чтобы в SHUTDOWN снять ТОЛЬКО свои,
    // а не все подряд (EventBus.off без хэндлера сносит всё, включая
    // хэндлеры новой сцены которая уже начала монтироваться).
    const onMove = (v: { x: number; y: number }) => {
      this.moveVec.set(v.x, v.y);
    };

    const onChestPicked = (data: { weaponId: WeaponId; isUpgrade: boolean }) => {
      if (data.isUpgrade) {
        this.weaponManager.upgradeWeapon(data.weaponId);
      } else {
        this.weaponManager.addWeapon(data.weaponId);
      }
      this.running = true;
      this.physics.resume();
    };

    const onUpgrade = (id: Parameters<typeof applyUpgrade>[1]) => {
      applyUpgrade(this.player, id);
      this.running = true;
      this.physics.resume();
      if (this.pendingLevelUps > 0) {
        this.time.delayedCall(50, () => this.triggerLevelUp());
      }
    };

    const onStartLocation = (locationId: string) => {
      // delayedCall(0) откладывает на следующий tick — гарантирует что
      // Phaser завершил create() до того как beginLocation изменит сцену.
      this.time.delayedCall(0, () => this.beginLocation(locationId));
    };

    const onRestart = () => {
      this.time.delayedCall(0, () => this.beginLocation(this.location?.id ?? ''));
    };

    EventBus.on(GameEvents.MOVE_INPUT, onMove);
    EventBus.on(GameEvents.UPGRADE_PICKED, onUpgrade);
    EventBus.on(GameEvents.CHEST_PICKED, onChestPicked);
    EventBus.on(GameEvents.START_LOCATION, onStartLocation);
    EventBus.on(GameEvents.RESTART, onRestart);

    // SHUTDOWN: снимаем ТОЛЬКО свои хэндлеры по ссылке.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.MOVE_INPUT, onMove);
      EventBus.off(GameEvents.UPGRADE_PICKED, onUpgrade);
      EventBus.off(GameEvents.CHEST_PICKED, onChestPicked);
      EventBus.off(GameEvents.START_LOCATION, onStartLocation);
      EventBus.off(GameEvents.RESTART, onRestart);
    });
  }

  // ── Запуск локации с нуля ──
  private beginLocation(locationId: string): void {
    const loc = getLocation(locationId);
    if (!loc) return; // неизвестная локация — игнорируем
    this.location = loc;

    // Очистить всё с прошлого run.
    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.orbs.clear(true, true);
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }

    // Замостить пол текстурой локации.
    this.children.list
      .filter((o) => o instanceof Phaser.GameObjects.TileSprite)
      .forEach((o) => o.destroy());
    this.add
      .tileSprite(0, 0, ARENA.width, ARENA.height, loc.floorTexture)
      .setOrigin(0, 0)
      .setDepth(0);

    // Разбросать декор локации поверх пола.
    this.scatterDecor(loc);

    // Пересоздать игрока со свежими статами.
    if (this.player) this.player.destroy();
    this.player = new Player(this, ARENA.width / 2, ARENA.height / 2);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    // Сброс оружия к стартовому — каждый забег начинается с нуля (только меч).
    this.weaponManager.reset('sword');
    this.weaponManager.setPlayer(this.player);
    this.setupCollisions();

    // Сброс состояния run.
    this.elapsedMs = 0;
    this.kills = 0;
    this.nextAttackAt = 0;
    this.hudTick = 0;
    this.pendingLevelUps = 0;
    this.vacuuming = false;
    this.finished = false;
    this.running = true;
    this.chest = null;
    this.chestOpen = false;
    this.flasks.clear(true, true);
    resetUpgradeCounts();
    this.physics.resume();

    // Запустить первую волну (с короткой паузой-объявлением).
    this.waveIndex = 0;
    this.startIntermission();
  }

  // Разбросать декор-объекты локации по арене.
  // Декор статичный, на слое depth=1 — между полом (0) и врагами (5),
  // поэтому игрок и враги визуально проходят поверх него.
  private scatterDecor(loc: LocationConfig): void {
    // Убрать декор прошлой локации.
    this.decorSprites.forEach((s) => s.destroy());
    this.decorSprites = [];

    const tex = this.textures.get(loc.decorTheme);
    const frameCount = tex.frameTotal - 1; // -1: служебный кадр __BASE
    if (frameCount <= 0) return;

    const margin = 80; // не ставить вплотную к краям арены
    const centerSafe = 220; // радиус «чистой зоны» вокруг старта игрока
    // Forest-декор крупный (деревья до 128px после scale) — нужен больший зазор.
    const isBigDecor = loc.decorTheme === 'decor-forest';
    const minGap = isBigDecor ? 170 : 110;

    const placed: { x: number; y: number }[] = [];

    for (let i = 0; i < loc.decorCount; i++) {
      // До 30 попыток найти позицию, которая не пересекается с уже размещённым.
      let x = 0;
      let y = 0;
      let ok = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        x = Phaser.Math.Between(margin, ARENA.width - margin);
        y = Phaser.Math.Between(margin, ARENA.height - margin);

        // Не заваливать декором точку спавна игрока (центр арены).
        const dx = x - ARENA.width / 2;
        const dy = y - ARENA.height / 2;
        if (Math.hypot(dx, dy) < centerSafe) continue;

        // Проверяем дистанцию до всех уже размещённых объектов.
        let tooClose = false;
        for (const p of placed) {
          if (Math.hypot(x - p.x, y - p.y) < minGap) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        ok = true;
        break;
      }
      // Если за 30 попыток места не нашлось — пропускаем этот объект,
      // чтобы не впихивать его внахлёст.
      if (!ok) continue;

      placed.push({ x, y });

      const frame = Phaser.Math.Between(0, frameCount - 1);
      const decor = this.add.sprite(x, y, loc.decorTheme, frame);
      decor.setDepth(1); // между полом и врагами
      decor.setScale(2); // декор-кадры мелкие (≤18px) — увеличиваем
      // Лёгкое случайное зеркалирование для разнообразия.
      if (Math.random() < 0.5) decor.setFlipX(true);
      this.decorSprites.push(decor);
    }
  }


  private spawnChest(): void {
    if (this.chest) return;
    this.chestOpen = false;
    const x = ARENA.width / 2 + Phaser.Math.Between(-80, 80);
    const y = ARENA.height / 2 + Phaser.Math.Between(-80, 80);
    const ch = this.add.sprite(x, y, 'chest-closed', 0).setDepth(3).setScale(1.5);
    ch.play('chest-idle');
    this.chest = ch;
  }

  private rollChestOptions(): { weaponId: WeaponId; isUpgrade: boolean }[] {
    const options: { weaponId: WeaponId; isUpgrade: boolean }[] = [];
    this.weaponManager.slots.forEach((ws) => {
      if (ws.level < 5) options.push({ weaponId: ws.def.id, isUpgrade: true });
    });
    WEAPON_ORDER.forEach((id) => {
      if (!this.weaponManager.hasWeapon(id) && this.weaponManager.slots.length < 4) {
        options.push({ weaponId: id, isUpgrade: false });
      }
    });
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options.slice(0, 3);
  }

  private maybeSpawnFlask(x: number, y: number): void {
    if (Math.random() > 0.08) return;
    const flask = this.physics.add.sprite(x, y, 'flask', 0).setDepth(3).setScale(2);
    flask.play('flask-glow');
    (flask.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    this.flasks.add(flask);
  }

  private handlePickups(): void {
    if (this.chest && !this.chestOpen && this.running) {
      const ch = this.chest as Phaser.GameObjects.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ch.x, ch.y);
      if (dist < 40) {
        this.chestOpen = true;
        ch.play('chest-opening');
        this.time.delayedCall(400, () => {
          if (this.chest) { (this.chest as Phaser.GameObjects.Sprite).destroy(); this.chest = null; }
          if (!this.running) return;
          const options = this.rollChestOptions();
          if (options.length === 0) return;
          this.running = false;
          this.physics.pause();
          EventBus.emit(GameEvents.CHEST_OPEN, options);
        });
      }
    }

    // Колбы — подходишь → +25 HP
    this.flasks.getChildren().forEach((obj) => {
      const flask = obj as Phaser.GameObjects.Sprite;
      if (!flask.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, flask.x, flask.y,
      );
      if (dist < 30) {
        flask.destroy();
        const heal = 25;
        this.player.hpCurrent = Math.min(
          this.player.hpCurrent + heal, this.player.stats.maxHp,
        );
      }
    });
  }

  // ── Настройка пересечений (идемпотентно — снимаем старые) ──
  private setupCollisions(): void {
    this.colliders.forEach((c) => c.destroy());
    this.colliders = [];

    // Болт попал во врага.
    this.colliders.push(
      this.physics.add.overlap(this.projectiles, this.enemies, (a, b) => {
        // Определяем по типу, а не по позиции аргумента (порядок не гарантирован).
        const proj = (a instanceof Projectile ? a : b) as Projectile;
        const enemy = (a instanceof Enemy ? a : b) as Enemy;
        if (!proj.active || !enemy.active) return;
        this.spawnHitSpark(proj.x, proj.y);
        proj.destroy();
        if (enemy.takeDamage(proj.damage)) this.killEnemy(enemy);
      }),
    );


    // Стрела (лук) — наносит урон и исчезает при попадании.
    this.colliders.push(
      this.physics.add.overlap(this.arrows, this.enemies, (a, b) => {
        const arrow = (a instanceof Arrow ? a : b) as Arrow;
        const enemy = (a instanceof Enemy ? a : b) as Enemy;
        if (!arrow.active || !enemy.active) return;
        this.spawnHitSpark(arrow.x, arrow.y);
        arrow.destroy();
        if (enemy.takeDamage(arrow.damage)) this.killEnemy(enemy);
      }),
    );
    // Враг коснулся игрока — контактный урон.
    this.colliders.push(
      this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (!enemy.active || !this.running) return;
        this.player.takeDamage(enemy.contactDamage, this.elapsedMs);
        if (!this.player.alive) this.endRun(false);
      }),
    );

    // Снаряд врага (огонь босса) попал в игрока.
    this.colliders.push(
      this.physics.add.overlap(this.player, this.enemyProjectiles, (a, b) => {
        const shot = (a instanceof EnemyProjectile ? a : b) as EnemyProjectile;
        if (!shot.active || !this.running) return;
        this.spawnFireHit(shot.x, shot.y);
        shot.destroy();
        this.player.takeDamage(shot.damage, this.elapsedMs);
        if (!this.player.alive) this.endRun(false);
      }),
    );

    // Игрок собрал XP-орб.
    this.colliders.push(
      this.physics.add.overlap(this.player, this.orbs, (_p, orbObj) => {
        const orb = orbObj as XPOrb;
        if (!orb.active) return;
        this.gainXp(orb.value);
        orb.destroy();
      }),
    );
  }

  // ── Главный цикл ──
  update(_time: number, delta: number): void {
    if (!this.running) return;

    this.elapsedMs += delta;

    this.handleMovement();
    this.handleWaves();
    this.handleEnemyChase();
    this.handleBoss();
    this.weaponManager.tick(this.elapsedMs, this.enemies.getChildren(), this.boss);
    this.handleProjectiles(delta);
    this.handleOrbMagnet();
    this.handlePickups();
    this.pushHud(delta);
  }

  // Способности босса — стрельба огнём и призыв свиты.
  private handleBoss(): void {
    if (!this.boss || !this.boss.active) return;

    // Огонь: залп из 3 снарядов веером — только если игрок в радиусе fireRange.
    if (this.boss.shouldFire(this.elapsedMs)) {
      const dist = Phaser.Math.Distance.Between(
        this.boss.x, this.boss.y, this.player.x, this.player.y,
      );
      // Стреляет только когда игрок достаточно близко — иначе экономит "ману".
      if (dist <= BOSS_CONFIG.fireRange) {
        const baseAngle = Math.atan2(
          this.player.y - this.boss.y,
          this.player.x - this.boss.x,
        );
        const burst = BOSS_CONFIG.fireBurst;
        const spread = BOSS_CONFIG.fireSpread;
        // Веер: от -spread до +spread равномерно
        for (let i = 0; i < burst; i++) {
          const t = burst === 1 ? 0 : (i / (burst - 1)) * 2 - 1; // -1..1
          const angle = baseAngle + t * spread;
          const shot = new EnemyProjectile(
            this,
            this.boss.x,
            this.boss.y,
            angle,
            BOSS_CONFIG.fireSpeed,
            BOSS_CONFIG.fireDamage,
          );
          this.enemyProjectiles.add(shot);
        }
      }
    }

    // Призыв: спавним свиту мелких врагов рядом с боссом.
    if (this.boss.shouldSummon(this.elapsedMs)) {
      for (let i = 0; i < BOSS_CONFIG.summonCount; i++) {
        // Призываем «быстрых» врагов (bat) — оказывают давление на игрока.
        const ox = this.boss.x + Phaser.Math.Between(-60, 60);
        const oy = this.boss.y + Phaser.Math.Between(-60, 60);
        const x = Phaser.Math.Clamp(ox, 30, ARENA.width - 30);
        const y = Phaser.Math.Clamp(oy, 30, ARENA.height - 30);
        // difficulty призванных — как у боссовой волны.
        this.enemies.add(new Enemy(this, x, y, 'bat', this.currentWave().hpMultiplier));
      }
    }
  }

  // Самонаведение болтов игрока + ручное движение огня дракона.
  private handleProjectiles(delta: number): void {
    this.projectiles.getChildren().forEach((obj) => {
      (obj as import('./Projectile').default).homeUpdate();
    });
    this.arrows.getChildren().forEach((obj) => {
      (obj as Arrow).manualUpdate(delta);
    });
    // Огонь дракона двигаем вручную (Arcade velocity глючил на нём).
    this.enemyProjectiles.getChildren().forEach((obj) => {
      (obj as EnemyProjectile).manualUpdate(delta);
    });
  }

  // ════════════════ СИСТЕМА ВОЛН ════════════════

  // Начать паузу-«передышку» перед очередной волной.
  private startIntermission(): void {
    this.waveActive = false;
    this.intermissionUntil = this.elapsedMs + INTERMISSION_MS;
    this.emitWaveState(); // React покажет «Wave N incoming…»
  }

  // Начать саму волну: подготовить счётчик врагов к спавну.
  private startWave(): void {
    const wave = this.currentWave();
    this.waveActive = true;
    this.enemiesToSpawn = wave.count;
    this.nextWaveSpawnAt = this.elapsedMs;

    // Боссовая волна — сразу спавним дракона в центре верхнего края арены.
    if (wave.boss) {
      this.spawnBoss(wave.hpMultiplier);
    }

    this.emitWaveState();
  }

  // Создать босса и навесить его коллизии.
  private spawnBoss(difficulty: number): void {
    const view = this.cameras.main.worldView;
    // Появляется по центру над видимой областью и влетает в бой.
    const x = Phaser.Math.Clamp(this.player.x, 200, ARENA.width - 200);
    const y = Phaser.Math.Clamp(view.y - 80, 80, ARENA.height - 80);

    this.boss = new Boss(this, x, y, difficulty);
    this.boss.initAbilities(this.elapsedMs); // запустить таймеры огня и призыва

    // Болт игрока попал в босса.
    this.colliders.push(
      this.physics.add.overlap(this.projectiles, this.boss, (a, b) => {
        const proj = (a instanceof Projectile ? a : b) as Projectile;
        const boss = (a instanceof Boss ? a : b) as Boss;
        if (!proj.active || !boss.active) return;
        this.spawnHitSpark(proj.x, proj.y);
        proj.destroy();
        if (boss.takeDamage(proj.damage)) this.killBoss();
      }),
    );

    // Стрела игрока попала в босса.
    this.colliders.push(
      this.physics.add.overlap(this.arrows, this.boss, (a, b) => {
        const arrow = (a instanceof Arrow ? a : b) as Arrow;
        const boss = (a instanceof Boss ? a : b) as Boss;
        if (!arrow.active || !boss.active) return;
        this.spawnHitSpark(arrow.x, arrow.y);
        arrow.destroy();
        if (boss.takeDamage(arrow.damage)) this.killBoss();
      }),
    );

    // Босс коснулся игрока — тяжёлый контактный урон.
    this.colliders.push(
      this.physics.add.overlap(this.player, this.boss, () => {
        if (!this.boss || !this.boss.active || !this.running) return;
        this.player.takeDamage(this.boss.contactDamage, this.elapsedMs);
        if (!this.player.alive) this.endRun(false);
      }),
    );
  }

  // Босс повержен — выдаём опыт и убираем со сцены.
  private killBoss(): void {
    if (!this.boss) return;
    const x = this.boss.x;
    const y = this.boss.y;
    const xp = this.boss.xpValue;
    this.boss.destroy();
    this.boss = null;
    this.kills++;
    // Босс роняет много опыта — несколько орбов веером.
    for (let i = 0; i < 6; i++) {
      const ox = x + Phaser.Math.Between(-40, 40);
      const oy = y + Phaser.Math.Between(-40, 40);
      this.orbs.add(new XPOrb(this, ox, oy, Math.ceil(xp / 6)));
    }
  }

  // Логика волн — зовётся каждый кадр.
  private handleWaves(): void {
    // Если локация завершена или идёт автосбор XP — ничего не делаем.
    if (this.finished || this.vacuuming) return;

    // Идёт пауза между волнами — ждём её конца.
    if (!this.waveActive) {
      if (this.elapsedMs >= this.intermissionUntil) this.startWave();
      return;
    }

    // Волна активна: спавним врагов пачкой с маленьким интервалом.
    if (this.enemiesToSpawn > 0 && this.elapsedMs >= this.nextWaveSpawnAt) {
      this.spawnWaveEnemy();
      this.enemiesToSpawn--;
      this.nextWaveSpawnAt = this.elapsedMs + 280;
    }

    // Волна зачищена: все враги заспавнены и убиты, И босс повержен (если был).
    if (this.enemiesToSpawn === 0 && this.countAliveEnemies() === 0 && !this.boss) {
      this.onWaveCleared();
    }
  }

  // Волна зачищена: сначала собираем оставшийся XP, потом — следующая волна или победа.
  private onWaveCleared(): void {
    this.waveIndex++;
    this.waveActive = false;
    const isVictory = this.waveIndex >= this.location.waves.length;
    this.vacuumOrbs(() => {
      if (isVictory) {
        this.endRun(true);
      } else {
        // Сундук появляется каждые 2 волны (волны 2, 4, 6...)
        if (this.waveIndex % 2 === 0) this.spawnChest();
        this.startIntermission();
      }
    });
  }

  // Текущая волна (с защитой от выхода за границы).
  private currentWave(): WaveConfig {
    const i = Math.min(this.waveIndex, this.location.waves.length - 1);
    return this.location.waves[i];
  }

  // Сколько врагов сейчас живо на арене.
  private countAliveEnemies(): number {
    let n = 0;
    this.enemies.getChildren().forEach((o) => {
      if ((o as Enemy).active) n++;
    });
    return n;
  }

  // Заспавнить одного врага текущей волны (вид — по весам волны).
  private spawnWaveEnemy(): void {
    const wave = this.currentWave();
    const kind = this.pickKindFromWeights(wave.weights);
    this.spawnEnemyAt(kind, wave.hpMultiplier);
  }

  // Выбрать вид врага по весам волны.
  private pickKindFromWeights(weights: WaveConfig['weights']): EnemyKind {
    const entries = Object.entries(weights) as [EnemyKind, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    if (total <= 0) return 'slime';
    let r = Math.random() * total;
    for (const [kind, w] of entries) {
      r -= w;
      if (r <= 0) return kind;
    }
    return entries[0][0];
  }

  // Создать врага за пределами видимой камеры.
  private spawnEnemyAt(kind: EnemyKind, hpMultiplier: number): void {
    // worldView — реально видимый прямоугольник мира (учитывает зум камеры).
    const view = this.cameras.main.worldView;
    const margin = 50;
    const edge = Phaser.Math.Between(0, 3);
    let x: number, y: number;

    if (edge === 0) {
      x = Phaser.Math.Between(view.x, view.right);
      y = view.y - margin;
    } else if (edge === 1) {
      x = Phaser.Math.Between(view.x, view.right);
      y = view.bottom + margin;
    } else if (edge === 2) {
      x = view.x - margin;
      y = Phaser.Math.Between(view.y, view.bottom);
    } else {
      x = view.right + margin;
      y = Phaser.Math.Between(view.y, view.bottom);
    }

    x = Phaser.Math.Clamp(x, 20, ARENA.width - 20);
    y = Phaser.Math.Clamp(y, 20, ARENA.height - 20);

    // hpMultiplier волны передаём как «difficulty» в конструктор Enemy.
    this.enemies.add(new Enemy(this, x, y, kind, hpMultiplier));
  }

  // Отправить состояние волн в React (для HUD и баннера волны).
  private emitWaveState(): void {
    const total = this.location.waves.length;
    // Клампируем current чтобы никогда не показывало «6/5» на экране победы.
    const current = Math.min(this.waveIndex + 1, total);
    EventBus.emit(GameEvents.WAVE_CHANGED, {
      current,
      total,
      enemiesLeft: this.enemiesToSpawn + this.countAliveEnemies(),
      intermission: !this.waveActive,
      boss: !!this.currentWave().boss,
    });
  }

  // ════════════════ ДВИЖЕНИЕ / БОЙ ════════════════

  private handleMovement(): void {
    let x = this.moveVec.x;
    let y = this.moveVec.y;

    if (x === 0 && y === 0) {
      if (this.keys.A.isDown || this.keys.LEFT.isDown) x = -1;
      else if (this.keys.D.isDown || this.keys.RIGHT.isDown) x = 1;
      if (this.keys.W.isDown || this.keys.UP.isDown) y = -1;
      else if (this.keys.S.isDown || this.keys.DOWN.isDown) y = 1;
    }

    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    const speed = this.player.stats.moveSpeed;
    const vx = x * speed;
    const vy = y * speed;
    this.player.setVelocity(vx, vy);
    this.player.updateAnimation(vx, vy);
  }

  private handleEnemyChase(): void {
    const px = this.player.x;
    const py = this.player.y;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.active) e.chase(px, py);
    });
    // Босс тоже движется к игроку.
    if (this.boss && this.boss.active) this.boss.chase(px, py);
  }

  private handleAutoAttack(): void {
    if (this.elapsedMs < this.nextAttackAt) return;

    // Цель — ближайший враг; если врагов нет, но есть босс — бьём босса.
    const enemyTargets = this.findNearestEnemies(this.player.stats.projectileCount);
    const bossActive = this.boss && this.boss.active;
    const primary = enemyTargets[0] ?? (bossActive ? this.boss! : null);
    if (!primary) return;

    const s = this.player.stats;
    this.nextAttackAt = this.elapsedMs + s.attackCooldown;

    const baseAngle = Math.atan2(primary.y - this.player.y, primary.x - this.player.x);

    for (let i = 0; i < s.projectileCount; i++) {
      const spread = (i - (s.projectileCount - 1) / 2) * 0.18;
      const isCrit = Math.random() < s.critChance;
      const dmg = isCrit ? s.attackDamage * 2 : s.attackDamage;
      // У каждого болта своя цель: обычный враг, иначе — основная цель (босс).
      const aim = enemyTargets[i] ?? primary;
      const bolt = new Projectile(
        this,
        this.player.x,
        this.player.y,
        baseAngle + spread,
        s.projectileSpeed,
        dmg,
        isCrit,
        aim,
      );
      this.projectiles.add(bolt);
    }
  }

  // Найти N ближайших живых врагов в радиусе атаки (отсортированы по дистанции).
  private findNearestEnemies(n: number): Enemy[] {
    const range = this.player.stats.attackRange;
    const list: { e: Enemy; d: number }[] = [];
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d <= range) list.push({ e, d });
    });
    list.sort((a, b) => a.d - b.d);
    return list.slice(0, n).map((x) => x.e);
  }

  private handleOrbMagnet(): void {
    const r = this.player.stats.pickupRadius;
    this.orbs.getChildren().forEach((obj) => {
      const orb = obj as XPOrb;
      if (!orb.active) return;
      if (this.vacuuming) {
        // Автосбор на переходе — притягиваемся с любого расстояния.
        orb.forceMagnetTo(this.player.x, this.player.y);
      } else {
        orb.magnetTo(this.player.x, this.player.y, r);
      }
    });
  }

  // Принудительно собрать все оставшиеся XP-орбы на арене.
  // Используется при переходе на следующую волну / победе локации.
  // Игра «замирает» на ~700мс, орбы магнитятся к игроку, после чего
  // вызывается then() для продолжения нормальной логики.
  private vacuumOrbs(then: () => void): void {
    const aliveOrbs = this.orbs.getChildren().filter((o) => o.active).length;
    if (aliveOrbs === 0) {
      then();
      return;
    }
    this.vacuuming = true;
    this.time.delayedCall(700, () => {
      this.vacuuming = false;
      // На всякий случай — добиваем оставшиеся орбы (если игрок их не догнал).
      this.orbs.getChildren().forEach((o) => {
        if (o.active) {
          this.gainXp((o as XPOrb).value);
          o.destroy();
        }
      });
      then();
    });
  }

  private killEnemy(enemy: Enemy): void {
    const xpValue = enemy.xpValue;
    const x = enemy.x;
    const y = enemy.y;
    enemy.destroy();
    this.kills++;
    this.orbs.add(new XPOrb(this, x, y, xpValue));
    // Шанс дропа колбы (с элитных врагов чаще)
    const flaskChance = (enemy.kind === 'elite' || enemy.kind === 'treant') ? 0.22 : 0.06;
    if (Math.random() < flaskChance) this.maybeSpawnFlask(x, y);
  }

  // ════════════════ XP / LEVEL UP ════════════════

  private gainXp(amount: number): void {
    this.player.xp += amount;
    let needed = xpForLevel(this.player.level);
    while (this.player.xp >= needed) {
      this.player.xp -= needed;
      this.player.level++;
      // Откладываем левелап в очередь, чтобы не показывать модалку поверх модалки.
      this.pendingLevelUps++;
      needed = xpForLevel(this.player.level);
    }
    // Если игра не на паузе из-за уже открытой модалки — открываем первую.
    if (this.pendingLevelUps > 0 && this.running) {
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp(): void {
    if (this.pendingLevelUps <= 0) return;
    this.pendingLevelUps--;
    this.running = false;
    this.physics.pause();
    EventBus.emit(GameEvents.LEVEL_UP, rollUpgrades());
  }

  // ════════════════ КОНЕЦ RUN ════════════════

  // Завершить run. victory=true — локация пройдена, false — игрок погиб.
  private endRun(victory: boolean): void {
    if (this.finished) return; // не завершать дважды
    this.finished = true;
    this.running = false;
    this.physics.pause();

    const survivalTime = Math.floor(this.elapsedMs / 1000);
    const result: RunResult = {
      survivalTime,
      level: this.player.level,
      kills: this.kills,
      score: scoreFromRun(this.kills, this.player.level, survivalTime),
      timestamp: Date.now(),
      locationId: this.location.id,
      locationName: this.location.name,
      wavesCleared: victory ? this.location.waves.length : this.waveIndex,
      totalWaves: this.location.waves.length,
      victory,
    };
    EventBus.emit(GameEvents.GAME_OVER, result);
  }

  // ════════════════ HUD ════════════════

  private pushHud(delta: number): void {
    this.hudTick += delta;
    if (this.hudTick < 100) return;
    this.hudTick = 0;

    const survivalSec = Math.floor(this.elapsedMs / 1000);
    const hud: HudState = {
      hp: Math.ceil(this.player.hpCurrent),
      maxHp: this.player.stats.maxHp,
      xp: Math.floor(this.player.xp),
      xpToNext: xpForLevel(this.player.level),
      level: this.player.level,
      kills: this.kills,
      score: scoreFromRun(this.kills, this.player.level, survivalSec),
      timeSec: survivalSec,
      wave: Math.min(this.waveIndex + 1, this.location.waves.length),
      totalWaves: this.location.waves.length,
      enemiesLeft: this.enemiesToSpawn + this.countAliveEnemies(),
      bossActive: !!(this.boss && this.boss.active),
      bossHpFraction: this.boss && this.boss.active ? this.boss.hpFraction : 0,
    };
    EventBus.emit(GameEvents.HUD_UPDATE, hud);
  }

  private spawnHitSpark(x: number, y: number): void {
    // Анимированный взрыв фаербола в точке попадания.
    const boom = this.add.sprite(x, y, 'firebolt-hit', 0).setDepth(9);
    boom.setScale(1.6);
    boom.play('firebolt-hit');
    boom.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => boom.destroy());
  }

  // Вспышка пламени в точке попадания огня дракона по игроку.
  private spawnFireHit(x: number, y: number): void {
    const boom = this.add.sprite(x, y, 'boss-fire-hit', 0).setDepth(9);
    boom.setScale(2.4);
    boom.play('boss-fire-hit');
    boom.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => boom.destroy());
  }
}
