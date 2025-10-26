# React Native ESP BluFi - Complete Architecture Guide

## Table of Contents
- [Overview](#overview)
- [Architecture Layers](#architecture-layers)
- [Security & Encryption Flow](#security--encryption-flow)
- [BluFi Protocol Structure](#blufi-protocol-structure)
- [Event System](#event-system)
- [File Structure & Responsibilities](#file-structure--responsibilities)
- [Integration Guide](#integration-guide)
- [Protocol Communication Examples](#protocol-communication-examples)

---

## Overview

This library implements **Espressif's BluFi protocol** - a secure Bluetooth-based WiFi provisioning system for ESP32 devices. It allows React Native applications to configure ESP32 devices to connect to WiFi networks securely over BLE (Bluetooth Low Energy).

### What Problem Does This Solve?

ESP32 devices often need WiFi credentials to connect to the internet, but they don't have a keyboard or display for user input. BluFi solves this by:

1. **Using Bluetooth** as a temporary communication channel
2. **Encrypting WiFi credentials** using Diffie-Hellman key exchange + AES
3. **Sending configuration** from a smartphone to the ESP32
4. **Verifying connection** and reporting status back to the app

### Key Features

✅ **Complete BluFi Protocol Implementation** - Follows ESP-IDF BluFi specification
✅ **End-to-End Encryption** - DH key exchange + AES-128 encryption
✅ **Cross-Platform Support** - React Native (iOS/Android), WeChat Mini Program
✅ **Automatic Fragmentation** - Handles packet splitting for BLE MTU limits
✅ **Event-Driven Architecture** - Clean pub/sub pattern
✅ **Protocol Abstraction** - Hides BLE complexity behind simple API

---

## Architecture Layers

The library is organized in **5 distinct layers**, each with specific responsibilities:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Package Entry Point (src/index.tsx)          │
│  - Exports main API                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 2: API Layer (src/blufi/xBlufi.ts)              │
│  - Public TypeScript API                                │
│  - Event definitions & routing                           │
│  - Platform selection (RN/WeChat/Alipay)                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 3: Platform Implementation                       │
│  - xBlufi-rn-impl.js (React Native + BLE)              │
│  - xBlufi-wx-impl.js (WeChat Mini Program)             │
│  - Protocol logic & state management                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 4: Protocol Utilities (util.js)                 │
│  - Frame construction & parsing                          │
│  - Fragmentation & reassembly                            │
│  - CRC checksum calculation                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Layer 5: Cryptography (crypto/)                        │
│  - Diffie-Hellman key exchange                           │
│  - AES-128 encryption/decryption                         │
│  - MD5 hashing for session keys                          │
│  - Big number math (DH operations)                       │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Package Entry Point

**File:** `src/index.tsx`

```typescript
import xBlufi from './blufi/xBlufi';
export * from './blufi/xBlufi';
export default xBlufi;
```

**Purpose:**
- Simple re-export of the main API
- Entry point for npm package consumers

---

### Layer 2: API Layer (Public Interface)

**File:** `src/blufi/xBlufi.ts`

**Responsibilities:**
- Provides developer-facing TypeScript API
- Defines enums and types (`XBLUFI_TYPE`, `OnFireEvent`)
- Implements event emitter pattern using `onfire.js`
- Routes calls to platform-specific implementations

**Key Exports:**

```typescript
// Platform types
const XMQTT_SYSTEM = {
  ReactNative: 0,    // React Native apps
  WeChat: 1,         // WeChat Mini Programs
  Alipay: 2          // Alipay Mini Programs
};

// Connection status types
const XBLUFI_TYPE = {
  TYPE_STATUS_CONNECTED: '-2',           // Device connection status callback
  TYPE_CLOSE_CONNECTED: '-1',            // Actively close connection
  TYPE_CONNECTED: '0',                   // Successfully connected
  TYPE_GET_DEVICE_LISTS: '1',            // BLE device discovery results
  TYPE_INIT_ESP32_RESULT: '2',           // Secure session initialized
  TYPE_RECIEVE_CUSTON_DATA: '3',         // Custom data received from ESP32
  TYPE_CONNECT_ROUTER_RESULT: '4',       // WiFi connection result
  TYPE_CONNECT_NEAR_ROUTER_LISTS: '5',   // Nearby WiFi networks list
  TYPE_CONNECT_ROUTER_SEND_END: '8',     // Configuration complete
  TYPE_GET_DEVICE_VERSION: '45',         // Device firmware version
  TYPE_GET_DEVICE_STATE: '46'            // Device WiFi state
};

// Internal event routing IDs
const OnFireEvent = {
  EVENT_START_DISCONORY: '0',                  // Start/stop BLE scanning
  EVENT_CONNECT_DISCONNECT: '1',               // Connect/disconnect BLE
  EVENT_NOFITY_INIT_ESP32: '3',                // Initialize secure session
  ENENT_ALL: '6',                              // Global event bus
  EVENT_NOFITY_SEND_ROUTER_SSID_PASSWORD: '50', // Send WiFi credentials
  EVENT_NOFITY_SEND_CUSTON_DATA: '51',         // Send custom data
  EVENT_NOFITY_SEND_GET_ROUTER_SSID: '52',     // Request WiFi scan
  EVENT_NOFITY_SEND_GET_STATE: '60',           // Request WiFi status
  EVENT_NOFITY_SEND_GET_VERSION: '80'          // Request firmware version
};
```

**Main API Functions:**

```typescript
// Initialize the library
initXBlufi(type: number, options: any): void

// Global event listener
listenDeviceMsgEvent(isSetListener: boolean, callback: Function): void
notifyDeviceMsgEvent(options: any): void

// BLE device discovery
notifyStartDiscoverBle(options: { isStart: boolean }): void
listenStartDiscoverBle(isSetListener: boolean, callback: Function): void

// BLE connection
notifyConnectBle(options: { isStart: boolean, deviceId: string }): void
listenConnectBle(isSetListener: boolean, callback: Function): void

// Secure session initialization (DH key exchange)
notifyInitBleEsp32(options: { deviceId: string }): void
listenInitBleEsp32(isSetListener: boolean, callback: Function): void

// WiFi configuration
notifySendRouterSsidAndPassword(options: { ssid: string, password: string }): void
listenSendRouterSsidAndPassword(isSetListener: boolean, callback: Function): void

// WiFi network scan
notifySendGetNearRouterSsid(options: any): void
listenSendGetNearRouterSsid(isSetListener: boolean, callback: Function): void

// Custom data exchange
notifySendCustomData(options: { customData: string }): void
listenSendCustomData(isSetListener: boolean, callback: Function): void

// Device information
notifySendGetVersion(options: any): void
notifySendGetState(options: any): void
```

---

### Layer 3: Platform Implementation

**File:** `src/blufi/xBlufi-rn-impl.js` (React Native)

**Responsibilities:**
- Wraps `react-native-ble-manager` for BLE operations
- Implements ESP32 BluFi protocol state machine
- Manages encryption context (keys, sequence numbers)
- Handles frame assembly, fragmentation, and parsing
- Processes incoming BluFi responses

**Key Components:**

#### BLE Wrapper Functions
```javascript
// Native BLE operations wrapped for consistency
rn.openBluetoothAdapter()       // Enable Bluetooth
rn.startBluetoothDevicesDiscovery() // Scan for devices
rn.createBLEConnection()        // Connect to device
rn.setBLEMTU()                  // Negotiate MTU size
rn.getBLEDeviceServices()       // Get service UUIDs
rn.notifyBLECharacteristicValueChange() // Enable notifications
rn.writeBLECharacteristicValue() // Write data to characteristic
rn.onBLECharacteristicValueChange() // Listen for incoming data
```

#### State Management
```javascript
let self = {
  data: {
    isConnected: false,
    isChecksum: true,       // Enable CRC verification
    isEncrypt: true,        // Enable AES encryption
    deviceId: '',
    ssid: '',
    password: '',
    md5Key: 0,              // Session encryption key
    service_uuid: '0000FFFF-0000-1000-8000-00805F9B34FB',
    characteristic_write_uuid: '0000FF01-0000-1000-8000-00805F9B34FB',
    characteristic_notify_uuid: '0000FF02-0000-1000-8000-00805F9B34FB',
    result: []              // Reassembly buffer for fragmented frames
  }
};

let sequenceControl = 0;    // Frame sequence number
let sequenceNumber = -1;    // Expected receive sequence
```

#### Protocol Functions
```javascript
// Diffie-Hellman key exchange
getSecret(deviceId, serviceId, characteristicId, client, kBytes, pBytes, gBytes)

// WiFi configuration sequence
writeDeviceRouterInfoStart()  // Set WiFi mode
writeRouterSsid()             // Send SSID (encrypted)
writeDevicePwd()              // Send password (encrypted)
writeDeviceEnd()              // Finalize configuration

// Information requests
writeGetNearRouterSsid()      // Request WiFi scan
writeSendGetState()           // Request WiFi status
writeSendGetVersion()         // Request firmware version

// Custom data
writeCutomsData()             // Send custom payload
```

---

### Layer 4: Protocol Utilities

**File:** `src/blufi/util.js`

**Responsibilities:**
- BluFi protocol frame construction
- Data fragmentation for BLE MTU limits
- CRC-16 checksum calculation
- Encryption/decryption wrapper
- Protocol constant definitions

**Frame Structure:**
```
┌──────────────┬──────────────┬──────────┬─────────────┬──────────┬───────┐
│ Type/Subtype │ Frame Control│ Sequence │ Data Length │   Data   │  CRC  │
│   (1 byte)   │   (1 byte)   │ (1 byte) │  (1 byte)   │ (0-N)    │ (2 B) │
└──────────────┴──────────────┴──────────┴─────────────┴──────────┴───────┘

Byte 0: Type (bits 0-1) + Subtype (bits 2-7)
Byte 1: Frame Control (encrypt, checksum, direction, require_ack, frag)
Byte 2: Sequence Number (0-255, wraps around)
Byte 3: Data Length
Byte 4+: Data Payload (encrypted if Frame Control bit set)
Last 2: CRC-16 (if Frame Control bit set)
```

**Key Functions:**

```javascript
// Frame construction
writeData(type, subtype, frameControl, sequence, dataLen, data)
// Returns complete frame as byte array

// Fragmentation
isSubcontractor(data, isChecksum, sequence, isEncrypt)
// Splits data if > MTU, returns { flag, len, lenData, laveData }

// Frame control byte
getFrameCTRLValue(encrypted, checksum, direction, requireAck, hasFrag)
// Builds frame control byte from boolean flags

// CRC calculation
getCRCValue(data)
// Uses CRC_TB lookup table for CRC-16

// Encryption wrapper
encrypt(aesjs, md5Key, sequence, data, isEncrypt)
// Applies AES if enabled, returns encrypted bytes

// Diffie-Hellman setup
blueDH(p, g, crypto)
// Creates DH client with prime modulus and generator
```

**Protocol Constants:**

```javascript
// Packet types
PACKAGE_VALUE = 0x00          // Data packet
PACKAGE_CONTROL_VALUE = 0x01  // Control packet

// Subtypes for PACKAGE_VALUE (0x00)
SUBTYPE_NEG = 0x00           // Negotiation data (DH key exchange)
SUBTYPE_SET_SSID = 0x02      // WiFi SSID
SUBTYPE_SET_PWD = 0x03       // WiFi password
SUBTYPE_CUSTOM_DATA = 0x13   // Custom application data

// Subtypes for PACKAGE_CONTROL_VALUE (0x01)
SUBTYPE_WIFI_MODEl = 0x02    // WiFi mode (STA/AP)
SUBTYPE_WIFI_NEG = 0x03      // WiFi scan request
SUBTYPE_END = 0x04           // Configuration complete
SUBTYPE_GET_WIFI_STATUS = 0x0f  // Status query
SUBTYPE_GET_VERSION = 0x10   // Version query

// Diffie-Hellman parameters (2048-bit)
DH_P = "0xFFFFFFFF..." // RFC 3526 prime modulus
DH_G = "0x02"          // Generator
```

---

### Layer 5: Cryptography

**Directory:** `src/blufi/crypto/`

#### **crypto-dh.js** - Diffie-Hellman Key Exchange
```javascript
// Creates DH keypair and computes shared secret
const DH = require('./lib/dh.js');

function DHKeyExchange(p, g) {
  const dh = new DH(p, g);
  dh.generateKeys();
  return dh;
}

// Usage:
const client = DHKeyExchange(DH_P, DH_G);
const publicKey = client.getPublicKey();      // Send to ESP32
const sharedSecret = client.computeSecret(esp32PublicKey);
```

#### **aes.js** - AES-128 Encryption
```javascript
// Encrypts data using AES-128-CBC with dynamic IV
const aes128 = require('./lib/aes-128-cbc.js');

function encrypt(key, iv, plaintext) {
  const cipher = new aes128(key);
  return cipher.encrypt(iv, plaintext);
}

// IV generation from sequence number
function generateAESIV(sequence) {
  const iv = new Array(16).fill(0);
  iv[0] = sequence;
  return iv;
}
```

#### **md5.min.js** - MD5 Hashing
```javascript
// Hashes DH shared secret to create AES key
const md5 = require('./crypto/md5.min.js');

const sharedSecret = client.computeSecret(esp32PublicKey);
const aesKey = md5.array(sharedSecret); // 128-bit AES key
```

#### **lib/** - Supporting Libraries
- **bn.js** - Big number arithmetic for DH calculations
- **dh.js** - Diffie-Hellman implementation
- **generatePrime.js** - Prime number generation
- **miller-rabin.js** - Primality testing
- **buffer.js** - Node.js Buffer polyfills for React Native
- **base64-js.js** - Base64 encoding utilities
- **ieee754.js** - IEEE 754 floating point operations

---

## Security & Encryption Flow

### Complete Security Handshake

```
┌─────────────┐                                    ┌─────────────┐
│ React Native│                                    │   ESP32     │
│     App     │                                    │   Device    │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ 1. BLE Connection Established                   │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │ 2. Request DH Parameters                        │
       │         [Type=0, Subtype=0, Encrypted=No]       │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │ 3. Send DH Public Key (P, G, K)                 │
       │         [Type=0, Subtype=0]                     │
       │         Data: TotalLen(2) + P + G + PublicKey   │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │                4. ESP32 Computes Shared Secret  │
       │                   SharedSecret = K^private mod P│
       │                   AES_Key = MD5(SharedSecret)   │
       │                                                  │
       │ 5. ESP32 Sends Public Key                       │
       │         [Type=1, Subtype=0]                     │
       │◀─────────────────────────────────────────────────│
       │                                                  │
       │ 6. App Computes Shared Secret                   │
       │    SharedSecret = ESP32_K^private mod P         │
       │    AES_Key = MD5(SharedSecret)                  │
       │    ✅ Both sides now have same AES key          │
       │                                                  │
       │ 7. Send WiFi Mode (Encrypted)                   │
       │         [Type=0, Subtype=2, Encrypted=Yes]      │
       │         IV = [sequence, 0, 0, ..., 0]           │
       │         Data = AES_Encrypt(mode_byte)           │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │ 8. Send SSID (Encrypted + CRC)                  │
       │         [Type=0, Subtype=2, Encrypted=Yes]      │
       │         Data = AES_Encrypt("MyWiFi")            │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │ 9. Send Password (Encrypted + CRC)              │
       │         [Type=0, Subtype=3, Encrypted=Yes]      │
       │         Data = AES_Encrypt("MyPassword123")     │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │ 10. Send End Command                            │
       │         [Type=1, Subtype=4]                     │
       │─────────────────────────────────────────────────▶│
       │                                                  │
       │                11. ESP32 Connects to WiFi       │
       │                                                  │
       │ 12. Connection Result                           │
       │         [Type=1, Subtype=15]                    │
       │         Data: OpMode + Status + SSID            │
       │◀─────────────────────────────────────────────────│
       │                                                  │
```

### Security Guarantees

1. **Forward Secrecy** - Each session uses unique DH keypair
2. **Confidentiality** - WiFi credentials encrypted with AES-128
3. **Integrity** - CRC-16 checksum prevents tampering
4. **Authentication** - Shared secret proves both parties computed same key
5. **Replay Protection** - Sequence numbers prevent replay attacks

### Encryption Details

**Algorithm:** AES-128-CBC
**Key Derivation:** MD5(DH_SharedSecret) → 128-bit key
**IV Generation:** `[sequence_number, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]`
**Padding:** None (data aligned to block size)

**Why MD5 for Key Derivation?**
- ESP-IDF BluFi specification requirement
- Compatibility with existing ESP32 firmware
- Sufficient security given ephemeral DH keys

**Why Dynamic IV from Sequence Number?**
- Ensures unique IV for each frame
- No need to transmit IV separately
- Synchronized on both sides

---

## BluFi Protocol Structure

### Frame Types

#### Type 0: Data Frames (PACKAGE_VALUE)
Used to transmit configuration data and custom payloads.

| Subtype | Hex  | Purpose                    | Direction    | Encrypted |
|---------|------|----------------------------|--------------|-----------|
| 0       | 0x00 | Negotiation (DH exchange)  | Bidirectional| No        |
| 2       | 0x02 | WiFi SSID                  | App → ESP32  | Yes       |
| 3       | 0x03 | WiFi Password              | App → ESP32  | Yes       |
| 17      | 0x11 | WiFi Scan Results          | ESP32 → App  | Optional  |
| 18      | 0x12 | Error Report               | ESP32 → App  | No        |
| 19      | 0x13 | Custom Data                | Bidirectional| Yes       |

#### Type 1: Control Frames (PACKAGE_CONTROL_VALUE)
Used for commands and status queries.

| Subtype | Hex  | Purpose                    | Direction    | Encrypted |
|---------|------|----------------------------|--------------|-----------|
| 2       | 0x02 | Set WiFi Mode              | App → ESP32  | Yes       |
| 3       | 0x03 | Request WiFi Scan          | App → ESP32  | No        |
| 4       | 0x04 | Configuration Complete     | App → ESP32  | No        |
| 15      | 0x0f | WiFi Connection Status     | ESP32 → App  | Optional  |
| 16      | 0x10 | Firmware Version           | ESP32 → App  | No        |

### Frame Control Byte

```
Bit 7-5: Reserved
Bit 4: Fragmentation (1 = more fragments follow)
Bit 3: Reserved
Bit 2: Direction (0 = output/request, 1 = input/response)
Bit 1: Checksum (1 = CRC present in last 2 bytes)
Bit 0: Encryption (1 = data is AES encrypted)
```

**Example:**
```javascript
// Frame Control = 0x03 (binary: 0000 0011)
// Bit 0 = 1: Encrypted
// Bit 1 = 1: CRC enabled
// Bit 4 = 0: No fragmentation
```

### Fragmentation

When data exceeds BLE MTU (typically 128-512 bytes), it's split:

```
First Fragment:
[Type/Subtype][0x13][Seq][Len][Data][CRC]
              ^
              Bit 4 = 1 (has more fragments)
              Bit 1 = 1 (CRC)
              Bit 0 = 1 (encrypted)

Middle Fragment:
[Type/Subtype][0x13][Seq][Len][Data][CRC]

Last Fragment:
[Type/Subtype][0x03][Seq][Len][Data][CRC]
              ^
              Bit 4 = 0 (no more fragments)
```

**Reassembly:**
```javascript
let result = []; // Global reassembly buffer

// On each fragment received:
if (frameControl & 0x10) {
  // Has more fragments
  result = result.concat(fragmentData);
} else {
  // Last fragment
  result = result.concat(fragmentData);
  processCompleteFrame(result);
  result = []; // Clear buffer
}
```

---

## Event System

### Architecture

The library uses **onfire.js** - a lightweight pub/sub event emitter:

```javascript
// Factory pattern
const mOnFire = factory();

// Publishing events
mOnFire.fire('52', { deviceId: 'AA:BB:CC:DD:EE:FF' });

// Subscribing to events
mOnFire.on('52', (data) => {
  console.log('WiFi scan requested:', data);
});

// Unsubscribing
mOnFire.un(callbackFunction);
```

### Event Flow

```
Application Layer (App.tsx)
        ↓
    xBlufi.notifySendGetNearRouterSsid()
        ↓
    xBlufi.ts: mOnFire.fire('52', options)
        ↓
    onfire.js: Lookup event '52' in __onfireEvents
        ↓
    Execute registered callback
        ↓
    xBlufi-rn-impl.js: writeGetNearRouterSsid()
        ↓
    BleManager.write() → ESP32 Device
        ↓
    ESP32 Response → BleManager notification
        ↓
    xBlufi-rn-impl.js: Parse frame, extract SSID list
        ↓
    mDeviceEvent.notifyDeviceMsgEvent({ type: TYPE_CONNECT_NEAR_ROUTER_LISTS })
        ↓
    Application Layer: Update UI with WiFi networks
```

### Two Number Systems

**Important:** The library uses two separate numbering systems:

1. **Internal Event IDs** (`OnFireEvent` values like '52')
   - JavaScript-only routing identifiers
   - Arbitrary strings for pub/sub pattern
   - **NOT sent to ESP32**

2. **BluFi Protocol Values** (Type/Subtype like 0x01/0x03)
   - Actual protocol values sent over BLE
   - Defined in ESP-IDF specification
   - **Used in BLE frames**

**Example:**
```javascript
// Internal event '52' triggers...
notifySendGetNearRouterSsid()
  → fire('52')
  → writeGetNearRouterSsid()
  → Creates frame with Type=1, Subtype=3  ← Real protocol values
  → ESP32 receives 0x01 0x03 (not '52')
```

---

## File Structure & Responsibilities

```
react-native-esp-blufi/
├── src/
│   ├── index.tsx                       ← Package entry point
│   │   └── Exports xBlufi API
│   │
│   └── blufi/
│       ├── xBlufi.ts                   ← 🎯 Main API Layer
│       │   ├── XBLUFI_TYPE enum       (Status types)
│       │   ├── OnFireEvent object      (Internal routing)
│       │   ├── initXBlufi()           (Initialize library)
│       │   ├── notify* functions       (Trigger actions)
│       │   └── listen* functions       (Register callbacks)
│       │
│       ├── xBlufi-rn-impl.js          ← 🔧 React Native Implementation
│       │   ├── rn.* BLE wrappers      (BLE operations)
│       │   ├── init()                  (Setup event listeners)
│       │   ├── getSecret()            (DH key exchange)
│       │   ├── write* functions        (Send commands)
│       │   ├── parseValue()           (Parse responses)
│       │   └── State management        (sequenceControl, keys)
│       │
│       ├── xBlufi-wx-impl.js          ← WeChat Mini Program impl
│       │
│       ├── util.js                     ← 📦 Protocol Utilities
│       │   ├── writeData()            (Frame construction)
│       │   ├── isSubcontractor()      (Fragmentation)
│       │   ├── getFrameCTRLValue()    (Control byte)
│       │   ├── getCRCValue()          (CRC-16)
│       │   ├── encrypt()              (AES wrapper)
│       │   ├── blueDH()               (DH setup)
│       │   └── Protocol constants      (Type/Subtype values)
│       │
│       ├── crypto/
│       │   ├── crypto-dh.js           ← 🔐 Diffie-Hellman
│       │   ├── aes.js                 ← 🔐 AES-128 encryption
│       │   ├── md5.min.js             ← 🔐 MD5 hashing
│       │   └── lib/
│       │       ├── dh.js              (DH algorithm)
│       │       ├── bn.js              (Big numbers)
│       │       ├── generatePrime.js   (Prime generation)
│       │       ├── miller-rabin.js    (Primality test)
│       │       ├── buffer.js          (Buffer polyfill)
│       │       ├── base64-js.js       (Base64 codec)
│       │       └── ...                (Other crypto utils)
│       │
│       └── other/
│           └── onfire.js              ← 📡 Event Emitter
│               ├── on()               (Subscribe)
│               ├── fire()             (Publish)
│               ├── un()               (Unsubscribe)
│               └── __onfireEvents      (Event registry)
│
├── example/                           ← Demo Application
│   ├── src/
│   │   └── App.tsx                    ← Usage example
│   └── package.json                   ← Imports parent package
│
├── package.json                       ← NPM package config
├── README.md                          ← User documentation
└── ARCHITECTURE.md                    ← This file
```

### Key Files Explained

| File | Lines | Purpose |
|------|-------|---------|
| `xBlufi.ts` | ~280 | Public API, event definitions, platform routing |
| `xBlufi-rn-impl.js` | ~1700 | Core protocol logic, BLE operations, state machine |
| `util.js` | ~800 | Frame construction, fragmentation, CRC, constants |
| `crypto-dh.js` | ~50 | DH key exchange wrapper |
| `aes.js` | ~200 | AES-128-CBC implementation |
| `onfire.js` | ~150 | Lightweight event emitter |

---

## Integration Guide

### Prerequisites

1. **React Native Project** (0.60+)
2. **Bluetooth Permissions** configured
3. **ESP32 Device** with BluFi firmware

### Step 1: Installation

```bash
npm install @kafudev/react-native-esp-blufi react-native-ble-manager
```

### Step 2: Platform Configuration

#### iOS - Info.plist
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to configure ESP32 devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to configure ESP32 devices</string>
```

#### Android - AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
```

#### Android - Request Runtime Permissions
```typescript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(granted).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}
```

### Step 3: Initialize BluFi

```typescript
import React, { useEffect, useState } from 'react';
import xBlufi, { XBLUFI_TYPE } from '@kafudev/react-native-esp-blufi';
import BleManager from 'react-native-ble-manager';

function App() {
  useEffect(() => {
    // Initialize BLE Manager
    BleManager.start({ showAlert: false });

    // Initialize xBlufi (0 = React Native platform)
    xBlufi.initXBlufi(0);

    // Setup global event listener
    xBlufi.listenDeviceMsgEvent(true, handleBlufiEvents);

    return () => {
      xBlufi.listenDeviceMsgEvent(false, handleBlufiEvents);
    };
  }, []);

  const handleBlufiEvents = (event) => {
    console.log('BluFi Event:', event.type, event.result, event.data);

    switch(event.type) {
      case XBLUFI_TYPE.TYPE_GET_DEVICE_LISTS:
        // Update UI with discovered devices
        setDevices(event.data);
        break;

      case XBLUFI_TYPE.TYPE_CONNECTED:
        if (event.result) {
          console.log('Connected to:', event.data.deviceId);
        }
        break;

      case XBLUFI_TYPE.TYPE_INIT_ESP32_RESULT:
        if (event.result) {
          console.log('Secure session established');
          // Now safe to send WiFi credentials
        }
        break;

      case XBLUFI_TYPE.TYPE_CONNECT_ROUTER_RESULT:
        if (event.data.success) {
          console.log('ESP32 connected to WiFi!');
        } else {
          console.log('WiFi connection failed:', event.data.msg);
        }
        break;
    }
  };

  return <View>{/* Your UI */}</View>;
}
```

### Step 4: Complete Provisioning Flow

```typescript
// 1. Scan for ESP32 devices
async function scanForDevices() {
  xBlufi.notifyStartDiscoverBle({
    isStart: true,
    serviceUUIDs: ['0000FFFF-0000-1000-8000-00805F9B34FB'],
    timeout: 10
  });
}

// 2. Connect to selected device
async function connectToDevice(deviceId: string) {
  xBlufi.notifyConnectBle({
    isStart: true,
    deviceId: deviceId
  });
}

// 3. Initialize secure session (after TYPE_CONNECTED event)
async function initializeSecureSession(deviceId: string) {
  xBlufi.notifyInitBleEsp32({ deviceId });
}

// 4. Send WiFi credentials (after TYPE_INIT_ESP32_RESULT event)
async function sendWiFiCredentials(ssid: string, password: string) {
  xBlufi.notifySendRouterSsidAndPassword({
    ssid: ssid,
    password: password
  });
}

// 5. Request nearby WiFi networks (optional)
async function scanWiFiNetworks() {
  xBlufi.notifySendGetNearRouterSsid({});
}

// 6. Get device information (optional)
async function getDeviceInfo() {
  xBlufi.notifySendGetVersion({});
  xBlufi.notifySendGetState({});
}

// 7. Disconnect
async function disconnect(deviceId: string) {
  xBlufi.notifyConnectBle({
    isStart: false,
    deviceId: deviceId
  });
}
```

### Step 5: ESP32 Firmware Setup

**Using ESP-IDF:**
```bash
cd ~/esp/esp-idf/examples/bluetooth/bluedroid/ble/blufi
idf.py menuconfig  # Configure WiFi settings if needed
idf.py build
idf.py flash monitor
```

**Key ESP32 Configuration:**
- **Service UUID:** `0000FFFF-0000-1000-8000-00805F9B34FB`
- **Write Characteristic:** `0000FF01-0000-1000-8000-00805F9B34FB`
- **Notify Characteristic:** `0000FF02-0000-1000-8000-00805F9B34FB`

---

## Protocol Communication Examples

### Example 1: Complete Provisioning Session

```
App → ESP32: Start BLE Scan
App ← ESP32: Device Found (name: "BLUFI_DEVICE", rssi: -45)

App → ESP32: Connect (deviceId: "AA:BB:CC:DD:EE:FF")
App ← ESP32: Connected

App → ESP32: Get Services
App ← ESP32: Services [0000FFFF-...]

App → ESP32: Enable Notifications (0000FF02-...)
App ← ESP32: Notifications Enabled

App → ESP32: [Type=0, Sub=0, Enc=No, Seq=0]
            Data: TotalLen + P + G + PublicKey
            (DH parameters and public key)

App ← ESP32: [Type=1, Sub=0, Seq=0]
            Data: ESP32_PublicKey
            (Both compute shared secret, derive AES key)

App → ESP32: [Type=0, Sub=2, Enc=Yes, CRC=Yes, Seq=1]
            Data: AES(0x01) ← WiFi STA mode
            CRC: 0x1234

App → ESP32: [Type=0, Sub=2, Enc=Yes, CRC=Yes, Seq=2]
            Data: AES("MyHomeWiFi")
            CRC: 0x5678

App → ESP32: [Type=0, Sub=3, Enc=Yes, CRC=Yes, Seq=3]
            Data: AES("SuperSecret123")
            CRC: 0x9ABC

App → ESP32: [Type=1, Sub=4, Enc=No, Seq=4]
            (Configuration complete)

            [ESP32 attempts WiFi connection...]

App ← ESP32: [Type=1, Sub=15, Seq=0]
            Data: [0x01, 0x00, ...SSID...]
            (OpMode=STA, Status=Connected, SSID="MyHomeWiFi")

SUCCESS! ESP32 is now online.
```

### Example 2: WiFi Network Scan

```
App → ESP32: [Type=1, Sub=3, Enc=No, Seq=5]
            (Request WiFi scan)

            [ESP32 scans for networks...]

App ← ESP32: [Type=1, Sub=17, Seq=1]
            Data: [
              0x0A,                    ← Length of first entry
              0xD5,                    ← RSSI (-43 dBm)
              'M','y','H','o','m','e', ← SSID
              'W','i','F','i',

              0x0E,                    ← Length of second entry
              0xC8,                    ← RSSI (-56 dBm)
              'N','e','i','g','h','b','o','r',
              'W','i','F','i',
              ...
            ]

App parses list, displays in UI:
- MyHomeWiFi (-43 dBm)
- NeighborWiFi (-56 dBm)
- ...
```

### Example 3: Custom Data Exchange

```
App → ESP32: [Type=0, Sub=19, Enc=Yes, CRC=Yes, Seq=6]
            Data: AES('{"command":"getLogs"}')
            (Custom JSON command)

App ← ESP32: [Type=1, Sub=19, Seq=2]
            Data: AES('{"logs":["Boot at 12:00","WiFi OK"]}')
            (Custom JSON response)
```

---

## Troubleshooting

### Common Issues

**1. "BLE Manager not initialized"**
```typescript
// Solution: Always call BleManager.start() before xBlufi
await BleManager.start({ showAlert: false });
xBlufi.initXBlufi(0);
```

**2. "Connection timeout"**
- Ensure ESP32 is advertising BluFi service
- Check Bluetooth is enabled on phone
- Verify permissions granted (Location on Android)
- Try reducing BLE scan timeout

**3. "Init ESP32 failed"**
- DH key exchange failed
- Check ESP32 firmware supports BluFi
- Verify MTU negotiation succeeded
- Review ESP32 logs for errors

**4. "WiFi connection failed"**
- Verify SSID/password correct
- Check WiFi network supports device
- Ensure ESP32 antenna connected
- Review error code in response frame

**5. "Fragmentation errors"**
- MTU too small for data
- Try shorter SSID/password
- Check CRC calculation
- Verify sequence numbers

### Debugging Tips

```typescript
// Enable verbose logging
console.log('BluFi event:', JSON.stringify(event, null, 2));

// Log raw BLE data
bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', (data) => {
  console.log('Raw BLE RX:', data.value);
});

// Check encryption key
console.log('AES Key (MD5 of shared secret):', self.data.md5Key);

// Monitor sequence numbers
console.log('TX Sequence:', sequenceControl);
console.log('RX Sequence:', sequenceNumber);
```

---

## Performance Considerations

### BLE MTU

- **Default MTU:** 23 bytes (20 usable after ATT header)
- **Negotiated MTU:** 128-512 bytes (depends on platform)
- **Recommendation:** Request 256 bytes for efficiency

```typescript
await BleManager.requestMTU(deviceId, 256);
```

### Fragmentation Overhead

- Each fragment adds 4-6 bytes overhead (header + CRC)
- Large passwords may require 2-3 fragments
- Consider shorter credentials if possible

### Connection Parameters

```typescript
// Faster connection for provisioning
BleManager.startBluetoothDevicesDiscovery({
  timeout: 5,  // Shorter scan
  allowDuplicatesKey: false
});

// Request connection priority (Android only)
BleManager.requestConnectionPriority(deviceId, 1); // 1 = high
```

---

## References

- **ESP-IDF BluFi Documentation:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/blufi.html
- **ESP-IDF BluFi Example:** https://github.com/espressif/esp-idf/tree/master/examples/bluetooth/bluedroid/ble/blufi
- **React Native BLE Manager:** https://github.com/innoveit/react-native-ble-manager
- **BluFi Protocol Spec:** https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/blufi.html#frame-formats

---

## License

MIT License - See LICENSE file for details.
