import Phaser from 'phaser';
import { PLATFORM_WIDTH } from '../constants.js';


const SLIME_SPEED = 80;

export default class Slime extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'slime_run');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.5);
        this.setCollideWorldBounds(true);
        this.setVelocityX(SLIME_SPEED);
        this.direction = 1;
        this.startX = x;

        // 缩小物理体，避免超出平台边缘
        this.body.setSize(36, 24);
        this.body.setOffset(4, 6);

        this.play('slime_run');
    }

    /**
     * 每帧更新
     * 碰到墙壁或平台边缘时反向
     */
    update() {
        // 碰到世界边界或墙壁反向
        if (this.body.blocked.right) {
            this.direction = -1;
            this.setFlipX(true);
        } else if (this.body.blocked.left) {
            this.direction = 1;
            this.setFlipX(false);
        }

        // 检测平台边缘，快到边缘时反向
        const tileSize = PLATFORM_WIDTH / 2 - 20; // 平台宽度一半 留20px边距

        if (this.x > this.startX + tileSize) {
            this.direction = -1;
            this.setFlipX(true);
        } else if (this.x < this.startX - tileSize) {
            this.direction = 1;
            this.setFlipX(false);
        }

        this.setVelocityX(SLIME_SPEED * this.direction);
    }

    /**
     * 被踩死时播放受击动画然后销毁
     */
    die(scene) {
        this.setVelocityX(0);
        this.setActive(false);  // 立刻标记为非活跃
        this.play('slime_hit');
        this.once('animationcomplete', () => {
            this.destroy();
        });
    }
}