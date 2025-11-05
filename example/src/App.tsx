import React, {useEffect, useState} from 'react';
import {
  View,
  Button,
  Text,
  ScrollView,
  TextInput,
  PermissionsAndroid,
} from 'react-native';
// import xBlufi from '@kafudev/react-native-esp-blufi';
import xBlufi from '../../src/blufi/xBlufi';

const App = () => {
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [ssidList, setSsidList] = useState<any[]>([]);
  const [ssid, setSsid] = useState('abc');
  const [password, setPassword] = useState('12345678');
  const [showOnlyRLC, setShowOnlyRLC] = useState(true);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize
  const init = async () => {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
    );
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
    );
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
    );
    xBlufi.initXBlufi(0, {});
    console.log('xBlufi', xBlufi.XMQTT_SYSTEM);
    xBlufi.listenDeviceMsgEvent(true, funListenDeviceMsgEvent);
    return () => {
      xBlufi.listenDeviceMsgEvent(false, funListenDeviceMsgEvent);
    };
  };

  const search = async () => {
    if (searching) {
      xBlufi.notifyStartDiscoverBle({
        isStart: false,
      });
    } else {
      xBlufi.notifyStartDiscoverBle({
        isStart: true,
      });
    }
  };

  const connect = async (deviceId: string) => {
    // Stop searching
    xBlufi.notifyStartDiscoverBle({
      isStart: false,
    });
    for (var i = 0; i < devicesList.length; i++) {
      if (deviceId === devicesList[i].deviceId) {
        const _name = devicesList[i].name;
        console.log(
          'Clicked, Bluetooth preparing to connect deviceId: ' + deviceId,
        );
        setDeviceId(deviceId);
        xBlufi.notifyConnectBle({
          isStart: true,
          deviceId: deviceId,
          _name,
        });
      }
    }
  };

  const disconnect = (_deviceId?: string) => {
    xBlufi.notifyConnectBle({
      isStart: false,
      deviceId: _deviceId || deviceId || '90:38:0C:5C:72:36',
    });
  };

  const funListenDeviceMsgEvent = (options: {
    type: any;
    result: any;
    data: any;
  }) => {
    console.log(
      'WORKING: funListenDeviceMsgEvent',
      options.type,
      options.result,
    );
    console.log('WORKING: Full event data:', JSON.stringify(options));
    switch (options.type) {
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS:
        console.log('Get device list: ', options.result);
        if (options.result) {
          setDevicesList(options.data as any[]);
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECTED:
        console.log('Active connection callback: ' + JSON.stringify(options));
        if (options.result) {
          setName(options.data.name);
          setDeviceId(options.data.deviceId);
        } else {
          // wx.hideLoading()
          // wx.showModal({
          //   title: 'Notification',
          //   content: 'Connection failed',
          //   showCancel: false
          // });
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_STATUS_CONNECTED: // Device connection status callback
        console.log(
          'Device connection status callback: ' + JSON.stringify(options),
        );
        // if (!options.result) {
        //   setName('');
        //   setDeviceId('');
        //   console.log('Device connection status callback: ', 'Mini program and device abnormally disconnected ');
        // }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CLOSE_CONNECTED: // Device connection status callback
        console.log(
          'Active close connection callback: ' + JSON.stringify(options),
        );
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START:
        if (!options.result) {
          console.log('Bluetooth not enabled fail =>', options);
        } else {
          console.log('Bluetooth search started');
          // Bluetooth search started
          setSearching(true);
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP:
        if (options.result) {
          // Bluetooth stop search ok
          console.log('Bluetooth stop search ok');
        } else {
          // Bluetooth stop search failed
          console.log('Bluetooth stop search failed');
        }
        setSearching(false);
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT:
        console.log(
          'Network configuration result: ',
          options.result,
          options.data.progress,
        );
        if (!options.result) {
          console.log(
            'Network configuration result: ',
            'Configuration failed, please retry',
          );
        } else {
          if (options.data.progress == 100) {
            let ssid = options.data.ssid;
            console.log(
              'Network configuration result: ',
              `Successfully connected to router [${ssid}]`,
            );
          }
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_RECIEVE_CUSTON_DATA:
        console.log('Received custom data from device: ', options.data);
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECT_NEAR_ROUTER_LISTS:
        console.log('Network discovered', options.data.SSID);
        if (options.data.SSID === '') {
          break;
        }
        setSsidList(ssidList => {
          // Remove duplicates
          for (let i = 0; i < ssidList.length; i++) {
            if (ssidList[i].SSID === options.data.SSID) {
              return ssidList;
            }
          }
          return [...ssidList, options.data];
        });
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT:
        console.log('Initialization result: ', JSON.stringify(options));
        if (options.result) {
          console.log('Initialization successful');
        } else {
          console.log('Initialization failed');
        }
        break;
    }
  };

  // Initialize ESP32
  function initEsp32(): void {
    console.log('initEsp32', deviceId);
    xBlufi.notifyInitBleEsp32({
      deviceId: deviceId,
    });
  }

  // Scan networks
  function scanNetworks(): void {
    setSsidList([]);
    console.log('WORKING: scanNetworks called');
    console.log(
      'WORKING: xBlufi.notifySendGetNearRouterSsid:',
      typeof xBlufi.notifySendGetNearRouterSsid,
    );

    if (typeof xBlufi.notifySendGetNearRouterSsid === 'function') {
      console.log('WORKING: Calling notifySendGetNearRouterSsid...');
      xBlufi.notifySendGetNearRouterSsid();
      console.log('WORKING: notifySendGetNearRouterSsid called successfully');
    } else {
      console.error(
        'WORKING: notifySendGetNearRouterSsid is not a function:',
        xBlufi.notifySendGetNearRouterSsid,
      );
    }
  }

  // Send WiFi configuration
  function sendWifiConfig(ssid: string, password: string): void {
    console.log('Sending WiFi config:', ssid, password);
    xBlufi.notifySendRouterSsidAndPassword({
      ssid: ssid,
      password: password,
    });
  }

  // Filter devices to show only RLC devices if enabled
  const getFilteredDevices = () => {
    if (!showOnlyRLC) {
      return devicesList;
    }

    return devicesList.filter(device => {
      if (!device?.name) {
        return false;
      }

      // Check if device name contains "RLC"
      const nameContainsRLC = device.name.toLowerCase().includes('rlc');

      // Check if device ID/MAC contains RLC patterns (starts with certain MAC prefixes)
      const hasRLCMacPattern =
        device.deviceId &&
        (device.deviceId.toLowerCase().startsWith('90:38:0c') || // Common RLC MAC prefix
          device.deviceId.toLowerCase().startsWith('a0:20:a6')); // Another common RLC MAC prefix

      return nameContainsRLC || hasRLCMacPattern;
    });
  };

  // Get device display info (MAC address from deviceId and RSSI)
  const getDeviceDisplayInfo = (device: any) => {
    const macAddress = device.deviceId || 'Unknown MAC';
    const rssi = device.rssi || device.RSSI || 'Unknown RSSI';
    return {macAddress, rssi};
  };

  function provCustom(): void {
    xBlufi.notifySendCustomData({
      deviceId: deviceId,
      data: 'hello',
    });
  }

  function provCustomWithByteData(): void {
    xBlufi.notifySendCustomData({
      deviceId: deviceId,
      data: [0x01, 0x02, 0x03].toString(),
    });
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 10,
        alignContent: 'center',
      }}>
      <Button title="Scan Devices" onPress={search} />

      {/* RLC Filter Toggle */}
      <View style={{marginVertical: 10}}>
        <Button
          title={showOnlyRLC ? 'Show All Devices' : 'Show Only RLC Devices'}
          onPress={() => setShowOnlyRLC(!showOnlyRLC)}
        />
        <Text
          style={{
            color: 'gray',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 5,
          }}>
          {showOnlyRLC
            ? 'Filtering for RLC devices only'
            : 'Showing all devices'}
        </Text>
      </View>

      {/* Loop through and display filtered device list */}
      {getFilteredDevices().map((item, index) => {
        if (!item?.name) {
          return null;
        }
        const {macAddress, rssi} = getDeviceDisplayInfo(item);
        return (
          <View
            key={item?.deviceId + index}
            style={{
              marginVertical: 5,
              padding: 10,
              backgroundColor: '#f5f5f5',
            }}>
            <Text style={{color: 'black', fontWeight: 'bold'}}>
              {item?.name}
            </Text>
            <Text style={{color: 'gray', fontSize: 12}}>MAC: {macAddress}</Text>
            <Text style={{color: 'gray', fontSize: 12}}>RSSI: {rssi}</Text>
            <Button title="Connect" onPress={() => connect(item?.deviceId)} />
          </View>
        );
      })}
      <View style={{height: 40}} />
      <Text style={{color: 'black', textAlign: 'left'}}>
        Device name: {name}
      </Text>
      <Button
        title="Disconnect to Device"
        onPress={() => {
          disconnect();
        }}
      />
      <View style={{height: 40}} />
      <Button title="Init Esp32" onPress={initEsp32} />
      <Button title="Scan Networks" onPress={scanNetworks} />
      {/* Loop through and display SSID list */}
      {ssidList.map((item, index) => {
        if (!item?.SSID) {
          return null;
        }
        return (
          <View key={item?.SSID + index}>
            <Text style={{color: 'black', textAlign: 'left'}}>
              SSID: {item?.SSID}
            </Text>
            <Button title="Set SSID" onPress={() => setSsid(item?.SSID)} />
          </View>
        );
      })}
      <TextInput value={ssid} placeholder="ssid" onChangeText={setSsid} />
      <TextInput
        value={password}
        placeholder="password"
        onChangeText={setPassword}
      />
      <Button
        title="Send WiFi Config"
        onPress={() => {
          sendWifiConfig(ssid, password);
        }}
      />
      <Button title="Send Custom Data" onPress={provCustom} />
      <Button
        title="Send Custom Data with Byte Information"
        onPress={provCustomWithByteData}
      />
    </ScrollView>
  );
};

export default App;
