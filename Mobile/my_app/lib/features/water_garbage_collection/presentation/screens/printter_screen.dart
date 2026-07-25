import 'package:flutter/material.dart';
import '../state/printer_state.dart';

class PrinterScreen extends StatelessWidget {
  const PrinterScreen({super.key});

  void _triggerTestPrint(BuildContext context, PrinterState appState) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: FutureBuilder<bool>(
            future: appState.printTestReceipt(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.print, color: Colors.blue, size: 64),
                      const SizedBox(height: 20),
                      const Text(
                        'กำลังพิมพ์ใบเสร็จทดสอบ...',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'ส่งคำสั่งทดสอบไปยังเครื่องพิมพ์ ${appState.connectedPrinterName} แล้ว',
                        style: const TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      const LinearProgressIndicator(color: Colors.blue),
                    ],
                  ),
                );
              }

              return Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
                    const SizedBox(height: 16),
                    const Text(
                      'ทดสอบการพิมพ์สำเร็จ',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'การเชื่อมต่อกับเครื่องพิมพ์ความร้อนทำงานได้เป็นปกติ',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: isDark ? Colors.black : Colors.white,
                        ),
                        onPressed: () => Navigator.pop(context),
                        child: const Text('ตกลง'),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = PrinterState();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('เชื่อมต่อเครื่องพิมพ์'),
        elevation: 0,
      ),
      body: AnimatedBuilder(
        animation: appState,
        builder: (context, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. สวิตช์ เปิด/ปิด Bluetooth
                Card(
                  elevation: 0,
                  color: theme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: theme.dividerColor),
                  ),
                  child: SwitchListTile(
                    secondary: Icon(
                      Icons.bluetooth,
                      color: appState.isBluetoothOn ? Colors.blue : Colors.grey,
                      size: 28,
                    ),
                    title: const Text(
                      'บลูทูธ (Bluetooth)',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      appState.isBluetoothOn ? 'เปิดใช้งานอยู่' : 'ปิดการทำงาน',
                      style: const TextStyle(fontSize: 12),
                    ),
                    value: appState.isBluetoothOn,
                    activeThumbColor: Colors.blue,
                    onChanged: (val) {
                      appState.toggleBluetooth(val);
                    },
                  ),
                ),
                const SizedBox(height: 20),

                // 2. สถานะเครื่องพิมพ์ปัจจุบัน
                const Text(
                  'เครื่องพิมพ์ที่เชื่อมต่อ (Connected Printer)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 0,
                  color: theme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: theme.dividerColor),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: appState.isPrinterConnected
                                    ? (isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF))
                                    : (isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF1F5F9)),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.print,
                                color: appState.isPrinterConnected ? Colors.blue : Colors.grey,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    appState.isPrinterConnected
                                        ? appState.connectedPrinterName
                                        : 'ยังไม่ได้เชื่อมต่อเครื่องพิมพ์',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.circle,
                                        color: appState.isPrinterConnected ? Colors.green : Colors.grey,
                                        size: 8,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        appState.isPrinterConnected ? 'Online' : 'Offline',
                                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                            ),
                            if (appState.isPrinterConnected)
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.redAccent,
                                  side: const BorderSide(color: Colors.redAccent),
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                ),
                                onPressed: () {
                                  appState.disconnectPrinter();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('ยกเลิกการเชื่อมต่อเครื่องพิมพ์แล้ว')),
                                  );
                                },
                                child: const Text('ตัดการเชื่อมต่อ', style: TextStyle(fontSize: 12)),
                              ),
                          ],
                        ),
                        if (appState.isPrinterConnected) ...[
                          const Divider(height: 24),
                          SizedBox(
                            width: double.infinity,
                            height: 40,
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Colors.blue),
                                foregroundColor: Colors.blue,
                              ),
                              onPressed: () => _triggerTestPrint(context, appState),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.print, size: 18),
                                  SizedBox(width: 8),
                                  Text('พิมพ์ทดสอบ (Test Print)', style: TextStyle(fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                        ]
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // 3. ส่วนการค้นหาอุปกรณ์
                if (appState.isBluetoothOn) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'อุปกรณ์ใกล้เคียง (Discovered Devices)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.grey),
                      ),
                      if (appState.isScanning)
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.blue),
                        )
                      else
                        TextButton.icon(
                          onPressed: () => appState.startScanPrinters(),
                          icon: const Icon(Icons.refresh, size: 16),
                          label: const Text('ค้นหาอีกครั้ง', style: TextStyle(fontSize: 13)),
                          style: TextButton.styleFrom(padding: EdgeInsets.zero),
                        )
                    ],
                  ),
                  const SizedBox(height: 8),
                  Card(
                    elevation: 0,
                    color: theme.cardColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: theme.dividerColor),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Builder(
                        builder: (context) {
                          if (appState.isScanning) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24.0),
                              child: Center(
                                child: Text('กำลังสแกนหาเครื่องพิมพ์ความร้อนแบบ Bluetooth...'),
                              ),
                            );
                          }
                          
                          if (appState.discoveredPrinters.isEmpty) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                              child: Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.search_off_outlined, color: Colors.grey[400], size: 40),
                                    const SizedBox(height: 8),
                                    const Text(
                                      'ไม่พบอุปกรณ์เครื่องพิมพ์ความร้อนใกล้เคียง',
                                      style: TextStyle(color: Colors.grey, fontSize: 13),
                                    ),
                                    const SizedBox(height: 12),
                                    ElevatedButton(
                                      onPressed: () => appState.startScanPrinters(),
                                      child: const Text('สแกนหาอุปกรณ์'),
                                    )
                                  ],
                                ),
                              ),
                            );
                          }

                          return ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: appState.discoveredPrinters.length,
                            separatorBuilder: (context, index) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final name = appState.discoveredPrinters[index];
                              final isCurrent = appState.isPrinterConnected && appState.connectedPrinterName == name;
                              
                              return ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF1F5F9),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.print_outlined, size: 20),
                                ),
                                title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: const Text('เครื่องพิมพ์พกพาความร้อน (58mm/80mm)'),
                                trailing: isCurrent
                                    ? const Icon(Icons.check_circle, color: Colors.green)
                                    : const Icon(Icons.arrow_forward_ios, size: 14),
                                enabled: !isCurrent,
                                onTap: () async {
                                  // แสดง Loading การเชื่อมต่อ
                                  showDialog(
                                    context: context,
                                    barrierDismissible: false,
                                    builder: (context) => const Center(
                                      child: CircularProgressIndicator(color: Colors.blue),
                                    ),
                                  );

                                  final navigator = Navigator.of(context);
                                  final scaffoldMessenger = ScaffoldMessenger.of(context);

                                  await appState.connectPrinter(name);

                                  navigator.pop(); // ปิด Dialog โหลด

                                  scaffoldMessenger.showSnackBar(
                                    SnackBar(
                                      content: Text('เชื่อมต่อกับเครื่องพิมพ์ $name สำเร็จ!'),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ),
                ] else ...[
                  // เตือนว่าต้องเปิดบลูทูธก่อน
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40.0),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.bluetooth_disabled, size: 54, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          const Text(
                            'กรุณาเปิดการทำงานบลูทูธของอุปกรณ์ก่อนเพื่อสแกนหาเครื่องพิมพ์',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  )
                ]
              ],
            ),
          );
        },
      ),
    );
  }
}
