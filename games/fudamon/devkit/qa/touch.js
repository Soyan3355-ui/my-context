globalThis.mkTouch=async function(page){const cdp=await page.context().newCDPSession(page);
  const center=async sel=>{const b=await page.locator(sel).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2}};
  const T={cdp,
    down:async sel=>{const c=await center(sel);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x,y:c.y}]})},
    up:async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})},
    tap:async sel=>{await T.down(sel);await new Promise(r=>setTimeout(r,60));await T.up()},
    a:async()=>T.tap('#btnA'),b:async()=>T.tap('#btnB'),menu:async()=>T.tap('#btnM')};
  globalThis.TOUCH=T;return T};
