import { BleManager } from 'react-native-ble-manager';
import { request, PERMISSIONS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

const SERVICE_UUID = '626b8801-39ce-491b-a871-5b9a209eedc8';
const CHARACTERISTIC_UUID = '626b87d1-39ce-491b-a871-5b9a209eedc8';

const BluetoothService = () => {
    //   const [manager] = useState(new BleManager());
    const [pairedDevices, setPairedDevices] = useState([]);

    const requestBluetoothPermission = async () => {
        console.log("function execution starts")
        const permission =
            Platform.OS === 'android'
                ? PERMISSIONS.ANDROID.BLUETOOTH_SCAN
                : PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL;
        console.log('Current platform:', Platform.OS);
        const result = await request(permission);
        console.log(result, ">>>>>>")
        if (result === 'granted') {
            console.log('Bluetooth permission granted. Starting scan...');
            startScan();
        } else {
            console.log('Bluetooth permission denied.');
            // Handle permission denial accordingly
        }
    };
    const startScan = () => {
        console.log('Starting Bluetooth device scan...');
        BleManager.scan(null, null, (error, scannedDevice) => {
            if (error) {
                console.error('Error during device scan:', error);
                return;
            }
            console.log('Scanned device:', scannedDevice);
            const isAlreadyPaired = pairedDevices.find(device => device.id === scannedDevice.id);
            if (isAlreadyPaired) {
                console.log('Device is already paired. Connecting automatically...');
                BleManager.stopDeviceScan();
                connectToDevice(scannedDevice.id);
            } else {
                console.log('Asking for pairing or handling pairing process...');
                pairWithDevice(scannedDevice);
            }
        });
    };
    const connectToDevice = (deviceId) => {
        if (!deviceId) {
            console.error('No device ID provided for connection.');
            return;
        }
        console.log('Connecting to device:', deviceId);
        BleManager.connectToDevice(deviceId)
            .then((connectedDevice) => {
                return BleManager.discoverAllServicesAndCharacteristics(deviceId);
            })
            .then(() => {
                console.log('Connected to device:', deviceId);
                BleManager.monitorCharacteristicForDevice(deviceId, SERVICE_UUID, CHARACTERISTIC_UUID, (error, characteristic) => {
                    if (error) {
                        console.error('Characteristic monitoring error:', error);
                        console.log(`Device ${deviceId} disconnected. Attempting to reconnect...`);
                        connectToDevice(deviceId); // Reconnect immediately
                        return;
                    }
                    const value = characteristic.value;
                    console.log('Received data:', value);
                    // Handle the received data as needed
                });
            })
            .catch((error) => {
                console.error('Connection error:', error);
                console.log(`Device ${deviceId} disconnected. Attempting to reconnect...`);
                connectToDevice(deviceId); // Reconnect immediately
            });
    };
    const pairWithDevice = async (device) => {
        try {
            console.log('Attempting to connect to device:', device.id);
            await BleManager.connectToDevice(device.id);
            setPairedDevices((prevDevices) => [...prevDevices, device]);
            console.log('Connected to device:', device.id);
            // Optionally, perform actions with the connected device
            // Monitor characteristics or perform other actions here
        } catch (error) {
            console.error('Connection error:', error);
            // Handle connection or pairing failure, show an error to the user, etc.
        }
    };
    useEffect(() => {
        console.log('BluetoothService useEffect - Requesting Bluetooth permission...');
        requestBluetoothPermission();
        return () => {
            console.log('BluetoothService useEffect cleanup - Canceling device connections...');
            pairedDevices.forEach(device => {
                BleManager.cancelDeviceConnection(device.id);
            });
        };
    }, [pairedDevices]);
    return null; // You don't need to return anything if you don't want to expose any values
};

export default BluetoothService;
