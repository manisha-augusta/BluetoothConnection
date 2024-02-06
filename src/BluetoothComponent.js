import React, { useEffect, useState } from 'react';
import { View, Text, Button, PermissionsAndroid, Platform, StyleSheet, FlatList } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { request, PERMISSIONS } from 'react-native-permissions';
 
const BluetoothComponent = () => {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
 
  // Replace these with the actual UUIDs from your smart home device
  const serviceUUID = '626b8801-39ce-491b-a871-5b9a209eedc8';
  const characteristicUUID = '626b87d1-39ce-491b-a871-5b9a209eedc8';
 
  const requestBluetoothPermission = async () => {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.BLUETOOTH_SCAN
        : PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL;
 
    console.log("permission>>>>>>>>>>>>", permission);
    const result = await request(permission);
    console.log("result>>>>", result);
    if (result === 'granted') {
      console.log('Bluetooth permission granted!!!');
      // Permission granted, start scanning for devices
      startDeviceScan();
    } else {
      // Permission denied, handle accordingly
      console.log('Bluetooth permission denied');
    }
  };
 
  const startDeviceScan = () => {
    BleManager.scan([], 5, true)
      .then(() => {
        console.log('Scanning...');
      })
      .catch(error => {
        console.error('Scan error:', error);
      });
  };
 
  const connectToDevice = (peripheralId) => {
    BleManager.connect(peripheralId)
      .then(() => {
        console.log('Connected to device:', peripheralId);
        setConnectedDevice(peripheralId);
        // Perform actions with the connected device
        startNotifications(peripheralId, serviceUUID, characteristicUUID);
      })
      .catch(error => {
        console.error('Connection error:', error);
      });
  };
 
  const startNotifications = (peripheralId, serviceUUID, characteristicUUID) => {
    BleManager.startNotification(peripheralId, serviceUUID, characteristicUUID)
      .then(() => {
        console.log('Started notifications.');
      })
      .catch(error => {
        console.error('Notification error:', error);
      });
  };
 
  useEffect(() => {
    // Start Bluetooth manager
    BleManager.start({ showAlert: false });
 
    // Add listener for discovered peripherals
    BleManager.addListener('BleManagerDiscoverPeripheral', peripheral => {
      console.log('Discovered device:', peripheral);
      // Update UI with discovered device information
      setDevices(prevDevices => [...prevDevices, peripheral]);
    });
 
    // Add listener for connected peripherals
    BleManager.addListener('BleManagerConnectPeripheral', peripheral => {
      console.log('Connected to:', peripheral);
    });
 
    // Add listener for disconnected peripherals
    BleManager.addListener('BleManagerDisconnectPeripheral', peripheral => {
      console.log('Disconnected from:', peripheral);
      setConnectedDevice(null);
    });
 
    // Request Bluetooth permission and start scanning on mount
    requestBluetoothPermission();
 
    // Clean up listeners on unmount
    return () => {
      BleManager.removeListener('BleManagerDiscoverPeripheral');
      BleManager.removeListener('BleManagerConnectPeripheral');
      BleManager.removeListener('BleManagerDisconnectPeripheral');
    };
  }, []);
 
  return (
<View>
<Text>Available Devices:</Text>
<FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
<View key={item.id}>
<Text>{item.name}</Text>
<Button title="Connect" onPress={() => connectToDevice(item.id)} />
</View>
        )}
      />
      {connectedDevice && (
<Text>Connected to: {connectedDevice}</Text>
      )}
</View>
  );
};
 
export default BluetoothComponent;
 
const styles = StyleSheet.create({
  button: {
    color: 'black',
    margin: 10,
    padding: 10,
  },
});