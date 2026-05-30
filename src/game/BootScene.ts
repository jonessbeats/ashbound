import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.spritesheet('player-idle', '/assets/sprites/player_idle.png', {
      frameWidth: 64,
      frameHeight: 44,
    });
    this.load.spritesheet('player-run', '/assets/sprites/player_run.png', {
      frameWidth: 64,
      frameHeight: 44,
    });

    this.load.spritesheet('enemy-slime', '/assets/sprites/enemy_slime.png', {
      frameWidth: 16,
      frameHeight: 16,
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

    this.load.spritesheet('boss-dragon', '/assets/sprites/boss_dragon.png', {
      frameWidth: 70,
      frameHeight: 73,
    });

    this.load.spritesheet('boss-fire', '/assets/sprites/boss_fire.png', {
      frameWidth: 15,
      frameHeight: 5,
    });
    this.load.spritesheet('boss-fire-hit', '/assets/sprites/boss_fire_hit.png', {
      frameWidth: 13,
      frameHeight: 13,
    });

    this.load.spritesheet('firebolt', '/assets/sprites/firebolt.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('firebolt-hit', '/assets/sprites/firebolt_hit.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image('floor-ruins', '/assets/tiles/floor_ruins.png');
    this.load.image('floor-forest', '/assets/tiles/floor_forest.png');
    this.load.image('floor-crypt', '/assets/tiles/floor_crypt.png');
    this.load.image('floor-enchanted', '/assets/tiles/floor_enchanted.png');
    this.load.image('floor-mountain', '/assets/tiles/floor_mountain.png');

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
    this.load.spritesheet('decor-forest', '/assets/tiles/decor_forest.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet('enemy-treant', '/assets/sprites/enemy_treant.png', {
      frameWidth: 31,
      frameHeight: 35,
    });
    this.load.spritesheet('enemy-mole', '/assets/sprites/enemy_mole.png', {
      frameWidth: 24,
      frameHeight: 24,
    });
    // 2D Pixel Dungeon Asset Pack by Pixel_Poem (commercial OK).
    this.load.spritesheet('enemy-skeleton2', '/assets/sprites/enemy_skeleton2.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('enemy-vampire', '/assets/sprites/enemy_vampire.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Creature Free Pack by Electric Lemon Games (commercial OK).
    this.load.spritesheet('enemy-goblin', '/assets/sprites/enemy_goblin.png', {
      frameWidth: 16, frameHeight: 16,
    });
    this.load.spritesheet('enemy-orc', '/assets/sprites/enemy_orc.png', {
      frameWidth: 16, frameHeight: 16,
    });
    this.load.spritesheet('enemy-mummy', '/assets/sprites/enemy_mummy.png', {
      frameWidth: 16, frameHeight: 16,
    });
    this.load.spritesheet('enemy-zombie', '/assets/sprites/enemy_zombie.png', {
      frameWidth: 16, frameHeight: 16,
    });
    this.load.spritesheet('enemy-fire_skull', '/assets/sprites/enemy_fire_skull.png', {
      frameWidth: 16, frameHeight: 16,
    });

    this.load.spritesheet('torch', '/assets/sprites/torch.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('chest-closed', '/assets/sprites/chest_closed.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('chest-open', '/assets/sprites/chest_open.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('flask', '/assets/sprites/flask.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.spritesheet('xp-coin', '/assets/sprites/xp_coin.png', {
      frameWidth: 5,
      frameHeight: 7,
    });
    this.load.spritesheet('xp-gem', '/assets/sprites/xp_gem.png', {
      frameWidth: 7,
      frameHeight: 7,
    });

    this.load.image('weapon-sword',  '/assets/sprites/weapon_1.png');
    this.load.image('weapon-axe',    '/assets/sprites/weapon_6.png');
    this.load.image('weapon-bow',    '/assets/sprites/weapon_11.png');
    this.load.image('weapon-dagger', '/assets/sprites/weapon_22.png');
    this.load.image('weapon-spear',  '/assets/sprites/weapon_53.png');
    this.load.image('weapon-staff',  '/assets/sprites/weapon_57.png');

    this.load.image('arrow', '/assets/sprites/arrow.png');
  }

  create(): void {
    this.createPlayerAnims();

    this.createEnemyAnims();

    this.createFireboltAnims();

    this.makeDiamond('tex-xp', 10, 0x57c7e8, 0x123a44);

    this.anims.create({
      key: 'xp-coin-spin',
      frames: this.anims.generateFrameNumbers('xp-coin', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'xp-gem-spin',
      frames: this.anims.generateFrameNumbers('xp-gem', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.scene.start('GameScene');
  }

  private createPlayerAnims(): void {
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player-idle', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
      frameRate: 14,
      repeat: -1,
    });
  }

  private createFireboltAnims(): void {
    this.anims.create({
      key: 'firebolt-fly',
      frames: this.anims.generateFrameNumbers('firebolt', { start: 0, end: 3 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: 'firebolt-hit',
      frames: this.anims.generateFrameNumbers('firebolt-hit', { start: 0, end: 3 }),
      frameRate: 22,
      repeat: 0,
    });
  }

  private createEnemyAnims(): void {
    const kinds: Record<string, number> = {
      slime: 4,
      bat: 4,
      skeleton: 4,
      elite: 4,
      treant: 4,
      mole: 4,
      skeleton2: 8,
      vampire: 8,
      goblin: 4,
      orc: 4,
      mummy: 4,
      zombie: 4,
      fire_skull: 4,
    };
    for (const [k, frames] of Object.entries(kinds)) {
      this.anims.create({
        key: 'enemy-' + k,
        frames: this.anims.generateFrameNumbers('enemy-' + k, { start: 0, end: frames - 1 }),
        frameRate: 7,
        repeat: -1,
      });
    }

    this.anims.create({
      key: 'torch-burn',
      frames: this.anims.generateFrameNumbers('torch', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'chest-idle',
      frames: this.anims.generateFrameNumbers('chest-closed', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'chest-opening',
      frames: this.anims.generateFrameNumbers('chest-open', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: 'flask-glow',
      frames: this.anims.generateFrameNumbers('flask', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'boss-dragon-fly',
      frames: this.anims.generateFrameNumbers('boss-dragon', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
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
