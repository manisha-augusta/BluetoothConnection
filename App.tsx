// import React from 'react';
// import { SafeAreaView } from 'react-native';
// import BluetoothComponent from './src/BluetoothComponent';
// import BluetoothService from './src/BluetoothService';
// import Test from './src/Test'

// const App = () => {
//   return (
// <SafeAreaView>
// <BluetoothComponent />
{/* <BluetoothService/> */ }
{/* <Test/> */ }
{/* </SafeAreaView>
  );
 };
 
 export default App; */}





/**
 * Sample BLE React Native App
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
  Pressable,
  TouchableOpacity
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

const SECONDS_TO_SCAN_FOR = 20;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = false;
const LUFT_SERVICE_ID = '626b87be-39ce-491b-a871-5b9a209eedc8';
const RADON_SERVICE_ID = '49535343-FE7D-4AE5-8FA9-9FAFD205E455';

import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [peripherals, setPeripherals] = useState(
    new Map<Peripheral['id'], Peripheral>(),
  );


const [radon, setRadon] = useState<string>('');
const [airVOC, setAirVOC] = useState<string>('');
const [co2, setCO2] = useState<string>('');
const [temp, setTemp] = useState<string>('');
const [humidity, setHumidity] = useState<string>('');
const [airPressure, setAirPressure] = useState<string>('');


const [previouslyConnectedPeripherals, setPreviouslyConnectedPeripherals] = useState<string[]>([]);



  //console.debug('peripherals map updated', [...peripherals.entries()]);

  const startScan = () => {
    console.log('Start Scan button pressed');
 
    if (!isScanning) {
        // reset found peripherals before scan
        setPeripherals(new Map<Peripheral['id'], Peripheral>());
 
        try {
            console.debug('[startScan] starting scan...');
            setIsScanning(true);
            BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
                matchMode: BleScanMatchMode.Sticky,
                scanMode: BleScanMode.LowLatency,
                callbackType: BleScanCallbackType.AllMatches,
            })
            .then(() => {
                console.debug('[startScan] scan promise returned successfully.');
                retrieveConnected(); // Call retrieveConnected after scanning
            })
            .catch((err: any) => {
                console.error('[startScan] ble scan returned in error', err);
            });
        } catch (error) {
            console.error('[startScan] ble scan error thrown', error);
        }
    }
};

  const handleStopScan = () => {
    setIsScanning(false);
    console.debug('[handleStopScan] scan is stopped.');
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    console.debug(
      `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
    );
    setPeripherals(map => {
      let p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
  };

  const handleConnectPeripheral = (event: any) => {
    console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
  };

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent,
  ) => {
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
    );
  };

  // const handleDiscoverPeripheral = (peripheral: Peripheral) => {
  //   console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
  //   if (!peripheral.name) {
  //     peripheral.name = 'NO NAME';
  //   }
  //   setPeripherals(map => {
  //     return new Map(map.set(peripheral.id, peripheral));
  //   });
  // };


  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    // Define a regex pattern for device names starting with 'luft' or 'radon'
    const deviceNamePattern = /^(luft|radon)/i;
   
    if (peripheral.name && deviceNamePattern.test(peripheral.name)) {
      setPeripherals((map) => new Map(map.set(peripheral.id, peripheral)));
    }
  };

  const togglePeripheralConnection = async (peripheral: Peripheral) => {
    if (peripheral && peripheral.connected) {
      try {
        await BleManager.disconnect(peripheral.id);
      } catch (error) {
        console.error(
          `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
          error,
        );
      }
    } else {
      await connectPeripheral(peripheral);
    }
  };

  // Function to retrieve connected peripherals and attempt automatic reconnection
  const retrieveConnected = async () => {
    try {
      for (const peripheralId of previouslyConnectedPeripherals) {
        try {
          await BleManager.connect(peripheralId);
          console.debug(`[retrieveConnected][${peripheralId}] reconnected.`);
          // Update the state to reflect the connection status
          setPeripherals(map => {
            let p = map.get(peripheralId);
            if (p) {
              p.connected = true;
              return new Map(map.set(p.id, p));
            }
            return map;
          });
        } catch (error) {
          console.error(`[retrieveConnected][${peripheralId}] Error reconnecting to peripheral`, error);
        }
      }
    } catch (error) {
      console.error('[retrieveConnected] Error retrieving connected peripherals.', error);
    }
  };

  const connectPeripheral = async (peripheral: Peripheral) => {
    try {
      if (peripheral) {
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        await BleManager.connect(peripheral.id);
        console.debug(`[connectPeripheral][${peripheral.id}] connected.`);
        setPreviouslyConnectedPeripherals
        (
        prev =>
        [...prev, peripheral.id]);
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = false;
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData,
        );

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
        );

        // if (peripheralData.characteristics) {
        //   for (let characteristic of peripheralData.characteristics) {
        //     if (characteristic.descriptors) {
        //       for (let descriptor of characteristic.descriptors) {
        //         try {
        //           let data = await BleManager.readDescriptor(
        //             peripheral.id,
        //             characteristic.service,
        //             characteristic.characteristic,
        //             descriptor.uuid,
        //           );
        //           console.debug(
        //             `[connectPeripheral][${peripheral.id}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`,
        //             data,
        //           );
        //         } catch (error) {
        //           console.error(
        //             `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
        //             error,
        //           );
        //         }
        //       }
        //     }
        //   }
        // }


        if (peripheralData.characteristics) {
          for (let characteristic of peripheralData.characteristics) {
            try {
              // Read value from the characteristic            
              const value = await BleManager.read(
                peripheral.id,
                characteristic.service,
                characteristic.characteristic,
              );
              console.log(
                // `[connectPeripheral][${peripheral.id}] Value from characteristic ${characteristic.characteristic}.`,
                // `[connectPeripheral][${peripheral.id}] Raw value from characteristic ${characteristic.characteristic}: ${value}.`,

                `[connectPeripheral][${peripheral.id}] Value from characteristic ${characteristic.service} ${characteristic.characteristic}: ${value}.`,
              );
              // Process the value as needed          
              // For example, update state or trigger further actions 

              switch (characteristic.characteristic) {
                case '626b87d0-39ce-491b-a871-5b9a209eedc8':
                  setRadon(value.toString());
                  console.debug(`Radon Raw Data: ${value}`);
                  break;

                  case '626b87d4-39ce-491b-a871-5b9a209eedc8':
                    setAirVOC(value.toString());
                  console.debug(`Air VOC Raw Data: ${value}`);
                  break;

                  case '626b87d3-39ce-491b-a871-5b9a209eedc8':
                    setCO2(value.toString());
                  console.debug(`CO2 Raw Data: ${value}`);
                  break;

                  case '626b87d1-39ce-491b-a871-5b9a209eedc8':
                    setTemp(value.toString());
                  console.debug(`Temp Raw Data: ${value}`);
                  break;

                  case '626b87d2-39ce-491b-a871-5b9a209eedc8':
                    setHumidity(value.toString());
                  console.debug(`Humidity Raw Data: ${value}`);
                  break;

                  case '626b87d5-39ce-491b-a871-5b9a209eedc8':
                    setAirPressure(value.toString());
                  console.debug(`Air pressure Raw Data: ${value}`);
                  break;
              }

            } catch (error) {
              console.error(
                `[connectPeripheral][${peripheral.id}] Error reading characteristic ${characteristic.service} ${characteristic.characteristic}: ${error}`,
              );
            }
          }
        }


        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.rssi = rssi;
            return new Map(map.set(p.id, p));
          }
          return map;
        });
      }
    } catch (error) {
      console.error(
        `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
        error,
      );
    }
  };

  function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {

    try {
      BleManager.start({ showAlert: false })
        .then(() => {
          console.debug('BleManager started.');
          // Retrieve connected peripherals when BleManager starts
          retrieveConnected();
        })
        
        .catch((error: any) =>
          console.error('BeManager could not be started.', error),
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }


    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ),
      bleManagerEmitter.addListener(
        'BleManagerConnectPeripheral',
        handleConnectPeripheral,
      ),
    ];

    handleAndroidPermissions();

    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);

  const handleAndroidPermissions = () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]).then(result => {
        if (result) {
          console.debug(
            '[handleAndroidPermissions] User accepts runtime permissions android 12+',
          );
        } else {
          console.error(
            '[handleAndroidPermissions] User refuses runtime permissions android 12+',
          );
        }
      });
    } else if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(checkResult => {
        if (checkResult) {
          console.debug(
            '[handleAndroidPermissions] runtime permission Android <12 already OK',
          );
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(requestResult => {
            if (requestResult) {
              console.debug(
                '[handleAndroidPermissions] User accepts runtime permission android <12',
              );
            } else {
              console.error(
                '[handleAndroidPermissions] User refuses runtime permission android <12',
              );
            }
          });
        }
      });
    }
  };

  const renderItem = ({ item }: { item: Peripheral }) => {
    const backgroundColor = item.connected ? '#069400' : Colors.white;
    return (
      <TouchableHighlight
        underlayColor="#0082FC"
        onPress={() => togglePeripheralConnection(item)}>
        <View style={[styles.row, { backgroundColor }]}>
          <Text style={styles.peripheralName}>
            {/* completeLocalName (item.name) & shortAdvertisingName (advertising.localName) may not always be the same */}
            {item.name} - {item?.advertising?.localName}
            {item.connecting && ' - Connecting...'}
          </Text>
          <Text style={styles.rssi}>RSSI: {item.rssi}</Text>
          <Text style={styles.peripheralId}>{item.id}</Text>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <>
      <StatusBar />
      <SafeAreaView style={styles.body}>
        {/* <Pressable style={styles.scanButton} onPress={startScan}>
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Bluetooth'}
          </Text>
        </Pressable> */}

        <TouchableOpacity style={styles.scanButton} onPress={startScan}>
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Bluetooth'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanButton} onPress={retrieveConnected}>
          <Text style={styles.scanButtonText}>
            {'Retrieve connected peripherals'}
          </Text>
        </TouchableOpacity>

        {Array.from(peripherals.values()).length === 0 && (
          <View style={styles.row}>
            <Text style={styles.noPeripherals}>
              No Peripherals, press "Scan Bluetooth" above.
            </Text>
          </View>
        )}

        <FlatList
          data={Array.from(peripherals.values())}
          contentContainerStyle={{ rowGap: 12 }}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />



   {/* Display values */}
   <View style={styles.valuesContainer}>
          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>Radon</Text>
            <Text style={styles.valueText}>{radon}</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>AirVOC</Text>
            <Text style={styles.valueText}>{airVOC}</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>CO2</Text>
            <Text style={styles.valueText}>{co2}</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>Temp</Text>
            <Text style={styles.valueText}>{temp}</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>Humidity</Text>
            <Text style={styles.valueText}>{humidity}</Text>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>AirPressure</Text>
            <Text style={styles.valueText}>{airPressure}</Text>
          </View>
        </View>

      </SafeAreaView>
    </>
  );
};

const boxShadow = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

const styles = StyleSheet.create({
  engine: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    color: Colors.black,
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#0a398a',
    margin: 10,
    borderRadius: 12,
    ...boxShadow,
  },
  scanButtonText: {
    fontSize: 20,
    letterSpacing: 0.25,
    color: Colors.white,
  },
  body: {
    backgroundColor: '#0082FC',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
  peripheralName: {
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  rssi: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
  },
  peripheralId: {
    fontSize: 12,
    textAlign: 'center',
    padding: 2,
    paddingBottom: 20,
  },
  row: {
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 20,
    ...boxShadow,
  },
  noPeripherals: {
    margin: 10,
    textAlign: 'center',
    color: Colors.white,
  },
  valuesContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueCard: {
    width: '48%', // Adjust based on your layout preferences
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    ...boxShadow,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  valueText: {
    fontSize: 18,
    color: '#555',
  },
});

export default App;