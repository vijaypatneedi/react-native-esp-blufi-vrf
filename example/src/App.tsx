import React, {useEffect, useState} from 'react';
import {
  View,
  Button,
  Text,
  ScrollView,
  TextInput,
  PermissionsAndroid,
  Alert,
  Platform,
  Linking,
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
  const [deviceInfo, setDeviceInfo] = useState<{Name?: string; SN?: string; version?: string; wifiBand?: string}>({});
  const [bluetoothReady, setBluetoothReady] = useState(false);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初始化
  const init = async () => {
    console.log('Initializing app on platform:', Platform.OS);

    // Request permissions only on Android
    if (Platform.OS === 'android') {
      try {
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
        );
        const scanGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
        );
        const connectGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
        );
        console.log('Android permissions:', {locationGranted, scanGranted, connectGranted});
      } catch (err) {
        console.warn('Permission error:', err);
      }
    } else if (Platform.OS === 'ios') {
      console.log('iOS: Permissions are handled in Info.plist');
      console.log('Please ensure Location Services are enabled in Settings > Privacy > Location Services');
      console.log('And Bluetooth permission is granted in Settings > [App Name] > Location');
    }
    // iOS permissions are handled in Info.plist

    xBlufi.initXBlufi(0, {});
    console.log('xBlufi', xBlufi.XMQTT_SYSTEM);
    xBlufi.listenDeviceMsgEvent(true, funListenDeviceMsgEvent);

    // On iOS, wait a bit for Bluetooth to fully initialize
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        console.log('iOS: Bluetooth should be ready now');
        setBluetoothReady(true);
      }, 1000);
    } else {
      setBluetoothReady(true);
    }

    return () => {
      xBlufi.listenDeviceMsgEvent(false, funListenDeviceMsgEvent);
    };
  };

  const search = async () => {
    console.log('Search button clicked, Platform:', Platform.OS);
    console.log('Current searching state:', searching);
    console.log('Bluetooth ready:', bluetoothReady);

    if (!bluetoothReady && Platform.OS === 'ios') {
      Alert.alert('Please Wait', 'Bluetooth is still initializing. Please wait a moment and try again.');
      return;
    }

    if (searching) {
      console.log('Stopping scan...');
      xBlufi.notifyStartDiscoverBle({
        isStart: false,
      });
    } else {
      console.log('Starting scan...');
      xBlufi.notifyStartDiscoverBle({
        isStart: true,
      });
    }
  };

  const connect = async (deviceId: string) => {
    //停止搜索
    xBlufi.notifyStartDiscoverBle({
      isStart: false,
    });
    for (var i = 0; i < devicesList.length; i++) {
      if (deviceId === devicesList[i].deviceId) {
        const _name = devicesList[i].name;
        console.log('点击了，蓝牙准备连接的deviceId:' + deviceId);
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
    console.log('funListenDeviceMsgEvent', options.type, options.result);
    switch (options.type) {
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS:
        console.log('获取设备列表：', options.result);
        console.log('设备数量：', options.data?.length || 0);
        if (options.result) {
          setDevicesList(options.data as any[]);
          console.log('设备列表已更新，设备数：', options.data?.length);
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECTED:
        console.log('主动连接回调：' + JSON.stringify(options));
        if (options.result) {
          setName(options.data.name);
          setDeviceId(options.data.deviceId);
        } else {
          // wx.hideLoading()
          // wx.showModal({
          //   title: '提示',
          //   content: '连接失败',
          //   showCancel: false
          // });
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_STATUS_CONNECTED: // 设备连接状态回调
        console.log('设备连接状态回调：' + JSON.stringify(options));
        // if (!options.result) {
        //   setName('');
        //   setDeviceId('');
        //   console.log('设备连接状态回调：', '小程序与设备异常断开 ');
        // }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CLOSE_CONNECTED: // 设备连接状态回调
        console.log('主动关闭连接回调：' + JSON.stringify(options));
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_START:
        if (!options.result) {
          console.log('蓝牙未开启 fail =》', options);
        } else {
          console.log('蓝牙开始搜索');
          //蓝牙搜索开始
          setSearching(true);
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS_STOP:
        if (options.result) {
          //蓝牙停止搜索ok
          console.log('蓝牙停止搜索ok');
        } else {
          //蓝牙停止搜索失败
          console.log('蓝牙停止搜索失败');
        }
        setSearching(false);
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT:
        console.log('配网结果：', options.result, options.data.progress);
        if (!options.result) {
          console.log('配网结果：', '配网失败，请重试');
        } else {
          if (options.data.progress == 100) {
            let ssid = options.data.ssid;
            console.log('配网结果：', `连接成功路由器【${ssid}】`);
          }
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_RECIEVE_CUSTON_DATA:
        console.log('收到设备发来的自定义数据结果：', options.data);
        console.log('Received custom data from device: ', options.data);
        // Try to parse as JSON to extract Name and SN
        try {
          if (options.data) {
            // Clean the string - remove trailing null characters and whitespace
            const cleanData = options.data.replace(/\u0000+$/, '').trim();
            console.log('Cleaned data:', cleanData);

            const responseData = JSON.parse(cleanData);
            if (responseData.Name || responseData.SN) {
              console.log('=== Wi-Fi Gateway Info ===');
              console.log('Name:', responseData.Name || name);
              console.log('Serial Number (SN):', responseData.SN || deviceId);
              console.log('WiFi Band:', responseData.WiFiBand || '2.4GHz');
              console.log('Full Response:', JSON.stringify(responseData, null, 2));

              setDeviceInfo(prev => ({
                ...prev,
                Name: responseData.Name || name,
                SN: responseData.SN || deviceId,
                wifiBand: responseData.WiFiBand || '2.4GHz',
              }));
              // You can now send this to your API
              // sendToAPI(responseData.Name, responseData.SN);
            }
          }
        } catch (e) {
          // If not JSON, just log the raw data
          console.error('Failed to parse custom data:', e);
          console.log('Raw data:', options.data);
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_CONNECT_NEAR_ROUTER_LISTS:
        console.log('发现网络', options.data.SSID);
        if (options.data.SSID === '') {
          break;
        }
        setSsidList(ssidList => {
          // 去重
          for (let i = 0; i < ssidList.length; i++) {
            if (ssidList[i].SSID === options.data.SSID) {
              return ssidList;
            }
          }
          return [...ssidList, options.data];
        });
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT:
        console.log('初始化结果：', JSON.stringify(options));
        if (options.result) {
          console.log('初始化成功');
        } else {
          console.log('初始化失败');
        }
        break;
      case xBlufi.XBLUFI_TYPE.TYPE_GET_DEVICE_VERSION:
        console.log('=== Device Version Info ===');
        console.log('Version:', options.data);
        setDeviceInfo(prev => ({...prev, version: options.data}));
        break;
    }
  };

  // 初始化esp32
  function initEsp32(): void {
    console.log('initEsp32', deviceId);
    xBlufi.notifyInitBleEsp32({
      deviceId: deviceId,
    });
  }

  // 扫描网络
  function scanNetworks(): void {
    setSsidList([]);
    console.log('scanNetworks');
    xBlufi.notifySendGetNearRouterSsid();
  }

  // 发送wifi配置
  function sendWifiConfig(ssid: string, password: string): void {
    console.log('sendWifiConfig', deviceId, ssid, password);
    if (!ssid) {
      return;
    }
    if (!password) {
      return;
    }
    xBlufi.notifySendRouterSsidAndPassword({
      deviceId: deviceId,
      ssid: ssid,
      password: password,
    });
  }

  function provCustom(): void {
    xBlufi.notifySendCustomData({
      deviceId: deviceId,
      customData: 'hello',
    });
  }

  function provCustomWithByteData(): void {
    xBlufi.notifySendCustomData({
      deviceId: deviceId,
      customData: [0x01, 0x02, 0x03].toString(),
    });
  }

  // Get device version
  function getDeviceVersion(): void {
    console.log('Getting device version...');
    xBlufi.notifySendGetVersion();
  }

  // Request device info (Name and SN) from device
  // Note: Your ESP32 firmware needs to be programmed to send this info
  function requestDeviceInfo(): void {
    console.log('Requesting device info (Name and SN)...');
    // Send the command that matches your production firmware
    const dataToSend = '{"Cmd": "get wifi inf"}';
    xBlufi.notifySendCustomData({
      deviceId: deviceId,
      customData: dataToSend,  // Use customData instead of data
    });
  }

  // Function to send device info to your API
  async function sendDeviceInfoToAPI(): Promise<void> {
    if (!deviceInfo.Name || !deviceInfo.SN) {
      console.log('Device info not available yet. Name:', deviceInfo.Name, 'SN:', deviceInfo.SN);
      Alert.alert('Error', 'Please get device info first');
      return;
    }

    console.log('=== Sending to API ===');
    console.log('Name:', deviceInfo.Name);
    console.log('SN:', deviceInfo.SN);

    try {
      // Example API call - replace with your actual API endpoint
      // const response = await fetch('https://your-api.com/device/check', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     Name: deviceInfo.Name,
      //     SN: deviceInfo.SN,
      //   }),
      // });
      // const result = await response.json();
      // console.log('API Response:', result);

      Alert.alert(
        'Device Info',
        `Ready to send:\nName: ${deviceInfo.Name}\nSN: ${deviceInfo.SN}`
      );
    } catch (error) {
      console.error('Error sending to API:', error);
    }
  }

  // Helper function to open iOS settings
  function openSettings(): void {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'iOS Permissions Required',
        'For Bluetooth scanning to work on iOS, you need to:\n\n1. Enable Location Services\n2. Grant Location permission to this app\n3. Grant Bluetooth permission\n\nOpen Settings now?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()}
        ]
      );
    } else {
      Alert.alert('Info', 'This is only needed for iOS devices');
    }
  }

  return (
      <ScrollView
      style={{
        flex: 1,
        padding: 10,
        alignContent: 'center',
      }}>
      {Platform.OS === 'ios' && (
        <View style={{marginBottom: 10, padding: 10, backgroundColor: '#fff3cd', borderRadius: 8}}>
          <Text style={{color: '#856404', marginBottom: 8}}>
            iOS Bluetooth requires Location permission
          </Text>
          <Button
            title="Open Settings"
            onPress={openSettings}
            color="#856404"
          />
        </View>
      )}
      <Button title="Scan Devices" onPress={search} />
      {/* Loop through and display device list */}
      {devicesList.map((item, index) => {
        // Show devices even without names, display MAC address instead
        const displayName = item?.name || `Device ${item?.deviceId || 'Unknown'}`;
        return (
          <View key={item?.deviceId + index} style={{marginVertical: 8, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8}}>
            <Text style={{color: 'black', fontWeight: 'bold'}}>
              {displayName}
            </Text>
            <Text style={{color: '#666', fontSize: 12}}>
              MAC: {item?.deviceId}
            </Text>
            <Text style={{color: '#666', fontSize: 12}}>
              RSSI: {item?.rssi || 'N/A'}
            </Text>
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
      {/* 循环显示ssid列表 */}
      <View style={{height: 20}} />

      {/* Device Info Section */}
      <View style={{backgroundColor: '#f0f0f0', padding: 10, marginVertical: 10}}>
        <Text style={{color: 'black', fontWeight: 'bold', fontSize: 16, marginBottom: 10}}>
          Device Information:
        </Text>
        {deviceInfo.Name && (
          <Text style={{color: 'black'}}>Name: {deviceInfo.Name}</Text>
        )}
        {deviceInfo.SN && (
          <Text style={{color: 'black'}}>Serial Number: {deviceInfo.SN}</Text>
        )}
        {deviceInfo.wifiBand && (
          <Text style={{color: 'black'}}>WiFi Band: {deviceInfo.wifiBand}</Text>
        )}
        {deviceInfo.version && (
          <Text style={{color: 'black'}}>Version: {deviceInfo.version}</Text>
        )}
        {!deviceInfo.Name && !deviceInfo.SN && !deviceInfo.version && !deviceInfo.wifiBand && (
          <Text style={{color: 'gray', fontStyle: 'italic'}}>
            No device info available yet
          </Text>
        )}
      </View>

      <Button title="Get Device Version" onPress={getDeviceVersion} />
      <Button title="Request Device Info (Name & SN)" onPress={requestDeviceInfo} />
      <Button
        title="Send Device Info to API"
        onPress={sendDeviceInfoToAPI}
        disabled={!deviceInfo.Name || !deviceInfo.SN}
      />
      <View style={{height: 20}} />

      {/* SSID List */}
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
