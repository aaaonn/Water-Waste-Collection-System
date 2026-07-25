import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../../../../features/auth/presentation/state/auth_state.dart';

abstract class PrinterService {
  Future<bool> get isBluetoothEnabled;
  Future<bool> get isConnected;
  Future<List<String>> scanDevices();
  Future<bool> connect(String address);
  Future<void> disconnect();
  Future<bool> printReceipt(Map<String, dynamic> receiptData, {String? qrCode, bool isInvoice = false});
}

class PrinterServiceImpl extends ChangeNotifier implements PrinterService {
  static const _channel = MethodChannel('com.example.my_app/printer');
  
  bool _isBluetoothEnabled = true;
  bool _isConnected = false;
  String _connectedDevice = "";
  bool _isScanning = false;
  List<String> _discoveredDevices = [];

  bool get isBluetoothEnabledSync => _isBluetoothEnabled;
  bool get isConnectedSync => _isConnected;
  String get connectedDevice => _connectedDevice;
  bool get isScanning => _isScanning;
  List<String> get discoveredDevices => _discoveredDevices;

  @override
  Future<bool> get isBluetoothEnabled async {
    // Bluetooth on Android will be verified native-side; here we return local state
    return _isBluetoothEnabled;
  }

  @override
  Future<bool> get isConnected async {
    try {
      final bool connected = await _channel.invokeMethod('isConnected');
      if (connected != _isConnected) {
        _isConnected = connected;
        notifyListeners();
      }
      return connected;
    } catch (e) {
      debugPrint("PrinterService isConnected error: $e");
      return _isConnected;
    }
  }

  @override
  Future<List<String>> scanDevices() async {
    if (!_isBluetoothEnabled) return [];
    _isScanning = true;
    _discoveredDevices.clear();
    notifyListeners();
    
    try {
      final List<dynamic>? devices = await _channel.invokeMethod('scanDevices');
      _isScanning = false;
      if (devices != null) {
        _discoveredDevices = devices.cast<String>();
      }
      notifyListeners();
      return _discoveredDevices;
    } catch (e) {
      _isScanning = false;
      notifyListeners();
      debugPrint("PrinterService scanDevices error: $e");
      return [];
    }
  }

  @override
  Future<bool> connect(String deviceName) async {
    // Parse MAC address from deviceName format: "DeviceName [MAC_Address]"
    String address = deviceName;
    if (deviceName.contains('[') && deviceName.contains(']')) {
      address = deviceName.substring(deviceName.indexOf('[') + 1, deviceName.indexOf(']'));
    }
    
    try {
      final bool success = await _channel.invokeMethod('connect', {'address': address});
      if (success) {
        _isConnected = true;
        _connectedDevice = deviceName;
      }
      notifyListeners();
      return success;
    } catch (e) {
      _isConnected = false;
      _connectedDevice = "";
      notifyListeners();
      debugPrint("PrinterService connect error: $e");
      return false;
    }
  }

  @override
  Future<void> disconnect() async {
    try {
      await _channel.invokeMethod('disconnect');
    } catch (e) {
      debugPrint("PrinterService disconnect error: $e");
    } finally {
      _isConnected = false;
      _connectedDevice = "";
      notifyListeners();
    }
  }

  @override
  Future<bool> printReceipt(Map<String, dynamic> receiptData, {String? qrCode, bool isInvoice = false}) async {
    final text = _formatReceiptText(receiptData, isInvoice: isInvoice);
    try {
      final bool success = await _channel.invokeMethod('printReceipt', {
        'text': text,
        'qrCode': qrCode,
      });
      return success;
    } catch (e) {
      debugPrint("PrinterService printReceipt error: $e");
      return false;
    }
  }

  String _formatReceiptText(Map<String, dynamic> data, {bool isInvoice = false}) {
    final buffer = StringBuffer();
    
    final profile = AuthState().userProfile;
    final fallbackOrgName = profile != null ? "องค์การบริหารส่วนตำบล${profile.subdistrictName}" : "อบต.ทุ่งหลวง";
    final fallbackOrgAddr = profile != null ? "อ.${profile.districtName} จ.${profile.provinceName}" : "";

    final orgName = data['organizationName'] ?? fallbackOrgName;
    final orgAddr = data['organizationAddress'] ?? fallbackOrgAddr;
    final orgPhone = data['organizationPhone'] ?? '';
    final receiptNum = data['receiptNumber'] ?? '';
    final invoiceId = data['invoiceId'] ?? '';
    final billMonth = data['billMonth'] ?? '';
    final ownerName = data['ownerName'] ?? '';
    final houseNumber = data['houseNumber'] ?? '';
    final village = data['village'] ?? '';
    final prevMeter = data['previousMeter'] ?? 0.0;
    final currMeter = data['currentMeter'] ?? 0.0;
    final unitConsumed = data['waterUnitConsumed'] ?? (currMeter - prevMeter);
    final waterBill = data['waterBillAmount'] ?? 0.0;
    final garbageBill = data['garbageBillAmount'] ?? 0.0;
    final total = data['totalAmount'] ?? (waterBill + garbageBill);
    final payMethod = data['paymentMethod'] ?? 'เงินสด';
    final staffName = data['staffName'] ?? '';
    final payTime = data['paymentTime'] ?? DateTime.now();

    final dateStr = payTime is DateTime 
        ? "${payTime.day}/${payTime.month}/${payTime.year + 543} ${payTime.hour.toString().padLeft(2, '0')}:${payTime.minute.toString().padLeft(2, '0')}"
        : payTime.toString();

    buffer.writeln("================================");
    buffer.writeln("        $orgName");
    if (orgAddr.isNotEmpty) buffer.writeln(" $orgAddr");
    if (orgPhone.isNotEmpty) buffer.writeln(" โทร: $orgPhone");
    buffer.writeln("================================");
    if (isInvoice) {
      buffer.writeln("ใบแจ้งหนี้/ใบแจ้งชำระเงิน");
      buffer.writeln("เลขที่ใบแจ้งหนี้: $invoiceId");
    } else {
      buffer.writeln("ใบเสร็จรับเงินค่าน้ำประปา/ค่าขยะ");
      buffer.writeln("เลขที่ใบเสร็จ: $receiptNum");
    }
    buffer.writeln("ประจำเดือน: $billMonth");
    buffer.writeln(isInvoice ? "วันที่พิมพ์: $dateStr" : "วันที่ชำระ: $dateStr");
    buffer.writeln("--------------------------------");
    buffer.writeln("ผู้ใช้น้ำ: $ownerName");
    buffer.writeln("บ้านเลขที่: $houseNumber หมู่บ้าน: $village");
    buffer.writeln("--------------------------------");
    buffer.writeln("มาตรวัดครั้งก่อน: ${prevMeter.toStringAsFixed(1)} หน่วย");
    buffer.writeln("มาตรวัดครั้งนี้: ${currMeter.toStringAsFixed(1)} หน่วย");
    buffer.writeln("ปริมาณที่ใช้: ${unitConsumed.toStringAsFixed(1)} หน่วย");
    buffer.writeln("--------------------------------");
    buffer.writeln("ค่าน้ำประปา:    ${waterBill.toStringAsFixed(2)} บาท");
    buffer.writeln("ค่าเก็บขยะ:     ${garbageBill.toStringAsFixed(2)} บาท");
    buffer.writeln("ยอดรวมทั้งสิ้น:  ${total.toStringAsFixed(2)} บาท");
    buffer.writeln("--------------------------------");
    if (isInvoice) {
      buffer.writeln("สถานะ:         ค้างชำระ (Unpaid)");
      buffer.writeln("--------------------------------");
      buffer.writeln("  * สแกน QR Code ด้านล่างเพื่อชำระเงิน  ");
    } else {
      buffer.writeln("ชำระโดย: $payMethod");
      if (staffName.isNotEmpty) buffer.writeln("เจ้าหน้าที่: $staffName");
    }
    buffer.writeln("================================");
    if (isInvoice) {
      buffer.writeln(" กรุณาชำระเงินภายในระยะเวลาที่กำหนด ");
    } else {
      buffer.writeln("      ขอบคุณที่ชำระค่าบริการ      ");
    }
    buffer.writeln("\n\n\n"); // Feed paper
    
    return buffer.toString();
  }

  void setBluetoothEnabled(bool enabled) {
    _isBluetoothEnabled = enabled;
    if (!enabled) {
      disconnect();
    }
    notifyListeners();
  }
}
