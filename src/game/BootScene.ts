// ────────────────────────────────────────────────────────────────
// BootScene.ts — генерирует placeholder-текстуры кодом (ТЗ §46).
// Никаких внешних ассетов — игра запускается сразу.
// Позже эти текстуры заменяются на настоящий pixel-art.
// ────────────────────────────────────────────────────────────────

import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  // preload — грузим внешние ассеты ДО create.
  preload(): void {
    // Спрайтшиты игрока (кадр 64×44). Собраны из пака Warrior by Clembod.
    this.load.spritesheet('player-idle', '/assets/sprites/player_idle.png', {
      frameWidth: 64,
      frameHeight: 44,
    });
    this.load.spritesheet('player-run', '/assets/sprites/player_run.png', {
      frameWidth: 64,
      frameHeight: 44,
    });

    // Спрайтшиты врагов (кадр 16×16, по 4 кадра ходьбы).
    // Спрайтшиты врагов из Debts in the Depths by Reaktori (CC0).
    // У каждого свой размер кадра и число кадров.
    // ('slime' — код-ключ; текстура — Batilisk: ровная анимация полёта)
    this.load.spritesheet('enemy-slime', '/assets/sprites/enemy_slime.png', {
      frameWidth: 25,
      frameHeight: 25,
    });
    this.load.spritesheet('enemy-bat', '/assets/sprites/enemy_bat.png', {
      frameWidth: 19,
      frameHeight: 28,
    });
    this.load.spritesheet('enemy-skeleton', '/assets/sprites/enemy_skeleton.png', {
      frameWidth: 19,
      frameHeight: 20,
    });
    this.load.spritesheet('enemy-elite', '/assets/sprites/enemy_elite.png', {
      frameWidth: 31,
      frameHeight: 24,
    });

    // Босс — дракон (кадр 70×73, 6 кадров). Debts in the Depths (CC0).
    this.load.spritesheet('boss-dragon', '/assets/sprites/boss_dragon.png', {
      frameWidth: 70,
      frameHeight: 73,
    });

    // Огонь дракона: снаряд (4 кадра 15×5) и взрыв при попадании (4 кадра 13×13).
    this.load.spritesheet('boss-fire', '/assets/sprites/boss_fire.png', {
      frameWidth: 15,
      frameHeight: 5,
    });
    this.load.spritesheet('boss-fire-hit', '/assets/sprites/boss_fire_hit.png', {
      frameWidth: 13,
      frameHeight: 13,
    });

    // Фаербол: полёт (4 кадра) и взрыв при попадании (4 кадра).
    this.load.spritesheet('firebolt', '/assets/sprites/firebolt.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('firebolt-hit', '/assets/sprites/firebolt_hit.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Тайлы пола локаций (48×48, бесшовные). Из Kenney Tiny Dungeon (CC0).
    this.load.image('floor-ruins', '/assets/tiles/floor_ruins.png');
    this.load.image('floor-forest', '/assets/tiles/floor_forest.png');
    this.load.image('floor-crypt', '/assets/tiles/floor_crypt.png');

    // Декор локаций (объекты-спрайтшиты). Из Debts in the Depths by Reaktori (CC0).
    // После расширения у всех тем единая ячейка 18×19.
    this.load.spritesheet('decor-catacombs', '/assets/tiles/decor_catacombs.png', {
      frameWidth: 18,
      frameHeight: 19,
    });
    this.load.spritesheet('decor-swamp', '/assets/tiles/decor_swamp.png', {
      frameWidth: 18,
      frameHeight: 19,
    });
    this.load.spritesheet('decor-inferno', '/assets/tiles/decor_inferno.png', {
      frameWidth: 18,
      frameHeight: 19,
    });
  }

  create(): void {
    // Игрок теперь — настоящий спрайт. Placeholder 'tex-player' больше не нужен,
    // но оставим анимации для него.
    this.createPlayerAnims();

    // Враги — настоящие спрайты с анимацией ходьбы.
    this.createEnemyAnims();

    // Фаербол — анимированный снаряд (полёт + взрыв).
    this.createFireboltAnims();

    // XP-орб — голубой кристалл.
    this.makeDiamond('tex-xp', 10, 0x57c7e8, 0x123a44);

    // Тайлы пола — загружены из файлов (floor-ruins/forest/crypt).

    // Всё готово — запускаем игровую сцену.
    this.scene.start('GameScene');
  }

  // ── Хелперы рисования. Каждый создаёт текстуру через Graphics. ──

  // Создать анимации игрока из загруженных спрайтшитов.
  private createPlayerAnims(): void {
    // idle — стоит на месте, 6 кадров, плавный цикл.
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1, // зациклить
    });
    // run — бежит, 8 кадров, быстрее.
    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
      frameRate: 14,
      repeat: -1,
    });
  }

  // Создать анимации фаербола: полёт (циклично) и взрыв (один проход).
  private createFireboltAnims(): void {
    this.anims.create({
      key: 'firebolt-fly',
      frames: this.anims.generateFrameNumbers('firebolt', { start: 0, end: 3 }),
      frameRate: 16,
      repeat: -1, // мерцает всё время полёта
    });
    this.anims.create({
      key: 'firebolt-hit',
      frames: this.anims.generateFrameNumbers('firebolt-hit', { start: 0, end: 3 }),
      frameRate: 22,
      repeat: 0, // взрыв проигрывается один раз
    });
  }

  // Создать анимации ходьбы для всех врагов.
  // У каждого своё число кадров (slime — 6, остальные — 4).
  private createEnemyAnims(): void {
    const kinds: Record<string, number> = {
      slime: 4,
      bat: 4,
      skeleton: 4,
      elite: 4,
    };
    for (const [k, frames] of Object.entries(kinds)) {
      this.anims.create({
        key: 'enemy-' + k, // ключ анимации = ключ текстуры
        frames: this.anims.generateFrameNumbers('enemy-' + k, { start: 0, end: frames - 1 }),
        frameRate: 7,
        repeat: -1,
      });
    }
    // Анимация босса-дракона (6 кадров взмаха крыльев).
    this.anims.create({
      key: 'boss-dragon-fly',
      frames: this.anims.generateFrameNumbers('boss-dragon', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    // Огонь дракона — снаряд (циклично) и взрыв при попадании (один проход).
    this.anims.create({
      key: 'boss-fire-fly',
      frames: this.anims.generateFrameNumbers('boss-fire', { start: 0, end: 3 }),
      frameRate: 14,
      repeat: -1,
    });
    this.anims.create({
      key: 'boss-fire-hit',
      frames: this.anims.generateFrameNumbers('boss-fire-hit', { start: 0, end: 3 }),
      frameRate: 20,
      repeat: 0,
    });
  }

  private makeDiamond(key: string, s: number, fill: number, stroke: number): void {
    const g = this.add.graphics();
    const h = s / 2;
    g.fillStyle(fill, 1);
    g.beginPath();
    g.moveTo(h, 0);
    g.lineTo(s, h);
    g.lineTo(h, s);
    g.lineTo(0, h);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, stroke, 1).strokePath();
    g.generateTexture(key, s, s);
    g.destroy();
  }
}
