# img-splitter
图片拆分库， 支持将 一张图片，规则拆分成多张图片

## 安装
``` shell
npm i img-splitter
```

## 使用

``` typescript

import imgSplitter from 'img-splitter'

imgSplitter(
  'img url',
  {
    width: 50, // 每个拆分的小方块宽度
    height: 50, // 每个拆分的小方块高度
    chunk: 3, // 总共拆成多少张图
  }
)

```
## 原理
使用 `OffscrenCanvas`， 在 `webworker` 线程中去做图片的裁剪，提取等处理， 并生成多张图片。

优势：图片的操作，不会阻塞js线程的执行，也就是在js可以专心为为用户交互进行反馈，而不回会导致页面的卡死，卡顿等效果

缺点：`webworker` 兼容性问题

