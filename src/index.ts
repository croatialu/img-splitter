import greenlet from 'greenlet'

const getBlobUrlByCanvas = (canvas: HTMLCanvasElement, type = 'image/png', quality = 0.2): Promise<string> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob)
        return reject(new Error('transform error'))

      const url = URL.createObjectURL(blob)

      resolve(url)
    }, type, quality)
  })
}

const getImageSize = greenlet(async (url: string): Promise<{ width: number; height: number }> => {
  const originImgBlob = await fetch(url).then(res => res.blob())

  const image = await createImageBitmap(originImgBlob)

  return {
    width: image.width,
    height: image.height,
  }
})

const cropImage = greenlet(async (url: string, {
  sx,
  sy,
  w,
  h,
}: { sx: number; sy: number; w: number; h: number }): Promise<string> => {
  const originImgBlob = await fetch(url).then(res => res.blob())

  const image = await createImageBitmap(originImgBlob)

  const value = await createImageBitmap(image, sx, sy, w, h)
  const canvas = new OffscreenCanvas(w, h)

  const ctx = canvas.getContext('2d')!

  ctx.drawImage(value, 0, 0)

  return URL.createObjectURL(await canvas.convertToBlob())
})

const extraImage = greenlet(async (url: string, {
  sx,
  sy,
  w,
  h,
}: { sx: number; sy: number; w: number; h: number }): Promise<string> => {
  const originImgBlob = await fetch(url).then(res => res.blob())
  const image = await createImageBitmap(originImgBlob)
  const { width: originWidth, height: originHeight } = image
  const value = await createImageBitmap(image, sx, sy, w, h)

  const canvas = new OffscreenCanvas(originWidth, originHeight)

  const ctx = canvas.getContext('2d')!

  ctx.drawImage(value, sx, sy)

  return URL.createObjectURL(await canvas.convertToBlob())
})

const cropImageByChunk = greenlet(async (imgUrl: string, chunkCount: number, isExtra?: boolean): Promise<string[]> => {
  const { width, height } = await getImageSize(imgUrl)
  const singleWidth = width / chunkCount

  const resultArr: string[] = []

  const cropFn = isExtra ? extraImage : cropImage

  for (let i = 0; i < chunkCount; i++) {
    const sx = i * singleWidth

    const url = await cropFn(imgUrl, {
      sx,
      sy: 0,
      w: singleWidth,
      h: height,
    })

    resultArr.push(url)
  }

  return resultArr
})

const getBlobByObjectUrl = (objectUrl: string) => {
  return fetch(objectUrl).then(res => res.blob())
}

const getRandomValue = (min: number, max: number) => {
  return Math.round(Math.random() * (max - min) + min)
}

/**
 * 交错截图
 */
const cropCrossImage = greenlet(async (url: string, {
  width, height, chunk,
}: { width?: number; height?: number; chunk: number }): Promise<string[]> => {
  const originImgBlob = await fetch(url).then(res => res.blob())

  const image = await createImageBitmap(originImgBlob)

  const { width: layoutWidth, height: layoutHeight } = image

  const cropWidth = width || layoutHeight
  const cropHeight = height || layoutHeight

  const canvasArr = Array(chunk).fill(null).map(() => {
    return new OffscreenCanvas(layoutWidth, layoutHeight)
  })

  const ctxArr = canvasArr.map(v => v.getContext('2d')!)

  let index = 0

  const getCurrentCtx = () => {
    return ctxArr[index]
  }

  const incrIndex = () => {
    // index = getRandomValue(0, chunk - 1)

    const next = index + 1
    index = canvasArr[next] ? next : 0
  }

  const spreadValue = 10

  for (let i = 0; i < layoutWidth; i += cropWidth) {
    index = i / cropWidth % chunk
    for (let j = 0; j < layoutHeight; j += cropHeight) {
      incrIndex()
      const ctx = getCurrentCtx()

      const startPoint = [
        Math.max(i - spreadValue, 0),
        Math.max(j - spreadValue, 0),
      ] as const

      const cropSize = [
        cropWidth + spreadValue * 2,
        cropHeight + spreadValue * 2,
      ] as const

      const value = await createImageBitmap(image, ...startPoint, ...cropSize)
      ctx.drawImage(value, ...startPoint, ...cropSize)
    }
  }

  const resultArr: string[] = []

  for (const canvas of canvasArr) {
    const blob = await canvas.convertToBlob()
    const blobUrl = URL.createObjectURL(blob)
    resultArr.push(blobUrl)
  }

  return resultArr
})

const getImageResizeInfo = async (url: string, resizeType: 'width' | 'height', value: number) => {
  const { width: originWidth, height: originHeight } = await getImageSize(url)

  const ratio = Number((originWidth / originHeight).toFixed(2))

  let width = 0
  let height = 0

  // 固定宽度， 求等比例下的高度
  if (resizeType === 'width') {
    width = value
    height = Math.floor(value / ratio)
  }
  else {
    height = value
    width = Math.floor(value * ratio)
  }

  return {
    originWidth,
    originHeight,
    ratio,
    width,
    height,
  }
}

export {
  cropImage, extraImage, cropImageByChunk, 
  getBlobUrlByCanvas, getBlobByObjectUrl, getImageResizeInfo, getImageSize
}

export default cropCrossImage
