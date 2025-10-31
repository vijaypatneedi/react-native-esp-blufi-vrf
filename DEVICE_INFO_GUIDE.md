# Guide: Extracting Device Name and Serial Number

## Overview
This guide explains how to extract the Wi-Fi gateway's Name and Serial Number (SN) from your ESP32 device and send it to your cloud API.

## Changes Made

### 1. Updated Event Listener
Modified the `TYPE_RECIEVE_CUSTON_DATA` event handler in `example/src/App.tsx` to:
- Parse JSON responses from the device
- Extract `Name` and `SN` fields
- Log the information in a clear format
- Store the data in component state

### 2. Added Device Info State
```typescript
const [deviceInfo, setDeviceInfo] = useState<{Name?: string; SN?: string; version?: string}>({});
```

### 3. Added New Functions

#### `getDeviceVersion()`
- Requests the device version from the ESP32
- Uses the existing `notifySendGetVersion()` API
- Response is captured in `TYPE_GET_DEVICE_VERSION` event

#### `requestDeviceInfo()`
- Sends a custom command to request device information
- **Important**: Your ESP32 firmware must be programmed to respond to this command
- The command sent is `'GET_DEVICE_INFO'` - you can customize this

#### `sendDeviceInfoToAPI()`
- Prepares the device Name and SN for API submission
- Contains placeholder code for your actual API call
- Validates that both Name and SN are available before sending

### 4. Added UI Components
- Device information display panel showing Name, SN, and Version
- "Get Device Version" button
- "Request Device Info (Name & SN)" button
- "Send Device Info to API" button (disabled until info is available)

## How to Use

### Step 1: Connect to Device
1. Tap "Scan Devices"
2. Select your ESP32 device from the list
3. Tap "Connect"

### Step 2: Initialize ESP32
Tap "Init Esp32" to initialize the BluFi protocol

### Step 3: Get Device Information

#### Option A: If your device automatically sends info
- After initialization, your device might automatically send the device info
- Check the console logs for: `=== Wi-Fi Gateway Info ===`

#### Option B: Request device info manually
1. Tap "Request Device Info (Name & SN)"
2. This sends `'GET_DEVICE_INFO'` command to your device
3. Your ESP32 firmware must respond with JSON:
   ```json
   {"Name": "YourDeviceName", "SN": "YourSerialNumber"}
   ```

#### Option C: Get device version
1. Tap "Get Device Version"
2. This retrieves the firmware version from the device

### Step 4: View Device Information
The device information panel will display:
- **Name**: The device name
- **Serial Number**: The device SN
- **Version**: The firmware version

### Step 5: Send to API
1. Once Name and SN are available, the "Send Device Info to API" button becomes enabled
2. Tap the button to send the information to your cloud API
3. Currently shows an alert with the data - replace with actual API call

## API Integration

To integrate with your actual API, modify the `sendDeviceInfoToAPI()` function:

```typescript
async function sendDeviceInfoToAPI(): Promise<void> {
  if (!deviceInfo.Name || !deviceInfo.SN) {
    Alert.alert('Error', 'Please get device info first');
    return;
  }

  try {
    // Replace with your actual API endpoint
    const response = await fetch('https://your-api.com/device/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN', // if needed
      },
      body: JSON.stringify({
        Name: deviceInfo.Name,
        SN: deviceInfo.SN,
      }),
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (response.ok) {
      Alert.alert('Success', 'Device found in cloud!');
    } else {
      Alert.alert('Error', 'Device not found in cloud');
    }
  } catch (error) {
    console.error('Error sending to API:', error);
    Alert.alert('Error', 'Failed to connect to API');
  }
}
```

## ESP32 Firmware Requirements

Your ESP32 firmware needs to handle custom data requests and respond with the device information. Here's what you need to implement on the ESP32 side:

### When receiving custom data "GET_DEVICE_INFO":
```c
// Pseudo-code for ESP32
void handleCustomData(String data) {
  if (data == "GET_DEVICE_INFO") {
    String response = "{\"Name\":\"" + deviceName + "\",\"SN\":\"" + serialNumber + "\"}";
    blufi_send_custom_data(response);
  }
}
```

### Or send automatically after connection:
```c
void onBlufiConnected() {
  String deviceInfo = "{\"Name\":\"" + deviceName + "\",\"SN\":\"" + serialNumber + "\"}";
  blufi_send_custom_data(deviceInfo);
}
```

## Console Logs

When device info is received, you'll see logs like:
```
=== Wi-Fi Gateway Info ===
Name: MyGateway
Serial Number (SN): 1234567890
Full Response: {
  "Name": "MyGateway",
  "SN": "1234567890"
}
```

## Troubleshooting

### No device info received
1. Ensure your ESP32 is connected (device name should be displayed)
2. Make sure ESP32 is initialized ("Init Esp32" button)
3. Check if your ESP32 firmware sends device info
4. Try the "Request Device Info" button
5. Check console logs for any errors

### Device info format not recognized
- Ensure your ESP32 sends data in JSON format: `{"Name": "xxx", "SN": "xxx"}`
- Check console logs for the raw data received
- The data must be valid JSON with exact keys "Name" and "SN"

### API call fails
- Check your network connection
- Verify your API endpoint URL
- Ensure proper authentication headers
- Check CORS settings on your API server
- Review console logs for detailed error messages

## Testing

To test without ESP32 firmware changes, you can manually trigger the event:

```typescript
// In your App.tsx, temporarily add:
funListenDeviceMsgEvent({
  type: xBlufi.XBLUFI_TYPE.TYPE_RECIEVE_CUSTON_DATA,
  result: true,
  data: '{"Name":"TestGateway","SN":"TEST123456"}'
});
```

## Next Steps

1. Update your ESP32 firmware to send device information
2. Replace the API endpoint with your actual cloud API
3. Add error handling and retry logic as needed
4. Consider storing device info locally (AsyncStorage) for offline access
5. Add loading states while fetching data
