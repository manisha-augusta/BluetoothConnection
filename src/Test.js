
import React, { useEffect, useState } from 'react';

import { View, Text, Button, PermissionsAndroid, Platform, StyleSheet, FlatList, TouchableHighlight } from 'react-native';

import BleManager, { BleManagerDidUpdateValueForCharacteristicEvent } from 'react-native-ble-manager';

import { request, PERMISSIONS } from 'react-native-permissions';
 
const BluetoothComponent = () => {

  const [devices, setDevices] = useState([]);

  const [connectedDevice, setConnectedDevice] = useState(null);
 
  const serviceUUID = '626b8801-39ce-491b-a871-5b9a209eedc8'; // Replace with your actual service UUID

  const characteristicUUID = '626b87d1-39ce-491b-a871-5b9a209eedc8'; // Replace with your actual characteristic UUID
 
  const requestBluetoothPermission = async () => {

    const permission =

      Platform.OS === 'android'

        ? PERMISSIONS.ANDROID.BLUETOOTH_SCAN

        : PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL;
 
    const result = await request(permission);

    if (result === 'granted') {

      console.log('Bluetooth permission granted!!!');

      startDeviceScan();

    } else {

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

    BleManager.start({ showAlert: false });
 
    BleManager.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
 
    BleManager.addListener('BleManagerConnectPeripheral', peripheral => {

      console.log('Connected to:', peripheral);

    });
 
    BleManager.addListener('BleManagerDisconnectPeripheral', peripheral => {

      console.log('Disconnected from:', peripheral);

      setConnectedDevice(null);

    });
 
    requestBluetoothPermission();
 
    return () => {

      BleManager.removeListener('BleManagerDiscoverPeripheral');

      BleManager.removeListener('BleManagerConnectPeripheral');

      BleManager.removeListener('BleManagerDisconnectPeripheral');

    };

  }, []);
 
  const handleDiscoverPeripheral = (peripheral) => {

    console.log('Discovered device:', peripheral);

    setDevices(prevDevices => [...prevDevices, peripheral]);

  };
 
  const renderItem = ({ item }) => {

    const backgroundColor = item.connected ? '#069400' : 'white';

    return (

      <TouchableHighlight

        underlayColor="#0082FC"

        onPress={() => connectToDevice(item.id)}>

        <View style={[styles.row, { backgroundColor }]}>

          <Text style={styles.peripheralName}>{item.name}</Text>

          <Text style={styles.peripheralId}>{item.id}</Text>

        </View>

      </TouchableHighlight>

    );

  };
 
  return (

    <View>

      <Text>Available Devices:</Text>

      <FlatList

        data={devices}

        keyExtractor={item => item.id}

        renderItem={renderItem}

      />

      {connectedDevice && (

        <Text>Connected to: {connectedDevice}</Text>

      )}

    </View>

  );

};
 
export default BluetoothComponent;
 
const styles = StyleSheet.create({

  row: {

    marginLeft: 10,

    marginRight: 10,

    borderRadius: 20,

    padding: 10,

    marginVertical: 5,

    elevation: 2,

  },

  peripheralName: {

    fontSize: 16,

    textAlign: 'center',

  },

  peripheralId: {

    fontSize: 12,

    textAlign: 'center',

  },

});
