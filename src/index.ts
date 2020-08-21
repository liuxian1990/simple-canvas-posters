interface Layer {
  id: string;
  type?: string;
  height?: number;
  width?: number;
  left?: number;
  top?: number;
  d?: number;
  path?: string;
  fontSize?: number;
  text?: string;
  lineHeight?: number;
  backgroundColor?: string;
  color?: string;
  referLayer?: Layer;
  mode?: string;
  sWidth: number;
  sHeight: number;
}

function addLayer(layer: Layer): void {
  if (layer.id) {
    toScale(layer, 1 / this.scale);
    this.layers.push(layer);
    if (this[layer.id] === undefined) {
      this[layer.id] = layer;
    } else {
      console.warn('建议id格式为#xxx,以免跟现有属性重复', layer);
    }
  } else {
    console.warn('建议给图该图层加上id', layer);
  }
}

function toScale(layer: Layer, scale: number) {
  if (layer) {
    Object.keys(layer).forEach(key => {
      if (Object.prototype.toString.call(layer[key]) === '[object Number]') {
        layer[key] = layer[key] * scale;
      }
    });
  }
}

function relativePosition(layer: Layer): Layer {
  if (layer.referLayer) {
    const referLayer: Layer = this[layer.referLayer.id];
    if (referLayer) {
      const { top, left } = layer.referLayer;
      top === undefined ||
        (layer.top = referLayer.top + referLayer.height + top);
      left === undefined ||
        (layer.left = referLayer.left + referLayer.width + left);
    } else {
      console.warn(`没有定义[ ${layer.referLayer.id} ]这个id`, layer);
    }
  }
  toScale(layer, this.scale);
  delete layer.referLayer;
  return layer;
}

function getStrLength(str = ''): number {
  let len = 0;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    // 单字节加1
    if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
      len += 1;
    } else {
      len += 2;
    }
  }
  return Math.ceil(len / 2);
}

class SimpleCanvas {
  scale: number = 1;
  ctx: any;
  canvasId: string;
  layers: Layer[] = [];

  constructor({ scale = 1, canvasId, self = {} }: any) {
    if (self) {
      this.ctx = wx.createCanvasContext(canvasId, self);
    } else {
      this.ctx = wx.createCanvasContext(canvasId);
    }
    this.scale = scale;
    this.canvasId = canvasId;
  }

  static textHeight = ({
    text = '',
    width = 0,
    lineHeight = 0,
    fontSize = 12,
    scale = 1
  }: any): number => {
    const textLength = getStrLength(text);
    const textWidth = textLength * fontSize;
    const textRowNum = Math.ceil(textWidth / width);
    return textRowNum * (lineHeight + fontSize) * scale - lineHeight;
  };

  // 获取canvas高度
  getAutoCanvasHeight(): number {
    return Math.max.apply(
      Math,
      this.layers.map((layer: Layer) => {
        const { top = 0, height = 0, type } = layer;
        if (type === 'artboard') {
          return 0;
        }
        return top + height;
      })
    );
  }

  /**
   * 创建Artboard
   * params: {
   *  backgroundColor,
   *  width,
   *  height,
   * }
   */
  createArtboard(layer: Layer): SimpleCanvas {
    const { backgroundColor = '#cccccc', width, height } = layer;
    const { ctx } = this;

    ctx.setFillStyle(backgroundColor);
    ctx.fillRect(0, 0, width, height);
    ctx.fill();

    layer.type = 'artboard';
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建Rectangle
   * params: {
   *  backgroundColor,
   *  top,
   *  left,
   *  width,
   *  height,
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  createRectangle(layer: Layer): SimpleCanvas {
    const {
      left,
      top,
      backgroundColor = '#cccccc',
      width,
      height
    } = relativePosition.call(this, layer);
    const { ctx } = this;

    ctx.setFillStyle(backgroundColor);
    ctx.fillRect(left, top, width, height);

    layer.type = 'rectangle';
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建Image
   * params: {
   *  path,
   *  backgroundColor,
   *  top,
   *  left,
   *  width,
   *  height,
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  drawImage(layer: Layer): SimpleCanvas {
    const {
      left,
      top,
      path,
      width,
      height,
      mode,
      sWidth,
      sHeight
    } = relativePosition.call(this, layer);
    const { ctx, scale } = this;

    if (mode && mode === 'center') {
      let sLeft = 0;
      let sTop = 0;
      let _width = 0;
      let _height = 0;

      _width = sWidth;
      _height = height * (sWidth / width);

      if (_height > sHeight) {
        _height = sHeight;
        _width = width * (sHeight / height);
      }

      sLeft = (sWidth - _width) / 2;
      sTop = (sHeight - _height) / 2;

      ctx.drawImage(
        path,
        sLeft / scale,
        sTop / scale,
        _width / scale,
        _height / scale,
        left,
        top,
        width,
        height
      );
    } else {
      ctx.drawImage(path, left, top, width, height);
    }

    layer.type = 'image';
    addLayer.call(this, layer);
    return this;
  }

  drawCircleImage(layer: Layer): SimpleCanvas {
    const { left, top, path, d = 0 } = relativePosition.call(this, layer);
    const { ctx } = this;
    ctx.save();
    // 绘制头像
    ctx.beginPath();
    // 先画个圆，前两个参数确定了圆心 （x,y） 坐标  第三个参数是圆的半径  四参数是绘图方向  默认是false，即顺时针
    const r = d / 2;
    const cx = left + r;
    const cy = top + r;
    ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
    ctx.clip(); // 画好了圆 剪切  原始画布中剪切任意形状和尺寸。
    // 一旦剪切了某个区域，则所有之后的绘图都会被限制在被剪切的区域内 这也是我们要save上下文的原因
    ctx.drawImage(path, left, top, d, d);
    ctx.restore(); // 恢复之前保存的绘图上下文 恢复之前保存的绘图问下文即状态 还可以继续绘制

    layer.type = 'circleImage';
    layer.height = layer.d;
    layer.width = layer.d;
    addLayer.call(this, layer);
    return this;
  }

  /**
   * 创建可换行文字
   * params: {
   *  text,
   *  fontSize,
   *  lineHeight,
   *  color,
   *  top,
   *  left,
   *  width,
   *  referLayer: { // 相对位置在这里设置后外层top, left 失效
   *    id,
   *    top,
   *    left,
   *  }
   * }
   */
  drawWrapText(layer: Layer) {
    const {
      left = 0,
      top = 0,
      text = '',
      fontSize = 12,
      width = 200,
      lineHeight = 1,
      color = '#333333'
    } = relativePosition.call(this, layer);

    const { ctx } = this;

    const chr = text.split('');
    let temp = '';
    const row = [];
    ctx.setFontSize(fontSize); // 设置文字大小便于measureText计算宽度
    for (let a = 0; a < chr.length; a += 1) {
      if (ctx.measureText(temp).width < width) {
        temp += chr[a];
      } else {
        a -= 1;
        row.push(temp);
        temp = '';
      }
    }
    row.push(temp);

    let textTop;

    for (let b = 0; b < row.length; b += 1) {
      textTop = top + (fontSize + (b * fontSize + b * lineHeight));
      ctx.setFillStyle(color);
      ctx.setFontSize(fontSize);
      ctx.fillText(row[b], left, textTop);
    }

    layer.type = 'wrapText';
    layer.height = textTop - top; // 计算出换行后文字高度
    layer.width = width;

    addLayer.call(this, layer);
    return this;
  }

  drawText(layer: Layer) {
    const {
      left = 0,
      top = 0,
      text = '',
      fontSize = 12,
      color = '#333333'
    } = relativePosition.call(this, layer);

    const { ctx } = this;

    ctx.setFontSize(fontSize);
    ctx.setFillStyle(color);
    ctx.fillText(text, left, top + fontSize);

    layer.type = 'text';
    layer.height = fontSize;
    layer.width = ctx.measureText(text).width;

    addLayer.call(this, layer);
    return this;
  }

  draw(complete: Function): void {
    const { ctx } = this;
    ctx.draw(false, () => {
      complete && complete();
    });
  }
}

export default SimpleCanvas;
