# @kafudev/react-native-esp-blufi Library User Manual

## Installation

Install the library using npm or yarn:

```shell
npm install @kafudev/react-native-esp-blufi
```

Or

```shell
yarn add @kafudev/react-native-esp-blufi
```

In addition, this library depends on another library called `react-native-ble-manager` to provide Bluetooth functionality. Please install it using the following command:

```shell
npm install react-native-ble-manager
```

Or

```shell
yarn add react-native-ble-manager
```

## Usage

Import the necessary components from `react` and `react-native`, as well as the library itself:

```jsx
import React, { useEffect, useState } from 'react';
import { View, Button, Text, ScrollView, TextInput } from 'react-native';
import xBlufi from '@kafudev/react-native-esp-blufi';
```

Create a functional component to implement your application:

```jsx
const App = () => {
  // Define your state variables here
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  // ...

  // Use the useEffect hook to initialize the library and listen for device messages
  useEffect(() => {
    xBlufi.initXBlufi(2);
    console.log('xBlufi', xBlufi.XMQTT_SYSTEM);
    xBlufi.listenDeviceMsgEvent(true, funListenDeviceMsgEvent);

    return () => {
      xBlufi.listenDeviceMsgEvent(false, funListenDeviceMsgEvent);
    };
  }, []);

  // Define event handler functions here
  const search = async () => {
    // ...
  };

  const connect = async (deviceId: string) => {
    // ...
  };

  const disconnect = (_deviceId?: string) => {
    // ...
  };

  const funListenDeviceMsgEvent = (options: {
    type: any;
    result: any;
    data: any;
  }) => {
    // ...
  };

  // Define other application logic functions here
  function initEsp32(): void {
    // ...
  }

  // Get version
  function getVersion(): void {
    // ...
  }

  // Get state
  function getState(): void {
    // ...
  }

  function scanNetworks(): void {
    // ...
  }

  function sendWifiConfig(ssid: string, password: string): void {
    // ...
  }

  function provCustom(): void {
    // ...
  }

  function provCustomWithByteData(): void {
    // ...
  }

  // Render UI components and bind event handlers
  return (
    <ScrollView style={{ flex: 1, padding: 10, alignContent: 'center' }}>
      {/* Write your UI components and event handlers here */}
    </ScrollView>
  );
};

export default App;
```

Note: Please replace the commented sections in the above code with your own logic and UI components.

To fully understand the purpose and usage of each function, please refer to the inline comments in the provided code examples.

## API

The following are the available APIs for the @kafudev/react-native-esp-blufi library:

| Method Name                            | Description                                                      |
| -------------------------------------- | ---------------------------------------------------------------- |
| `initXBlufi(num: number)`              | Initialize xBlufi, parameter is a number, 0=ReactNative         |
| `listenDeviceMsgEvent(...)`            | Listen for device message events                                 |
| `notifyStartDiscoverBle(...)`          | Notify to start or stop Bluetooth device discovery               |
| `notifyConnectBle(...)`                | Notify to connect or disconnect Bluetooth device                 |
| `notifyInitBleEsp32(...)`              | Notify to initialize Bluetooth device ESP32                      |
| `notifySendGetNearRouterSsid(...)`     | Notify to send command to get nearby router SSID                 |
| `notifySendRouterSsidAndPassword(...)` | Notify to send WiFi configuration (SSID and password)            |
| `notifySendCustomData(...)`            | Notify to send custom data to device                             |

Please refer to the library's documentation as needed and use the appropriate APIs to implement your application requirements.


## Notes

Please note that before using any Bluetooth functionality, you need to call `BleManager.start()` to initialize `react-native-ble-manager`.

Thank you for the information! The following are the usage instructions for the @kafudev/react-native-esp-blufi library based on the `https://github.com/xuhongv/BlufiEsp32WeChat` open source project.

## Acknowledgments

Special thanks to the `https://github.com/xuhongv/BlufiEsp32WeChat` open source project, which provided inspiration and reference for the @kafudev/react-native-esp-blufi library.

When writing your own application, you can refer to the related logic and functionality of `https://github.com/xuhongv/BlufiEsp32WeChat` and modify and adjust as needed.
