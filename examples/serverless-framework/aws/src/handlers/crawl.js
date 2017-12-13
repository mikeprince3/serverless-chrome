import log from '../utils/log'
import crawl from '../chrome/crawl'

export default async function handler (event, context, callback) {
  const {
    queryStringParameters: {
      url = 'https://github.com/adieuadieu/serverless-chrome',
      mobile = false,
    },
  } = event

  let screenshotData

  log('Processing screenshot capture for', url)

  const startTime = Date.now()

  try {
    screenshotData = await crawl(url, mobile)
  } catch (error) {
    console.error('Error capturing screenshot for', url, error)
    return callback(error)
  }

  log(`Chromium took ${Date.now() - startTime}ms to load URL and capture screenshot.`)

        //screenshotData.text = null
//      screenshotData.html = null

  return callback(null, {
    statusCode: 200,
    body: JSON.stringify(screenshotData),
    headers: {
        'Content-Type': 'application/json'
    },
  })
}

