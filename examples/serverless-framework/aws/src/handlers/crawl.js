import log from '../utils/log'
import crawl from '../chrome/crawl'

export default async function handler (event, context, callback) {
  const {
    queryStringParameters: {
      url = 'https://github.com/adieuadieu/serverless-chrome',
      mobile = false,
    },
  } = event

  let data

  log('Processing crawl for', url)

  const startTime = Date.now()

  try {
    data = await crawl(url, mobile)
  } catch (error) {
    console.error('Error crawling for', url, error)
    return callback(error)
  }

  log(`Chromium took ${Date.now() - startTime}ms to load URL and crawl.`)

  return callback(null, {
    statusCode: 200,
    body: data,
    isBase64Encoded: true,
    headers: {
      'Content-Type': 'image/png',
    },
  })
}
