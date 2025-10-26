// @ts-ignore
import { factory } from './other/onfire';

let mOnFire: any = null;

// 0=ReactNative  1=WeChat Mini Program 2=Alipay Mini Program
const XMQTT_SYSTEM = {
  ReactNative: 0,
  WeChat: 1,
  Alipay: 2,
};

const XBLUFI_TYPE = {
  TYPE_STATUS_CONNECTED: '-2', /// Device connection status callback
  TYPE_CLOSE_CONNECTED: '-1', /// Actively close connection
  TYPE_CONNECTED: '0', // Actively connect
  TYPE_GET_DEVICE_LISTS: '1', // Discover device list callback
  TYPE_INIT_ESP32_RESULT: '2',
  TYPE_RECIEVE_CUSTON_DATA: '3', // Received custom data
  TYPE_CONNECT_ROUTER_RESULT: '4',
  TYPE_CONNECT_NEAR_ROUTER_LISTS: '5',
  TYPE_GET_DEVICE_LISTS_START: ' 41', // Discover device list callback started
  TYPE_GET_DEVICE_LISTS_STOP: '42', // Stop discovering device list callback
};

const OnFireEvent = {
  EVENT_START_DISCONORY: '0', // Bluetooth status event - discover devices
  EVENT_CONNECT_DISCONNECT: '1', // Notify connect or disconnect Bluetooth
  EVENT_NOFITY_INIT_ESP32: '3', // Notify to get Bluetooth device service UUID list and initialization
  ENENT_ALL: '6',
  EVENT_NOFITY_SEND_ROUTER_SSID_PASSWORD: '50', // Notify to send router SSID and password
  EVENT_NOFITY_SEND_CUSTON_DATA: '51', // Notify to send custom data
  EVENT_NOFITY_SEND_GET_ROUTER_SSID: '52', // Get nearby SSIDs
};

/**
 * Initialize
 * @param type Reference XMQTT_SYSTEM
 */
function initXBlufi(type: number = 0, options: any): void {
  mOnFire = factory();
  switch (type) {
    case XMQTT_SYSTEM.ReactNative:
      let $rnBlufiImpl = require('./xBlufi-rn-impl.js');
      $rnBlufiImpl.init(options);
      break;
    case XMQTT_SYSTEM.WeChat:
      let $wxBlufiImpl = require('./xBlufi-wx-impl.js');
      $wxBlufiImpl.init(options);
      break;
    case XMQTT_SYSTEM.Alipay:
      break;
  }
}

function notifyDeviceMsgEvent(options: any): void {
  mOnFire.fire(OnFireEvent.ENENT_ALL, options);
}

function listenDeviceMsgEvent(isSetListener: boolean, funtion: Function): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.ENENT_ALL, funtion);
  } else {
    mOnFire.un(funtion);
  }
}

/**
 * Start or stop discovering nearby Bluetooth devices
 * @param options Connection parameters {"isStart":true , "filter":"name filter"} : Whether to start discovering devices
 */
function notifyStartDiscoverBle(options: any): void {
  mOnFire.fire(OnFireEvent.EVENT_START_DISCONORY, options);
}

/**
 * Start or stop discovering nearby Bluetooth devices
 * @param options Connection parameters {"isStart":true} Whether to start discovering devices
 */
function listenStartDiscoverBle(
  isSetListener: boolean,
  funtion: Function
): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_START_DISCONORY, funtion);
  } else {
    mOnFire.un(funtion);
  }
}

/**
 * Connect or disconnect Bluetooth connection
 *
 * @param options Connection parameters {"connect":true,"deviceID":"device id, obtained from Bluetooth discovery list"}
 */
function notifyConnectBle(options: any): void {
  console.log('notifyConnectBle deviceId preparing to connect --------------');
  mOnFire.fire(OnFireEvent.EVENT_CONNECT_DISCONNECT, options);
}

/**
 * Start or stop connecting to Bluetooth device
 * @param options Connection parameters {"isStart":true} Whether to start discovering devices
 */
function listenConnectBle(isSetListener: boolean, funtion: Function): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_CONNECT_DISCONNECT, funtion);
  } else {
    mOnFire.un(funtion);
  }
}

/**
 * Notify initialization to get device service list and other information
 * @param options Connection parameters {"deviceId":"device's device id"}
 */
function notifyInitBleEsp32(options: any): void {
  mOnFire.fire(OnFireEvent.EVENT_NOFITY_INIT_ESP32, options);
}

/**
 * Notify initialization to get device service list and other information
 * @param options Connection parameters {"isStart":true} Whether to start discovering devices
 */
function listenInitBleEsp32(isSetListener: boolean, funtion: Function): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_NOFITY_INIT_ESP32, funtion);
  } else {
    mOnFire.un(funtion);
  }
}

/**

Send notification to get nearby router SSID list */ function notifySendGetNearRouterSsid(): void {
  mOnFire.fire(OnFireEvent.EVENT_NOFITY_SEND_GET_ROUTER_SSID);
}
/**

Listen for sending get nearby router SSID list event */ function listenSendGetNearRouterSsid(
  isSetListener: boolean,
  funtion: Function
): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_NOFITY_SEND_GET_ROUTER_SSID, funtion);
  } else {
    mOnFire.un(funtion);
  }
}
/**

Send router SSID and password notification
@param options Connection parameters {"ssid":"xxx","password":"xxx"} */ function notifySendRouterSsidAndPassword(
  options: any
): void {
  mOnFire.fire(OnFireEvent.EVENT_NOFITY_SEND_ROUTER_SSID_PASSWORD, options);
}
/**

Listen for sending router SSID and password event */ function listenSendRouterSsidAndPassword(
  isSetListener: boolean,
  funtion: Function
): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_NOFITY_SEND_ROUTER_SSID_PASSWORD, funtion);
  } else {
    mOnFire.un(funtion);
  }
}
/**

Send custom data notification
@param options Custom data */ function notifySendCustomData(options: any): void {
  mOnFire.fire(OnFireEvent.EVENT_NOFITY_SEND_CUSTON_DATA, options);
}
/**

Listen for sending custom data event */ function listenSendCustomData(
  isSetListener: boolean,
  funtion: Function
): void {
  if (isSetListener) {
    mOnFire.on(OnFireEvent.EVENT_NOFITY_SEND_CUSTON_DATA, funtion);
  } else {
    mOnFire.un(funtion);
  }
}
export {
  XMQTT_SYSTEM,
  XBLUFI_TYPE,
  OnFireEvent,
  initXBlufi,
  notifyDeviceMsgEvent,
  listenDeviceMsgEvent,
  notifyStartDiscoverBle,
  listenStartDiscoverBle,
  notifyConnectBle,
  listenConnectBle,
  notifyInitBleEsp32,
  listenInitBleEsp32,
  notifySendGetNearRouterSsid,
  listenSendGetNearRouterSsid,
  notifySendRouterSsidAndPassword,
  listenSendRouterSsidAndPassword,
  notifySendCustomData,
  listenSendCustomData,
};

export default {
  XMQTT_SYSTEM,
  XBLUFI_TYPE,
  OnFireEvent,
  initXBlufi,
  notifyDeviceMsgEvent,
  listenDeviceMsgEvent,
  notifyStartDiscoverBle,
  listenStartDiscoverBle,
  notifyConnectBle,
  listenConnectBle,
  notifyInitBleEsp32,
  listenInitBleEsp32,
  notifySendGetNearRouterSsid,
  listenSendGetNearRouterSsid,
  notifySendRouterSsidAndPassword,
  listenSendRouterSsidAndPassword,
  notifySendCustomData,
  listenSendCustomData,
};
