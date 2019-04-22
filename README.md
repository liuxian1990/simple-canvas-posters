## simple-canvas-posters

一款用 canvas 绘制朋友圈分享海报的简单工具，优点支持相对位置布局，无需计算绝对位置，会根据相对图层的位置改变布局。
目前仅支持微信小程序，可在 mpvue, nui-app 中使用

## 安装

```bash
npm i simple-canvas-posters
```

[查看小程序演示](https://developers.weixin.qq.com/s/YPzL6OmH7W7c)

## 使用

```javascript
import SimpleCanvas from 'simple-canvas-posters';

const canvas = new SimpleCanvas({
  scale: 1,
  canvasId: 'canvas'
}); // 实例化对象

canvas
  // 创建画板
  .createArtboard({
    id: 'share',
    backgroundColor: '#ffffff',
    width: 375,
    height: 600
  })

  // 创建avatar图片
  .drawCircleImage({
    id: 'avatar',
    path:
      'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83eqML1IepKLibmc8XmO9pUKRh41ghjMZ8Kl3aQgmxwibC9PTRngUicicthczHGO6icyWgCYKPztcKa1NsOA/132',
    left: 10,
    top: 10,
    d: 60
  })
  // 创建文字
  .drawWrapText({
    id: 'nickname',
    fontSize: 16,
    text: `超级大魔王~`,
    // 位置参照
    referLayer: {
      id: 'avatar',
      left: 12,
      top: -(canvas.avatar.height / 2 + 8)
    }
  })

  .draw();
```

## 在源生小程序中使用

`npm run build` 之后将 dist/index.js copy 到源生小程序项目中
