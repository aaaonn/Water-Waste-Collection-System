import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dart:async';
import '../state/household_state.dart';
import '../state/printer_state.dart';
import '../../domain/entities/household.dart';
import 'record_screen.dart';
import '../../../../core/utils/thai_date_utils.dart';

class PaymentScreen extends StatefulWidget {
  final Household household;

  const PaymentScreen({super.key, required this.household});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _paymentMethod = 'cash'; // 'cash' หรือ 'promptpay'
  bool _isLoading = true;
  Household? _detailedHousehold;

  String? _promptPayQRCodeURL;
  bool _isLoadingQRCode = false;
  String? _errorMessageQRCode;
  Timer? _statusTimer;
  bool _isSavingPayment = false;
  List<dynamic> _waterTiers = [];
  List<GarbageRate> _garbageRates = [];

  @override
  void initState() {
    super.initState();
    _loadHouseholdDetail();
  }

  Future<void> _loadHouseholdDetail() async {
    final detail = await HouseholdState().fetchHouseholdDetail(
      widget.household.id,
      status: widget.household.status,
    );
    if (detail != null) {
      _detailedHousehold = detail;
      if (detail.qrCodeUrl != null && detail.qrCodeUrl!.isNotEmpty) {
        _promptPayQRCodeURL = detail.qrCodeUrl;
      }
    }

    try {
      final waterTiers = await HouseholdState().fetchWaterUnits();
      _waterTiers = waterTiers;
    } catch (e) {
      debugPrint('Error loading water tiers in payment_screen: $e');
    }

    try {
      final garbageRates = await HouseholdState().fetchGarbageRates();
      _garbageRates = garbageRates;
    } catch (e) {
      debugPrint('Error loading garbage rates in payment_screen: $e');
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _stopStatusPolling();
    super.dispose();
  }

  Future<void> _fetchPromptPayQRCode() async {
    final h = _detailedHousehold ?? widget.household;
    if (h.invoiceId == null) {
      setState(() {
        _errorMessageQRCode = 'ไม่พบรหัสใบแจ้งหนี้เพื่อทำการชำระเงิน';
      });
      return;
    }

    if (_promptPayQRCodeURL != null) {
      _startStatusPolling();
      return;
    }

    setState(() {
      _isLoadingQRCode = true;
      _errorMessageQRCode = null;
    });

    final qrUrl = await HouseholdState().generatePromptPayQR(h.invoiceId!);
    if (qrUrl != null && qrUrl.isNotEmpty) {
      setState(() {
        _promptPayQRCodeURL = qrUrl;
        _isLoadingQRCode = false;
      });
      _startStatusPolling();
    } else {
      setState(() {
        _promptPayQRCodeURL = 'simulated';
        _isLoadingQRCode = false;
        _errorMessageQRCode =
            'เซิร์ฟเวอร์ไม่ได้กำหนดค่ากุญแจความปลอดภัยสำหรับโหมดสแกนจ่ายจริง\n(แสดงผลระบบโหมดจำลอง)';
      });
    }
  }

  void _startStatusPolling() {
    _statusTimer?.cancel();
    final h = _detailedHousehold ?? widget.household;
    if (h.invoiceId == null) return;

    _statusTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      final status = await HouseholdState().checkPaymentStatus(h.invoiceId!);
      if (status == 'paid' || status == 'success') {
        timer.cancel();
        final householdState = HouseholdState();
        if (mounted) {
          final updatedDetail = await householdState.fetchHouseholdDetail(
            h.id,
            status: HouseholdStatus.paid,
          );
          if (!mounted) return;
          if (updatedDetail != null) {
            _detailedHousehold = updatedDetail;
            h.status = HouseholdStatus.paid;
            h.paymentMethod = updatedDetail.paymentMethod;
            h.paymentTime = updatedDetail.paymentTime;
            h.invoiceId = updatedDetail.invoiceId;
            h.receiptNumber = updatedDetail.receiptNumber;
            h.qrCodeUrl = updatedDetail.qrCodeUrl;
          } else {
            h.status = HouseholdStatus.paid;
            h.paymentMethod = 'promptpay';
            h.paymentTime = DateTime.now();
          }
          householdState.payBill(h.id, 'promptpay');
          setState(() {});
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('ตรวจพบการชำระเงินสำเร็จผ่านพร้อมเพย์!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    });
  }

  void _stopStatusPolling() {
    _statusTimer?.cancel();
    _statusTimer = null;
  }

  Future<void> _processPayment() async {
    final h = _detailedHousehold ?? widget.household;

    if (_paymentMethod == 'cash') {
      if (h.status == HouseholdStatus.surveyedUnpaid) {
        if (h.invoiceId == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('ไม่พบรหัสใบแจ้งหนี้ในการบันทึกชำระเงิน'),
              backgroundColor: Colors.redAccent,
            ),
          );
          return;
        }

        // แสดง Dialog ยืนยันการชำระเงินสดเพื่อป้องกันการกดผิดพลาด
        final confirm = await showDialog<bool>(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              title: const Row(
                children: [
                  Icon(Icons.monetization_on, color: Colors.green),
                  SizedBox(width: 8),
                  Text('ยืนยันการรับเงิน'),
                ],
              ),
              content: Text(
                'ต้องการยืนยันการชำระเงินด้วยเงินสดใช่หรือไม่?\n\n'
                'ยอดชำระทั้งสิ้น: ฿${h.totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 14),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('ยกเลิก', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1D4ED8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('ยืนยันชำระเงิน'),
                ),
              ],
            );
          },
        );

        if (confirm != true) return;

        setState(() {
          _isSavingPayment = true;
        });

        final success = await HouseholdState().payBill(h.id, 'cash');

        if (!mounted) return;

        if (!success) {
          setState(() {
            _isSavingPayment = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('บันทึกการชำระเงินสดล้มเหลว กรุณาลองใหม่อีกครั้ง'),
              backgroundColor: Colors.redAccent,
            ),
          );
          return;
        }

        final updatedDetail = await HouseholdState().fetchHouseholdDetail(
          h.id,
          status: HouseholdStatus.paid,
        );
        if (!mounted) return;
        if (updatedDetail != null) {
          _detailedHousehold = updatedDetail;
          h.status = HouseholdStatus.paid;
          h.paymentMethod = updatedDetail.paymentMethod;
          h.paymentTime = updatedDetail.paymentTime;
          h.invoiceId = updatedDetail.invoiceId;
          h.receiptNumber = updatedDetail.receiptNumber;
          h.qrCodeUrl = updatedDetail.qrCodeUrl;
        } else {
          h.status = HouseholdStatus.paid;
          h.paymentMethod = 'cash';
          h.paymentTime = DateTime.now();
        }

        setState(() {
          _isSavingPayment = false;
        });
      }
    }

    if (!mounted) return;

    // เริ่มต้นกระบวนการพิมพ์ใบเสร็จ
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return PrintDialog(
          isInvoiceOnly: false,
          household: h,
          paymentMethod: _paymentMethod,
        );
      },
    );

    setState(() {
      _isSavingPayment = false;
    });
  }

  void _processInvoicePrint() {
    final h = _detailedHousehold ?? widget.household;
    // เริ่มต้นกระบวนการพิมพ์ใบแจ้งชำระเงิน
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return PrintDialog(
          isInvoiceOnly: true,
          household: h,
          paymentMethod: _paymentMethod,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final householdState = HouseholdState();
    final printerState = PrinterState();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: Listenable.merge([householdState, printerState]),
      builder: (context, child) {
        final h = _detailedHousehold ?? widget.household;
        final double unitsUsed = h.currentMeter != null
            ? (h.currentMeter! - h.previousMeter)
            : 0.0;
        final double consumedUnits = h.waterUnitConsumed ?? unitsUsed;
        double defaultRate = 4.0;
        if (_waterTiers.isNotEmpty) {
          try {
            defaultRate = (_waterTiers.first['cost'] as num).toDouble();
          } catch (_) {}
        }
        final double waterRate = consumedUnits > 0
            ? (h.waterBillAmount / consumedUnits)
            : defaultRate;

        List<Map<String, dynamic>> appliedTiers = [];
        if (_waterTiers.isNotEmpty && consumedUnits > 0) {
          double remaining = consumedUnits;
          for (var tier in _waterTiers) {
            if (remaining <= 0) break;
            final double start = (tier['start_unit'] as num).toDouble();
            final double? end = tier['end_unit'] != null ? (tier['end_unit'] as num).toDouble() : null;
            final double cost = (tier['cost'] as num).toDouble();

            double capacity;
            if (end == null) {
              capacity = remaining;
            } else {
              if (start == 0) {
                capacity = end;
              } else {
                capacity = end - start + 1;
              }
            }

            double consumedInTier = 0.0;
            if (remaining >= capacity) {
              consumedInTier = capacity;
              remaining -= capacity;
            } else {
              consumedInTier = remaining;
              remaining = 0;
            }

            if (consumedInTier > 0) {
              appliedTiers.add({
                'range': end != null
                    ? 'ยูนิตที่ ${start.toStringAsFixed(0)} - ${end.toStringAsFixed(0)}'
                    : 'ยูนิตที่ ${start.toStringAsFixed(0)} ขึ้นไป',
                'rate': cost,
                'consumed': consumedInTier,
                'amount': consumedInTier * cost,
              });
            }
          }
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(
              h.status == HouseholdStatus.paid
                  ? 'ประวัติใบเสร็จรับเงิน'
                  : 'เก็บเงินค่าบริการ',
            ),
            elevation: 0,
          ),
          body: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: Colors.blue),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ส่วนตัวอย่างใบเสร็จ / ใบแจ้งหนี้ (Invoice / Receipt Preview)
                      Text(
                        h.status == HouseholdStatus.paid
                            ? 'ตัวอย่างใบเสร็จ (Receipt Preview)'
                            : 'ตัวอย่างใบแจ้งชำระเงิน (Invoice Preview)',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // การตกแต่งแบบใบเสร็จความร้อนพกพา (Thermal Printer style)
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(12),
                            topRight: Radius.circular(12),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              spreadRadius: 1,
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipPath(
                          clipper: ZigzagClipper(),
                          child: Container(
                            color: Colors.white,
                            padding: const EdgeInsets.only(bottom: 24),
                            child: Column(
                              children: [
                                // หยักขอบกระดาษด้านบนจำลอง
                                Container(
                                  height: 8,
                                  width: double.infinity,
                                  color: const Color.fromARGB(255, 255, 255, 255),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(24.0),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      Image.asset(
                                        'assets/bill_logo.png',
                                        width: 80,
                                        height: 80,
                                        fit: BoxFit.contain,
                                        errorBuilder: (context, error, stackTrace) =>
                                            const SizedBox.shrink(),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        h.status == HouseholdStatus.paid
                                            ? 'ใบเสร็จรับเงิน (Receipt)'
                                            : 'ใบแจ้งชำระเงิน / ใบแจ้งหนี้ (Invoice)',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      Text(
                                        h.organizationName ?? 'องค์การบริหารส่วนตำบลทุ่งหลวง',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.black87,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        h.organizationAddress ?? 'อ.โพนพิสัย จ.หนองคาย',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Colors.black54,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 12),
                                      const Text(
                                        '• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •',
                                        style: TextStyle(
                                          color: Colors.black38,
                                          fontSize: 10,
                                        ),
                                      ),
                                      const SizedBox(height: 8),

                                      // ข้อมูลทั่วไปในใบเสร็จ
                                      if (h.waterUserId != null && h.waterUserId!.isNotEmpty)
                                        _buildReceiptRow(
                                          'รหัสผู้ใช้น้ำ:',
                                          h.waterUserId!,
                                        ),
                                      _buildReceiptRow(
                                        'บ้านเลขที่:',
                                        h.houseNumber,
                                      ),
                                      _buildReceiptRow(
                                        'ผู้ใช้บริการ:',
                                        h.ownerName,
                                      ),
                                      _buildReceiptRow('หมู่บ้าน:', h.village),
                                      if (h.householdFullAddress != null && h.householdFullAddress!.isNotEmpty)
                                        _buildReceiptRow(
                                          'ที่อยู่:',
                                          h.householdFullAddress!,
                                        ),
                                      if (h.status == HouseholdStatus.paid && h.receiptNumber != null && h.receiptNumber!.isNotEmpty)
                                        _buildReceiptRow(
                                          'เลขที่ใบเสร็จ:',
                                          h.receiptNumber!,
                                        ),
                                      _buildReceiptRow(
                                        'รอบเดือน:',
                                        h.billMonth ?? HouseholdState().selectedMonth,
                                      ),
                                      _buildReceiptRow(
                                        'วันที่บันทึก:',
                                        h.paymentTime != null
                                            ? '${h.paymentTime!.day}/${h.paymentTime!.month}/${h.paymentTime!.year + 543} ${h.paymentTime!.hour.toString().padLeft(2, '0')}:${h.paymentTime!.minute.toString().padLeft(2, '0')} น.'
                                            : '${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year + 543} (รอชำระเงิน)',
                                      ),

                                      const SizedBox(height: 8),
                                      const Text(
                                        '• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •',
                                        style: TextStyle(
                                          color: Colors.black38,
                                          fontSize: 10,
                                        ),
                                      ),
                                      const SizedBox(height: 8),

                                      // รายการค่าน้ำ
                                      _buildReceiptRow(
                                        'ค่าน้ำประปา (${h.previousMeter} -> ${h.currentMeter ?? "-"} หน่วย)',
                                        '฿ ${h.waterBillAmount.toStringAsFixed(2)}',
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          left: 12.0,
                                          bottom: 4.0,
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            if (appliedTiers.isEmpty) ...[
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '- ใช้จริง ${consumedUnits.toStringAsFixed(1)} หน่วย @ ${waterRate.toStringAsFixed(1)} บาท',
                                                    style: const TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.black54,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ] else ...[
                                              ...appliedTiers.map((tier) {
                                                final range = tier['range'] as String;
                                                final rate = tier['rate'] as double;
                                                final consumed = tier['consumed'] as double;
                                                final amount = tier['amount'] as double;
                                                return Padding(
                                                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                                                  child: Row(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment.start,
                                                    children: [
                                                      Expanded(
                                                        child: Text(
                                                          '- $range (ใช้จริง ${consumed.toStringAsFixed(1)} หน่วย @ ${rate.toStringAsFixed(1)} บาท)',
                                                          style: const TextStyle(
                                                            fontSize: 11,
                                                            color: Colors.black54,
                                                          ),
                                                        ),
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Text(
                                                        '฿ ${amount.toStringAsFixed(2)}',
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Colors.black54,
                                                          fontWeight: FontWeight.w500,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              }),
                                            ],
                                            if (h.waterStartDate != null && h.waterEndDate != null)
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '- ช่วงเวลา: ${h.waterStartDate!.day}/${h.waterStartDate!.month}/${h.waterStartDate!.year + 543} ถึง ${h.waterEndDate!.day}/${h.waterEndDate!.month}/${h.waterEndDate!.year + 543}',
                                                    style: const TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.black54,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                          ],
                                        ),
                                      ),

                                      // รายการค่าขยะ
                                      if (h.garbageDetails != null && h.garbageDetails!.isNotEmpty) ...[
                                        ...h.garbageDetails!.map((detail) {
                                          final sizeName = detail['size_name'] as String? ?? '';
                                          final cost = (detail['cost'] as num?)?.toDouble() ?? 0.0;
                                          final amount = detail['amount'] as int? ?? 0;
                                          return _buildReceiptRow(
                                            'ค่าบริการขยะ ($sizeName) x$amount',
                                            '฿ ${(cost * amount).toStringAsFixed(2)}',
                                          );
                                        })
                                      ] else ...[
                                        ...h.garbageBins.entries
                                            .where((e) => e.value > 0)
                                            .map((entry) {
                                              double rate = 0.0;
                                              try {
                                                final matchedRate = _garbageRates.firstWhere((r) =>
                                                  ThaiDateUtils.mapSizeKey(r.sizeName) == entry.key
                                                );
                                                rate = matchedRate.cost;
                                              } catch (_) {
                                                try {
                                                  final matchedRate = _garbageRates.firstWhere((r) =>
                                                    r.sizeName.contains(entry.key)
                                                  );
                                                  rate = matchedRate.cost;
                                                } catch (_) {
                                                  if (entry.key == '20L') {
                                                    rate = 20.0;
                                                  } else if (entry.key == '60L') {
                                                    rate = 40.0;
                                                  } else if (entry.key == '120L') {
                                                    rate = 80.0;
                                                  }
                                                }
                                              }
                                              return _buildReceiptRow(
                                                'ค่าบริการขยะ (${entry.key}) x${entry.value}',
                                                '฿ ${(rate * entry.value).toStringAsFixed(2)}',
                                              );
                                            }),
                                        if (h.garbageBins.values.fold(
                                              0,
                                              (sum, count) => sum + count,
                                            ) ==
                                            0)
                                          _buildReceiptRow(
                                            'ค่าบริการขยะ (ไม่มีถังขยะ)',
                                            '฿ 0.00',
                                          ),
                                      ],

                                      const SizedBox(height: 8),
                                      const Text(
                                        '• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •',
                                        style: TextStyle(
                                          color: Colors.black38,
                                          fontSize: 10,
                                        ),
                                      ),
                                      const SizedBox(height: 8),

                                      // ยอดรวม
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'ยอดชำระทั้งสิ้น:',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          Text(
                                            '฿ ${h.totalAmount.toStringAsFixed(2)}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 20,
                                              color: Color(0xFF1D4ED8),
                                            ),
                                          ),
                                        ],
                                      ),

                                      if (h.status == HouseholdStatus.paid) ...[
                                        const SizedBox(height: 16),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            border: Border.all(
                                              color: Colors.green,
                                              width: 2,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: const Text(
                                            'ชำระเงินเรียบร้อยแล้ว',
                                            style: TextStyle(
                                              color: Colors.green,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        if (h.staffName != null && h.staffName!.isNotEmpty) ...[
                                           const SizedBox(height: 12),
                                           _buildReceiptRow(
                                             'เจ้าหน้าที่รับเงิน:',
                                             h.staffName!,
                                           ),
                                         ],
                                      ] else ...[
                                        const SizedBox(height: 16),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 8,
                                          ),
                                          decoration: BoxDecoration(
                                            border: Border.all(
                                              color: Colors.orange,
                                              width: 2,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: const Text(
                                            'รอการชำระเงิน',
                                            style: TextStyle(
                                              color: Colors.orange,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        const Text(
                                          '* QR Code จะปรากฏบนใบแจ้งชำระที่พิมพ์ออกทางเครื่องพิมพ์จริง',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.grey,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ถ้าชำระเงินเรียบร้อยแล้ว จะแสดงปุ่มกด Reprint ทันที
                      if (h.status == HouseholdStatus.paid) ...[
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.colorScheme.primary,
                              foregroundColor: isDark
                                  ? Colors.black
                                  : Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: _processPayment,
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.print),
                                SizedBox(width: 8),
                                Text(
                                  'พิมพ์ใบเสร็จซ้ำ (Reprint)',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: isDark
                                    ? Colors.blue[300]!
                                    : const Color(0xFF475569),
                                width: 1.5,
                              ),
                              foregroundColor: isDark
                                  ? Colors.blue[300]!
                                  : const Color(0xFF475569),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            onPressed: () {
                              Navigator.pop(
                                context,
                              ); // ย้อนกลับไปยังหน้ารายการครัวเรือน/หน้าหลัก
                            },
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.home_outlined),
                                SizedBox(width: 8),
                                Text(
                                  'กลับหน้าหลัก',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Center(
                          child: TextButton.icon(
                            onPressed: () {
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      RecordScreen(household: h),
                                ),
                              );
                            },
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            label: const Text(
                              'แก้ไขข้อมูลการสำรวจ',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            style: TextButton.styleFrom(
                              foregroundColor: isDark
                                  ? Colors.orange[300]
                                  : Colors.orange[800],
                            ),
                          ),
                        ),
                      ] else ...[
                        if (h.invoiceId?.startsWith('LOCAL-') ?? false)
                          Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade100,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.orange.shade300),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.wifi_off, color: Colors.orange.shade800),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'ทำงานแบบออฟไลน์ — ชำระได้เฉพาะเงินสด',
                                    style: TextStyle(
                                      color: Colors.orange.shade900,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        // ส่วนตัวเลือกการชำระเงิน
                        const Text(
                          'ช่องทางการชำระเงิน',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 12),

                        Row(
                          children: [
                            Expanded(
                              child: _buildPaymentMethodCard(
                                method: 'cash',
                                title: 'เงินสด (Cash)',
                                icon: Icons.money_outlined,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildPaymentMethodCard(
                                method: 'promptpay',
                                title: 'QR PromptPay',
                                icon: Icons.qr_code_scanner_outlined,
                                disabled: h.invoiceId?.startsWith('LOCAL-') ?? false,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // การกรอกข้อมูลเงินทอนหรือแสดง QR Code ตามตัวเลือก
                        if (_paymentMethod == 'promptpay') ...[
                          // แสดง QR PromptPay จาก backend
                          Card(
                            elevation: 0,
                            color: theme.cardColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(color: theme.dividerColor),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                children: [
                                  // หัว PromptPay
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [],
                                  ),
                                  const SizedBox(height: 16),

                                  if (_isLoadingQRCode)
                                    const SizedBox(
                                      width: 320,
                                      height: 380,
                                      child: Center(
                                        child: CircularProgressIndicator(
                                          color: Colors.blue,
                                        ),
                                      ),
                                    )
                                  else ...[
                                    Container(
                                      width: 320,
                                      height: 380,
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        border: Border.all(
                                          color: Colors.grey[300]!,
                                          width: 2,
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(
                                        child:
                                            (_promptPayQRCodeURL != null &&
                                                _promptPayQRCodeURL !=
                                                    'simulated')
                                            ? SvgPicture.network(
                                                _promptPayQRCodeURL!,
                                                width: 250,
                                                height: 324,
                                                fit: BoxFit.contain,
                                                placeholderBuilder: (context) =>
                                                    const Center(
                                                      child:
                                                          CircularProgressIndicator(
                                                            color: Colors.blue,
                                                          ),
                                                    ),
                                              )
                                            : Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  const Icon(
                                                    Icons.qr_code_2,
                                                    size: 120,
                                                    color: Color(0xFF0F172A),
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    'ยอดชำระ ฿${h.totalAmount.toStringAsFixed(2)}',
                                                    style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 12,
                                                      color: Color(0xFF0F172A),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    if (_errorMessageQRCode != null) ...[
                                      Text(
                                        _errorMessageQRCode!,
                                        style: const TextStyle(
                                          color: Colors.orange,
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 8),
                                    ],
                                    const Text(
                                      'ให้ผู้ใช้สแกน QR Code เพื่อโอนเข้าบัญชี อบต. ทุ่งหลวง',
                                      style: TextStyle(
                                        color: Colors.grey,
                                        fontSize: 11,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.green[600],
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                      ),
                                      onPressed: () async {
                                        if (h.invoiceId != null) {
                                          final status = await HouseholdState()
                                              .checkPaymentStatus(h.invoiceId!);
                                          if (!context.mounted) return;
                                          if (status == 'paid' ||
                                              status == 'success') {
                                            _stopStatusPolling();
                                            final householdState =
                                                HouseholdState();
                                            final updatedDetail = await householdState.fetchHouseholdDetail(
                                              h.id,
                                              status: HouseholdStatus.paid,
                                            );
                                            if (!context.mounted) return;
                                            if (updatedDetail != null) {
                                              _detailedHousehold = updatedDetail;
                                              h.status = HouseholdStatus.paid;
                                              h.paymentMethod = updatedDetail.paymentMethod;
                                              h.paymentTime = updatedDetail.paymentTime;
                                              h.invoiceId = updatedDetail.invoiceId;
                                              h.receiptNumber = updatedDetail.receiptNumber;
                                              h.qrCodeUrl = updatedDetail.qrCodeUrl;
                                            } else {
                                              h.status = HouseholdStatus.paid;
                                              h.paymentMethod = 'promptpay';
                                              h.paymentTime = DateTime.now();
                                            }
                                            householdState.payBill(
                                              h.id,
                                              'promptpay',
                                            );
                                            setState(() {});
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                  'ตรวจพบการชำระเงินสำเร็จผ่านพร้อมเพย์!',
                                                ),
                                                backgroundColor: Colors.green,
                                              ),
                                            );
                                          } else {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                  'ยังไม่ตรวจพบยอดชำระเงิน (คลิกเพื่อเช็คอีกครั้ง)',
                                                ),
                                                backgroundColor: Colors.orange,
                                              ),
                                            );
                                          }
                                        }
                                      },
                                      icon: const Icon(Icons.refresh, size: 16),
                                      label: const Text(
                                        'ตรวจสอบยอดชำระเงิน',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),

                        // ปุ่มชำระเงินและปุ่มพิมพ์ใบแจ้งหนี้แบบ Stack
                        Column(
                          children: [
                            if (_paymentMethod == 'cash') ...[
                              SizedBox(
                                width: double.infinity,
                                height: 52,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(
                                      0xFF1D4ED8,
                                    ), // สีน้ำเงินชำระเงิน
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  onPressed: _isSavingPayment
                                      ? null
                                      : _processPayment,
                                  child: _isSavingPayment
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.print),
                                            SizedBox(width: 8),
                                            Text(
                                              'ชำระเงินและพิมพ์ใบเสร็จ',
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                              const SizedBox(height: 12),
                            ],
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(
                                    color: isDark
                                        ? Colors.blue[300]!
                                        : const Color(0xFF475569),
                                    width: 1.5,
                                  ),
                                  foregroundColor: isDark
                                      ? Colors.blue[300]!
                                      : const Color(0xFF475569),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                onPressed: _processInvoicePrint,
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.description_outlined),
                                    SizedBox(width: 8),
                                    Text(
                                      'พิมพ์ใบแจ้งชำระเงิน (ยังไม่จ่าย)',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Center(
                              child: TextButton.icon(
                                onPressed: () {
                                  Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          RecordScreen(household: h),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.edit_outlined, size: 18),
                                label: const Text(
                                  'แก้ไขข้อมูลการสำรวจ',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                style: TextButton.styleFrom(
                                  foregroundColor: isDark
                                      ? Colors.orange[300]
                                      : Colors.orange[800],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],
                    ],
                  ),
                ),
        );
      },
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 5,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 6,
            child: Text(
              value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard({
    required String method,
    required String title,
    required IconData icon,
    bool disabled = false,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isSelected = _paymentMethod == method && !disabled;
    return GestureDetector(
      onTap: disabled
          ? null
          : () {
              setState(() {
                _paymentMethod = method;
              });
        if (method == 'promptpay') {
          _fetchPromptPayQRCode();
        } else {
          _stopStatusPolling();
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: disabled
              ? (isDark ? Colors.grey[800] : Colors.grey[200])
              : isSelected
                  ? (isDark
                        ? const Color(0xFF1E3A8A).withValues(alpha: 0.3)
                        : const Color(0xFFEFF6FF))
                  : (isDark ? theme.cardColor : Colors.white),
          border: Border.all(
            color: disabled
                ? Colors.transparent
                : isSelected
                    ? const Color(0xFF3B82F6)
                    : (isDark ? theme.dividerColor : Colors.grey[200]!),
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected && !disabled
              ? [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                    spreadRadius: 1,
                    blurRadius: 8,
                  ),
                ]
              : [],
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: disabled
                  ? Colors.grey.withValues(alpha: 0.5)
                  : isSelected ? const Color(0xFF3B82F6) : Colors.grey,
              size: 32,
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: disabled
                    ? Colors.grey.withValues(alpha: 0.5)
                    : isSelected
                        ? (isDark ? Colors.blue[300] : const Color(0xFF1E3A8A))
                        : (isDark ? Colors.grey[300] : Colors.black87),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ZigzagClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0, size.height - 6);
    double x = 0;
    double y = size.height - 6;
    double increment = size.width / 35;
    bool toggle = true;
    while (x < size.width) {
      x += increment;
      y = toggle ? size.height : size.height - 6;
      path.lineTo(x, y);
      toggle = !toggle;
    }
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class PrintDialog extends StatefulWidget {
  final bool isInvoiceOnly;
  final Household household;
  final String paymentMethod;

  const PrintDialog({
    super.key,
    required this.isInvoiceOnly,
    required this.household,
    required this.paymentMethod,
  });

  @override
  State<PrintDialog> createState() => _PrintDialogState();
}

class _PrintDialogState extends State<PrintDialog> {
  String _printStep =
      'checking'; // 'checking', 'no_printer', 'printing', 'success'

  @override
  void initState() {
    super.initState();
    _runPrintSequence();
  }

  Future<void> _runPrintSequence() async {
    final printerState = PrinterState();
    final householdState = HouseholdState();

    // Step 1: Delay and check printer connection
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    if (!printerState.isPrinterConnected) {
      setState(() {
        _printStep = 'no_printer';
      });
      return;
    }

    // Step 2: Show printing status
    setState(() {
      _printStep = 'printing';
    });

    // Step 3: Fetch PromptPay QR payload if printing invoice
    String? qrCodePayload;
    if (widget.isInvoiceOnly &&
        widget.household.invoiceId != null &&
        !widget.household.invoiceId!.startsWith('LOCAL-')) {
      try {
        qrCodePayload = await householdState.generatePromptPayQR(widget.household.invoiceId!);
      } catch (e) {
        debugPrint('Error fetching PromptPay QR for printing: $e');
      }
    }

    // Step 4: Execute real print command
    await printerState.printHouseholdReceipt(
      widget.household,
      qrCode: qrCodePayload,
      isInvoice: widget.isInvoiceOnly,
    );
    if (!mounted) return;

    // Step 5: Print completed, update local status
    if (!widget.isInvoiceOnly &&
        widget.household.status == HouseholdStatus.surveyedUnpaid) {
      widget.household.status = HouseholdStatus.paid;
      widget.household.paymentMethod = widget.paymentMethod;
      widget.household.paymentTime = DateTime.now();
      householdState.payBill(widget.household.id, widget.paymentMethod);
    }

    setState(() {
      _printStep = 'success';
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final printerState = PrinterState();
    final h = widget.household;

    if (_printStep == 'checking') {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: Colors.blue),
              const SizedBox(height: 24),
              Text(
                widget.isInvoiceOnly
                    ? 'กำลังเตรียมข้อมูลใบแจ้งหนี้ (พร้อม QR Code)...'
                    : 'กำลังเตรียมข้อมูลใบเสร็จ...',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                printerState.isPrinterConnected
                    ? 'กำลังเชื่อมต่อเครื่องพิมพ์ ${printerState.connectedPrinterName}...'
                    : 'กำลังตรวจสอบสถานะเครื่องพิมพ์...',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    if (_printStep == 'no_printer') {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.print_disabled_outlined,
                color: Colors.orange,
                size: 54,
              ),
              const SizedBox(height: 16),
              const Text(
                'ไม่พบเครื่องพิมพ์ที่เชื่อมต่อ',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 8),
              Text(
                widget.isInvoiceOnly
                    ? 'กรุณาตรวจสอบการเชื่อมต่อ Bluetooth และเครื่องพิมพ์ความร้อนก่อนพิมพ์ใบแจ้งหนี้พร้อม QR Code'
                    : 'กรุณาตรวจสอบการเชื่อมต่อ Bluetooth และเครื่องพิมพ์ความร้อนก่อนพิมพ์ใบเสร็จ',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context); // ปิด Dialog ค้นหา
                      },
                      child: const Text('ยกเลิก'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: isDark ? Colors.black : Colors.white,
                      ),
                      onPressed: () {
                        Navigator.pop(context); // ปิด Dialog ปัจจุบัน
                        if (!widget.isInvoiceOnly) {
                          // บันทึกชำระเงินสำเร็จไว้ก่อน แม้ไม่มีเครื่องพิมพ์
                          if (h.status == HouseholdStatus.surveyedUnpaid) {
                            h.status = HouseholdStatus.paid;
                            h.paymentMethod = widget.paymentMethod;
                            h.paymentTime = DateTime.now();
                            HouseholdState().payBill(
                              h.id,
                              widget.paymentMethod,
                            );
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'บันทึกการชำระเงินเรียบร้อยแล้ว (ไม่ได้พิมพ์ใบเสร็จ)',
                              ),
                              backgroundColor: Colors.amber,
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'บันทึกข้อมูลการสำรวจแล้ว (ไม่ได้พิมพ์ใบแจ้งหนี้พร้อม QR Code)',
                              ),
                              backgroundColor: Colors.amber,
                            ),
                          );
                        }
                      },
                      child: Text(
                        widget.isInvoiceOnly ? 'ข้ามการพิมพ์' : 'ชำระเงินเลย',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    if (_printStep == 'printing') {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.print, color: Colors.green, size: 64),
              const SizedBox(height: 20),
              Text(
                widget.isInvoiceOnly
                    ? 'กำลังพิมพ์ใบแจ้งหนี้พร้อม QR Code...'
                    : 'กำลังพิมพ์ใบเสร็จ...',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'ส่งคำสั่งไปยังเครื่องพิมพ์ ${printerState.connectedPrinterName} แล้ว',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 16),
              const LinearProgressIndicator(color: Colors.green),
            ],
          ),
        ),
      );
    }

    // printStep == 'success'
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle_outline,
              color: Colors.green,
              size: 64,
            ),
            const SizedBox(height: 16),
            const Text(
              'การพิมพ์เสร็จสมบูรณ์',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              widget.isInvoiceOnly
                  ? 'พิมพ์ใบแจ้งชำระเงินพร้อม QR Code เรียบร้อยแล้ว'
                  : 'ชำระค่าบริการและออกใบเสร็จเรียบร้อยแล้ว',
              style: const TextStyle(color: Colors.grey, fontSize: 13),
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
                onPressed: () {
                  Navigator.pop(context); // ปิด Dialog
                },
                child: const Text('ตกลง'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
