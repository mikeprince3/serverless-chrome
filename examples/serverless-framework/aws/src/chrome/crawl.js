import Cdp from 'chrome-remote-interface'
import log from '../utils/log'
import sleep from '../utils/sleep'

export default async function crawlUrl (url, mobile = false) {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 60

  let result
  let loaded = false
  let bodyFound = false;

  const loading = async (startTime = Date.now()) => {
    if (!loaded && !bodyFound && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }
 
  const [tab] = await Cdp.List()
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const {
    Network, Page, Runtime, Emulation,
  } = client

  Network.requestWillBeSent((params) => {
    log('Chrome is sending request for:', params.request.url, params.redirectResponse)
  })

//  Network.responseReceived((params) => {
    //console.log('responseReceived', params);
  //});


  Page.loadEventFired(() => {
    loaded = true
  })

  try {
    await Promise.all([Network.enable(), Page.enable()])

    if (mobile) {
      await Network.setUserAgentOverride({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1',
      })
    }
    else {
      await Network.setUserAgentOverride({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
      })
    }


    await Emulation.setDeviceMetricsOverride({
      mobile: !!mobile,
      deviceScaleFactor: 0,
      scale: 1, // mobile ? 2 : 1,
      fitWindow: false,
      width: mobile ? 375 : 1280,
      height: 0,
    })

    await Page.navigate({ url })
    await Page.loadEventFired()
    await loading()

    log('page loaded')

    const expression = `({
      url: window.location.href,
      title: document.title,
      text: document.documentElement.outerText,
      html: document.documentElement.outerHTML
    })`;

    const contentResult = await Runtime.evaluate({expression, returnByValue: true});
    
    if (contentResult.exceptionDetails !== undefined && contentResult.exceptionDetails !== null)
    {
      log('content result exception', contentResult.exceptionDetails)
    }

    const metrics = await Page.getLayoutMetrics;
    const width = Math.ceil(metrics.contentSize.width);
    const height = Math.ceil(metrics.contentSize.height);

    const clip = { x: 0, y: 0, width, height, scale: 1 };


    
    var resultObj = contentResult.result.value;
    
    await Emulation.setDeviceMetricsOverride({
      mobile: !!mobile,
      deviceScaleFactor: 1,
      scale: 1, // mobile ? 2 : 1,
      //fitWindow: false,
      width: width,
      height: height
    })

    const screenshot = await Page.captureScreenshot({ format: 'png', clip })

    resultObj.screenshot = screenshot.data;


  } catch (error) {
    console.error(error)
  }

  await client.close()

  return resultObj
    
}
