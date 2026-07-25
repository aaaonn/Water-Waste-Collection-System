import 'package:flutter/material.dart';
import '../../../../core/services/printer/printer_service.dart';

class PrinterState extends ChangeNotifier {
  static final PrinterState _instance = PrinterState._internal();
  factory PrinterState() => _instance;
  
  final PrinterServiceImpl _service = PrinterServiceImpl();

  PrinterState._internal() {
    _service.addListener(notifyListeners);
  }

  bool get isBluetoothOn => _service.isBluetoothEnabledSync;
  bool get isPrinterConnected => _service.isConnectedSync;
  String get connectedPrinterName => _service.connectedDevice;
  bool get isScanning => _service.isScanning;
  List<String> get discoveredPrinters => _service.discoveredDevices;

  void toggleBluetooth(bool value) {
    _service.setBluetoothEnabled(value);
  }

  Future<void> startScanPrinters() async {
    await _service.scanDevices();
  }

  Future<bool> connectPrinter(String name) async {
    return await _service.connect(name);
  }

  void disconnectPrinter() {
    _service.disconnect();
  }
  
  Future<bool> printTestReceipt() async {
    return await _service.printReceipt({
      'ownerName': 'ทดสอบการพิมพ์',
      'houseNumber': '99/9',
      'village': 'หมู่ที่ 9 บ้านทดสอบ',
      'previousMeter': 100.0,
      'currentMeter': 120.0,
      'waterUnitConsumed': 20.0,
      'waterBillAmount': 100.0,
      'garbageBillAmount': 40.0,
      'totalAmount': 140.0,
      'receiptNumber': 'TEST-0001',
      'billMonth': 'มิถุนายน 2569',
      'paymentMethod': 'เงินสด',
      'staffName': 'เจ้าหน้าที่ทดสอบ',
    });
  }

  Future<bool> printHouseholdReceipt(dynamic household, {String? qrCode, bool isInvoice = false}) async {
    return await _service.printReceipt({
      'ownerName': household.ownerName,
      'houseNumber': household.houseNumber,
      'village': household.village,
      'previousMeter': household.previousMeter,
      'currentMeter': household.currentMeter ?? 0.0,
      'waterUnitConsumed': household.waterUnitConsumed ?? 0.0,
      'waterBillAmount': household.waterBillAmount,
      'garbageBillAmount': household.garbageBillAmount,
      'totalAmount': household.totalAmount,
      'receiptNumber': household.receiptNumber ?? 'REC-${DateTime.now().millisecondsSinceEpoch}',
      'invoiceId': household.invoiceId ?? '',
      'billMonth': household.billMonth ?? 'มิถุนายน 2569',
      'paymentMethod': household.paymentMethod == 'promptpay' ? 'PromptPay' : 'เงินสด',
      'staffName': household.staffName ?? 'เจ้าหน้าที่',
      'paymentTime': household.paymentTime ?? DateTime.now(),
    }, qrCode: qrCode, isInvoice: isInvoice);
  }
}
