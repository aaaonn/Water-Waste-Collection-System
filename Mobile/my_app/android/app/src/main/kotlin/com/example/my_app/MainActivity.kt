package com.example.my_app

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.Context
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.rt.printerlibrary.printer.RTPrinter
import com.rt.printerlibrary.factory.printer.ThermalPrinterFactory
import com.rt.printerlibrary.factory.connect.BluetoothFactory
import com.rt.printerlibrary.bean.BluetoothEdrConfigBean
import com.rt.printerlibrary.enumerate.ConnectStateEnum
import com.rt.printerlibrary.enumerate.CommonEnum
import com.rt.printerlibrary.enumerate.SettingEnum
import com.rt.printerlibrary.connect.PrinterInterface
import com.rt.printerlibrary.cmd.EscFactory
import com.rt.printerlibrary.setting.TextSetting
import com.rt.printerlibrary.observer.PrinterObserver
import com.rt.printerlibrary.observer.PrinterObserverManager
import com.rt.printerlibrary.enumerate.BarcodeType
import com.rt.printerlibrary.enumerate.QrcodeEccLevel
import com.rt.printerlibrary.setting.BarcodeSetting
import com.rt.printerlibrary.setting.CommonSetting
import java.io.UnsupportedEncodingException
import android.annotation.SuppressLint

class MainActivity : FlutterActivity(), PrinterObserver {
    private val CHANNEL = "com.example.my_app/printer"
    private var rtPrinter: RTPrinter<Any>? = null
    private var curPrinterInterface: PrinterInterface<Any>? = null
    private var pendingConnectionResult: MethodChannel.Result? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val printerFactory = ThermalPrinterFactory()
        @Suppress("UNCHECKED_CAST")
        rtPrinter = printerFactory.create() as? RTPrinter<Any>
        PrinterObserverManager.getInstance().add(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        PrinterObserverManager.getInstance().remove(this)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "scanDevices" -> {
                    scanDevices(result)
                }
                "connect" -> {
                    val address = call.argument<String>("address")
                    if (address != null) {
                        connectPrinter(address, result)
                    } else {
                        result.error("INVALID_ARGUMENT", "Address is null", null)
                    }
                }
                "disconnect" -> {
                    disconnectPrinter(result)
                }
                "printReceipt" -> {
                    val text = call.argument<String>("text")
                    val qrCode = call.argument<String>("qrCode")
                    if (text != null) {
                        printText(text, qrCode, result)
                    } else {
                        result.error("INVALID_ARGUMENT", "Text is null", null)
                    }
                }
                "isConnected" -> {
                    val isConnected = curPrinterInterface?.getConnectState() == ConnectStateEnum.Connected
                    result.success(isConnected)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun scanDevices(result: MethodChannel.Result) {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            result.success(emptyList<String>())
            return
        }
        val devices = bluetoothAdapter.bondedDevices
        val deviceList = mutableListOf<String>()
        for (device in devices) {
            val name = device.name ?: "Unknown"
            val address = device.address
            deviceList.add("$name [$address]")
        }
        result.success(deviceList)
    }

    private fun connectPrinter(address: String, result: MethodChannel.Result) {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        if (bluetoothAdapter == null) {
            result.error("NO_BLUETOOTH", "Bluetooth not supported", null)
            return
        }
        val device = bluetoothAdapter.getRemoteDevice(address)
        if (device == null) {
            result.error("DEVICE_NOT_FOUND", "Device not found for address: $address", null)
            return
        }

        pendingConnectionResult = result
        val configBean = BluetoothEdrConfigBean(device)
        val piFactory = BluetoothFactory()
        @Suppress("UNCHECKED_CAST")
        val printerInterface = piFactory.create() as? PrinterInterface<Any>
        printerInterface?.setConfigObject(configBean)
        rtPrinter?.setPrinterInterface(printerInterface)

        try {
            rtPrinter?.connect(configBean)
        } catch (e: Exception) {
            pendingConnectionResult = null
            result.error("CONNECTION_FAILED", e.message, null)
        }
    }

    private fun disconnectPrinter(result: MethodChannel.Result) {
        try {
            rtPrinter?.disConnect()
            curPrinterInterface = null
            result.success(true)
        } catch (e: Exception) {
            result.error("DISCONNECT_FAILED", e.message, null)
        }
    }

    private fun printText(text: String, qrCode: String?, result: MethodChannel.Result) {
        val printer = rtPrinter
        val printerInterface = curPrinterInterface
        if (printer == null || printerInterface == null || printerInterface.getConnectState() != ConnectStateEnum.Connected) {
            result.error("NOT_CONNECTED", "Printer is not connected", null)
            return
        }

        try {
            val escFactory = EscFactory()
            val cmd = escFactory.create()
            cmd.append(cmd.headerCmd)
            
            val setting = TextSetting()
            setting.doubleHeight = SettingEnum.Disable
            setting.doubleWidth = SettingEnum.Disable
            
            cmd.append(cmd.getTextCmd(setting, text, "TIS-620")) // Thai TIS-620 encoding
            
            if (qrCode != null && qrCode.isNotEmpty()) {
                // Set alignment to middle for QR code
                val commonSetting = CommonSetting()
                commonSetting.align = CommonEnum.ALIGN_MIDDLE
                cmd.append(cmd.getCommonSettingCmd(commonSetting))
                
                // Add QR code command
                val barcodeSetting = BarcodeSetting()
                barcodeSetting.qrcodeDotSize = 5 // accept value: Esc(1~15)
                barcodeSetting.qrcodeEccLevel = QrcodeEccLevel.M
                cmd.append(cmd.getBarcodeCmd(BarcodeType.QR_CODE, barcodeSetting, qrCode))
                cmd.append(cmd.getLFCmd())
                
                // Reset alignment to left for subsequent items
                commonSetting.align = CommonEnum.ALIGN_LEFT
                cmd.append(cmd.getCommonSettingCmd(commonSetting))
            }
            
            cmd.append(cmd.allCutCmd)
            printer.writeMsgAsync(cmd.getAppendCmds())
            result.success(true)
        } catch (e: UnsupportedEncodingException) {
            result.error("ENCODING_ERROR", e.message, null)
        } catch (e: Exception) {
            result.error("PRINT_FAILED", e.message, null)
        }
    }

    override fun printerObserverCallback(printerInterface: PrinterInterface<*>?, state: Int) {
        runOnUiThread {
            when (state) {
                CommonEnum.CONNECT_STATE_SUCCESS -> {
                    @Suppress("UNCHECKED_CAST")
                    curPrinterInterface = printerInterface as? PrinterInterface<Any>
                    pendingConnectionResult?.success(true)
                    pendingConnectionResult = null
                }
                CommonEnum.CONNECT_STATE_INTERRUPTED -> {
                    curPrinterInterface = null
                    pendingConnectionResult?.error("CONNECTION_INTERRUPTED", "Disconnected or connection failed", null)
                    pendingConnectionResult = null
                }
            }
        }
    }

    override fun printerReadMsgCallback(printerInterface: PrinterInterface<*>?, bytes: ByteArray?) {
        // Handle read messages if needed
    }
}
