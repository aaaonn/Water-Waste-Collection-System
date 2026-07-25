import 'package:flutter/material.dart';
import '../state/household_state.dart';
import '../../domain/entities/household.dart';
import 'payment_screen.dart';
import '../../../../core/utils/thai_date_utils.dart';

class RecordScreen extends StatefulWidget {
  final Household household;

  const RecordScreen({super.key, required this.household});

  @override
  State<RecordScreen> createState() => _RecordScreenState();
}

class _RecordScreenState extends State<RecordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentMeterController = TextEditingController();

  final Map<int, int> _binCountsByID = {};
  List<GarbageRate> _dynamicGarbageRates = [];
  List<dynamic> _waterTiers = [];

  double _calculatedUnits = 0.0;
  double _waterFee = 0.0;
  double _garbageFee = 0.0;
  double _totalAmount = 0.0;
  bool _isLoading = true;
  Household? _detailedHousehold;
  Household get h => _detailedHousehold ?? widget.household;

  @override
  void initState() {
    super.initState();
    _currentMeterController.addListener(_calculateCosts);
    _loadHouseholdDetail();
  }

  Future<void> _loadHouseholdDetail() async {
    final rates = await HouseholdState().fetchGarbageRates();
    final waterTiers = await HouseholdState().fetchWaterUnits();
    
    _dynamicGarbageRates = rates;
    _waterTiers = waterTiers;
    _binCountsByID.clear();
    for (var r in rates) {
      _binCountsByID[r.id] = 0;
    }

    final detail = await HouseholdState().fetchHouseholdDetail(widget.household.id);
    if (detail != null) {
      _detailedHousehold = detail;
    } else {
      _detailedHousehold = widget.household;
    }

    if (_detailedHousehold!.currentMeter != null) {
      _currentMeterController.text = _detailedHousehold!.currentMeter!.toStringAsFixed(1);
    }

    for (var r in rates) {
      final key = ThaiDateUtils.mapSizeKey(r.sizeName);
      if (_detailedHousehold!.garbageBins.containsKey(key)) {
        _binCountsByID[r.id] = _detailedHousehold!.garbageBins[key] ?? 0;
      } else if (_detailedHousehold!.garbageBins.containsKey(r.sizeName)) {
        _binCountsByID[r.id] = _detailedHousehold!.garbageBins[r.sizeName] ?? 0;
      }
    }

    _calculateCosts();

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _currentMeterController.dispose();
    super.dispose();
  }

  void _calculateCosts() {
    final text = _currentMeterController.text;
    final currentVal = double.tryParse(text);

    if (currentVal != null && currentVal >= h.previousMeter) {
      _calculatedUnits = currentVal - h.previousMeter;
      
      double totalAmount = 0.0;
      double remaining = _calculatedUnits;

      if (_waterTiers.isNotEmpty) {
        final sortedTiers = List<Map<String, dynamic>>.from(_waterTiers);
        sortedTiers.sort((a, b) => (a['start_unit'] as num).compareTo(b['start_unit'] as num));

        for (final tier in sortedTiers) {
          if (remaining <= 0) break;
          final startUnit = (tier['start_unit'] as num).toDouble();
          final endUnit = tier['end_unit'] as num?;
          final costPerUnit = (tier['cost'] as num).toDouble();

          double capacity;
          if (endUnit == null) {
            capacity = remaining;
          } else {
            final endVal = endUnit.toDouble();
            capacity = startUnit == 0 ? endVal : endVal - startUnit + 1;
          }

          final consumed = remaining >= capacity ? capacity : remaining;
          totalAmount += consumed * costPerUnit;
          remaining -= consumed;
        }
        _waterFee = totalAmount;
      } else {
        _waterFee = _calculatedUnits * 5.0;
      }
    } else {
      _calculatedUnits = 0.0;
      _waterFee = 0.0;
    }

    double totalGarbageFee = 0.0;
    _binCountsByID.forEach((rateId, count) {
      final rate = _dynamicGarbageRates.firstWhere((r) => r.id == rateId, orElse: () => GarbageRate(id: 0, subdistrictId: 0, sizeName: '', cost: 0.0));
      totalGarbageFee += rate.cost * count;
    });
    _garbageFee = totalGarbageFee;
    _totalAmount = _waterFee + _garbageFee;

    if (mounted) {
      setState(() {});
    }
  }

  void _submitData() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      final currentMeter = double.parse(_currentMeterController.text);
      
      final errorMessage = await HouseholdState().submitSurvey(
        id: h.id,
        currentMeter: currentMeter,
        binCountsByID: _binCountsByID,
      );

      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });

      if (errorMessage == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('บันทึกข้อมูลบ้านเลขที่ ${h.houseNumber} สำเร็จ!'),
            backgroundColor: Colors.green,
          ),
        );

        // ดึงข้อมูลครัวเรือนที่อัปเดตล่าสุดจาก State เพื่อให้มีสถานะเป็น surveyedUnpaid และมี invoiceId
        final updatedHousehold = HouseholdState().households.firstWhere(
              (element) => element.id == h.id,
              orElse: () => h,
            );

        // มั่นใจว่าตัวแปรท้องถิ่น h ได้รับการอัปเดตค่าที่สำคัญด้วย
        h.status = HouseholdStatus.surveyedUnpaid;
        h.invoiceId = updatedHousehold.invoiceId;

        // นำทางไปยังหน้า PaymentScreen ทันที
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => PaymentScreen(household: updatedHousehold),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('เกิดข้อผิดพลาดในการบันทึกข้อมูล: $errorMessage'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('บันทึกข้อมูลการสำรวจ'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
              // ข้อมูลครัวเรือนย่อ
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'บ้านเลขที่ ${h.houseNumber}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'เจ้าของ: ${h.ownerName}',
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    Text(
                      'หมู่บ้าน: ${h.village}',
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 1. ส่วนบันทึกน้ำประปา
              const Text(
                'ข้อมูลมาตรวัดน้ำประปา',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 10),
              Card(
                elevation: 0,
                color: theme.cardColor,
                clipBehavior: Clip.antiAlias,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: theme.dividerColor),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border(
                      left: BorderSide(
                        color: isDark ? Colors.blue[400]! : const Color(0xFF2563EB),
                        width: 5,
                      ),
                    ),
                  ),
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('ดัชนีครั้งก่อน:', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          Text(
                            '${h.previousMeter} หน่วย',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      TextFormField(
                        controller: _currentMeterController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          labelText: 'ดัชนีครั้งนี้ (หน่วย)',
                          hintText: 'กรอกเลขมาตรน้ำจดล่าสุด',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          prefixIcon: const Icon(Icons.water_drop, color: Colors.blue),
                          suffixText: 'หน่วย',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'กรุณากรอกเลขมาตรน้ำครั้งนี้';
                          }
                          final numValue = double.tryParse(value);
                          if (numValue == null) {
                            return 'กรุณากรอกเป็นตัวเลข';
                          }
                          if (numValue < h.previousMeter) {
                            return 'เลขมาตรครั้งนี้ต้องไม่น้อยกว่าครั้งก่อน (${h.previousMeter})';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('ปริมาณน้ำที่ใช้:', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          Text(
                            '${_calculatedUnits.toStringAsFixed(1)} หน่วย',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.blue[300] : const Color(0xFF2563EB),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('ประมาณการค่าน้ำประปา:', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          Text(
                            '฿ ${_waterFee.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.blue[300] : const Color(0xFF2563EB),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 2. ส่วนบันทึกถังขยะ
              const Text(
                'ข้อมูลการจัดเก็บขยะ',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 10),
              Card(
                elevation: 0,
                color: theme.cardColor,
                clipBehavior: Clip.antiAlias,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: theme.dividerColor),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border(
                      left: BorderSide(
                        color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669),
                        width: 5,
                      ),
                    ),
                  ),
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      if (_dynamicGarbageRates.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16.0),
                          child: Text('ไม่พบประเภทถังขยะสำหรับตำบลนี้', style: TextStyle(color: Colors.grey)),
                        )
                      else
                        ..._dynamicGarbageRates.map((rate) {
                          final index = _dynamicGarbageRates.indexOf(rate);
                          final isLast = index == _dynamicGarbageRates.length - 1;
                          return Column(
                            children: [
                              _buildBinCounterRow(
                                context,
                                size: rate.sizeName,
                                label: rate.sizeName,
                                priceLabel: 'อัตราค่าบริการ ${rate.cost.toStringAsFixed(0)} บาท/ถัง',
                                count: _binCountsByID[rate.id] ?? 0,
                                onChanged: (newVal) {
                                  setState(() {
                                    _binCountsByID[rate.id] = newVal;
                                    _calculateCosts();
                                  });
                                },
                              ),
                              if (!isLast) const Divider(height: 16),
                            ],
                          );
                        }),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('ประมาณการค่าขยะรวม:', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          Text(
                            '฿ ${_garbageFee.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF059669),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 25),

              // 3. ยอดรวมทัังหมด
              Card(
                color: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isDark ? Colors.blue[800]! : const Color(0xFFBFDBFE)),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ค่าบริการรวมทั้งสิ้น:',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.blue[200] : const Color(0xFF1E3A8A),
                        ),
                      ),
                      Text(
                        '฿ ${_totalAmount.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.blue[300] : const Color(0xFF1D4ED8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),

              // ปุ่มบันทึกข้อมูล
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: isDark ? Colors.black : Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _submitData,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.save_outlined),
                      SizedBox(width: 8),
                      Text(
                        'บันทึกข้อมูล & ชำระเงิน',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBinCounterRow(
    BuildContext context, {
    required String size,
    required String label,
    required String priceLabel,
    required int count,
    required ValueChanged<int> onChanged,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 2),
              Text(
                priceLabel,
                style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 12),
              ),
            ],
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: Icon(
                Icons.remove_circle_outline,
                color: count > 0 ? Colors.redAccent : Colors.grey,
                size: 26,
              ),
              onPressed: count > 0 ? () => onChanged(count - 1) : null,
            ),
            Container(
              constraints: const BoxConstraints(minWidth: 30),
              alignment: Alignment.center,
              child: Text(
                '$count',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            IconButton(
              icon: const Icon(
                Icons.add_circle_outline,
                color: Colors.green,
                size: 26,
              ),
              onPressed: () => onChanged(count + 1),
            ),
          ],
        )
      ],
    );
  }
}
