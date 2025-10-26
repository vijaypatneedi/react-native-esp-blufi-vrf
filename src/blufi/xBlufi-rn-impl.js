import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import util from './util.js';
import mDeviceEvent from './xBlufi';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

let tempTimer = 0;
let client = null;
// let util = null;
// let mDeviceEvent = null;
let crypto = null;
let md5 = null;
let aesjs = null;
const timeOut = 10; // timeout (seconds)
var timeId = '';
let sequenceControl = 0;
let sequenceNumber = -1;

let self = {
  data: {
    isConnected: false,
    failure: false,
    value: 0,
    desc: 'Please wait patiently...',
    isChecksum: false,
    isEncrypt: false,
    flagEnd: false,
    defaultData: 1,
    ssidType: 2,
    passwordType: 3,
    meshIdType: 3,
    deviceId: '',
    ssid: '',
    uuid: '',
    serviceId: '',
    password: '',
    meshId: '',
    processList: [],
    result: [],
    service_uuid: '0000FFFF-0000-1000-8000-00805F9B34FB',
    characteristic_write_uuid: '0000FF01-0000-1000-8000-00805F9B34FB',
    characteristic_notify_uuid: '0000FF02-0000-1000-8000-00805F9B34FB',
    customData: null,
    md5Key: 0,
  },
};

class rn {
  // Bluetooth adapter state listener
  static async onBluetoothAdapterStateChange(callback) {
    return new Promise((resolve, reject) => {
      BleManager.start({ showAlert: false })
        .then(() => {
          resolve();
          bleManagerEmitter.removeAllListeners('BleManagerDidUpdateState');
          bleManagerEmitter.addListener('BleManagerDidUpdateState', callback);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
  // Open Bluetooth adapter
  static async openBluetoothAdapter({ success, fail }) {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        resolve();
        success && success();
        return;
      }
      BleManager.enableBluetooth()
        .then(() => {
          resolve();
          success && success();
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Close Bluetooth adapter
  static async closeBluetoothAdapter({ complete }) {
    return new Promise((resolve, reject) => {
      resolve();
      complete && complete();
    });
  }
  // Get Bluetooth adapter state
  static async getBluetoothAdapterState({ success, fail }) {
    return new Promise((resolve, reject) => {
      console.log('BleManager checkState 0');
      resolve();
      success && success();
  // For BleManager versions below 10 there is no callback; return default state
      // BleManager.checkState()
      //   .then((state) => {
      //     console.log('BleManager checkState', state);
      //     resolve(state);
      //     success && success(state);
      //   })
      //   .catch((error) => {
      //     reject(error);
      //     fail && fail(error);
      //   });
    });
  }

  // Connection listener
  static async onBLEConnectionStateChange(callback) {
    return new Promise((resolve, reject) => {
      resolve();
      bleManagerEmitter.removeAllListeners('BleManagerConnectPeripheral');
      bleManagerEmitter.addListener('BleManagerConnectPeripheral', callback);
    });
  }
  // Connect
  static async createBLEConnection({ deviceId, success, fail }) {
    return new Promise((resolve, reject) => {
      BleManager.connect(deviceId)
        .then(() => {
          resolve();
          success && success();
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Set MTU
  static async setBLEMTU({ deviceId, mtu, success, fail }) {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        resolve(256);
        success && success(256);
        return;
      }
      BleManager.requestMTU(deviceId, mtu)
        .then((mtu) => {
          resolve(mtu);
          success && success(mtu);
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Disconnect
  static async closeBLEConnection({ deviceId, success, fail }) {
    return new Promise((resolve, reject) => {
      BleManager.disconnect(deviceId)
        .then(() => {
          resolve();
          success && success();
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }

  // Start scanning
  static async startBluetoothDevicesDiscovery({
    serviceUUIDs,
    timeout,
    allowDuplicatesKey,
    options,
    success,
    fail,
  }) {
    return new Promise((resolve, reject) => {
      BleManager.scan(
        [...serviceUUIDs],
        timeout || timeOut,
        allowDuplicatesKey,
        options
      )
        .then(() => {
          console.log('BleManager scan ok');
          resolve();
          success && success();
        })
        .catch((error) => {
          console.log('BleManager scan', error);
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Get Bluetooth devices
  static async onBluetoothDeviceFound(callback) {
    return new Promise((resolve, reject) => {
      resolve();
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', callback);
      console.log('BleManager onBluetoothDeviceFound ok');
    });
  }
  // Stop scanning
  static async stopBluetoothDevicesDiscovery({ success, fail }) {
    return new Promise((resolve, reject) => {
      BleManager.stopScan()
        .then(() => {
          resolve();
          success && success();
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Get all services for the Bluetooth device
  static async getBLEDeviceServices({ deviceId, success, fail }) {
    return new Promise((resolve, reject) => {
      BleManager.retrieveServices(deviceId)
        .then((services) => {
          resolve(services);
          success && success(services);
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Get characteristics
  static async getBLEDeviceCharacteristics({
    deviceId,
    serviceId,
    success,
    fail,
  }) {
    return new Promise((resolve, reject) => {
      BleManager.retrieveServices(deviceId)
        .then((res) => {
          resolve(res);
          success && success(res);
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Read characteristic value
  static async readBLECharacteristicValue({
    deviceId,
    serviceId,
    characteristicId,
    success,
    fail,
  }) {
    return new Promise((resolve, reject) => {
      BleManager.read(deviceId, serviceId, characteristicId)
        .then((data) => {
          resolve(data);
          success && success(data);
        })
        .catch((error) => {
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Write characteristic value
  static async writeBLECharacteristicValue({
    deviceId,
    serviceId,
    characteristicId,
    value,
    success,
    fail,
  }) {
    return new Promise((resolve, reject) => {
      console.log(
        'writeBLECharacteristicValue',
        deviceId,
        serviceId,
        characteristicId,
        value
      );
      // resolve();
      // success && success();
      BleManager.write(deviceId, serviceId, characteristicId, value)
        .then(() => {
          console.log('write ok');
          success && success();
          resolve();
        })
        .catch((error) => {
          fail && fail(error);
          reject(error);
        });
    });
  }
  // Enable notifications for characteristic
  static async notifyBLECharacteristicValueChange({
    deviceId,
    serviceId,
    characteristicId,
    value,
    success,
    fail,
  }) {
    return new Promise((resolve, reject) => {
      BleManager.startNotification(deviceId, serviceId, characteristicId)
        .then(() => {
          console.log('Notification started');
          resolve();
          success && success();
        })
        .catch((error) => {
          console.log('Notification error', error);
          reject(error);
          fail && fail(error);
        });
    });
  }
  // Characteristic value update
  static async onBLECharacteristicValueChange(callback) {
    return new Promise((resolve, reject) => {
      bleManagerEmitter.removeAllListeners(
        'BleManagerDidUpdateValueForCharacteristic'
      );
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        (data) => {
          resolve(data);
          callback && callback(data);
        }
      ),
        resolve();
    });
  }
}

function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

function buf2string(buffer) {
  var arr = Array.prototype.map.call(new Uint8Array(buffer), (x) => x);
  var str = '';
  for (var i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

function getSsids(str) {
  var list = [],
    strs = str.split(':');
  for (var i = 0; i < strs.length; i++) {
    list.push(parseInt(strs[i], 16));
  }
  return list;
}

function getCharCodeat(str) {
  var list = [];
  for (var i = 0; i < str.length; i++) {
    list.push(str.charCodeAt(i));
  }
  return list;
}

function isEncrypt(fragNum, list, md5Key) {
  var checksum = [],
    checkData = [];
  if (fragNum[7] == '1') {
    // returned data is encrypted
    if (fragNum[6] == '1') {
      var len = list.length - 2;
      list = list.slice(0, len);
    }
    var iv = this.generateAESIV(parseInt(list[2], 16));
    if (fragNum[3] == '0') {
      // not fragmented
      list = list.slice(4);
      self.data.flagEnd = true;
    } else {
      // fragmented
      list = list.slice(6);
    }
  } else {
    // returned data is not encrypted
    if (fragNum[6] == '1') {
      var len = list.length - 2;
      list = list.slice(0, len);
    }
    if (fragNum[3] == '0') {
      // not fragmented
      list = list.slice(4);
      self.data.flagEnd = true;
    } else {
      // fragmented
      list = list.slice(6);
    }
  }
  return list;
}

function getSecret(
  deviceId,
  serviceId,
  characteristicId,
  client,
  kBytes,
  pBytes,
  gBytes,
  data
) {
  var obj = [],
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(data, true, sequenceControl);
    frameControl = util.getFrameCTRLValue(
      false,
      true,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  } else {
    data = [];
    data.push(util.NEG_SET_SEC_ALL_DATA);
    var pLength = pBytes.length;
    var pLen1 = (pLength >> 8) & 0xff;
    var pLen2 = pLength & 0xff;
    data.push(pLen1);
    data.push(pLen2);
    data = data.concat(pBytes);
    var gLength = gBytes.length;
    var gLen1 = (gLength >> 8) & 0xff;
    var gLen2 = gLength & 0xff;
    data.push(gLen1);
    data.push(gLen2);
    data = data.concat(gBytes);
    var kLength = kBytes.length;
    var kLen1 = (kLength >> 8) & 0xff;
    var kLen2 = kLength & 0xff;
    data.push(kLen1);
    data.push(kLen2);
    data = data.concat(kBytes);
    obj = util.isSubcontractor(data, true, sequenceControl);
    frameControl = util.getFrameCTRLValue(
      false,
      true,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  }
  var value = util.writeData(
    util.PACKAGE_VALUE,
    util.SUBTYPE_NEG,
    frameControl,
    sequenceControl,
    obj.len,
    obj.lenData
  );
  var typedArray = new Uint8Array(value);
  console.log(typedArray);

  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function (res) {
      if (obj.flag) {
        getSecret(
          deviceId,
          serviceId,
          characteristicId,
          client,
          kBytes,
          pBytes,
          gBytes,
          obj.laveData
        );
      }
    },
    fail: function (res) {
      console.log(res);
      console.log(deviceId);
      console.log(serviceId);
      console.log(characteristicId);
      console.log(typedArray.length);
    },
  });
}

function writeDeviceRouterInfoStart(
  deviceId,
  serviceId,
  characteristicId,
  data
) {
  console.log(
    'writeDeviceRouterInfoStart start:',
    deviceId,
    serviceId,
    characteristicId,
    data
  );
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(
      data,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  } else {
    obj = util.isSubcontractor(
      [self.data.defaultData],
      self.data.isChecksum,
      sequenceControl,
      true
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  }
  var defaultData = util.encrypt(
    aesjs,
    self.data.md5Key,
    sequenceControl,
    obj.lenData,
    true
  );
  var value = util.writeData(
    util.PACKAGE_CONTROL_VALUE,
    util.SUBTYPE_WIFI_MODEl,
    frameControl,
    sequenceControl,
    obj.len,
    defaultData
  );
  var typedArray = new Uint8Array(value);
  console.log('writeDeviceRouterInfoStart obj', obj, value, typedArray);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {
      if (obj.flag) {
        writeDeviceRouterInfoStart(
          deviceId,
          serviceId,
          characteristicId,
          obj.laveData
        );
      } else {
        writeRouterSsid(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (error) {
      console.log('writeDeviceRouterInfoStart fail:', error);
    },
  });
}

function writeCutomsData(deviceId, serviceId, characteristicId, data) {
  console.log(
    'writeCutomsData',
    deviceId,
    serviceId,
    characteristicId,
    data,
    self.data
  );
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(
      data,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  } else {
    var ssidData = getCharCodeat(self.data.customData);
    obj = util.isSubcontractor(
      ssidData,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  }
  var defaultData = util.encrypt(
    aesjs,
    self.data.md5Key,
    sequenceControl,
    obj.lenData,
    true
  );
  var value = util.writeData(
    util.PACKAGE_VALUE,
    util.SUBTYPE_CUSTOM_DATA,
    frameControl,
    sequenceControl,
    obj.len,
    defaultData
  );
  var typedArray = new Uint8Array(value);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {
      if (obj.flag) {
        writeCutomsData(deviceId, serviceId, characteristicId, obj.laveData);
      }
    },
    fail: function (error) {
      //console.log(257);
      console.log('writeCutomsData', error);
    },
  });
}

function writeGetNearRouterSsid(deviceId, serviceId, characteristicId, data) {
  console.log(
    'writeGetNearRouterSsid',
    deviceId,
    serviceId,
    characteristicId,
    data
  );
  sequenceControl = parseInt(sequenceControl) + 1;
  var frameControl = util.getFrameCTRLValue(
    self.data.isEncrypt,
    false,
    util.DIRECTION_OUTPUT,
    false,
    false
  );
  var value = util.writeData(
    self.data.PACKAGE_CONTROL_VALUE,
    util.SUBTYPE_WIFI_NEG,
    frameControl,
    sequenceControl,
    0,
    null
  );
  var typedArray = new Uint8Array(value);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {},
    fail: function (error) {
      console.log('writeGetNearRouterSsid', error);
    },
  });
}

// Get status
function writeSendGetState(deviceId, serviceId, characteristicId, data) {
  console.log('writeSendGetState', deviceId, serviceId, characteristicId, data);
  sequenceControl = parseInt(sequenceControl) + 1;
  var frameControl = util.getFrameCTRLValue(
    self.data.isEncrypt,
    false,
    util.DIRECTION_OUTPUT,
    false,
    false
  );
  var value = util.writeData(
    self.data.PACKAGE_CONTROL_VALUE,
    util.SUBTYPE_GET_WIFI_STATUS,
    frameControl,
    sequenceControl,
    0,
    null
  );
  var typedArray = new Uint8Array(value);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {},
    fail: function (error) {
      console.log('writeSendGetState', error);
    },
  });
}

// Get version
function writeSendGetVersion(deviceId, serviceId, characteristicId, data) {
  console.log(
    'writeSendGetVersion',
    deviceId,
    serviceId,
    characteristicId,
    data
  );
  sequenceControl = parseInt(sequenceControl) + 1;
  var frameControl = util.getFrameCTRLValue(
    self.data.isEncrypt,
    false,
    util.DIRECTION_OUTPUT,
    false,
    false
  );
  var value = util.writeData(
    self.data.PACKAGE_CONTROL_VALUE,
    util.SUBTYPE_GET_VERSION,
    frameControl,
    sequenceControl,
    0,
    null
  );
  var typedArray = new Uint8Array(value);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {},
    fail: function (error) {
      console.log('writeSendGetVersion', error);
    },
  });
}

function writeRouterSsid(deviceId, serviceId, characteristicId, data) {
  console.log('writeRouterSsid', deviceId, serviceId, characteristicId, data);
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(
      data,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  } else {
    var ssidData = getCharCodeat(self.data.ssid);
    obj = util.isSubcontractor(
      ssidData,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  }
  var defaultData = util.encrypt(
    aesjs,
    self.data.md5Key,
    sequenceControl,
    obj.lenData,
    true
  );
  var value = util.writeData(
    util.PACKAGE_VALUE,
    util.SUBTYPE_SET_SSID,
    frameControl,
    sequenceControl,
    obj.len,
    defaultData
  );
  var typedArray = new Uint8Array(value);
  console.log('writeRouterSsid obj', obj, value, typedArray);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function () {
      if (obj.flag) {
        writeRouterSsid(deviceId, serviceId, characteristicId, obj.laveData);
      } else {
        writeDevicePwd(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (error) {
      //console.log(257);
      console.log('writeRouterSsid fail', error);
    },
  });
}

function writeDevicePwd(deviceId, serviceId, characteristicId, data) {
  console.log('writeDevicePwd', deviceId, serviceId, characteristicId, data);
  var obj = {},
    frameControl = 0;
  sequenceControl = parseInt(sequenceControl) + 1;
  if (!util._isEmpty(data)) {
    obj = util.isSubcontractor(
      data,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  } else {
    var pwdData = getCharCodeat(self.data.password);
    obj = util.isSubcontractor(
      pwdData,
      self.data.isChecksum,
      sequenceControl,
      self.data.isEncrypt
    );
    frameControl = util.getFrameCTRLValue(
      self.data.isEncrypt,
      self.data.isChecksum,
      util.DIRECTION_OUTPUT,
      false,
      obj.flag
    );
  }
  var defaultData = util.encrypt(
    aesjs,
    self.data.md5Key,
    sequenceControl,
    obj.lenData,
    true
  );
  var value = util.writeData(
    util.PACKAGE_VALUE,
    util.SUBTYPE_SET_PWD,
    frameControl,
    sequenceControl,
    obj.len,
    defaultData
  );
  var typedArray = new Uint8Array(value);
  console.log('writeDevicePwd obj', obj, value, typedArray);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function (res) {
      if (obj.flag) {
        writeDevicePwd(deviceId, serviceId, characteristicId, obj.laveData);
      } else {
        writeDeviceEnd(deviceId, serviceId, characteristicId, null);
      }
    },
    fail: function (error) {
      console.log('writeDevicePwd fail', error);
    },
  });
}

function writeDeviceEnd(deviceId, serviceId, characteristicId) {
  console.log('writeDeviceEnd', deviceId, serviceId, characteristicId);
  sequenceControl = parseInt(sequenceControl) + 1;
  var frameControl = util.getFrameCTRLValue(
    self.data.isEncrypt,
    false,
    util.DIRECTION_OUTPUT,
    false,
    false
  );
  var value = util.writeData(
    self.data.PACKAGE_CONTROL_VALUE,
    util.SUBTYPE_END,
    frameControl,
    sequenceControl,
    0,
    null
  );
  var typedArray = new Uint8Array(value);
  console.log('writeDeviceEnd obj', frameControl, value, typedArray);
  rn.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    value: Array.from(typedArray),
    success: function (res) {
      if (mDeviceEvent) {
        mDeviceEvent.notifyDeviceMsgEvent({
          type: mDeviceEvent.XBLUFI_TYPE.TYPE_CONNECT_ROUTER_SEND_END,
          result: false,
          data: {
            success: 1,
          },
        });
      }
    },
    fail: function (error) {
      console.log('writeDeviceEnd fail', error);
    },
  });
}

function init({}) {
  console.log('init');

  // mDeviceEvent = require('./xBlufi');
  // util = require('./util.js');
  crypto = require('./crypto/crypto-dh.js');
  md5 = require('./crypto/md5.min.js');
  aesjs = require('./crypto/aes.js');
  rn.onBLEConnectionStateChange(function (res) {
    console.log('onBLEConnectionStateChange', res);
    let obj = {
      type: mDeviceEvent.XBLUFI_TYPE.TYPE_STATUS_CONNECTED,
      result: res.connected,
      data: res,
    };
    mDeviceEvent.notifyDeviceMsgEvent(obj);
  });

  mDeviceEvent.listenStartDiscoverBle(true, function (options) {
    if (options.isStart) {
      // Step 1: check if Bluetooth adapter is available
      rn.onBluetoothAdapterStateChange(function (res) {
        console.log('onBluetoothAdapterStateChange', res);
        if (!res.available) {
        }
      });
  // Step 2: close and re-open adapter before scanning
      rn.closeBluetoothAdapter({
        complete: function (res) {
          console.log('closeBluetoothAdapter', res);
          rn.openBluetoothAdapter({
            success: function (res) {
              console.log('openBluetoothAdapter', res);
              rn.getBluetoothAdapterState({
                success: function (res) {
                  console.log('getBluetoothAdapterState', res);
                  rn.stopBluetoothDevicesDiscovery({
                    success: function (res) {
                      console.log('stopBluetoothDevicesDiscovery', res);
                      let devicesList = [];
                      let countsTimes = 0;
                      rn.onBluetoothDeviceFound(function (devices) {
                        console.log('onBluetoothDeviceFound', devices);
                        // Filter duplicate devices; support different API return formats
                        var isnotexist = true;
                        devices.deviceId = devices.id;
                        if (devices.deviceId) {
                          if (devices.advertisData) {
                            devices.advertisData = buf2hex(
                              devices.advertisData
                            );
                          } else {
                            devices.advertisData = '';
                          }
                          for (var i = 0; i < devicesList.length; i++) {
                            if (devices.deviceId === devicesList[i].deviceId) {
                              isnotexist = false;
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices);
                          }
                        } else if (devices.devices) {
                          if (devices.devices[0].advertisData) {
                            devices.devices[0].advertisData = buf2hex(
                              devices.devices[0].advertisData
                            );
                          } else {
                            devices.devices[0].advertisData = '';
                          }
                          for (var i = 0; i < devicesList.length; i++) {
                            if (
                              devices.devices[0].deviceId ==
                              devicesList[i].deviceId
                            ) {
                              isnotexist = false;
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices.devices[0]);
                          }
                        } else if (devices[0]) {
                          if (devices[0].advertisData) {
                            devices[0].advertisData = buf2hex(
                              devices[0].advertisData
                            );
                          } else {
                            devices[0].advertisData = '';
                          }
                          for (var i = 0; i < devicesList.length; i++) {
                            if (
                              devices[0].deviceId == devicesList[i].deviceId
                            ) {
                              isnotexist = false;
                            }
                          }
                          if (isnotexist) {
                            devicesList.push(devices[0]);
                          }
                        }

                        let obj = {
                          type: mDeviceEvent.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS,
                          result: true,
                          data: devicesList,
                        };
                        mDeviceEvent.notifyDeviceMsgEvent(obj);
                      });
                      rn.startBluetoothDevicesDiscovery({
                        options: options.options || {},
                        timeout: options.timeout || timeOut,
                        serviceUUIDs: options.serviceUUIDs || [],
                        allowDuplicatesKey: true,
                        success: function () {
                          console.log('startBluetoothDevicesDiscovery');
                          let obj = {
                            type: mDeviceEvent.XBLUFI_TYPE
                              .TYPE_GET_DEVICE_LISTS_START,
                            result: true,
                            data: res,
                          };
                          mDeviceEvent.notifyDeviceMsgEvent(obj);
                          //Start scanning, clear list
                          devicesList.length = 0;
                        },
                        fail: function (res) {
                          let obj = {
                            type: mDeviceEvent.XBLUFI_TYPE
                              .TYPE_GET_DEVICE_LISTS_START,
                            result: false,
                            data: res,
                          };
                          mDeviceEvent.notifyDeviceMsgEvent(obj);
                        },
                      });
                    },
                    fail: function (res) {
                      let obj = {
                        type: mDeviceEvent.XBLUFI_TYPE
                          .TYPE_GET_DEVICE_LISTS_START,
                        result: false,
                        data: res,
                      };
                      mDeviceEvent.notifyDeviceMsgEvent(obj);
                    },
                  });
                },
                fail: function (res) {
                  let obj = {
                    type: mDeviceEvent.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                    result: false,
                    data: res,
                  };
                  mDeviceEvent.notifyDeviceMsgEvent(obj);
                },
              });
            },
            fail: function (res) {
              let obj = {
                type: mDeviceEvent.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START,
                result: false,
                data: res,
              };
              mDeviceEvent.notifyDeviceMsgEvent(obj);
            },
          });
        },
      });
    } else {
      rn.stopBluetoothDevicesDiscovery({
        success: function (res) {
          clearInterval(tempTimer);
          let obj = {
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP,
            result: true,
            data: res,
          };
          mDeviceEvent.notifyDeviceMsgEvent(obj);
        },
        fail: function (res) {
          let obj = {
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP,
            result: false,
            data: res,
          };
          mDeviceEvent.notifyDeviceMsgEvent(obj);
        },
      });
    }
  });

  mDeviceEvent.listenConnectBle(true, function (options) {
    //console.log("Am I connecting?", (options.isStart))

    if (options.isStart)
      rn.createBLEConnection({
        deviceId: options.deviceId,
        success: function (res) {
          rn.setBLEMTU({
            deviceId: options.deviceId,
            mtu: 128,
          });
          self.data.deviceId = options.deviceId;
          mDeviceEvent.notifyDeviceMsgEvent({
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_CONNECTED,
            result: true,
            data: {
              deviceId: options.deviceId,
              name: options.name,
            },
          });
        },
        fail: function (res) {
          self.data.deviceId = null;
          mDeviceEvent.notifyDeviceMsgEvent({
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_CONNECTED,
            result: false,
            data: res,
          });
        },
      });
    else
      rn.closeBLEConnection({
        deviceId: options.deviceId,
        success: function (res) {
          console.log('Disconnected successfully');
          self.data.deviceId = null;
          mDeviceEvent.notifyDeviceMsgEvent({
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_CLOSE_CONNECTED,
            result: true,
            data: {
              deviceId: options.deviceId,
              name: options.name,
            },
          });
        },
        fail: function (res) {
          self.data.deviceId = null;
          mDeviceEvent.notifyDeviceMsgEvent({
            type: mDeviceEvent.XBLUFI_TYPE.TYPE_CLOSE_CONNECTED,
            result: false,
            data: res,
          });
        },
      });
  });

  mDeviceEvent.listenInitBleEsp32(true, function (options) {
    sequenceControl = 0;
    sequenceNumber = -1;
    self = null;
    self = {
      data: {
        isConnected: false,
        failure: false,
        value: 0,
        desc: 'Please wait patiently...',
        isChecksum: true,
        isEncrypt: true,
        flagEnd: false,
        defaultData: 1,
        ssidType: 2,
        passwordType: 3,
        meshIdType: 3,
        deviceId: '',
        ssid: '',
        uuid: '',
        serviceId: '',
        password: '',
        meshId: '',
        processList: [],
        result: [],
        service_uuid: '0000FFFF-0000-1000-8000-00805F9B34FB',
        characteristic_write_uuid: '0000FF01-0000-1000-8000-00805F9B34FB',
        characteristic_notify_uuid: '0000FF02-0000-1000-8000-00805F9B34FB',
        customData: null,
        md5Key: 0,
      },
    };
    let deviceId = options.deviceId;
    self.data.deviceId = options.deviceId;
    rn.getBLEDeviceServices({
      // The deviceId here needs to have already established a connection with the corresponding device through createBLEConnection
      deviceId: deviceId,
      success: function (res) {
        var services = res.services;
        console.log('Successfully retrieved services', res, services);
        if (services.length > 0) {
          for (var i = 0; i < services.length; i++) {
            if (
              self.data.service_uuid
                .toLowerCase()
                .indexOf(services[i].uuid.toLowerCase()) != -1
            ) {
              var serviceId = services[i].uuid;
              var list = res.characteristics;
              console.log('Successfully retrieved characteristics', list);
              if (list.length > 0) {
                for (var i = 0; i < list.length; i++) {
                  var uuid = list[i].characteristic;
                  if (
                    self.data.characteristic_notify_uuid
                      .toLowerCase()
                      .indexOf(uuid.toLowerCase()) != -1
                  ) {
                    self.data.serviceId = serviceId;
                    self.data.uuid = uuid;
                    console.log('Successfully retrieved notify characteristic', uuid);
                    rn.notifyBLECharacteristicValueChange({
                      state: true, // Enable notify function
                      deviceId: deviceId,
                      serviceId: serviceId,
                      characteristicId: uuid,
                      success: function () {
                        console.log('Notify enabled successfully');
                        let characteristicId =
                          self.data.characteristic_write_uuid;
                        // Notify device interaction mode (encryption) start
                        client = util.blueDH(util.DH_P, util.DH_G, crypto);

                        var kBytes = util.uint8ArrayToArray(
                          client.getPublicKey()
                        );
                        var pBytes = util.hexByInt(util.DH_P);
                        var gBytes = util.hexByInt(util.DH_G);
                        var pgkLength =
                          pBytes.length + gBytes.length + kBytes.length + 6;
                        var pgkLen1 = (pgkLength >> 8) & 0xff;
                        var pgkLen2 = pgkLength & 0xff;
                        var data = [];
                        data.push(util.NEG_SET_SEC_TOTAL_LEN);
                        data.push(pgkLen1);
                        data.push(pgkLen2);
                        var frameControl = util.getFrameCTRLValue(
                          false,
                          false,
                          util.DIRECTION_OUTPUT,
                          false,
                          false
                        );
                        var value = util.writeData(
                          util.PACKAGE_VALUE,
                          util.SUBTYPE_NEG,
                          frameControl,
                          sequenceControl,
                          data.length,
                          data
                        );
                        var typedArray = new Uint8Array(value);
                        rn.writeBLECharacteristicValue({
                          deviceId: deviceId,
                          serviceId: serviceId,
                          characteristicId: characteristicId,
                          value: Array.from(typedArray),
                          success: function () {
                            console.log(
                              'initEsp32 writeBLECharacteristicValue'
                            );
                            getSecret(
                              deviceId,
                              serviceId,
                              characteristicId,
                              client,
                              kBytes,
                              pBytes,
                              gBytes,
                              null
                            );
                          },
                          fail: function (error) {
                            let obj = {
                              type: mDeviceEvent.XBLUFI_TYPE
                                .TYPE_INIT_ESP32_RESULT,
                              result: false,
                              data: error,
                            };
                            console.log(
                              'initEsp32 writeBLECharacteristicValue error:',
                              error,
                              obj
                            );
                            mDeviceEvent.notifyDeviceMsgEvent(obj);
                          },
                        });
                        // Notify device interaction mode (encryption) end
                        rn.onBLECharacteristicValueChange(function (res) {
                          let list2 = util.ab2hex(res.value);
                          // start
                          let result = self.data.result;
                          if (list2.length < 4) {
                            console.log(407);
                            return false;
                          }
                          var val = parseInt(list2[0], 16);
                          var type = val & 3;
                          var subType = val >> 2;
                          var dataLength = parseInt(list2[3], 16);
                          if (dataLength == 0) {
                            return false;
                          }
                          var fragNum = util.hexToBinArray(list2[1]);
                          list2 = isEncrypt(fragNum, list2, self.data.md5Key);
                          result = result.concat(list2);
                          self.data.result = result;
                          if (self.data.flagEnd) {
                            self.data.flagEnd = false;
                            let xscustomData = [];
                            for (var i = 0; i <= result.length; i++) {
                              xscustomData.push(
                                String.fromCharCode(parseInt(result[i], 16))
                              );
                            }
                            console.log(
                              'recieve data type subType: ',
                              type,
                              subType,
                              result,
                              list2,
                              xscustomData.join('')
                            );
                            if (type == 1) {
                              let what = [];
                              switch (subType) {
                                case 15: // 0xf (b’001111) Wi-Fi connection status: Notifies the phone of the ESP32's Wi-Fi status, including STA and SoftAP status (When the phone queries the Wi-Fi status, other data frames can be replied in addition to this frame.)
                                  let scene = '';
                                  if (
                                    result.length == 3 ||
                                    result.length == 6
                                  ) {
                                    // Other connection data
                                    scene = 'get'; // Get configuration
                                  } else {
                                    scene = 'set'; // Set configuration
                                    // Connection result
                                    for (var i = 0; i <= result.length; i++) {
                                      var num = parseInt(result[i], 16) + '';
                                      if (i > 12)
                                        what.push(
                                          String.fromCharCode(
                                            parseInt(result[i], 16)
                                          )
                                        );
                                    }
                                  }
                                  if (result?.[1] == '00') {
                                    // wifi connection successful
                                    mDeviceEvent.notifyDeviceMsgEvent({
                                      type: mDeviceEvent.XBLUFI_TYPE
                                        .TYPE_CONNECT_ROUTER_RESULT,
                                      result: true,
                                      data: {
                                        progress: 100,
                                        scene,
                                        ssid: what.join(''),
                                        code1: result?.[1],
                                        success: true,
                                        msg: 'wifi connection successful',
                                      },
                                    });
                                  } else {
                                    // wifi connection failed
                                    mDeviceEvent.notifyDeviceMsgEvent({
                                      type: mDeviceEvent.XBLUFI_TYPE
                                        .TYPE_CONNECT_ROUTER_RESULT,
                                      result: false,
                                      data: {
                                        progress: 0,
                                        scene,
                                        ssid: what.join(''),
                                        code1: result?.[1],
                                        success: false,
                                        msg: 'wifi connection failed',
                                      },
                                    });
                                  }
                                  break;
                                case 19: // 0x13 (b’010011) User sends or receives custom data.
                                  let customData = [];
                                  for (var i = 0; i <= result.length; i++) {
                                    customData.push(
                                      String.fromCharCode(
                                        parseInt(result[i], 16)
                                      )
                                    );
                                  }
                                  let obj = {
                                    type: mDeviceEvent.XBLUFI_TYPE
                                      .TYPE_RECIEVE_CUSTON_DATA,
                                    result: true,
                                    data: customData.join(''),
                                  };
                                  mDeviceEvent.notifyDeviceMsgEvent(obj);

                                  break;
                                case util.SUBTYPE_NEGOTIATION_NEG: // 0x0 (b’000000) Used to send negotiation data, transmitted to the callback function registered at the application layer.
                                  var arr = util.hexByInt(result.join(''));
                                  var clientSecret = client.computeSecret(
                                    new Uint8Array(arr)
                                  );
                                  var md5Key = md5.array(clientSecret);
                                  self.data.md5Key = md5Key;
                                  console.log(
                                    'SUBTYPE_NEGOTIATION_NEG clientSecret: ',
                                    clientSecret,
                                    md5Key
                                  );
                                  mDeviceEvent.notifyDeviceMsgEvent({
                                    type: mDeviceEvent.XBLUFI_TYPE
                                      .TYPE_INIT_ESP32_RESULT,
                                    result: true,
                                    data: {
                                      deviceId,
                                      serviceId,
                                      characteristicId,
                                    },
                                  });
                                  break;
                                // case 15: // 0xf (b'001111) wifi connection status - Notifies the phone of ESP32's Wi-Fi status, including STA status and SoftAP status (when receiving a phone inquiry about Wi-Fi status, in addition to replying with this frame, other data frames can also be replied.)
                                //   let scustomData = [];
                                //   for (var i = 0; i <= result.length; i++) {
                                //     scustomData.push(
                                //       String.fromCharCode(
                                //         parseInt(result[i], 16)
                                //       )
                                //     );
                                //   }
                                //   console.log('Network connection successful 15x2 :', scustomData.join(''));
                                //   mDeviceEvent.notifyDeviceMsgEvent({
                                //     type: mDeviceEvent.XBLUFI_TYPE
                                //       .TYPE_GET_DEVICE_STATE,
                                //     result: true,
                                //     data: scustomData.join(''),
                                //   });
                                //   break;
                                case 16: // 0x10 b’010000 Version
                                  let xcustomData = [];
                                  for (var i = 0; i <= result.length; i++) {
                                    xcustomData.push(
                                      String.fromCharCode(
                                        parseInt(result[i], 16)
                                      )
                                    );
                                  }
                                  mDeviceEvent.notifyDeviceMsgEvent({
                                    type: mDeviceEvent.XBLUFI_TYPE
                                      .TYPE_GET_DEVICE_VERSION,
                                    result: true,
                                    data: xcustomData.join(''),
                                  });
                                  break;
                                case 17: // 0x11 (b’010001) Notifies the phone of the list of Wi-Fi hotspots around the ESP32.
                                  getList(result, result.length, 0);
                                  break;
                                case 18: // 0x12 (b’010010) Notifies the phone that an exception has occurred in the BluFi process.
                                  console.log(
                                    'Report error. 18 :',
                                    util.failList[parseInt(result?.[0])]
                                  );
                                  break;
                                default:
                                  console.log(
                                    '468: type=1',
                                    `subType=${subType}`,
                                    result
                                  );
                                  //self.setFailProcess(true, util.descFailList[4])
                                  break;
                              }
                              self.data.result = [];
                            } else if (type == 0) {
                              let what = [];
                              let xscustomData = [];
                              for (var i = 0; i <= result.length; i++) {
                                xscustomData.push(
                                  String.fromCharCode(parseInt(result[i], 16))
                                );
                              }
                              console.log(
                                'recieve xscustomData :',
                                subType,
                                xscustomData.join('')
                              );
                              switch (subType) {
                                default:
                                  console.log(
                                    '466: type=0',
                                    `subType=${subType}`,
                                    result
                                  );
                                  break;
                              }
                            } else {
                              //console.log(472);
                              console.log(
                                'Connection failed 472:',
                                util.failList[parseInt(result?.[0])]
                              );
                              console.log(
                                'Report error. 472 :',
                                util.failList[parseInt(result?.[0])]
                              );
                            }
                          }
                          // end
                        });
                      },
                      fail: function (res) {
                        console.log(
                          'fail notifyBLECharacteristicValueChange:',
                          res
                        );
                        let obj = {
                          type: mDeviceEvent.XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
                          result: false,
                          data: res,
                        };
                        mDeviceEvent.notifyDeviceMsgEvent(obj);
                      },
                    });
                  }
                }
              }
              break;
            }
          }
        }
      },
      fail: function (res) {
        let obj = {
          type: mDeviceEvent.XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT,
          result: false,
          data: res,
        };
        mDeviceEvent.notifyDeviceMsgEvent(obj);
        console.log('fail getBLEDeviceServices:' + JSON.stringify(res));
      },
    });
  });

  mDeviceEvent.listenSendRouterSsidAndPassword(true, function (options) {
    self.data.password = options.password;
    self.data.ssid = options.ssid;
    console.log('sendRouterSsid: ', options.ssid, options.password);
    writeDeviceRouterInfoStart(
      self.data.deviceId,
      self.data.service_uuid,
      self.data.characteristic_write_uuid,
      null
    );
  });

  mDeviceEvent.listenSendCustomData(true, function (options) {
    self.data.customData = options.customData;
    console.log('customData: ', options.customData);
    writeCutomsData(
      self.data.deviceId,
      self.data.service_uuid,
      self.data.characteristic_write_uuid,
      null
    );
  });

  mDeviceEvent.listenSendGetNearRouterSsid(true, function (options) {
    console.log('getNearRouterSsid: ', options);
    writeGetNearRouterSsid(
      self.data.deviceId,
      self.data.service_uuid,
      self.data.characteristic_write_uuid,
      null
    );
  });

  // Listen for get version
  mDeviceEvent.listenSendGetVersion(true, function (options) {
    console.log('getVersion: ', options);
    writeSendGetVersion(
      self.data.deviceId,
      self.data.service_uuid,
      self.data.characteristic_write_uuid,
      null
    );
  });
  // Listen for get state
  mDeviceEvent.listenSendGetState(true, function (options) {
    console.log('getState: ', options);
    writeSendGetState(
      self.data.deviceId,
      self.data.service_uuid,
      self.data.characteristic_write_uuid,
      null
    );
  });
}

function getList(arr, totalLength, curLength) {
  // console.log(totalLength)
  // console.log(arr)
  var self = this;
  if (arr.length > 0) {
    var len = parseInt(arr[0], 16);
    curLength += 1 + len;
    if (len > 0 && curLength < totalLength) {
      var rssi = 0,
        name = '';
      let list = [];
      for (var i = 1; i <= len; i++) {
        if (i == 1) {
          rssi = parseInt(arr[i], 16);
        } else {
          list.push(parseInt(arr[i], 16));
        }
      }
      name = decodeURIComponent(escape(String.fromCharCode(...list)));
      let obj = {
        type: mDeviceEvent.XBLUFI_TYPE.TYPE_CONNECT_NEAR_ROUTER_LISTS,
        result: true,
        data: { rssi: rssi, SSID: name },
      };
      mDeviceEvent.notifyDeviceMsgEvent(obj);
      arr = arr.splice(len + 1);
      getList(arr, totalLength, curLength);
    }
  }
}

/****************************** Public API ***************************************/
module.exports = {
  init: init,
};
